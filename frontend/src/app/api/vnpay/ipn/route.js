import { NextResponse } from 'next/server';
import { verifyReturnUrl } from '@/lib/vnpay';
import { updatePaymentStatus } from '@/lib/supabase';

// VNPAY server calls this URL server-to-server to confirm payment.
// This is the ONLY place we update the database.
// Must be public (no auth) — see middleware.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());
  return handleIpn(query);
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());
  try {
    const text = await request.text();
    if (text) {
      const bodyParams = Object.fromEntries(new URLSearchParams(text));
      Object.assign(query, bodyParams);
    }
  } catch { /* ignore */ }
  return handleIpn(query);
}

async function handleIpn(query) {
  console.log('[vnpay/ipn] received:', query);

  if (!verifyReturnUrl(query)) {
    console.error('[vnpay/ipn] invalid signature');
    return NextResponse.json({ RspCode: '97', Message: 'Fail checksum' });
  }

  const responseCode = query['vnp_ResponseCode'];
  const txnRef = query['vnp_TxnRef'] ?? '';
  const amount = Number(query['vnp_Amount']) / 100;
  // orderId was set as Date.now().toString().slice(-8) in create route
  // txnRef is the same value used as orderId
  const orderId = txnRef;

  console.log(`[vnpay/ipn] responseCode=${responseCode} amount=${amount} orderId=${orderId}`);

  if (responseCode !== '00') {
    // Update payment status to failed in Supabase
    try { await updatePaymentStatus(orderId, 'failed'); } catch { /* non-blocking */ }
    return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
  }

  // 1. Update payment status to completed in Supabase
  try {
    await updatePaymentStatus(orderId, 'completed');
    console.log('[vnpay/ipn] payment status updated to completed for orderId:', orderId);
  } catch (err) {
    console.error('[vnpay/ipn] updatePaymentStatus error:', err.message);
    // Non-blocking — still grant Pro
  }

  // 2. Grant Pro in Descope
  // descope_id is stored directly in the payments row
  try {
    const descopeId = await getDescopeIdByOrderId(orderId);
    if (descopeId) {
      await grantPro(descopeId);
      console.log('[vnpay/ipn] granted Pro to:', descopeId);
    } else {
      console.warn('[vnpay/ipn] no descope_id found for orderId:', orderId);
    }
  } catch (err) {
    console.error('[vnpay/ipn] grantPro error:', err.message);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' });
  }

  return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
}

async function getDescopeIdByOrderId(orderId) {
  const { getSupabase } = await import('@/lib/supabase/server');
  const supabase = getSupabase();

  const { data } = await supabase
    .from('payments')
    .select('descope_id')
    .eq('order_id', orderId)
    .single();

  return data?.descope_id ?? null;
}

async function grantPro(descopeId) {
  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID;
  const managementKey = process.env.DESCOPE_MANAGEMENT_KEY;

  if (!managementKey) {
    console.warn('[grantPro] DESCOPE_MANAGEMENT_KEY not set — skipping Descope update');
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
