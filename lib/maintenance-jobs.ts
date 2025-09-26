// Memory Layer V1 - Maintenance jobs for decay and green hold management

import { supabaseAdmin } from './supabase';
import { calculateSectionProgress, calculateRadarState } from './memory-layer';
import { DECAY_AMOUNT, GREEN_GRACE_PERIOD_DAYS } from './types';

// Decay job - runs at midnight local time
export async function runDecayJob(): Promise<{
  processed_codes: number;
  decayed_codes: number;
  updated_users: Set<string>;
}> {
  console.log('Starting decay job...');

  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  // Find codes that haven't been used in 48+ hours and have power > 0
  const { data: inactiveCodes, error: codesError } = await supabaseAdmin
    .from('codes')
    .select(`
      id,
      user_id,
      section,
      power_pct,
      updated_at,
      logs:logs(timestamp)
    `)
    .eq('status', 'active')
    .gt('power_pct', 0);

  if (codesError) {
    throw new Error(`Failed to fetch codes for decay: ${codesError.message}`);
  }

  const updatedUsers = new Set<string>();
  let processedCodes = 0;
  let decayedCodes = 0;

  for (const code of inactiveCodes || []) {
    processedCodes++;

    // Get the most recent log for this code
    const { data: recentLogs, error: logsError } = await supabaseAdmin
      .from('logs')
      .select('timestamp')
      .eq('code_id', code.id)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (logsError) {
      console.error(`Failed to fetch recent logs for code ${code.id}:`, logsError);
      continue;
    }

    // Determine if code should decay
    let shouldDecay = false;
    if (!recentLogs || recentLogs.length === 0) {
      // No logs at all - check code creation/update time
      shouldDecay = new Date(code.updated_at) < fortyEightHoursAgo;
    } else {
      // Has logs - check most recent log time
      shouldDecay = new Date(recentLogs[0].timestamp) < fortyEightHoursAgo;
    }

    if (shouldDecay) {
      const newPowerPct = Math.max(0, code.power_pct - DECAY_AMOUNT);

      // Update code power
      const { error: updateError } = await supabaseAdmin
        .from('codes')
        .update({
          power_pct: newPowerPct,
          updated_at: new Date().toISOString()
        })
        .eq('id', code.id);

      if (updateError) {
        console.error(`Failed to update code ${code.id}:`, updateError);
        continue;
      }

      decayedCodes++;
      updatedUsers.add(code.user_id);

      console.log(`Decayed code ${code.id} from ${code.power_pct}% to ${newPowerPct}%`);
    }
  }

  // Recalculate section progress and radar state for affected users
  for (const userId of updatedUsers) {
    try {
      const sections = ['pre_game', 'in_game', 'post_game', 'locker_room', 'off_court'];

      // Recalculate all sections for this user
      for (const section of sections) {
        await calculateSectionProgress(userId, section as any);
      }

      // Recalculate radar state
      await calculateRadarState(userId);
    } catch (error) {
      console.error(`Failed to update progress for user ${userId}:`, error);
    }
  }

  console.log(`Decay job completed. Processed: ${processedCodes}, Decayed: ${decayedCodes}, Users updated: ${updatedUsers.size}`);

  return {
    processed_codes: processedCodes,
    decayed_codes: decayedCodes,
    updated_users: updatedUsers
  };
}

// Green Hold maintenance check - runs at noon local time
export async function runGreenHoldMaintenanceJob(): Promise<{
  sections_checked: number;
  sections_demoted: number;
  sections_warned: number;
}> {
  console.log('Starting Green Hold maintenance job...');

  const now = new Date();
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() - GREEN_GRACE_PERIOD_DAYS);

  // Find all green sections that might need maintenance
  const { data: greenSections, error: sectionsError } = await supabaseAdmin
    .from('section_progress')
    .select('*')
    .eq('color', 'green');

  if (sectionsError) {
    throw new Error(`Failed to fetch green sections: ${sectionsError.message}`);
  }

  let sectionsChecked = 0;
  let sectionsDemoted = 0;
  let sectionsWarned = 0;

  for (const section of greenSections || []) {
    sectionsChecked++;

    // Check activity in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentLogs, error: logsError } = await supabaseAdmin
      .from('logs')
      .select('timestamp')
      .eq('user_id', section.user_id)
      .eq('section', section.section)
      .eq('counted', true)
      .gte('timestamp', sevenDaysAgo.toISOString());

    if (logsError) {
      console.error(`Failed to fetch recent logs for section ${section.id}:`, logsError);
      continue;
    }

    // Count unique days with activity
    const logDates = new Set();
    recentLogs?.forEach(log => {
      const logDate = new Date(log.timestamp).toDateString();
      logDates.add(logDate);
    });

    const activeDays = logDates.size;
    const isActiveEnough = activeDays >= 4; // Need 4 days active in 7-day window

    if (!isActiveEnough) {
      // Section is not meeting maintenance requirements
      if (!section.grace_started_at) {
        // Start grace period
        const { error: graceError } = await supabaseAdmin
          .from('section_progress')
          .update({
            grace_started_at: now.toISOString()
          })
          .eq('id', section.id);

        if (graceError) {
          console.error(`Failed to start grace period for section ${section.id}:`, graceError);
          continue;
        }

        sectionsWarned++;
        console.log(`Started grace period for user ${section.user_id} section ${section.section}`);

      } else {
        // Check if grace period has expired
        const graceStarted = new Date(section.grace_started_at);
        if (graceStarted < gracePeriodEnd) {
          // Grace period expired - demote to yellow and end green hold
          let longestGreenHoldSec = section.longest_green_hold_sec;

          // Calculate current green hold duration if active
          if (section.green_hold_started_at) {
            const holdStart = new Date(section.green_hold_started_at);
            const currentHoldDuration = Math.floor((now.getTime() - holdStart.getTime()) / 1000);
            longestGreenHoldSec = Math.max(longestGreenHoldSec, currentHoldDuration);
          }

          const { error: demoteError } = await supabaseAdmin
            .from('section_progress')
            .update({
              color: 'yellow',
              grace_started_at: null,
              green_hold_started_at: null,
              longest_green_hold_sec: longestGreenHoldSec
            })
            .eq('id', section.id);

          if (demoteError) {
            console.error(`Failed to demote section ${section.id}:`, demoteError);
            continue;
          }

          // Recalculate radar state for this user
          await calculateRadarState(section.user_id);

          sectionsDemoted++;
          console.log(`Demoted user ${section.user_id} section ${section.section} from green to yellow`);
        }
      }
    } else if (section.grace_started_at) {
      // Section is now meeting requirements - clear grace period
      const { error: clearGraceError } = await supabaseAdmin
        .from('section_progress')
        .update({
          grace_started_at: null
        })
        .eq('id', section.id);

      if (clearGraceError) {
        console.error(`Failed to clear grace period for section ${section.id}:`, clearGraceError);
      } else {
        console.log(`Cleared grace period for user ${section.user_id} section ${section.section}`);
      }
    }
  }

  console.log(`Green Hold maintenance completed. Checked: ${sectionsChecked}, Demoted: ${sectionsDemoted}, Warned: ${sectionsWarned}`);

  return {
    sections_checked: sectionsChecked,
    sections_demoted: sectionsDemoted,
    sections_warned: sectionsWarned
  };
}

// Combined maintenance job that can be called by a single cron job
export async function runAllMaintenanceJobs(): Promise<{
  decay_results: Awaited<ReturnType<typeof runDecayJob>>;
  green_hold_results: Awaited<ReturnType<typeof runGreenHoldMaintenanceJob>>;
}> {
  const [decayResults, greenHoldResults] = await Promise.all([
    runDecayJob(),
    runGreenHoldMaintenanceJob()
  ]);

  return {
    decay_results: decayResults,
    green_hold_results: greenHoldResults
  };
}