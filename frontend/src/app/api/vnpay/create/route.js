import { NextResponse } from 'next/server';
import { createPaymentUrl } from '@/lib/vnpay';
import { createPayment, getUserByDescopeId } from '@/lib/supabase';
import { validateEnv } from '@/lib/validateEnv';

export async function POST(request) {
  try {
    validateEnv();
    const body = await request.json();
    const { amount, planId, userId, cycle } = body;

    if (!amount || !planId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (
      !Number.isFinite(numAmount) ||
      numAmount <= 0 ||
      numAmount > 10_000_000
    ) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const validPlans = ['pro_monthly', 'pro_yearly'];
    if (!validPlans.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const validCycles = ['monthly', 'yearly'];
    if (cycle && !validCycles.includes(cycle)) {
      return NextResponse.json({ error: 'Invalid Cycle' }, { status: 400 });
    }

    // Use full timestamp for uniqueness (vnp_TxnRef max 100 chars, alphanumeric)
    const orderId = Date.now().toString();

    const forwardedFor = request.headers.get('x-forwarded-for');
    const rawIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    // Normalize IPv6 loopback to IPv4 (VNPAY rejects ::1)
    const ipAddr = (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') ? '127.0.0.1' : rawIp;

    const orderInfo = `Thanh toan goi ${planId}`;

    const paymentUrl = createPaymentUrl({
      amount,
      orderId,
      orderInfo,
      ipAddr,
      locale: 'vn',
    });

    try {
      const dbUser = await getUserByDescopeId(userId);
      if (dbUser) {
        await createPayment({
          userid: dbUser.id,
          orderId,
          planId,
          amount,
          cycle: cycle || 'monthly',
        });
      }
    } catch (dbError) {
      console.error('DB save error (non-blocking):', dbError.message);
    }

    return NextResponse.json({
      success: true,
      paymentUrl,
      orderId,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
