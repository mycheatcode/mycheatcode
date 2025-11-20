'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FeedbackItem {
  id: string;
  user_id: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  message: string | null;
  page_url: string;
  user_email: string;
  created_at: string;
  rating_overall: number | null;
  rating_coach_quality: number | null;
  rating_ease_of_use: number | null;
  rating_feature_value: number | null;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const supabase = createClient();
  const router = useRouter();

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
        'huntersimson11@gmail.com',
        'hunter@courtcandystore.com',
      ];

      if (!adminEmails.includes(user.email || '')) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      loadFeedback();
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/');
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedback(data || []);
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = filter === 'all'
    ? feedback
    : feedback.filter(item => item.type === filter);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return '#ff4444';
      case 'feature': return '#00ff41';
      case 'improvement': return '#ffaa00';
      case 'other': return '#888888';
      default: return '#888888';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature': return '💡';
      case 'improvement': return '✨';
      case 'other': return '💬';
      default: return '💬';
    }
  };

  // Show loading while checking authorization
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Checking authorization...</div>
          <div className="text-zinc-500">Please wait</div>
        </div>
      </div>
    );
  }

  // Don't render if not authorized (redirect will happen)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">User Feedback</h1>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
          <p className="text-zinc-400">
            Total submissions: {feedback.length}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {['all', 'bug', 'feature', 'improvement', 'other'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filter === type
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              {type !== 'all' && ` (${feedback.filter(f => f.type === type).length})`}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-400">
            Loading feedback...
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            No feedback submissions yet
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(item.type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold uppercase px-2 py-1 rounded"
                          style={{
                            backgroundColor: getTypeColor(item.type) + '20',
                            color: getTypeColor(item.type),
                          }}
                        >
                          {item.type}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                {(item.rating_overall || item.rating_coach_quality || item.rating_ease_of_use || item.rating_feature_value) && (
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {item.rating_overall && (
                      <div className="bg-zinc-800 rounded-lg p-3">
                        <div className="text-xs text-zinc-400 mb-1">Coach Experience</div>
                        <div className="text-2xl font-bold text-white">{item.rating_overall}/10</div>
                      </div>
                    )}
                    {item.rating_coach_quality && (
                      <div className="bg-zinc-800 rounded-lg p-3">
                        <div className="text-xs text-zinc-400 mb-1">Cheat Code Advice</div>
                        <div className="text-2xl font-bold text-white">{item.rating_coach_quality}/10</div>
                      </div>
                    )}
                    {item.rating_ease_of_use && (
                      <div className="bg-zinc-800 rounded-lg p-3">
                        <div className="text-xs text-zinc-400 mb-1">Practice Game Scenarios</div>
                        <div className="text-2xl font-bold text-white">{item.rating_ease_of_use}/10</div>
                      </div>
                    )}
                    {item.rating_feature_value && (
                      <div className="bg-zinc-800 rounded-lg p-3">
                        <div className="text-xs text-zinc-400 mb-1">Relatable Topic Variety</div>
                        <div className="text-2xl font-bold text-white">{item.rating_feature_value}/10</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message */}
                {item.message && (
                  <div className="mb-4">
                    <div className="text-xs text-zinc-400 mb-2 font-semibold">Written Feedback:</div>
                    <p className="text-white leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>
                )}

                {/* Screenshot */}
                {item.screenshot_url && (
                  <div className="mb-4">
                    <div className="text-xs text-zinc-400 mb-2 font-semibold">Screenshot:</div>
                    <a
                      href={item.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={item.screenshot_url}
                        alt="User submitted screenshot"
                        className="max-w-full h-auto rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                    </a>
                    <p className="text-xs text-zinc-500 mt-1">Click to view full size</p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                  {item.user_email && (
                    <div>
                      <span className="font-semibold">Email:</span>{' '}
                      <a href={`mailto:${item.user_email}`} className="text-zinc-400 hover:text-white transition-colors">
                        {item.user_email}
                      </a>
                    </div>
                  )}
                  {item.page_url && (
                    <div>
                      <span className="font-semibold">Page:</span>{' '}
                      <span className="text-zinc-400">{item.page_url.replace(window.location.origin, '')}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">User ID:</span>{' '}
                    <span className="text-zinc-400 font-mono text-[10px]">{item.user_id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
