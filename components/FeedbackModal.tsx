'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Analytics } from '@/lib/analytics';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<'bug' | 'feature' | 'improvement' | 'other'>('bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Rating states (1-10)
  const [coachExperience, setCoachExperience] = useState<number | null>(null);
  const [cheatCodeAdvice, setCheatCodeAdvice] = useState<number | null>(null);
  const [practiceGames, setPracticeGames] = useState<number | null>(null);
  const [topicVariety, setTopicVariety] = useState<number | null>(null);

  // Pricing feedback
  const [willingToPay, setWillingToPay] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState('');

  // Screenshot upload
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const supabase = createClient();

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setScreenshot(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pricing feedback is now mandatory
    if (!willingToPay) {
      setError('Please answer the pricing question');
      return;
    }

    // At least ratings OR message OR screenshot required
    const hasRatings = coachExperience || cheatCodeAdvice || practiceGames || topicVariety;
    if (!message.trim() && !hasRatings && !screenshot) {
      setError('Please provide ratings, feedback, or a screenshot');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to submit feedback');
        setLoading(false);
        return;
      }

      let screenshotUrl: string | null = null;

      // Upload screenshot if provided
      if (screenshot) {
        setUploadingScreenshot(true);
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('feedback-screenshots')
          .upload(filePath, screenshot, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload screenshot');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('feedback-screenshots')
          .getPublicUrl(filePath);

        screenshotUrl = publicUrl;
        setUploadingScreenshot(false);
      }

      // Insert feedback
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          type,
          message: message.trim() || null,
          page_url: window.location.href,
          user_email: user.email,
          rating_overall: coachExperience,
          rating_coach_quality: cheatCodeAdvice,
          rating_ease_of_use: practiceGames,
          rating_feature_value: topicVariety,
          screenshot_url: screenshotUrl,
          willing_to_pay: willingToPay,
          suggested_price: suggestedPrice.trim() || null,
        });

      if (insertError) throw insertError;

      // Track feedback submission
      Analytics.trackFeedbackSubmitted(type, !!hasRatings, !!screenshot);

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setMessage('');
        setType('bug');
        setCoachExperience(null);
        setCheatCodeAdvice(null);
        setPracticeGames(null);
        setTopicVariety(null);
        setWillingToPay(null);
        setSuggestedPrice('');
        setScreenshot(null);
        setScreenshotPreview(null);
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
      setUploadingScreenshot(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-4">
        <div
          className="w-full max-w-md rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {submitted ? (
          <div className="text-center py-8">
            <div className="mb-4 flex justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Thank You!
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your feedback has been submitted
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Send Feedback
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Feedback Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'bug', label: 'Bug Report', icon: '🐛' },
                    { value: 'feature', label: 'Feature Request', icon: '💡' },
                    { value: 'improvement', label: 'Improvement', icon: '✨' },
                    { value: 'other', label: 'Other', icon: '💬' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value as typeof type)}
                      className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                        type === option.value
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                          : 'border-[var(--card-border)] hover:border-[var(--accent-color)]/50'
                      }`}
                      style={{
                        color: type === option.value ? 'var(--accent-color)' : 'var(--text-secondary)',
                      }}
                    >
                      <div>{option.icon}</div>
                      <div className="mt-1">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating System */}
              <div className="space-y-4 py-2">
                <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Rate Key Features (Optional - 1-10)
                </div>

                {/* Coach Experience */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Coach Experience
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCoachExperience(num)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                          coachExperience === num
                            ? 'bg-[var(--accent-color)] text-black'
                            : 'bg-[var(--bg-primary)] border border-[var(--card-border)] hover:border-[var(--accent-color)]'
                        }`}
                        style={{ color: coachExperience === num ? '#000' : 'var(--text-secondary)' }}
                        disabled={loading}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cheat Code Advice */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Cheat Code Advice
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCheatCodeAdvice(num)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                          cheatCodeAdvice === num
                            ? 'bg-[var(--accent-color)] text-black'
                            : 'bg-[var(--bg-primary)] border border-[var(--card-border)] hover:border-[var(--accent-color)]'
                        }`}
                        style={{ color: cheatCodeAdvice === num ? '#000' : 'var(--text-secondary)' }}
                        disabled={loading}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Practice Game Scenarios */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Practice Game Scenarios
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPracticeGames(num)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                          practiceGames === num
                            ? 'bg-[var(--accent-color)] text-black'
                            : 'bg-[var(--bg-primary)] border border-[var(--card-border)] hover:border-[var(--accent-color)]'
                        }`}
                        style={{ color: practiceGames === num ? '#000' : 'var(--text-secondary)' }}
                        disabled={loading}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relatable Topic Variety */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Relatable Topic Variety
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTopicVariety(num)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                          topicVariety === num
                            ? 'bg-[var(--accent-color)] text-black'
                            : 'bg-[var(--bg-primary)] border border-[var(--card-border)] hover:border-[var(--accent-color)]'
                        }`}
                        style={{ color: topicVariety === num ? '#000' : 'var(--text-secondary)' }}
                        disabled={loading}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Feedback */}
              <div className="space-y-3 py-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  💰 Pricing Feedback <span style={{ color: '#00ff41' }}>*</span>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Would you pay $7.99/month for this app? <span style={{ color: '#00ff41' }}>*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'yes', label: 'Yes', emoji: '✅' },
                      { value: 'no', label: 'No', emoji: '❌' },
                      { value: 'maybe', label: 'Maybe', emoji: '🤔' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setWillingToPay(option.value as typeof willingToPay)}
                        className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                          willingToPay === option.value
                            ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                            : 'border-[var(--card-border)] hover:border-[var(--accent-color)]/50'
                        }`}
                        style={{
                          color: willingToPay === option.value ? 'var(--accent-color)' : 'var(--text-secondary)',
                        }}
                        disabled={loading}
                      >
                        <div className="text-lg">{option.emoji}</div>
                        <div className="mt-1">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {(willingToPay === 'no' || willingToPay === 'maybe') && (
                  <div>
                    <label htmlFor="suggested-price" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      What would you pay per month? (Optional)
                    </label>
                    <input
                      id="suggested-price"
                      type="text"
                      value={suggestedPrice}
                      onChange={(e) => setSuggestedPrice(e.target.value)}
                      className="w-full rounded-xl p-3 text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--accent-color)',
                      } as React.CSSProperties}
                      placeholder="e.g., $4.99, $2.99, or $0 (free only)"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Your Feedback (Optional)
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--accent-color)',
                  } as React.CSSProperties}
                  placeholder="Tell us what's on your mind..."
                  disabled={loading}
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Attach Screenshot (Optional)
                </label>

                {!screenshotPreview ? (
                  <div className="relative">
                    <input
                      type="file"
                      id="screenshot-upload"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      disabled={loading}
                      className="hidden"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-[var(--accent-color)]"
                      style={{
                        borderColor: 'var(--card-border)',
                        backgroundColor: 'var(--bg-primary)',
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Click to upload image
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                        PNG, JPG up to 5MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--card-border)' }}>
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full h-48 object-contain"
                      style={{ backgroundColor: 'var(--bg-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      disabled={loading}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
                      title="Remove screenshot"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-secondary)',
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor: 'var(--accent-color)',
                    color: '#000',
                  }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
