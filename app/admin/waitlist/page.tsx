'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Signup {
  id: string;
  email: string;
  first_name: string | null;
  age_bracket: string;
  status: string;
  confirmed_at: string | null;
  last_email_sent: string | null;
  created_at: string;
  email_sent_successfully: boolean | null;
  email_error: string | null;
  email_send_attempts: number;
}

export default function WaitlistAdminPage() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [filteredSignups, setFilteredSignups] = useState<Signup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<{id: string; message: string} | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  // Check authorization first
  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user email is in admin list
      const adminEmails = [
        'hunter@mycheatcode.ai',
        'mycheatcode.ai@gmail.com',
        'hunter.simson12@gmail.com',
      ];

      if (!adminEmails.includes(user.email || '')) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      fetchSignups();
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/');
    } finally {
      setCheckingAuth(false);
    }
  };

  // Load all signups
  useEffect(() => {
    if (isAuthorized) {
      fetchSignups();
    }
  }, [isAuthorized]);

  // Filter signups based on search and status
  useEffect(() => {
    let filtered = signups;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSignups(filtered);
  }, [signups, searchTerm, statusFilter]);

  const fetchSignups = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist/list-all');
      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        setError(data.error || `Failed to fetch signups (${response.status})`);
        return;
      }

      setSignups(data.signups || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async (email: string, id: string) => {
    setResendingId(id);
    setResendMessage(null);

    try {
      const response = await fetch('/api/waitlist/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendMessage({ id, message: '✅ Email sent!' });
        // Refresh the list
        await fetchSignups();
        // Clear message after 3 seconds
        setTimeout(() => setResendMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to resend email');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setResendingId(null);
    }
  };

  const deleteUser = async (email: string, id: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError('');

    try {
      const response = await fetch('/api/waitlist/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state immediately
        setSignups(prev => prev.filter(s => s.id !== id));
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    total: signups.length,
    confirmed: signups.filter(s => s.status === 'confirmed').length,
    pending: signups.filter(s => s.status === 'pending').length,
  };

  // Show loading while checking authorization
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2 text-black">Checking authorization...</div>
          <div className="text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  // Don't render if not authorized (redirect will happen)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Waitlist Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage waitlist signups and resend confirmation emails
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-3xl font-bold text-black">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Signups</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email or name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('confirmed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'confirmed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Confirmed ({stats.confirmed})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({stats.pending})
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-gray-500">Loading signups...</div>
          </div>
        ) : (
          /* Table */
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Signed Up
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSignups.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No signups found
                      </td>
                    </tr>
                  ) : (
                    filteredSignups.map((signup) => (
                      <tr key={signup.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-black font-mono">
                          {signup.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {signup.first_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {signup.age_bracket}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            signup.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {signup.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(signup.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {signup.last_email_sent
                            ? new Date(signup.last_email_sent).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {signup.email_sent_successfully === null ? (
                            <span className="text-gray-400 text-xs">No attempt</span>
                          ) : signup.email_sent_successfully ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                ✓ Delivered
                              </span>
                              {signup.email_send_attempts > 1 && (
                                <span className="text-xs text-gray-500">
                                  {signup.email_send_attempts} attempts
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                ✗ Failed
                              </span>
                              {signup.email_error && (
                                <span className="text-xs text-red-600 max-w-[150px] truncate" title={signup.email_error}>
                                  {signup.email_error}
                                </span>
                              )}
                              {signup.email_send_attempts > 0 && (
                                <span className="text-xs text-gray-500">
                                  {signup.email_send_attempts} attempts
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {signup.status === 'confirmed' ? (
                              <span className="text-green-600 text-xs">✓ Done</span>
                            ) : (
                              <>
                                <button
                                  onClick={() => resendEmail(signup.email, signup.id)}
                                  disabled={resendingId === signup.id || deletingId === signup.id}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {resendingId === signup.id ? 'Sending...' : '📧 Resend'}
                                </button>
                                {resendMessage?.id === signup.id && (
                                  <span className="text-green-600 text-xs whitespace-nowrap">
                                    {resendMessage.message}
                                  </span>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => deleteUser(signup.email, signup.id)}
                              disabled={deletingId === signup.id || resendingId === signup.id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              title="Delete user"
                            >
                              {deletingId === signup.id ? 'Deleting...' : '🗑️ Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Users should check their spam folder if they don't see the email.
            The confirmation link expires in 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
