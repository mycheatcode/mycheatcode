'use client';

import { useState } from 'react';

interface SignupStatus {
  email: string;
  status: string;
  confirmed_at: string | null;
  last_email_sent: string | null;
  created_at: string;
}

export default function WaitlistAdminPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SignupStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const checkStatus = async () => {
    if (!email) return;

    setLoading(true);
    setError('');
    setStatus(null);
    setResendMessage('');

    try {
      const response = await fetch('/api/waitlist/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check status');
        return;
      }

      setStatus(data);
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    if (!email) return;

    setResending(true);
    setResendMessage('');
    setError('');

    try {
      const response = await fetch('/api/waitlist/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendMessage('✅ Confirmation email resent successfully!');
        // Refresh status
        await checkStatus();
      } else {
        setError(data.error || 'Failed to resend email');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">
          Waitlist Admin - Email Status Checker
        </h1>

        {/* Search Form */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check Email Status
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkStatus()}
              placeholder="user@example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
            />
            <button
              onClick={checkStatus}
              disabled={loading || !email}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Resend Success Message */}
        {resendMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">{resendMessage}</p>
          </div>
        )}

        {/* Status Display */}
        {status && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">Status Results</h2>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-black font-mono">{status.email}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <p className="text-black">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    status.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {status.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                  </span>
                </p>
              </div>

              {status.confirmed_at && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Confirmed At:</span>
                  <p className="text-black">
                    {new Date(status.confirmed_at).toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-500">Last Email Sent:</span>
                <p className="text-black">
                  {status.last_email_sent
                    ? new Date(status.last_email_sent).toLocaleString()
                    : 'Never'}
                </p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500">Signed Up:</span>
                <p className="text-black">
                  {new Date(status.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Resend Button */}
            {status.status !== 'confirmed' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={resendEmail}
                  disabled={resending}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? 'Resending...' : '📧 Resend Confirmation Email'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This will send a new confirmation email to {status.email}
                </p>
              </div>
            )}

            {status.status === 'confirmed' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-green-600 text-center font-medium">
                  ✓ This email has already been confirmed
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-black mb-2">How to use:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Enter the user's email address</li>
            <li>Click "Check Status" to see if they've confirmed</li>
            <li>If status is "Pending", click "Resend Confirmation Email"</li>
            <li>Tell the user to check their spam folder</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
