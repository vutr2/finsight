import { NextResponse } from 'next/server';
import { verifyReturnUrl } from '@/lib/vnpay';
import { updatePaymentStatus } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase/server';

// VNPAY redirects the browser here after payment.
// In sandbox, IPN is never called — so we also update DB here as fallback.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  if (!verifyReturnUrl(query)) {
    console.error('[vnpay/callback] invalid signature');
    return NextResponse.redirect(new URL('/dashboard/payment/failed?reason=invalid', request.url));
  }

  const responseCode = query['vnp_ResponseCode'];
  const orderId = query['vnp_TxnRef'] ?? '';

  if (responseCode !== '00') {
    // Non-blocking — mark failed
    updatePaymentStatus(orderId, 'failed').catch(() => {});
    return NextResponse.redirect(new URL('/dashboard/payment/failed?reason=declined', request.url));
  }

  // Payment successful — update DB + grant Pro (fallback for sandbox where IPN is not called)
  try {
    await updatePaymentStatus(orderId, 'completed');

    // Look up descope_id directly from payments row (stored at payment creation time)
    const supabase = getSupabase();
    const { data: payment } = await supabase
      .from('payments')
      .select('descope_id')
      .eq('order_id', orderId)
      .single();

    if (payment?.descope_id) {
      await grantPro(payment.descope_id);
      console.log('[vnpay/callback] granted Pro to:', payment.descope_id);
    } else {
      console.warn('[vnpay/callback] no descope_id found for orderId:', orderId);
    }
  } catch (err) {
    console.error('[vnpay/callback] post-payment update error:', err.message);
    // Still redirect to success — payment was confirmed by VNPAY
  }

  return NextResponse.redirect(new URL('/dashboard/payment/success', request.url));
}

async function grantPro(descopeId) {
  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID;
  const managementKey = process.env.DESCOPE_MANAGEMENT_KEY;

  if (!managementKey) {
    console.warn('[grantPro] DESCOPE_MANAGEMENT_KEY not set — skipping');
    return;
  }

  const res = await fetch('https://api.descope.com/v1/mgmt/user/update/customAttribute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${projectId}:${managementKey}`,
    },
    body: JSON.stringify({
      loginId: descopeId,
      attributeKey: 'plan',
      attributeValue: 'pro',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Descope ${res.status}: ${body}`);
  }
}
