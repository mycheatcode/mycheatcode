'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'auto' | 'feature_locked';
}

export default function PaywallModal({ isOpen, onClose, trigger = 'auto' }: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsLoading(true);
    // TODO: Implement Stripe checkout flow later
    console.log('Subscribe clicked - Stripe integration coming soon');
    setIsLoading(false);
  };

  const handleClose = async () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div
        className="relative w-full sm:max-w-md rounded-3xl shadow-2xl overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
          maxHeight: '85vh'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all hover:bg-white/10 z-10"
          style={{ color: '#888' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Hero Section */}
        <div className="text-center pt-10 px-6 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight" style={{ color: '#ffffff' }}>
            Unlock MyCheatCode
          </h1>
          <p className="text-base" style={{ color: '#999' }}>
            Unlimited access. Cancel anytime.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="px-6 pb-6 space-y-4">
          {/* Monthly Plan */}
          <div
            className="rounded-2xl p-5 cursor-pointer transition-all border-2"
            style={{
              backgroundColor: selectedPlan === 'monthly' ? 'rgba(0, 255, 65, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: selectedPlan === 'monthly' ? '#00ff41' : 'rgba(255, 255, 255, 0.1)',
            }}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="mb-4">
              <div className="font-bold text-sm mb-2" style={{ color: '#ffffff' }}>Monthly</div>
              <div className="font-bold text-4xl mb-1" style={{ color: '#ffffff' }}>$7.99 <span className="text-lg font-normal" style={{ color: '#888' }}>/month</span></div>
              <div className="text-sm" style={{ color: '#888' }}>3 days free, then $7.99/mo</div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubscribe();
              }}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-base transition-all active:scale-98 mb-4"
              style={{
                backgroundColor: selectedPlan === 'monthly' ? '#00ff41' : 'rgba(255, 255, 255, 0.1)',
                color: selectedPlan === 'monthly' ? '#000' : '#ffffff',
                border: selectedPlan === 'monthly' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {isLoading ? 'Loading...' : 'Start Free Trial'}
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>24/7 AI confidence coach</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Personalized cheat codes</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Pre-game & post-game support</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Unlimited access</span>
              </div>
            </div>
          </div>

          {/* Annual Plan */}
          <div
            className="relative rounded-2xl p-5 cursor-pointer transition-all border-2"
            style={{
              backgroundColor: selectedPlan === 'annual' ? 'rgba(0, 255, 65, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: selectedPlan === 'annual' ? '#00ff41' : 'rgba(255, 255, 255, 0.1)',
            }}
            onClick={() => setSelectedPlan('annual')}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#000', color: '#00ff41' }}>
              27% off
            </div>

            <div className="mb-4">
              <div className="font-bold text-sm mb-2" style={{ color: '#ffffff' }}>Yearly</div>
              <div className="font-bold text-4xl mb-1" style={{ color: '#ffffff' }}>$69.99 <span className="text-lg font-normal" style={{ color: '#888' }}>/year</span></div>
              <div className="text-sm" style={{ color: '#888' }}>3 days free, then $69.99 per year ($5.83/mo)</div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubscribe();
              }}
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-base transition-all active:scale-98 mb-4"
              style={{
                backgroundColor: selectedPlan === 'annual' ? '#00ff41' : 'rgba(255, 255, 255, 0.1)',
                color: selectedPlan === 'annual' ? '#000' : '#ffffff',
                border: selectedPlan === 'annual' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {isLoading ? 'Loading...' : 'Start Free Trial'}
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>All in monthly, plus...</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>24/7 AI confidence coach</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Personalized cheat codes</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Pre-game & post-game support</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Unlimited access</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#00ff41' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className="font-semibold">Save $25.89 per year</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Section - Shows selected plan only */}
        <div className="px-6 pb-6">
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(0, 255, 65, 0.06)', border: '1px solid rgba(0, 255, 65, 0.2)' }}>
            <div className="flex items-center justify-between text-center gap-3">
              <div className="flex-1">
                <div className="text-xs mb-2" style={{ color: '#888' }}>Sports Psychologist</div>
                <div className="text-xl font-bold leading-tight" style={{ color: '#ffffff' }}>$150</div>
                <div className="text-xs mt-1" style={{ color: '#666' }}>/session</div>
              </div>
              <div className="px-2">
                <div className="text-lg font-semibold" style={{ color: '#888' }}>vs</div>
              </div>
              <div className="flex-1">
                <div className="text-xs mb-2" style={{ color: '#00ff41' }}>
                  {selectedPlan === 'annual' ? 'Yearly Plan' : 'Monthly Plan'}
                </div>
                <div className="text-xl font-bold leading-tight" style={{ color: '#00ff41' }}>
                  ${selectedPlan === 'annual' ? '0.19' : '0.27'}
                </div>
                <div className="text-xs mt-1" style={{ color: '#00ff41' }}>/day</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="px-6 pb-6">
          <div className="text-center space-y-2">
            <p className="text-xs" style={{ color: '#666' }}>
              Cancel anytime • No commitment
            </p>
            <div className="flex items-center justify-center gap-4 text-xs" style={{ color: '#666' }}>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Secure Payment
              </span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                30-Day Guarantee
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
