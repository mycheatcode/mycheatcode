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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div
        className="relative w-full sm:max-w-md rounded-3xl shadow-2xl overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
          maxHeight: '88vh',
          border: '2px solid rgba(0, 255, 65, 0.2)'
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
        <div className="text-center pt-10 px-5 pb-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight" style={{ color: '#ffffff' }}>
            Your 24/7 Mental<br />Performance Coach
          </h1>
          <p className="text-base sm:text-lg mb-4" style={{ color: '#999' }}>
            Get the same mental training as elite athletes<br />at a fraction of the cost
          </p>
        </div>

        {/* Value Comparison - Emphasized */}
        <div className="px-5 pb-5">
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(0, 255, 65, 0.08)', border: '2px solid rgba(0, 255, 65, 0.3)' }}>
            <div className="text-center mb-4">
              <div className="text-xs font-bold tracking-wider mb-2" style={{ color: '#00ff41' }}>VALUE COMPARISON</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="text-xs mb-2" style={{ color: '#888' }}>Sports Psychologist</div>
                <div className="font-bold text-2xl mb-1" style={{ color: '#ffffff' }}>$150</div>
                <div className="text-xs" style={{ color: '#666' }}>per session</div>
                <div className="text-xs mt-2" style={{ color: '#666' }}>• Limited availability<br />• Expensive per hour<br />• Hard to schedule</div>
              </div>
              <div className="px-4">
                <div className="text-xl font-bold" style={{ color: '#00ff41' }}>VS</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs mb-2" style={{ color: '#00ff41' }}>MyCheatCode</div>
                <div className="font-bold text-2xl mb-1" style={{ color: '#00ff41' }}>
                  {selectedPlan === 'annual' ? '$2.50' : '$4.99'}
                </div>
                <div className="text-xs" style={{ color: '#00ff41' }}>per month</div>
                <div className="text-xs mt-2" style={{ color: '#00ff41' }}>• Available 24/7<br />• Unlimited access<br />• Instant support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="px-5 pb-4">
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
        <div className="px-5 pb-4">
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

      </div>
    </div>
  );
}
