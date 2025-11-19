import { SupabaseClient } from '@supabase/supabase-js';

export interface SubscriptionStatus {
  isSubscribed: boolean;
  status: 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  hasSeenPaywall: boolean;
  canAccessFeature: boolean;
}

/**
 * Check if user has an active subscription
 * @param supabase - Supabase client
 * @param userId - User ID to check (optional, will use current user if not provided)
 * @returns Subscription status object
 */
export async function checkSubscriptionStatus(
  supabase: SupabaseClient,
  userId?: string
): Promise<SubscriptionStatus> {
  try {
    // Get user ID if not provided
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          isSubscribed: false,
          status: 'free',
          hasSeenPaywall: false,
          canAccessFeature: false
        };
      }
      targetUserId = user.id;
    }

    // Fetch subscription status from users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_subscribed, subscription_status, paywall_seen')
      .eq('id', targetUserId)
      .single();

    if (error || !userData) {
      console.error('Error fetching subscription status:', error);
      return {
        isSubscribed: false,
        status: 'free',
        hasSeenPaywall: false,
        canAccessFeature: false
      };
    }

    const isSubscribed = userData.is_subscribed || false;
    const status = userData.subscription_status || 'free';
    const hasSeenPaywall = userData.paywall_seen || false;

    // User can access features if they have an active subscription or trial
    const canAccessFeature = isSubscribed || status === 'trialing' || status === 'active';

    return {
      isSubscribed,
      status: status as SubscriptionStatus['status'],
      hasSeenPaywall,
      canAccessFeature
    };
  } catch (error) {
    console.error('Unexpected error checking subscription:', error);
    return {
      isSubscribed: false,
      status: 'free',
      hasSeenPaywall: false,
      canAccessFeature: false
    };
  }
}

/**
 * Check if user should see the paywall after onboarding
 * Returns true if user has completed onboarding but hasn't seen paywall yet
 */
export async function shouldShowPaywallAfterOnboarding(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: userData } = await supabase
      .from('users')
      .select('onboarding_completed, paywall_seen, is_subscribed, subscription_status')
      .eq('id', user.id)
      .single();

    if (!userData) return false;

    // Show paywall if:
    // 1. Onboarding is completed
    // 2. User hasn't seen paywall yet
    // 3. User is not subscribed
    return (
      userData.onboarding_completed &&
      !userData.paywall_seen &&
      !userData.is_subscribed &&
      userData.subscription_status !== 'trialing' &&
      userData.subscription_status !== 'active'
    );
  } catch (error) {
    console.error('Error checking if should show paywall:', error);
    return false;
  }
}

/**
 * Mark paywall as seen
 */
export async function markPaywallSeen(supabase: SupabaseClient): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('users')
      .update({
        paywall_seen: true,
        paywall_seen_at: new Date().toISOString()
      })
      .eq('id', user.id);
  } catch (error) {
    console.error('Error marking paywall as seen:', error);
  }
}
