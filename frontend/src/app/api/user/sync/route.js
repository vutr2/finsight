import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { descopeId, email, name } = await request.json();

    if (!descopeId) {
      return NextResponse.json({ error: 'Missing descopeId' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          descope_id: descopeId,
          email: email ?? null,
          name: name ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'descope_id' }
      );

    if (error) {
      console.error('[api/user/sync] upsert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/user/sync] error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
