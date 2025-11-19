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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div
        className="relative w-full sm:max-w-md sm:rounded-3xl shadow-2xl overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
          maxHeight: '95vh',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
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
        <div className="text-center pt-8 px-5 pb-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight" style={{ color: '#ffffff' }}>
            Play With<br />Unshakeable Confidence
          </h1>
          <p className="text-base sm:text-lg" style={{ color: '#999' }}>
            Stop second-guessing. Start dominating.<br />Your personal mental coach, available 24/7.
          </p>
        </div>

        {/* Benefits - Outcome Focused */}
        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 255, 65, 0.05) 100%)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-base sm:text-lg mb-0.5" style={{ color: '#ffffff' }}>Instant Mental Resets</div>
              <div className="text-sm leading-relaxed" style={{ color: '#888' }}>Get back in your zone after mistakes in seconds</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 255, 65, 0.05) 100%)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-base sm:text-lg mb-0.5" style={{ color: '#ffffff' }}>Perform Under Pressure</div>
              <div className="text-sm leading-relaxed" style={{ color: '#888' }}>Master clutch moments with personalized tools</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 255, 65, 0.05) 100%)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-base sm:text-lg mb-0.5" style={{ color: '#ffffff' }}>Build Lasting Confidence</div>
              <div className="text-sm leading-relaxed" style={{ color: '#888' }}>Track your progress and mental toughness</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2) 0%, rgba(0, 255, 65, 0.05) 100%)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-base sm:text-lg mb-0.5" style={{ color: '#ffffff' }}>Unlimited Access</div>
              <div className="text-sm leading-relaxed" style={{ color: '#888' }}>Chat anytime, create unlimited codes, practice daily</div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="px-5 pb-5">
          {/* Annual Plan (Recommended) */}
          <div
            className="relative rounded-2xl p-4 mb-3 cursor-pointer transition-all border-2"
            style={{
              backgroundColor: selectedPlan === 'annual' ? 'rgba(0, 255, 65, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: selectedPlan === 'annual' ? '#00ff41' : 'rgba(255, 255, 255, 0.1)',
            }}
            onClick={() => setSelectedPlan('annual')}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#00ff41', color: '#000' }}>
              BEST VALUE • SAVE 50%
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="flex-1">
                <div className="font-bold text-lg sm:text-xl mb-0.5" style={{ color: '#ffffff' }}>Annual Plan</div>
                <div className="text-sm" style={{ color: '#888' }}>
                  <span className="line-through">$59.88</span> <span className="font-bold" style={{ color: '#00ff41' }}>$29.99/year</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#666' }}>Just $2.50/month • 7-day free trial</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${selectedPlan === 'annual' ? 'border-[#00ff41]' : 'border-gray-600'}`}>
                {selectedPlan === 'annual' && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00ff41' }}></div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Plan */}
          <div
            className="rounded-2xl p-4 cursor-pointer transition-all border-2"
            style={{
              backgroundColor: selectedPlan === 'monthly' ? 'rgba(0, 255, 65, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: selectedPlan === 'monthly' ? '#00ff41' : 'rgba(255, 255, 255, 0.1)',
            }}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-bold text-lg sm:text-xl mb-0.5" style={{ color: '#ffffff' }}>Monthly Plan</div>
                <div className="text-sm" style={{ color: '#888' }}>
                  <span className="font-bold">$4.99/month</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#666' }}>7-day free trial</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${selectedPlan === 'monthly' ? 'border-[#00ff41]' : 'border-gray-600'}`}>
                {selectedPlan === 'monthly' && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00ff41' }}></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-5 pb-5">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all active:scale-98 mb-3"
            style={{
              background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
              color: '#000000',
              boxShadow: '0 8px 24px rgba(0, 255, 65, 0.4)'
            }}
          >
            {isLoading ? 'Loading...' : 'Start 7-Day Free Trial'}
          </button>

          {/* Trust Signals */}
          <div className="text-center space-y-2">
            <p className="text-xs" style={{ color: '#888' }}>
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

        {/* Value Comparison - Compressed */}
        <div className="px-5 pb-6">
          <div className="rounded-xl p-3.5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="flex items-center justify-between text-sm">
              <div className="text-center flex-1">
                <div className="text-xs mb-1" style={{ color: '#888' }}>Sports Psychologist</div>
                <div className="font-bold" style={{ color: '#ffffff' }}>$150/session</div>
              </div>
              <div className="text-xs px-3" style={{ color: '#666' }}>vs</div>
              <div className="text-center flex-1">
                <div className="text-xs mb-1" style={{ color: '#00ff41' }}>MyCheatCode</div>
                <div className="font-bold" style={{ color: '#00ff41' }}>$2.50/month</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
