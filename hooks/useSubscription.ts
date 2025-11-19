import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { checkSubscriptionStatus, type SubscriptionStatus } from '@/lib/subscription';

/**
 * Hook to check user's subscription status
 * Returns subscription info and loading state
 */
export function useSubscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    status: 'free',
    hasSeenPaywall: false,
    canAccessFeature: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      console.log('🔄 useSubscription: Fetching subscription status...');
      setIsLoading(true);
      const status = await checkSubscriptionStatus(supabase);
      console.log('🔄 useSubscription: Status fetched:', status);
      setSubscriptionStatus(status);
      setIsLoading(false);
    };

    const setupSubscription = async () => {
      await fetchSubscriptionStatus();

      // Set up real-time listener for subscription changes
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return null;
      }

      const channel = supabase
        .channel('subscription_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`
          },
          () => {
            // Refetch subscription status when user record updates
            fetchSubscriptionStatus();
          }
        )
        .subscribe();

      return channel;
    };

    let channelPromise = setupSubscription();

    return () => {
      channelPromise.then((channel) => {
        if (channel) {
          channel.unsubscribe();
        }
      });
    };
  }, [supabase, refetchTrigger]);

  return {
    ...subscriptionStatus,
    isLoading,
    refetch: () => setRefetchTrigger(prev => prev + 1)
  };
}
