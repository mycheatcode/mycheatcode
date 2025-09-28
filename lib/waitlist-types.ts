import { z } from 'zod';

// Role options
export const roleOptions = ['Player', 'Coach', 'Parent', 'Trainer'] as const;
export type Role = typeof roleOptions[number];

// Level options
export const levelOptions = ['Middle School', 'High School', 'College', 'Pro', 'Other'] as const;
export type Level = typeof levelOptions[number];

// Goal options
export const goalOptions = [
  'Confidence',
  'Game Anxiety',
  'Focus',
  'Shooting Slump',
  'Finishing at Rim',
  'Leadership',
  'Other'
] as const;
export type Goal = typeof goalOptions[number];

// Urgency options
export const urgencyOptions = ['ASAP', 'In-season', 'Off-season', 'Just curious'] as const;
export type Urgency = typeof urgencyOptions[number];

// Email regex for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Disposable email domains to block (basic list)
export const disposableEmailDomains = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'throwaway.email',
  'yopmail.com',
  'temp-mail.org',
  'dispostable.com',
  'fakemailgenerator.com'
];

// Zod schema for waitlist signup
export const waitlistSignupSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address')
    .refine((email) => {
      const domain = email.toLowerCase().split('@')[1];
      return !disposableEmailDomains.includes(domain);
    }, 'Please use a non-disposable email address'),

  role: z.enum(roleOptions, {
    errorMap: () => ({ message: 'Please select your role' })
  }),

  level: z.enum(levelOptions, {
    errorMap: () => ({ message: 'Please select your level' })
  }),

  goal: z.string()
    .min(1, 'Please select your primary goal'),

  urgency: z.enum(urgencyOptions).optional(),

  referralCode: z.string().optional(),

  consent: z.boolean()
    .refine((val) => val === true, 'You must agree to receive updates'),

  // Honeypot field - should be empty
  nickname: z.string().max(0, 'Invalid submission')
});

export type WaitlistSignupData = z.infer<typeof waitlistSignupSchema>;

// Database types
export interface WaitlistSignup {
  id: string;
  email: string;
  role: Role;
  level: Level;
  goal: string;
  urgency?: Urgency;
  referral_code?: string;
  consent: boolean;
  status: 'pending' | 'confirmed' | 'invited' | 'unsubscribed';
  ip?: string;
  user_agent?: string;
  created_at: string;
}

// API response types
export interface WaitlistApiResponse {
  ok: boolean;
  duplicate?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

// Rate limit tracking
export interface RateLimit {
  id: string;
  ip: string;
  attempts: number;
  window_start: string;
  created_at: string;
}

// Email confirmation token payload
export interface ConfirmationTokenPayload {
  email: string;
  exp: number;
}