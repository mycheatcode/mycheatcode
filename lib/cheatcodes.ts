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
    const { data, error } = await supabase
      .from('cheat_codes')
      .insert({
        user_id: userId,
        title: cheatCodeData.title,
        category: cheatCodeData.category,
        what: cheatCodeData.what || null,
        when: cheatCodeData.when || null,
        how: cheatCodeData.how || null,
        why: cheatCodeData.why || null,
        phrase: cheatCodeData.phrase || null,
        practice: cheatCodeData.practice || null,
        source_chat_id: chatId || null,
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
        updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
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
