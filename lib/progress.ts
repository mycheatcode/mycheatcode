import { createClient } from './supabase/client';

// Progress calculation rules:
// - Baseline: 25% (built-in confidence - every athlete starts here)
// - First 5 chats: +3% each (40% at 5 chats)
// - Chats 6-15: +2% each (60% at 15 chats)
// - Chats 16-30: +1.5% each (82.5% at 30 chats)
// - Chats 31-50: +1% each (can reach 100% at 50 chats)
// - Chats 51+: +0.5% each (maintain/sustain 100%)
// - Decay: -3% per 72 hours of inactivity
// - Progress floor: 25% (baseline confidence never disappears)
// - Caps at 100%

function calculateChatContribution(chatCount: number): number {
  let progress = 0;

  // First 5 chats: 3% each
  if (chatCount >= 1) progress += Math.min(chatCount, 5) * 3;

  // Chats 6-15: 2% each
  if (chatCount > 5) {
    const chats6to15 = Math.min(chatCount - 5, 10);
    progress += chats6to15 * 2;
  }

  // Chats 16-30: 1.5% each
  if (chatCount > 15) {
    const chats16to30 = Math.min(chatCount - 15, 15);
    progress += chats16to30 * 1.5;
  }

  // Chats 31-50: 1% each
  if (chatCount > 30) {
    const chats31to50 = Math.min(chatCount - 30, 20);
    progress += chats31to50 * 1;
  }

  // Chats 51+: 0.5% each
  if (chatCount > 50) {
    progress += (chatCount - 50) * 0.5;
  }

  return progress;
}

function calculateDecay(lastActivityTimestamp: number): number {
  const now = Date.now();
  const hoursSinceActivity = (now - lastActivityTimestamp) / (1000 * 60 * 60);
  const daysSinceActivity = hoursSinceActivity / 24;

  // Decay starts after 72 hours (3 days)
  if (daysSinceActivity < 3) return 0;

  // -3% per 72 hours of inactivity
  const decayPeriods = Math.floor(daysSinceActivity / 3);
  return decayPeriods * 3;
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
    // Count actual chat SESSIONS (not individual activities)
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id, created_at')
      .eq('user_id', userId);

    if (chatsError) {
      console.error('Error fetching chats:', chatsError);
      return {
        progress: 25, // Return baseline even on error
        chatCount: 0,
        baseProgress: 25,
        decay: 0,
        lastActivity: null,
        hoursUntilNextDecay: 0,
        isDecaying: false,
      };
    }

    // Count total chat sessions
    const chatCount = chats?.length || 0;

    // Get most recent chat activity for decay calculation
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('created_at')
      .eq('user_id', userId)
      .eq('activity_type', 'chat')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching activity:', error);
    }

    // Get last activity timestamp
    const lastActivity = activities && activities.length > 0 ? new Date(activities[0].created_at).getTime() : 0;

    // Baseline confidence (25%)
    const BASELINE_CONFIDENCE = 25;

    // Calculate base progress from chats
    const chatProgress = calculateChatContribution(chatCount);

    // Calculate decay
    const decay = lastActivity > 0 ? calculateDecay(lastActivity) : 0;

    // Total base progress = baseline + chat contribution
    const baseProgress = BASELINE_CONFIDENCE + chatProgress;

    // Final progress (capped 25-100, never below baseline)
    const finalProgress = Math.max(BASELINE_CONFIDENCE, Math.min(100, baseProgress - decay));

    // Calculate time until next decay (decay happens every 72 hours)
    const hoursSinceActivity =
      lastActivity > 0 ? (Date.now() - lastActivity) / (1000 * 60 * 60) : 0;
    const hoursUntilNextDecay =
      lastActivity > 0 ? Math.max(0, 72 - (hoursSinceActivity % 72)) : 0;

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
      progress: 25, // Return baseline even on error
      chatCount: 0,
      baseProgress: 25,
      decay: 0,
      lastActivity: null,
      hoursUntilNextDecay: 0,
      isDecaying: false,
    };
  }
}
