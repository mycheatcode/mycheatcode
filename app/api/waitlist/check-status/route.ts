import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Fetch signup status
    const { data: signup, error: fetchError } = await supabase
      .from('waitlist_signups')
      .select('email, status, confirmed_at, last_email_sent, created_at')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !signup) {
      return NextResponse.json({
        error: 'Email not found in waitlist'
      }, { status: 404 });
    }

    return NextResponse.json(signup);

  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
