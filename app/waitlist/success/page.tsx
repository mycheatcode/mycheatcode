'use client';

import Link from 'next/link';

export default function WaitlistSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            MyCheatCode
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="max-w-lg text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Main Message */}
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            You're confirmed!
          </h1>

          <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
            Your email has been confirmed and you're officially on the MyCheatCode early access list.
            We'll notify you as soon as we're ready to help you unlock your mental game.
          </p>

          {/* Additional Info */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">What happens next?</h2>
            <ul className="text-left text-zinc-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>We'll send you updates as we build your AI basketball coach</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>You'll get early access before the public launch</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Your feedback will help shape the final product</span>
              </li>
            </ul>
          </div>

          {/* Social Sharing */}
          <div className="mb-8">
            <p className="text-sm text-zinc-400 mb-4">Help us grow - share with your team:</p>
            <ShareButtons />
          </div>

          {/* Contact */}
          <div className="text-sm text-zinc-400">
            <p>Questions? Email us at <a href="mailto:hello@mycheatcode.ai" className="text-blue-400 hover:text-blue-300">hello@mycheatcode.ai</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}

function ShareButtons() {
  const shareText = 'I just joined the mycheatcode.ai waitlist';
  const shareUrl = 'https://mycheatcode.ai/waitlist';

  const handleTwitterShare = () => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} - ${shareUrl}`);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={handleTwitterShare}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Share on X
      </button>

      <button
        onClick={handleCopyLink}
        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy Link
      </button>
    </div>
  );
}