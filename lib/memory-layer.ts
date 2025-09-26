// Memory Layer V1 - Core business logic and database utilities

import { supabase } from './supabase';
import {
  User,
  Session,
  Message,
  Code,
  Log,
  SectionProgress,
  RadarState,
  SectionType,
  ColorType,
  GrowthCalculation,
  SECTION_PROMOTION_RULES,
  SECTIONS,
  DAILY_LOG_LIMIT,
  MAX_ACTIVE_CODES_PER_SECTION,
  DECAY_AMOUNT,
  GREEN_MAINTENANCE_DAYS,
  GREEN_GRACE_PERIOD_DAYS
} from './types';

// Authentication helpers
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (fetchError) return null;
  return data;
}

export async function ensureUserExists(userId: string, handle: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, handle })
    .select()
    .single();

  if (error) throw new Error(`Failed to create/update user: ${error.message}`);
  return data;
}

// Session management
export async function upsertActiveSession(userId: string, section: SectionType): Promise<Session> {
  // End any existing active session for this user/section
  await supabase
    .from('sessions')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('section', section)
    .eq('is_active', true);

  // Create new active session
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      section,
      is_active: true
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

export async function saveMessage(sessionId: string, role: 'user' | 'assistant' | 'system', text: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      text
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save message: ${error.message}`);
  return data;
}

// Code management
export async function createCode(userId: string, section: SectionType, name: string, oneLine: string): Promise<{ code: Code; active_count: number }> {
  // Check active codes limit
  const { data: activeCodes, error: countError } = await supabase
    .from('codes')
    .select('id')
    .eq('user_id', userId)
    .eq('section', section)
    .eq('status', 'active');

  if (countError) throw new Error(`Failed to check active codes: ${countError.message}`);

  if (activeCodes && activeCodes.length >= MAX_ACTIVE_CODES_PER_SECTION) {
    throw new Error(`Maximum ${MAX_ACTIVE_CODES_PER_SECTION} active codes per section. Archive one to add another.`);
  }

  const { data, error } = await supabase
    .from('codes')
    .insert({
      user_id: userId,
      section,
      name,
      one_line: oneLine,
      status: 'active',
      power_pct: 0
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create code: ${error.message}`);

  return {
    code: data,
    active_count: (activeCodes?.length || 0) + 1
  };
}

// Growth calculation
export async function calculateGrowth(codeId: string, userId: string, section: SectionType): Promise<GrowthCalculation> {
  // Get existing logs for this code
  const { data: logs, error } = await supabase
    .from('logs')
    .select('id, timestamp')
    .eq('code_id', codeId)
    .order('timestamp', { ascending: true });

  if (error) throw new Error(`Failed to fetch logs: ${error.message}`);

  const logCount = logs ? logs.length : 0;

  // Check honeymoon period (first 7 days OR first 10 logs for entire section)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: sectionLogs, error: sectionError } = await supabase
    .from('logs')
    .select('id')
    .eq('user_id', userId)
    .eq('section', section)
    .gte('timestamp', sevenDaysAgo.toISOString());

  if (sectionError) throw new Error(`Failed to fetch section logs: ${sectionError.message}`);

  const sectionLogCount = sectionLogs ? sectionLogs.length : 0;
  const isHoneymoon = sectionLogCount <= 10;

  // Calculate base growth
  let growthAmount: number;
  if (logCount < 3) {
    growthAmount = 20;
  } else if (logCount < 6) {
    growthAmount = 10;
  } else if (logCount < 10) {
    growthAmount = 5;
  } else {
    growthAmount = Math.random() < 0.5 ? 2 : 3;
  }

  // Apply honeymoon bonus
  if (isHoneymoon) {
    growthAmount = Math.floor(growthAmount * 1.25);
  }

  return {
    new_power_pct: Math.min(100, growthAmount),
    growth_amount: growthAmount,
    is_honeymoon: isHoneymoon,
    log_count: logCount + 1
  };
}

// Daily cap checking
export async function checkDailyLogLimit(userId: string, section: SectionType): Promise<{ can_log: boolean; count_today: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('logs')
    .select('id')
    .eq('user_id', userId)
    .eq('section', section)
    .eq('counted', true)
    .gte('timestamp', today.toISOString());

  if (error) throw new Error(`Failed to check daily limit: ${error.message}`);

  const countToday = data ? data.length : 0;
  return {
    can_log: countToday < DAILY_LOG_LIMIT,
    count_today: countToday
  };
}

// Section progress calculation
export async function calculateSectionProgress(userId: string, section: SectionType): Promise<SectionProgress> {
  // Get all logs for this section
  const { data: logs, error: logsError } = await supabase
    .from('logs')
    .select('code_id, counted')
    .eq('user_id', userId)
    .eq('section', section);

  if (logsError) throw new Error(`Failed to fetch section logs: ${logsError.message}`);

  // Get unique codes and total valid logs
  const validLogs = logs?.filter(log => log.counted) || [];
  const uniqueCodeIds = new Set(validLogs.map(log => log.code_id));
  const totalValidLogs = validLogs.length;
  const uniqueCodesUsed = uniqueCodeIds.size;

  // Calculate section score (average of active codes' power)
  const { data: activeCodes, error: codesError } = await supabase
    .from('codes')
    .select('power_pct')
    .eq('user_id', userId)
    .eq('section', section)
    .eq('status', 'active');

  if (codesError) throw new Error(`Failed to fetch active codes: ${codesError.message}`);

  const sectionScore = activeCodes && activeCodes.length > 0
    ? Math.round(activeCodes.reduce((sum, code) => sum + code.power_pct, 0) / activeCodes.length)
    : 0;

  // Determine color based on guardrails
  let color: ColorType = 'red';

  if (totalValidLogs >= SECTION_PROMOTION_RULES.yellow_to_green.min_logs &&
      uniqueCodesUsed >= SECTION_PROMOTION_RULES.yellow_to_green.min_codes) {
    color = 'green';
  } else if (totalValidLogs >= SECTION_PROMOTION_RULES.orange_to_yellow.min_logs &&
             uniqueCodesUsed >= SECTION_PROMOTION_RULES.orange_to_yellow.min_codes) {
    color = 'yellow';
  } else if (totalValidLogs >= SECTION_PROMOTION_RULES.red_to_orange.min_logs &&
             uniqueCodesUsed >= SECTION_PROMOTION_RULES.red_to_orange.min_codes) {
    color = 'orange';
  }

  // Get or create section progress record
  const { data: existing } = await supabase
    .from('section_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('section', section)
    .single();

  const progressData = {
    user_id: userId,
    section,
    section_score: sectionScore,
    color,
    total_valid_logs: totalValidLogs,
    unique_codes_used: uniqueCodesUsed,
    last_active_at: new Date().toISOString(),
    // Preserve existing green hold data
    green_hold_started_at: existing?.green_hold_started_at || null,
    longest_green_hold_sec: existing?.longest_green_hold_sec || 0,
    grace_started_at: existing?.grace_started_at || null,
    streak_days_7: existing?.streak_days_7 || 0
  };

  // Handle green hold transitions
  if (color === 'green' && existing?.color !== 'green') {
    // Starting green hold
    progressData.green_hold_started_at = new Date().toISOString();
    progressData.grace_started_at = null;
  } else if (color !== 'green' && existing?.color === 'green' && existing?.green_hold_started_at) {
    // Ending green hold - calculate duration and update longest
    const holdStart = new Date(existing.green_hold_started_at);
    const holdDuration = Math.floor((Date.now() - holdStart.getTime()) / 1000);
    progressData.longest_green_hold_sec = Math.max(existing.longest_green_hold_sec, holdDuration);
    progressData.green_hold_started_at = null;
    progressData.grace_started_at = null;
  }

  const { data, error } = await supabase
    .from('section_progress')
    .upsert(progressData)
    .select()
    .single();

  if (error) throw new Error(`Failed to update section progress: ${error.message}`);
  return data;
}

// Radar state calculation
export async function calculateRadarState(userId: string): Promise<RadarState> {
  const { data: sectionProgress, error } = await supabase
    .from('section_progress')
    .select('section, section_score')
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to fetch section progress: ${error.message}`);

  // Initialize with zeros
  const scores = {
    pre_game_score: 0,
    in_game_score: 0,
    post_game_score: 0,
    locker_room_score: 0,
    off_court_score: 0
  };

  // Map section progress to radar scores
  sectionProgress?.forEach(progress => {
    scores[`${progress.section}_score` as keyof typeof scores] = progress.section_score;
  });

  // Calculate overall radar score (average)
  const radarScore = Math.round(
    (scores.pre_game_score + scores.in_game_score + scores.post_game_score +
     scores.locker_room_score + scores.off_court_score) / 5
  );

  const radarData = {
    user_id: userId,
    ...scores,
    radar_score: radarScore,
    updated_at: new Date().toISOString()
  };

  const { data, error: upsertError } = await supabase
    .from('radar_state')
    .upsert(radarData)
    .select()
    .single();

  if (upsertError) throw new Error(`Failed to update radar state: ${upsertError.message}`);
  return data;
}

// Complete log creation flow
export async function createLog(codeId: string, userId: string): Promise<{
  log: Log;
  code: Code;
  section_progress: SectionProgress;
  radar_state: RadarState;
  should_count: boolean;
}> {
  // Get code details
  const { data: code, error: codeError } = await supabase
    .from('codes')
    .select('*')
    .eq('id', codeId)
    .eq('user_id', userId) // Ensure ownership
    .single();

  if (codeError || !code) {
    throw new Error('Code not found or access denied');
  }

  // Check daily limit
  const dailyCheck = await checkDailyLogLimit(userId, code.section);
  const shouldCount = dailyCheck.can_log;

  // Calculate growth if this log will count
  let newPowerPct = code.power_pct;
  if (shouldCount) {
    const growth = await calculateGrowth(codeId, userId, code.section);
    newPowerPct = Math.min(100, code.power_pct + growth.growth_amount);
  }

  // Create log entry
  const { data: log, error: logError } = await supabase
    .from('logs')
    .insert({
      code_id: codeId,
      user_id: userId,
      section: code.section,
      counted: shouldCount
    })
    .select()
    .single();

  if (logError) throw new Error(`Failed to create log: ${logError.message}`);

  // Update code power if log counts
  let updatedCode = code;
  if (shouldCount) {
    const { data, error: updateError } = await supabase
      .from('codes')
      .update({ power_pct: newPowerPct })
      .eq('id', codeId)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update code power: ${updateError.message}`);
    updatedCode = data;
  }

  // Recalculate section progress
  const sectionProgress = await calculateSectionProgress(userId, code.section);

  // Recalculate radar state
  const radarState = await calculateRadarState(userId);

  return {
    log,
    code: updatedCode,
    section_progress: sectionProgress,
    radar_state: radarState,
    should_count: shouldCount
  };
}

// Progress retrieval
export async function getProgress(userId: string): Promise<{
  radar_state: RadarState;
  section_progress: SectionProgress[];
}> {
  const [radarResult, progressResult] = await Promise.all([
    supabase
      .from('radar_state')
      .select('*')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('section_progress')
      .select('*')
      .eq('user_id', userId)
      .order('section')
  ]);

  if (radarResult.error) {
    // Create empty radar state if none exists
    const emptyRadar = await calculateRadarState(userId);
    radarResult.data = emptyRadar;
  }

  if (progressResult.error) {
    throw new Error(`Failed to fetch progress: ${progressResult.error.message}`);
  }

  return {
    radar_state: radarResult.data,
    section_progress: progressResult.data || []
  };
}