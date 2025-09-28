import { Resend } from 'resend';
import { createHmac, timingSafeEqual } from 'crypto';
import type { ConfirmationTokenPayload } from './waitlist-types';

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

// Send confirmation email
export async function sendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Initialize Resend inside the function to avoid build-time issues
    const resend = new Resend(process.env.RESEND_API_KEY);

    const confirmationToken = generateConfirmationToken(email);
    const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/waitlist/confirm?token=${confirmationToken}`;

    const { data, error } = await resend.emails.send({
      from: 'MyCheatCode <team@mycheatcode.ai>',
      to: [email],
      subject: 'Confirm your spot on the MyCheatCode waitlist',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Spot - MyCheatCode</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 24px; font-weight: bold; background: linear-gradient(to right, #ffffff, #a1a1aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 20px 0;">
                MyCheatCode
              </h1>
            </div>

            <!-- Main Content -->
            <div style="background-color: #111111; border: 1px solid #333333; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
              <h2 style="font-size: 28px; font-weight: bold; color: #ffffff; margin: 0 0 20px 0; text-align: center;">
                You're In. Let's Unlock Your Game.
              </h2>

              <p style="font-size: 16px; color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
                Thanks for joining MyCheatCode. You've taken the first step toward mastering the mental side of basketball and building cheat codes that give you a real advantage.
              </p>

              <p style="font-size: 16px; color: #d1d5db; line-height: 1.6; margin: 0 0 30px 0;">
                To confirm your spot on the early access list, just hit the button below.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(to right, #1f2937, #374151); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; border: 1px solid #4b5563;">
                  Confirm My Spot
                </a>
              </div>

              <p style="font-size: 14px; color: #9ca3af; text-align: center; margin: 20px 0 0 0;">
                This link expires in 48 hours
              </p>
            </div>

            <!-- What's Next -->
            <div style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <h3 style="font-size: 20px; font-weight: bold; color: #ffffff; margin: 0 0 15px 0;">
                What happens next?
              </h3>
              <ul style="margin: 0; padding: 0; list-style: none;">
                <li style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                  <span style="color: #f59e0b; margin-right: 10px; margin-top: 2px;">•</span>
                  <span style="color: #d1d5db; font-size: 14px;"><strong>Early Access:</strong> You'll be among the first to test it out when we launch.</span>
                </li>
                <li style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                  <span style="color: #f59e0b; margin-right: 10px; margin-top: 2px;">•</span>
                  <span style="color: #d1d5db; font-size: 14px;"><strong>Exclusive Updates:</strong> Get behind-the-scenes progress and drops before anyone else.</span>
                </li>
                <li style="display: flex; align-items: flex-start;">
                  <span style="color: #f59e0b; margin-right: 10px; margin-top: 2px;">•</span>
                  <span style="color: #d1d5db; font-size: 14px;"><strong>Have a Voice:</strong> We'll ask for your feedback to help shape MyCheatCode into the ultimate mental performance tool for hoopers.</span>
                </li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 10px 0;">
                Contact: <a href="mailto:team@mycheatcode.ai" style="color: #3b82f6;">team@mycheatcode.ai</a>
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/waitlist/unsubscribe?email=${encodeURIComponent(email)}" style="color: #6b7280; text-decoration: underline;">
                  Unsubscribe anytime.
                </a>
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Confirmation email sent successfully:', data?.id);
    return { success: true };

  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}