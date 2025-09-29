import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyConfirmationToken } from '@/lib/email-confirmation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    // If token is provided, verify it first
    if (token) {
      const verification = verifyConfirmationToken(token);

      if (!verification.valid || !verification.email) {
        return NextResponse.json({
          success: false,
          expired: true,
          error: 'Invalid or expired token'
        }, { status: 400 });
      }

      // Use email from verified token
      const verifiedEmail = verification.email;

      // Update the user's status to confirmed
      const { error } = await supabase
        .from('waitlist_signups')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('email', verifiedEmail.toLowerCase());

      if (error) {
        console.error('Database update error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to confirm email'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        email: verifiedEmail
      });
    }

    // Legacy path - if email is provided directly (backward compatibility)
    if (email) {
      // Update the user's status to confirmed
      const { error } = await supabase
        .from('waitlist_signups')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase());

      if (error) {
        console.error('Database update error:', error);
        return NextResponse.json({ error: 'Failed to confirm email' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Token or email is required' }, { status: 400 });

  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// Handle non-POST methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}