'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'auto' | 'feature_locked'; // auto = after onboarding, feature_locked = user tried to access locked feature
}

export default function PaywallModal({ isOpen, onClose, trigger = 'auto' }: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsLoading(true);
    // TODO: Implement Stripe checkout flow later
    // For now, just close the modal
    console.log('Subscribe clicked - Stripe integration coming soon');
    setIsLoading(false);
  };

  const handleClose = async () => {
    // Mark that user has seen the paywall
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({
          paywall_seen: true,
          paywall_seen_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(0, 255, 65, 0.2)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {trigger === 'feature_locked' ? 'Unlock Full Access' : 'Ready to Level Up?'}
          </h2>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            {trigger === 'feature_locked'
              ? 'This feature requires a subscription to access.'
              : 'You\'ve experienced what MyCheatCode can do. Now unlock unlimited access.'
            }
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(0, 255, 65, 0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Unlimited Coach Conversations</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Get personalized mental coaching whenever you need it</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(0, 255, 65, 0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Unlimited Cheat Codes</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Create as many mental game tools as you need</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(0, 255, 65, 0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Practice Games & Progress Tracking</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Build momentum and track your mental game growth</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(0, 255, 65, 0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Access Your Code Library</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>View and practice all your saved cheat codes anytime</div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-color)' }}>$4.99</div>
          <div className="text-lg" style={{ color: 'var(--text-secondary)' }}>per month</div>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full py-4 rounded-xl font-semibold text-lg transition-all active:scale-95 mb-6"
          style={{
            backgroundColor: 'var(--button-bg)',
            color: 'var(--button-text)',
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
          }}
        >
          {isLoading ? 'Loading...' : 'Start Subscription'}
        </button>

        {/* Compare vs Sports Psychologist */}
        <div
          className="rounded-xl p-5 border"
          style={{
            backgroundColor: 'rgba(0, 255, 65, 0.05)',
            borderColor: 'rgba(0, 255, 65, 0.2)'
          }}
        >
          <div className="text-center mb-3">
            <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-color)' }}>Compare the Value</div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex-1 text-center">
              <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Sports Psychologist</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>$150+</div>
              <div style={{ color: 'var(--text-tertiary)' }}>per session</div>
            </div>
            <div className="px-4" style={{ color: 'var(--text-tertiary)' }}>vs</div>
            <div className="flex-1 text-center">
              <div className="font-semibold mb-1" style={{ color: 'var(--accent-color)' }}>MyCheatCode</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-color)' }}>$4.99</div>
              <div style={{ color: 'var(--text-tertiary)' }}>per month</div>
            </div>
          </div>
        </div>

        {/* Explore Message */}
        {trigger === 'auto' && (
          <div className="text-center mt-6">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              You can close this and explore the app, but features will be locked until you subscribe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
