// import { Resend } from 'resend';
import { createHmac, timingSafeEqual } from 'crypto';
import type { ConfirmationTokenPayload } from './waitlist-types';

// const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a signed token for email confirmation
export function generateConfirmationToken(email: string): string {
  const payload: ConfirmationTokenPayload = {
    email: email.toLowerCase(),
    exp: Date.now() + (48 * 60 * 60 * 1000) // 48 hours
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const secret = process.env.WAITLIST_SIGN_SECRET || 'default-secret-change-in-production';
  const signature = createHmac('sha256', secret).update(data).digest('hex');

  return `${data}.${signature}`;
}

// Verify a confirmation token
export function verifyConfirmationToken(token: string): { valid: boolean; email?: string } {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) {
      return { valid: false };
    }

    const secret = process.env.WAITLIST_SIGN_SECRET || 'default-secret-change-in-production';
    const expectedSignature = createHmac('sha256', secret).update(data).digest('hex');

    // Use timing-safe comparison
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      return { valid: false };
    }

    const payload: ConfirmationTokenPayload = JSON.parse(
      Buffer.from(data, 'base64').toString('utf-8')
    );

    // Check expiration
    if (Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, email: payload.email };
  } catch (error) {
    return { valid: false };
  }
}

// Send confirmation email - temporarily disabled
export async function sendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  console.log('Email sending temporarily disabled for:', email);
  return { success: true };
}