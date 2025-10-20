import { createClient } from './supabase/client';

// Progress calculation rules:
// - First 3 chats: +10% each
// - Chats 4-10: +5% each
// - Chats 11+: +2% each
// - Decay: -5% per 24 hours of inactivity
// - Caps at 100%, never below 0%

function calculateChatContribution(chatCount: number): number {
  let progress = 0;

  // First 3 chats: 10% each
  if (chatCount >= 1) progress += Math.min(chatCount, 3) * 10;

  // Chats 4-10: 5% each
  if (chatCount > 3) {
    const chats4to10 = Math.min(chatCount - 3, 7);
    progress += chats4to10 * 5;
  }

  // Chats 11+: 2% each
  if (chatCount > 10) {
    progress += (chatCount - 10) * 2;
  }

  return progress;
}

function calculateDecay(lastActivityTimestamp: number): number {
  const now = Date.now();
  const hoursSinceActivity = (now - lastActivityTimestamp) / (1000 * 60 * 60);
  const daysSinceActivity = hoursSinceActivity / 24;

  // Decay starts after 24 hours
  if (daysSinceActivity < 1) return 0;

  // -5% per 24 hours of inactivity
  return Math.floor(daysSinceActivity) * 5;
}

export interface ProgressData {
  progress: number;
  chatCount: number;
  baseProgress: number;
  decay: number;
  lastActivity: string | null;
  hoursUntilNextDecay: number;
  isDecaying: boolean;
}

/**
 * Calculate user's momentum/progress percentage
 */
export async function getUserProgress(userId: string): Promise<ProgressData> {
  const supabase = createClient();

  try {
    // Fetch user's activity log
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('activity_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activity:', error);
      return {
        progress: 0,
        chatCount: 0,
        baseProgress: 0,
        decay: 0,
        lastActivity: null,
        hoursUntilNextDecay: 0,
        isDecaying: false,
      };
    }

    // Count chat activities
    const chatActivities = activities?.filter((a) => a.activity_type === 'chat') || [];
    const chatCount = chatActivities.length;

    // Get last activity timestamp
    const lastActivity = activities && activities.length > 0 ? new Date(activities[0].created_at).getTime() : 0;

    // Calculate base progress from chats
    const baseProgress = calculateChatContribution(chatCount);

    // Calculate decay
    const decay = lastActivity > 0 ? calculateDecay(lastActivity) : 0;

    // Final progress (capped 0-100)
    const finalProgress = Math.max(0, Math.min(100, baseProgress - decay));

    // Calculate time until next decay
    const hoursSinceActivity =
      lastActivity > 0 ? (Date.now() - lastActivity) / (1000 * 60 * 60) : 0;
    const hoursUntilNextDecay =
      lastActivity > 0 ? Math.max(0, 24 - (hoursSinceActivity % 24)) : 0;

    return {
      progress: finalProgress,
      chatCount,
      baseProgress,
      decay,
      lastActivity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
      hoursUntilNextDecay: Math.round(hoursUntilNextDecay * 10) / 10,
      isDecaying: decay > 0,
    };
  } catch (err) {
    console.error('Unexpected error calculating progress:', err);
    return {
      progress: 0,
      chatCount: 0,
      baseProgress: 0,
      decay: 0,
      lastActivity: null,
      hoursUntilNextDecay: 0,
      isDecaying: false,
    };
  }
}
