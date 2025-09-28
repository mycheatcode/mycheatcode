import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyConfirmationToken } from '@/lib/email-confirmation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    // Redirect to waitlist page with error
    return NextResponse.redirect(
      new URL('/waitlist?error=missing-token', request.url)
    );
  }

  // Verify the token
  const verification = verifyConfirmationToken(token);

  if (!verification.valid || !verification.email) {
    // Redirect to waitlist page with error
    return NextResponse.redirect(
      new URL('/waitlist?error=invalid-token', request.url)
    );
  }

  try {
    // Update the user's status to confirmed
    const { error } = await supabase
      .from('waitlist_signups')
      .update({ status: 'confirmed' })
      .eq('email', verification.email)
      .eq('status', 'pending'); // Only update if still pending

    if (error) {
      console.error('Failed to confirm email:', error);
      return NextResponse.redirect(
        new URL('/waitlist?error=confirmation-failed', request.url)
      );
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/waitlist/success', request.url)
    );

  } catch (error) {
    console.error('Email confirmation error:', error);
    return NextResponse.redirect(
      new URL('/waitlist?error=confirmation-failed', request.url)
    );
  }
}