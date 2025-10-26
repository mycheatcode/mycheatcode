'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface FeedbackItem {
  id: string;
  user_id: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  message: string;
  page_url: string;
  user_email: string;
  created_at: string;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const supabase = createClient();

  useEffect(() => {
    loadFeedback();
  }, []);

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

                {/* Message */}
                <div className="mb-4">
                  <p className="text-white leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>
                </div>

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
