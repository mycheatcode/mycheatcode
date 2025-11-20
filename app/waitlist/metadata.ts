import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Beta | MyCheatCode - Mental Performance Coach for Basketball',
  description: 'Master your mental game with personalized AI cheat codes. Build mental strength across 5 key areas: Pre-Game, In-Game, Post-Game, Off Court, and Locker Room. Join 2,847+ players.',
  keywords: [
    'basketball mental game',
    'sports psychology',
    'mental performance coach',
    'basketball confidence',
    'free throw mental game',
    'basketball pressure moments',
    'AI coaching',
    'mental training basketball',
    'sports mental health',
    'basketball mindset'
  ],
  authors: [{ name: 'MyCheatCode Team' }],
  creator: 'MyCheatCode',
  publisher: 'MyCheatCode',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mycheatcode/waitlist',
    title: 'MyCheatCode - Mental Performance Coach for Basketball Players',
    description: 'Get personalized cheat codes for every moment on the court. Master pressure moments, build confidence, and track your mental strength.',
    siteName: 'MyCheatCode',
    images: [
      {
        url: 'https://mycheatcode/waitlist-media/hero.png',
        width: 1920,
        height: 1080,
        alt: 'MyCheatCode Dashboard - Mental Performance Tracking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyCheatCode - Mental Performance Coach for Basketball',
    description: 'Master your mental game with personalized AI cheat codes. Join 2,847+ players building mental strength.',
    images: ['https://mycheatcode/waitlist-media/hero.png'],
    creator: '@mycheatcode',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
  alternates: {
    canonical: 'https://mycheatcode/waitlist',
  },
};
