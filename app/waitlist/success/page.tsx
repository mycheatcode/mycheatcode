'use client';

import Link from 'next/link';

export default function WaitlistSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
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
            Submission Entered
          </h1>

          <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
            Check your email to secure your spot. We'll notify you as soon as early access is available.
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

          {/* Contact */}
          <div className="text-sm text-zinc-400">
            <p>Questions? Email us at <a href="mailto:team@mycheatcode.ai" className="text-blue-400 hover:text-blue-300">team@mycheatcode.ai</a></p>
          </div>
        </div>
      </main>
    </div>
  );
}