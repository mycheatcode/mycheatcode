import { NextRequest, NextResponse } from 'next/server';
import { sendConfirmationEmail } from '@/lib/email-confirmation';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check environment variables
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL;
    const hasSignSecret = !!process.env.WAITLIST_SIGN_SECRET;

    const result = await sendConfirmationEmail(email);

    return NextResponse.json({
      success: result.success,
      error: result.error,
      env: {
        hasResendKey,
        hasSiteUrl,
        hasSignSecret,
      }
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
