import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendConfirmationEmail } from '@/lib/email-confirmation';

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

    // Check if email exists in database
    const { data: signup, error: fetchError } = await supabase
      .from('waitlist_signups')
      .select('email, status, confirmed_at, email_send_attempts')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !signup) {
      return NextResponse.json({
        success: false,
        error: 'Email not found in waitlist'
      }, { status: 404 });
    }

    // Check if already confirmed
    if (signup.status === 'confirmed') {
      return NextResponse.json({
        success: false,
        error: 'Email already confirmed',
        alreadyConfirmed: true
      });
    }

    // Send confirmation email
    const result = await sendConfirmationEmail(email.toLowerCase());

    if (!result.success) {
      // Track failed attempt
      await supabase
        .from('waitlist_signups')
        .update({
          email_sent_successfully: false,
          email_error: result.error || 'Failed to send email',
          email_send_attempts: (signup.email_send_attempts || 0) + 1
        })
        .eq('email', email.toLowerCase());

      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email'
      }, { status: 500 });
    }

    // Update with success
    await supabase
      .from('waitlist_signups')
      .update({
        last_email_sent: new Date().toISOString(),
        email_sent_successfully: true,
        email_error: null,
        email_send_attempts: (signup.email_send_attempts || 0) + 1
      })
      .eq('email', email.toLowerCase());

    return NextResponse.json({
      success: true,
      message: 'Confirmation email resent successfully'
    });

  } catch (error) {
    console.error('Resend email error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
