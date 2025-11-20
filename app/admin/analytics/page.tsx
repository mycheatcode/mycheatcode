'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AnalyticsStats {
  totalEvents: number;
  uniqueUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  topEvents: Array<{ event_name: string; count: number }>;
  userEngagement: Array<{ date: string; users: number; events: number }>;
  eventsByCategory: Array<{ category: string; count: number }>;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuthorization();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadAnalytics();
    }
  }, [isAuthorized, timeRange]);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

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
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/');
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date | null = null;
      if (timeRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Fetch all analytics data
      const query = supabase.from('analytics_events').select('*');
      if (startDate) {
        query.gte('created_at', startDate.toISOString());
      }
      const { data: events, error } = await query;

      if (error) throw error;

      if (!events) {
        setStats(null);
        return;
      }

      // Calculate stats
      const uniqueUsers = new Set(events.map(e => e.user_id)).size;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyUsers = new Set(
        events
          .filter(e => new Date(e.created_at) >= today)
          .map(e => e.user_id)
      ).size;

      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyUsers = new Set(
        events
          .filter(e => new Date(e.created_at) >= weekAgo)
          .map(e => e.user_id)
      ).size;

      // Top events
      const eventCounts = events.reduce((acc, e) => {
        acc[e.event_name] = (acc[e.event_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topEvents = Object.entries(eventCounts)
        .map(([event_name, count]) => ({ event_name, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Events by category
      const categoryCounts = events.reduce((acc, e) => {
        acc[e.event_category] = (acc[e.event_category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const eventsByCategory = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count: count as number }))
        .sort((a, b) => b.count - a.count);

      // Daily engagement (last 7 days)
      const dailyEngagement: Record<string, { users: Set<string>; events: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        dailyEngagement[dateStr] = { users: new Set(), events: 0 };
      }

      events.forEach(e => {
        const dateStr = e.created_at.split('T')[0];
        if (dailyEngagement[dateStr]) {
          dailyEngagement[dateStr].users.add(e.user_id);
          dailyEngagement[dateStr].events++;
        }
      });

      const userEngagement = Object.entries(dailyEngagement).map(([date, data]) => ({
        date,
        users: data.users.size,
        events: data.events,
      }));

      setStats({
        totalEvents: events.length,
        uniqueUsers,
        dailyActiveUsers: dailyUsers,
        weeklyActiveUsers: weeklyUsers,
        topEvents,
        userEngagement,
        eventsByCategory,
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

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

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">User Analytics</h1>
            <div className="flex gap-3">
              <Link
                href="/admin/feedback"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Feedback
              </Link>
              <Link
                href="/admin/waitlist"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Waitlist
              </Link>
              <Link
                href="/"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
          <p className="text-zinc-400">
            User behavior tracking and engagement metrics
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-3 mb-6">
          {[
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: 'all', label: 'All Time' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as typeof timeRange)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range.value
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading analytics...</div>
        ) : !stats ? (
          <div className="text-center py-12 text-zinc-400">No analytics data yet</div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-white mb-1">{stats.totalEvents}</div>
                <div className="text-sm text-zinc-400">Total Events</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.uniqueUsers}</div>
                <div className="text-sm text-zinc-400">Unique Users</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-blue-500 mb-1">{stats.dailyActiveUsers}</div>
                <div className="text-sm text-zinc-400">Daily Active Users</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-purple-500 mb-1">{stats.weeklyActiveUsers}</div>
                <div className="text-sm text-zinc-400">Weekly Active Users</div>
              </div>
            </div>

            {/* Daily Engagement Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Daily Engagement (Last 7 Days)</h2>
              <div className="space-y-3">
                {stats.userEngagement.map((day) => (
                  <div key={day.date}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="text-zinc-400">{new Date(day.date).toLocaleDateString()}</span>
                      <span className="text-white font-medium">
                        {day.users} users · {day.events} events
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(day.events / Math.max(...stats.userEngagement.map(d => d.events), 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Events */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Top Events</h2>
                <div className="space-y-3">
                  {stats.topEvents.map((event, index) => (
                    <div key={event.event_name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-mono text-sm">#{index + 1}</span>
                        <span className="text-white font-mono text-sm">{event.event_name}</span>
                      </div>
                      <span className="text-zinc-400 font-medium">{event.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events by Category */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Events by Category</h2>
                <div className="space-y-4">
                  {stats.eventsByCategory.map((cat) => {
                    const percentage = (cat.count / stats.totalEvents) * 100;
                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white capitalize">{cat.category.replace('_', ' ')}</span>
                          <span className="text-zinc-400 text-sm">{cat.count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
