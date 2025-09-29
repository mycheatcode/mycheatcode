'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyConfirmationToken } from '@/lib/email-confirmation';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams?.get('token');

      if (!token) {
        setStatus('error');
        return;
      }

      try {
        // Verify the token
        const verification = verifyConfirmationToken(token);

        if (!verification.valid || !verification.email) {
          setStatus('expired');
          return;
        }

        setEmail(verification.email);

        // Update the user's status in the database
        const response = await fetch('/api/waitlist/confirm-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: verification.email }),
        });

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
      }
    };

    confirmEmail();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Confirming your email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Logo */}
            <div className="inline-block mb-6">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                MyCheatCode
              </h1>
            </div>

            <h2 className="text-3xl font-bold mb-4 text-white">
              Email Confirmed!
            </h2>

            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
              Thanks for confirming your email, {email}. You're now officially on the MyCheatCode early access list.
            </p>

            {/* What's Next */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-white mb-3">What happens next?</h3>
              <ul className="text-zinc-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>We'll send you exclusive updates as we build your AI basketball coach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>You'll get early access before the public launch</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Your feedback will help shape the final product</span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-sm text-zinc-400">
              <p>Questions? Email us at <a href="mailto:team@mycheatcode.ai" className="text-blue-400 hover:text-blue-300">team@mycheatcode.ai</a></p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error or expired states
  const isExpired = status === 'expired';

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Logo */}
          <div className="inline-block mb-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              MyCheatCode
            </h1>
          </div>

          <h2 className="text-3xl font-bold mb-4 text-white">
            {isExpired ? 'Link Expired' : 'Confirmation Failed'}
          </h2>

          <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
            {isExpired
              ? 'This confirmation link has expired. Please sign up again to get a new confirmation email.'
              : 'We couldn\'t confirm your email. The link may be invalid or already used.'
            }
          </p>

          {/* Action Button */}
          <div className="mb-8">
            <a
              href="/waitlist"
              className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all duration-200"
            >
              Sign Up Again
            </a>
          </div>

          {/* Contact */}
          <div className="text-sm text-zinc-400">
            <p>Need help? Email us at <a href="mailto:team@mycheatcode.ai" className="text-blue-400 hover:text-blue-300">team@mycheatcode.ai</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}