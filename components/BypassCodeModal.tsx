'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BypassCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Secret bypass code - change this to whatever you want
const BYPASS_CODE = '2025';

export default function BypassCodeModal({ isOpen, onClose }: BypassCodeModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔐 Bypass code submitted:', code.trim());
    console.log('🔐 Expected code:', BYPASS_CODE);
    console.log('🔐 Match:', code.trim() === BYPASS_CODE);

    try {
      // Check if code is correct
      if (code.trim() !== BYPASS_CODE) {
        console.log('❌ Invalid code entered');
        setError('Invalid bypass code');
        setIsLoading(false);
        return;
      }

      console.log('✅ Code is correct, getting user...');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user logged in');
        setError('You must be logged in');
        setIsLoading(false);
        return;
      }

      console.log('✅ User found:', user.id);
      console.log('🔄 Attempting to update bypass_subscription...');

      // Enable bypass subscription
      const { error: updateError } = await supabase
        .from('users')
        .update({ bypass_subscription: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error enabling bypass:', updateError);
        setError(`Failed to enable bypass: ${updateError.message}`);
        setIsLoading(false);
        return;
      }

      console.log('✅ Bypass enabled successfully!');

      // Success!
      setSuccess(true);
      setTimeout(() => {
        console.log('🔄 Reloading page to refresh subscription status...');
        onClose();
        // Refresh the page to update subscription status
        window.location.reload();
      }, 2500); // Increased from 1500ms to 2500ms to ensure DB commit

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{
          backgroundColor: '#0a0a0a',
          border: '2px solid rgba(0, 255, 65, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all hover:bg-white/10"
          style={{ color: '#888' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 255, 65, 0.2)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#00ff41' }}>
              Bypass Enabled!
            </h2>
            <p className="text-sm" style={{ color: '#999' }}>
              Refreshing app...
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
              Enter Bypass Code
            </h2>
            <p className="text-sm mb-6" style={{ color: '#999' }}>
              For beta testing access only
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code..."
                className="w-full px-4 py-3 rounded-xl mb-4 text-white placeholder-gray-500 outline-none"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: error ? '2px solid #ff4444' : '2px solid rgba(255, 255, 255, 0.1)'
                }}
                autoFocus
              />

              {error && (
                <p className="text-sm mb-4" style={{ color: '#ff4444' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="w-full py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#00ff41',
                  color: '#000'
                }}
              >
                {isLoading ? 'Activating...' : 'Activate Bypass'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
