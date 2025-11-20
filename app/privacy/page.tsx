'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#000000', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--accent-color)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
        <p className="text-sm mb-12" style={{ color: 'var(--text-secondary)' }}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-8 prose prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>1. Introduction</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Welcome to MyCheatCode ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our basketball confidence coaching platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>2.1 Information You Provide</h3>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li><strong>Account Information:</strong> Email address, full name, and password (encrypted)</li>
              <li><strong>Profile Information:</strong> Any additional information you choose to provide</li>
              <li><strong>Chat Messages:</strong> Conversations with your AI confidence coach</li>
              <li><strong>Cheat Codes:</strong> Mental performance techniques you create or save</li>
              <li><strong>Usage Data:</strong> How you interact with codes (completions, usage tracking)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>2.2 Automatically Collected Information</h3>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
              <li><strong>Usage Analytics:</strong> Pages visited, features used, time spent on platform</li>
              <li><strong>Log Data:</strong> IP address, access times, error logs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>3. How We Use Your Information</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>We use your information to:</p>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li>• Provide and improve our AI coaching services</li>
              <li>• Personalize your experience and track your progress</li>
              <li>• Send you important updates and notifications</li>
              <li>• Analyze usage patterns to improve our platform</li>
              <li>• Prevent fraud and ensure platform security</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>4. Data Sharing and Disclosure</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>
              We do not sell your personal data. We may share your information only in these limited circumstances:
            </p>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li><strong>Service Providers:</strong> Third-party services that help us operate (e.g., Supabase for database, hosting providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>5. Data Security</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="space-y-2 mt-3" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li>• Encryption of data in transit (HTTPS/TLS)</li>
              <li>• Encrypted password storage</li>
              <li>• Secure database access controls</li>
              <li>• Regular security audits and updates</li>
            </ul>
            <p className="mt-4" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>6. Your Rights</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>You have the right to:</p>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Withdraw Consent:</strong> Revoke permission for data processing</li>
            </ul>
            <p className="mt-4" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              To exercise these rights, contact us at <a href="mailto:team@mycheatcode" className="underline" style={{ color: 'var(--accent-color)' }}>team@mycheatcode</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>7. Data Retention</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              We retain your data for as long as your account is active or as needed to provide services.
              When you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>8. Children's Privacy</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Our platform is not intended for children under 13. We do not knowingly collect data from children under 13.
              If you are a parent and believe your child has provided us with personal information, please contact us to have it removed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>9. Cookies and Tracking</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              We use cookies and similar technologies to maintain your session, remember preferences, and analyze usage.
              You can control cookies through your browser settings, but disabling them may affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>10. International Data Transfers</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>11. Changes to This Policy</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              We may update this privacy policy from time to time. We will notify you of material changes by email or through a notice on our platform.
              Your continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>12. Contact Us</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              If you have questions about this privacy policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Email: <a href="mailto:team@mycheatcode" className="underline" style={{ color: 'var(--accent-color)' }}>team@mycheatcode</a></p>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Website: <a href="https://mycheatcode" className="underline" style={{ color: 'var(--accent-color)' }}>mycheatcode</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
