import { createClient } from './supabase/client';

export interface CheatCodeData {
  title: string;
  category: string;
  what?: string;
  when?: string;
  how?: string;
  why?: string;
  phrase?: string;
  practice?: string;
}

/**
 * Save a cheat code from chat to the database
 */
export async function saveCheatCode(
  userId: string,
  cheatCodeData: CheatCodeData,
  chatId?: string
): Promise<{ cheatCodeId?: string; error?: string }> {
  const supabase = createClient();

  try {
    // Build content from individual fields
    const contentParts = [];
    if (cheatCodeData.what) contentParts.push(`**What**: ${cheatCodeData.what}`);
    if (cheatCodeData.when) contentParts.push(`**When**: ${cheatCodeData.when}`);
    if (cheatCodeData.how) contentParts.push(`**How**: ${cheatCodeData.how}`);
    if (cheatCodeData.why) contentParts.push(`**Why**: ${cheatCodeData.why}`);
    if (cheatCodeData.phrase) contentParts.push(`**Cheat Code Phrase**: "${cheatCodeData.phrase}"`);

    const content = contentParts.join('\n\n');

    const { data, error } = await supabase
      .from('cheat_codes')
      .insert({
        user_id: userId,
        title: cheatCodeData.title,
        category: cheatCodeData.category,
        content: content,
        chat_id: chatId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving cheat code:', error);
      return { error: error.message };
    }

    return { cheatCodeId: data.id };
  } catch (err) {
    console.error('Unexpected error saving cheat code:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Get all cheat codes for a user
 */
export async function getUserCheatCodes(userId: string): Promise<{
  cheatCodes?: any[];
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('cheat_codes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cheat codes:', error);
      return { error: error.message };
    }

    return { cheatCodes: data };
  } catch (err) {
    console.error('Unexpected error fetching cheat codes:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Get a specific cheat code by ID
 */
export async function getCheatCode(
  userId: string,
  cheatCodeId: string
): Promise<{
  cheatCode?: any;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('cheat_codes')
      .select('*')
      .eq('id', cheatCodeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching cheat code:', error);
      return { error: error.message };
    }

    return { cheatCode: data };
  } catch (err) {
    console.error('Unexpected error fetching cheat code:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Update a cheat code
 */
export async function updateCheatCode(
  userId: string,
  cheatCodeId: string,
  updates: Partial<CheatCodeData>
): Promise<{ error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('cheat_codes')
      .update({
        ...updates,
      })
      .eq('id', cheatCodeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating cheat code:', error);
      return { error: error.message };
    }

    return {};
  } catch (err) {
    console.error('Unexpected error updating cheat code:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Delete a cheat code
 */
export async function deleteCheatCode(
  userId: string,
  cheatCodeId: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('cheat_codes')
      .delete()
      .eq('id', cheatCodeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting cheat code:', error);
      return { error: error.message };
    }

    return {};
  } catch (err) {
    console.error('Unexpected error deleting cheat code:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Update power for a cheat code (called when user logs usage)
 */
export async function updateCheatCodePower(
  userId: string,
  cheatCodeId: string,
  powerDelta: number
): Promise<{ error?: string }> {
  const supabase = createClient();

  try {
    // Get current power
    const { data: code, error: fetchError } = await supabase
      .from('cheat_codes')
      .select('power')
      .eq('id', cheatCodeId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching cheat code for power update:', fetchError);
      return { error: fetchError.message };
    }

    // Calculate new power (capped at 100)
    const newPower = Math.min(100, (code.power || 0) + powerDelta);

    // Update power and last_used_at
    const { error: updateError } = await supabase
      .from('cheat_codes')
      .update({
        power: newPower,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', cheatCodeId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating cheat code power:', updateError);
      return { error: updateError.message };
    }

    return {};
  } catch (err) {
    console.error('Unexpected error updating cheat code power:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Log cheat code usage
 * Creates a usage log entry and increments the usage count
 */
export async function logCheatCodeUsage(
  userId: string,
  cheatCodeId: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  try {
    // Insert usage log entry (silently fail if table doesn't exist)
    await supabase
      .from('cheat_code_usage_log')
      .insert({
        user_id: userId,
        cheat_code_id: cheatCodeId,
      });

    // Get current times_used count
    const { data: code, error: fetchError } = await supabase
      .from('cheat_codes')
      .select('times_used')
      .eq('id', cheatCodeId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      // If column doesn't exist, just skip silently
      return {};
    }

    // Update times_used and last_used_at
    await supabase
      .from('cheat_codes')
      .update({
        times_used: (code.times_used || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', cheatCodeId)
      .eq('user_id', userId);

    return {};
  } catch (err) {
    // Silently handle errors
    return {};
  }
}

/**
 * Check if a cheat code was used today
 */
export async function checkTodayUsage(
  userId: string,
  cheatCodeId: string
): Promise<{ usedToday: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Get today's date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('=== Checking today usage ===');
    console.log('User ID:', userId);
    console.log('Cheat Code ID:', cheatCodeId);
    console.log('Today start:', today.toISOString());

    const { data, error } = await supabase
      .from('cheat_code_usage_log')
      .select('id')
      .eq('user_id', userId)
      .eq('cheat_code_id', cheatCodeId)
      .gte('used_at', today.toISOString())
      .limit(1);

    if (error) {
      console.log('Error checking usage:', error);
      // Gracefully handle any errors (table doesn't exist, etc.)
      // Just return false - not used today
      return { usedToday: false };
    }

    const wasUsedToday = (data?.length || 0) > 0;
    console.log('Data from query:', data);
    console.log('Was used today?', wasUsedToday);

    return { usedToday: wasUsedToday };
  } catch (err) {
    console.log('Exception checking usage:', err);
    // Silently handle any errors and return false
    return { usedToday: false };
  }
}

/**
 * Get usage statistics for a cheat code
 */
export async function getUsageStats(
  userId: string,
  cheatCodeId: string
): Promise<{
  timesUsed: number;
  lastUsedAt: string | null;
  lastUsedDaysAgo: number | null;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('cheat_codes')
      .select('times_used, last_used_at')
      .eq('id', cheatCodeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching usage stats:', error);
      return {
        timesUsed: 0,
        lastUsedAt: null,
        lastUsedDaysAgo: null,
        error: error.message,
      };
    }

    // Calculate days ago
    let lastUsedDaysAgo = null;
    if (data.last_used_at) {
      const lastUsed = new Date(data.last_used_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastUsed.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      lastUsedDaysAgo = diffDays;
    }

    return {
      timesUsed: data.times_used || 0,
      lastUsedAt: data.last_used_at,
      lastUsedDaysAgo,
    };
  } catch (err) {
    console.error('Unexpected error fetching usage stats:', err);
    return {
      timesUsed: 0,
      lastUsedAt: null,
      lastUsedDaysAgo: null,
      error: 'Unexpected error',
    };
  }
}
