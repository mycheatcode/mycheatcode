'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#00ff41' }}>MYCHEATCODE.AI</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Reset Your Password</p>
        </div>

        <div className="rounded-2xl p-8 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          {sent ? (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Check Your Email</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  We've sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </p>
              </div>
              <Link href="/login" className="block">
                <button
                  className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
                  style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
                >
                  Back to Login
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 100, 100, 0.3)' }}>
                  <p style={{ color: '#ff6464', fontSize: '14px' }}>{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-medium transition-colors mb-4"
                style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <Link href="/login" className="block text-center">
                <span className="text-sm transition-colors hover:text-white" style={{ color: 'var(--text-secondary)' }}>
                  Back to Login
                </span>
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
