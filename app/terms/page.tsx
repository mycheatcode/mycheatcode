'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Terms of Service</h1>
        <p className="text-sm mb-12" style={{ color: 'var(--text-secondary)' }}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-8 prose prose-invert max-w-none">
          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>1. Agreement to Terms</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              By accessing or using MyCheatCode.AI ("the Platform," "we," "our," or "us"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>2. Description of Service</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              MyCheatCode.AI is an AI-powered basketball confidence coaching platform that helps athletes develop mental performance techniques ("Cheat Codes")
              through interactive conversations with an AI coach. The Platform includes chat functionality, progress tracking, and personalized mental training tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>3. Eligibility</h2>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li>• You must be at least 13 years old to use this Platform</li>
              <li>• Users under 18 should have parental or guardian consent</li>
              <li>• You must provide accurate and complete registration information</li>
              <li>• You are responsible for maintaining the confidentiality of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>4. Account Responsibilities</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>You agree to:</p>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li>• Maintain the security of your password and account</li>
              <li>• Notify us immediately of any unauthorized use</li>
              <li>• Be responsible for all activities under your account</li>
              <li>• Provide accurate, current, and complete information</li>
              <li>• Not share your account with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>5. Acceptable Use</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>5.1 You May</h3>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li>• Use the Platform for personal mental performance training</li>
              <li>• Create and save Cheat Codes for your own use</li>
              <li>• Communicate with the AI coach in good faith</li>
              <li>• Track your progress and momentum</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>5.2 You May Not</h3>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li>• Use the Platform for any illegal or unauthorized purpose</li>
              <li>• Violate any laws in your jurisdiction</li>
              <li>• Harass, abuse, or harm others</li>
              <li>• Impersonate any person or entity</li>
              <li>• Transmit viruses, malware, or harmful code</li>
              <li>• Attempt to gain unauthorized access to our systems</li>
              <li>• Scrape, data mine, or use automated tools without permission</li>
              <li>• Interfere with or disrupt the Platform's operation</li>
              <li>• Circumvent security or usage limitations</li>
              <li>• Use the Platform to train competing AI models</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>6. Intellectual Property</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>6.1 Our Rights</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              The Platform, including all content, features, functionality, software, and AI models, are owned by MyCheatCode.AI and protected by copyright,
              trademark, and other intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of our Platform.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>6.2 Your Content</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              You retain ownership of content you create (chats, Cheat Codes, etc.). By using the Platform, you grant us a license to use, store, and process
              your content to provide and improve our services. We may use anonymized, aggregated data for analytics and improvement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>7. AI Coach Disclaimer</h2>
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 100, 100, 0.3)' }}>
              <p className="font-semibold mb-2" style={{ color: '#ff6464' }}>IMPORTANT DISCLAIMER</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                The AI coach is not a substitute for professional mental health services, medical advice, or professional coaching.
                If you are experiencing mental health issues, please seek help from a qualified professional.
              </p>
            </div>
            <ul className="space-y-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <li>• The AI provides general mental performance guidance, not therapy</li>
              <li>• We are not responsible for decisions made based on AI recommendations</li>
              <li>• The AI may make mistakes or provide inaccurate information</li>
              <li>• Always use your own judgment and consult professionals when needed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>8. Fees and Payment</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              We reserve the right to charge fees for access to the Platform. Current pricing (if any) is displayed on our website.
              By subscribing, you agree to pay all applicable fees. Fees are non-refundable except as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>9. Termination</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>9.1 By You</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              You may terminate your account at any time through your profile settings. Upon termination, your data will be deleted in accordance with our Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>9.2 By Us</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or for any reason at our discretion.
              We will provide notice when possible, but reserve the right to terminate immediately for serious violations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>10. Disclaimers and Limitations of Liability</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>10.1 "As Is" Service</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              The Platform is provided "as is" and "as available" without warranties of any kind. We do not guarantee the Platform will be error-free,
              secure, or uninterrupted. Use at your own risk.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--text-primary)' }}>10.2 Limitation of Liability</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              To the maximum extent permitted by law, MyCheatCode.AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
              or any loss of profits or revenues, whether direct or indirect. Our total liability shall not exceed the amount you paid us in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>11. Indemnification</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              You agree to indemnify and hold harmless MyCheatCode.AI, its officers, directors, employees, and agents from any claims, damages, losses,
              or expenses arising from your use of the Platform, violation of these Terms, or violation of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>12. Dispute Resolution</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with
              the rules of the American Arbitration Association. You waive your right to a jury trial or to participate in a class action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>13. Governing Law</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              These Terms are governed by the laws of the United States and the State of [Your State], without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>14. Changes to Terms</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Platform.
              Your continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>15. Severability</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>16. Entire Agreement</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and MyCheatCode.AI regarding the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>17. Contact Us</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              If you have questions about these Terms, please contact us:
            </p>
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Email: <a href="mailto:team@mycheatcode.ai" className="underline" style={{ color: 'var(--accent-color)' }}>team@mycheatcode.ai</a></p>
              <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Website: <a href="https://mycheatcode.ai" className="underline" style={{ color: 'var(--accent-color)' }}>mycheatcode.ai</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
