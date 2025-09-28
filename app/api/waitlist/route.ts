import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { waitlistSignupSchema, type WaitlistApiResponse } from '@/lib/waitlist-types';
import { sendConfirmationEmail } from '@/lib/email-confirmation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiting helper
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  // Clean up old entries
  await supabase
    .from('waitlist_rate_limits')
    .delete()
    .lt('window_start', windowStart.toISOString());

  // Check current attempts
  const { data: attempts } = await supabase
    .from('waitlist_rate_limits')
    .select('attempts')
    .eq('ip', ip)
    .gt('window_start', windowStart.toISOString())
    .maybeSingle();

  const currentAttempts = attempts?.attempts || 0;
  const maxAttempts = 10;

  if (currentAttempts >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  // Update or insert rate limit record
  if (attempts) {
    await supabase
      .from('waitlist_rate_limits')
      .update({ attempts: currentAttempts + 1 })
      .eq('ip', ip)
      .eq('attempts', currentAttempts); // Optimistic locking
  } else {
    await supabase
      .from('waitlist_rate_limits')
      .insert({ ip, attempts: 1, window_start: new Date().toISOString() });
  }

  return { allowed: true, remaining: maxAttempts - currentAttempts - 1 };
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const body = await request.json();

    // Validate input
    const result = waitlistSignupSchema.safeParse(body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formattedErrors: Record<string, string> = {};

      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          formattedErrors[field] = messages[0];
        }
      });

      return NextResponse.json({
        ok: false,
        error: 'Validation failed',
        fieldErrors: formattedErrors
      } as WaitlistApiResponse, { status: 422 });
    }

    const data = result.data;

    // Check honeypot
    if (data.nickname && data.nickname.length > 0) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid submission'
      } as WaitlistApiResponse, { status: 400 });
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      return NextResponse.json({
        ok: false,
        error: 'Too many requests. Please try again later.'
      } as WaitlistApiResponse, { status: 429 });
    }

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('waitlist_signups')
      .select('id')
      .eq('email', data.email.toLowerCase())
      .maybeSingle();

    if (existing) {
      // Email already exists - return success to prevent email enumeration
      return NextResponse.json({
        ok: true,
        duplicate: true
      } as WaitlistApiResponse);
    }

    // Insert new signup
    const { error: insertError } = await supabase
      .from('waitlist_signups')
      .insert({
        email: data.email.toLowerCase(),
        role: data.role,
        level: data.level,
        goals: data.goals,
        custom_goal: data.customGoal || null,
        urgency: data.urgency || null,
        referral_code: data.referralCode || null,
        consent: data.consent,
        status: 'pending',
        ip: clientIP,
        user_agent: request.headers.get('user-agent') || null
      });

    if (insertError) {
      console.error('Database insert error:', insertError);

      // Check if it's a duplicate email error (race condition)
      if (insertError.code === '23505') {
        return NextResponse.json({
          ok: true,
          duplicate: true
        } as WaitlistApiResponse);
      }

      return NextResponse.json({
        ok: false,
        error: 'Failed to save signup. Please try again.'
      } as WaitlistApiResponse, { status: 500 });
    }

    // Send confirmation email (don't block response on this)
    sendConfirmationEmail(data.email.toLowerCase()).catch(error => {
      console.error('Failed to send confirmation email:', error);
      // Could log this to an error tracking service
    });

    return NextResponse.json({
      ok: true
    } as WaitlistApiResponse);

  } catch (error) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json({
      ok: false,
      error: 'An unexpected error occurred. Please try again.'
    } as WaitlistApiResponse, { status: 500 });
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