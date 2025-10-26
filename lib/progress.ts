import { createClient } from './supabase/client';

/**
 * NEW MOMENTUM SYSTEM
 *
 * FIRST-TIME BONUSES (one-time only):
 * - First meaningful chat (5+ USER messages, avg 20+ chars): +2%
 * - First code created: +5%
 * - First code completion: +3%
 *
 * CODE CREATION GAINS (based on CURRENT momentum):
 * - Momentum 25-39%: +4% per code
 * - Momentum 40-59%: +2.5% per code
 * - Momentum 60-79%: +2% per code
 * - Momentum 80-99%: +2% per code
 * - Momentum 100%: +1% per code
 *
 * MEANINGFUL CHATS:
 * - Requirements: 5+ USER messages (AI doesn't count), avg 20+ chars, no code created
 * - +1% per chat
 * - Max 3 counted per day
 *
 * CODE COMPLETIONS:
 * - +1% per completion
 * - Each code can only be completed once per 24 hours
 *
 * DAILY CAPS:
 * - First 3 days after signup: No cap
 * - Day 4+: 12% max total gain per day
 *
 * DECAY:
 * - 72-hour grace period
 * - After 72hrs: -3% every 3 days of inactivity
 * - Stops at 25% baseline
 *
 * DISPLAY:
 * - Track decimals internally
 * - Display whole numbers only (rounded down)
 */

const BASELINE_CONFIDENCE = 25;

// First-time bonus amounts
const FIRST_CHAT_BONUS = 2;
const FIRST_CODE_BONUS = 5;
const FIRST_COMPLETION_BONUS = 3;

// Code creation gains by momentum tier
function getCodeCreationGain(currentMomentum: number): number {
  if (currentMomentum < 40) return 4;
  if (currentMomentum < 60) return 2.5;
  if (currentMomentum < 80) return 2;
  if (currentMomentum < 100) return 2;
  return 1; // At 100%
}

// Meaningful chat gain
const MEANINGFUL_CHAT_GAIN = 1;
const MAX_CHATS_PER_DAY = 3;

// Code completion gain
const CODE_COMPLETION_GAIN = 1;

// Daily caps
const DAILY_CAP_AFTER_DAY_3 = 12;

function calculateDecay(lastActivityTimestamp: number): number {
  const now = Date.now();
  const hoursSinceActivity = (now - lastActivityTimestamp) / (1000 * 60 * 60);

  // 72-hour grace period
  if (hoursSinceActivity < 72) return 0;

  // -3% every 3 days (72 hours) after grace period
  const hoursSinceGracePeriod = hoursSinceActivity - 72;
  const decayPeriods = Math.floor(hoursSinceGracePeriod / 72);
  return decayPeriods * 3;
}

export interface ProgressData {
  progress: number; // Displayed progress (rounded down)
  progressRaw: number; // Internal decimal progress
  chatCount: number;
  codeCount: number;
  completionCount: number;
  baseProgress: number;
  decay: number;
  lastActivity: string | null;
  hoursUntilNextDecay: number;
  isDecaying: boolean;
  firstTimeBonus: number;
  dailyGainToday: number;
  dailyCapReached: boolean;
}

/**
 * Get user's signup date to determine if daily cap applies
 */
async function getUserSignupDate(userId: string): Promise<Date | null> {
  const supabase = createClient();

  // Try to get from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', userId)
    .single();

  if (error || !userData?.created_at) {
    // If no users table or no data, assume user is past day 3 (apply daily cap)
    // This is safer than assuming they're within first 3 days
    return null;
  }

  return new Date(userData.created_at);
}

/**
 * Get daily gain tracking from activity log
 */
async function getDailyGain(userId: string): Promise<number> {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('momentum_gains')
    .select('gain_amount')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) return 0;

  return data?.reduce((sum, record) => sum + record.gain_amount, 0) || 0;
}

/**
 * Record momentum gain in database
 */
async function recordMomentumGain(
  userId: string,
  gainAmount: number,
  source: 'first_chat' | 'first_code' | 'first_completion' | 'code_creation' | 'chat' | 'completion',
  metadata?: any
) {
  const supabase = createClient();

  await supabase.from('momentum_gains').insert({
    user_id: userId,
    gain_amount: gainAmount,
    source,
    metadata,
  });
}

/**
 * Check if user has received a specific first-time bonus
 */
async function hasReceivedFirstTimeBonus(userId: string, source: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('momentum_gains')
    .select('id')
    .eq('user_id', userId)
    .eq('source', source)
    .limit(1);

  if (error) return false;
  return (data?.length || 0) > 0;
}

/**
 * Get meaningful chats today (5+ messages, no code created)
 */
async function getMeaningfulChatsToday(userId: string): Promise<number> {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('momentum_gains')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'chat')
    .gte('created_at', today.toISOString());

  if (error) return 0;
  return data?.length || 0;
}

/**
 * Calculate user's momentum/progress percentage
 */
export async function getUserProgress(userId: string): Promise<ProgressData> {
  const supabase = createClient();

  try {
    // Get all momentum gains to calculate total
    const { data: gains, error: gainsError } = await supabase
      .from('momentum_gains')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (gainsError) {
      console.error('Error fetching momentum gains:', gainsError);
    }

    // Calculate total gains
    let totalGain = 0;
    let firstTimeBonus = 0;
    const gainsArray = gains || [];

    for (const gain of gainsArray) {
      totalGain += gain.gain_amount;
      if (['first_chat', 'first_code', 'first_completion'].includes(gain.source)) {
        firstTimeBonus += gain.gain_amount;
      }
    }

    // Get counts for display
    const { data: chats } = await supabase
      .from('chats')
      .select('id')
      .eq('user_id', userId);
    const chatCount = chats?.length || 0;

    const { data: codes } = await supabase
      .from('cheat_codes')
      .select('id')
      .eq('user_id', userId);
    const codeCount = codes?.length || 0;

    const { data: completions } = await supabase
      .from('code_completions')
      .select('id')
      .eq('user_id', userId);
    const completionCount = completions?.length || 0;

    // Get last activity timestamp
    const { data: activities } = await supabase
      .from('activity_log')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastActivity = activities && activities.length > 0
      ? new Date(activities[0].created_at).getTime()
      : Date.now();

    // Calculate decay
    const decay = calculateDecay(lastActivity);

    // Calculate base progress
    const baseProgress = BASELINE_CONFIDENCE + totalGain;

    // Apply decay (but never below baseline)
    const progressRaw = Math.max(BASELINE_CONFIDENCE, Math.min(100, baseProgress - decay));
    const progress = Math.floor(progressRaw); // Display rounded down

    // Calculate time until next decay
    const hoursSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60);
    const hoursUntilNextDecay = hoursSinceActivity < 72
      ? 72 - hoursSinceActivity
      : 72 - ((hoursSinceActivity - 72) % 72);

    // Get daily gain
    const dailyGainToday = await getDailyGain(userId);

    // Check if daily cap reached
    const signupDate = await getUserSignupDate(userId);
    const daysSinceSignup = signupDate
      ? Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const dailyCapActive = daysSinceSignup >= 3;
    const dailyCapReached = dailyCapActive && dailyGainToday >= DAILY_CAP_AFTER_DAY_3;

    return {
      progress,
      progressRaw,
      chatCount,
      codeCount,
      completionCount,
      baseProgress,
      decay,
      lastActivity: new Date(lastActivity).toISOString(),
      hoursUntilNextDecay: Math.round(hoursUntilNextDecay * 10) / 10,
      isDecaying: decay > 0,
      firstTimeBonus,
      dailyGainToday,
      dailyCapReached,
    };
  } catch (err) {
    console.error('Unexpected error calculating progress:', err);
    return {
      progress: BASELINE_CONFIDENCE,
      progressRaw: BASELINE_CONFIDENCE,
      chatCount: 0,
      codeCount: 0,
      completionCount: 0,
      baseProgress: BASELINE_CONFIDENCE,
      decay: 0,
      lastActivity: null,
      hoursUntilNextDecay: 0,
      isDecaying: false,
      firstTimeBonus: 0,
      dailyGainToday: 0,
      dailyCapReached: false,
    };
  }
}

/**
 * Award momentum for creating a code
 */
export async function awardCodeCreationMomentum(userId: string, codeId: string): Promise<number> {
  const supabase = createClient();

  // Check if this is first code
  const isFirstCode = !(await hasReceivedFirstTimeBonus(userId, 'first_code'));

  // Get current progress to determine tier
  const currentProgress = await getUserProgress(userId);

  // Check daily cap
  if (currentProgress.dailyCapReached) {
    return 0;
  }

  let gainAmount = 0;

  // Award first code bonus
  if (isFirstCode) {
    gainAmount += FIRST_CODE_BONUS;
    await recordMomentumGain(userId, FIRST_CODE_BONUS, 'first_code', { code_id: codeId });
  }

  // Award tier-based code creation gain
  const tierGain = getCodeCreationGain(currentProgress.progressRaw);

  // Check if this would exceed daily cap
  const remainingDailyCap = currentProgress.dailyCapReached
    ? 0
    : DAILY_CAP_AFTER_DAY_3 - currentProgress.dailyGainToday;

  const signupDate = await getUserSignupDate(userId);
  const daysSinceSignup = signupDate
    ? Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const dailyCapActive = daysSinceSignup >= 3;

  const actualTierGain = dailyCapActive
    ? Math.min(tierGain, remainingDailyCap)
    : tierGain;

  if (actualTierGain > 0) {
    gainAmount += actualTierGain;
    await recordMomentumGain(userId, actualTierGain, 'code_creation', { code_id: codeId });
  }


  return gainAmount;
}

/**
 * Check if a chat qualifies as "meaningful"
 * Requirements:
 * - 5+ messages FROM THE USER (AI responses don't count)
 * - Average user message length >= 20 characters
 * - No cheat code was created in this chat
 */
async function isMeaningfulChat(userId: string, chatId: string): Promise<boolean> {
  const supabase = createClient();

  // Get all messages from this chat
  const { data: chat, error } = await supabase
    .from('chats')
    .select('messages')
    .eq('id', chatId)
    .eq('user_id', userId)
    .single();

  if (error || !chat || !chat.messages) {
    return false;
  }

  const messages = chat.messages as any[];

  // Count user messages only (role === 'user')
  const userMessages = messages.filter((m: any) => m.role === 'user');

  // Must have at least 5 user messages
  if (userMessages.length < 5) {
    return false;
  }

  // Calculate average user message length
  const totalLength = userMessages.reduce((sum: number, m: any) => {
    return sum + (m.content?.length || 0);
  }, 0);
  const avgLength = totalLength / userMessages.length;

  // Average message must be at least 20 characters
  if (avgLength < 20) {
    return false;
  }

  // Check if a cheat code was created in this chat
  const { data: codes } = await supabase
    .from('cheat_codes')
    .select('id')
    .eq('user_id', userId)
    .eq('chat_id', chatId)
    .limit(1);

  if (codes && codes.length > 0) {
    return false;
  }

  return true;
}

/**
 * Award momentum for meaningful chat (5+ user messages, avg 20+ chars, no code created)
 */
export async function awardMeaningfulChatMomentum(userId: string, chatId: string): Promise<number> {
  // Check if chat qualifies as meaningful
  const isMeaningful = await isMeaningfulChat(userId, chatId);
  if (!isMeaningful) {
    return 0;
  }

  // Check if this is first meaningful chat
  const isFirstChat = !(await hasReceivedFirstTimeBonus(userId, 'first_chat'));

  // Get current progress
  const currentProgress = await getUserProgress(userId);

  // Check daily cap
  if (currentProgress.dailyCapReached) {
    return 0;
  }

  // Check max chats per day
  const chatsToday = await getMeaningfulChatsToday(userId);
  if (!isFirstChat && chatsToday >= MAX_CHATS_PER_DAY) {
    return 0;
  }

  let gainAmount = 0;

  // Award first chat bonus
  if (isFirstChat) {
    gainAmount += FIRST_CHAT_BONUS;
    await recordMomentumGain(userId, FIRST_CHAT_BONUS, 'first_chat', { chat_id: chatId });
  }

  // Award regular chat gain (if under daily limit)
  if (chatsToday < MAX_CHATS_PER_DAY) {
    gainAmount += MEANINGFUL_CHAT_GAIN;
    await recordMomentumGain(userId, MEANINGFUL_CHAT_GAIN, 'chat', { chat_id: chatId });
  }


  return gainAmount;
}

/**
 * Award momentum for completing a code
 */
export async function awardCodeCompletionMomentum(userId: string, codeId: string): Promise<number> {
  const supabase = createClient();

  // Check if this code was completed in last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const { data: recentCompletion } = await supabase
    .from('momentum_gains')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'completion')
    .gte('created_at', oneDayAgo.toISOString())
    .eq('metadata->>code_id', codeId)
    .limit(1);

  if (recentCompletion && recentCompletion.length > 0) {
    return 0;
  }

  // Check if this is first completion
  const isFirstCompletion = !(await hasReceivedFirstTimeBonus(userId, 'first_completion'));

  // Get current progress
  const currentProgress = await getUserProgress(userId);

  // Check daily cap
  if (currentProgress.dailyCapReached) {
    return 0;
  }

  let gainAmount = 0;

  // Award first completion bonus
  if (isFirstCompletion) {
    gainAmount += FIRST_COMPLETION_BONUS;
    await recordMomentumGain(userId, FIRST_COMPLETION_BONUS, 'first_completion', { code_id: codeId });
  }

  // Award regular completion gain
  gainAmount += CODE_COMPLETION_GAIN;
  await recordMomentumGain(userId, CODE_COMPLETION_GAIN, 'completion', { code_id: codeId });


  return gainAmount;
}
