import { createClient } from './supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Create or update a chat session in the database
 */
export async function saveChat(
  userId: string,
  messages: ChatMessage[],
  chatId?: string
): Promise<{ chatId: string; error?: string }> {
  const supabase = createClient();

  try {
    if (chatId) {
      // Update existing chat
      const { error } = await supabase
        .from('chats')
        .update({
          messages: messages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating chat:', error);
        return { chatId, error: error.message };
      }

      return { chatId };
    } else {
      // Create new chat
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: userId,
          messages: messages,
          is_active: true,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        return { chatId: '', error: error.message };
      }

      return { chatId: data.id };
    }
  } catch (err) {
    console.error('Unexpected error saving chat:', err);
    return { chatId: chatId || '', error: 'Unexpected error' };
  }
}

/**
 * Get the active chat for a user
 */
export async function getActiveChat(userId: string): Promise<{
  chatId?: string;
  messages?: ChatMessage[];
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('chats')
      .select('id, messages')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No active chat is not an error
      if (error.code === 'PGRST116') {
        return {};
      }
      console.error('Error fetching active chat:', error);
      return { error: error.message };
    }

    return {
      chatId: data.id,
      messages: data.messages as ChatMessage[],
    };
  } catch (err) {
    console.error('Unexpected error fetching chat:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * End the current active chat session
 */
export async function endActiveChat(userId: string, chatId: string): Promise<{ error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('chats')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error ending chat:', error);
      return { error: error.message };
    }

    return {};
  } catch (err) {
    console.error('Unexpected error ending chat:', err);
    return { error: 'Unexpected error' };
  }
}

/**
 * Log activity for progress tracking
 */
export async function logActivity(
  userId: string,
  activityType: 'chat' | 'cheat_code_saved' | 'cheat_code_used',
  metadata?: Record<string, any>
): Promise<{ error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('activity_log').insert({
      user_id: userId,
      activity_type: activityType,
      metadata: metadata || {},
    });

    if (error) {
      console.error('Error logging activity:', error);
      return { error: error.message };
    }

    return {};
  } catch (err) {
    console.error('Unexpected error logging activity:', err);
    return { error: 'Unexpected error' };
  }
}
