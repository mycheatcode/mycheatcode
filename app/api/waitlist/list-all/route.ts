import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch all signups, ordered by most recent first
    const { data: signups, error: fetchError } = await supabase
      .from('waitlist_signups')
      .select('id, email, first_name, age_bracket, status, confirmed_at, last_email_sent, created_at, email_sent_successfully, email_error, email_send_attempts')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch signups'
      }, { status: 500 });
    }

    return NextResponse.json({
      signups: signups || [],
      total: signups?.length || 0
    });

  } catch (error) {
    console.error('List all error:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
