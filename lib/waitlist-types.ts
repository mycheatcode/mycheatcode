import { z } from 'zod';

// Position options
export const positionOptions = [
  'Point Guard',
  'Shooting Guard',
  'Small Forward',
  'Power Forward',
  'Center',
  'Combo Guard',
  'Stretch Forward',
  'Other'
] as const;
export type Position = typeof positionOptions[number];

// Level options
export const levelOptions = ['Middle School', 'High School', 'College', 'Pro', 'Other'] as const;
export type Level = typeof levelOptions[number];

// Goal options
export const goalOptions = [
  'Confidence & Self-Belief',
  'Handling Pressure Moments (free throws, clutch shots, big games)',
  'Consistency & Focus (play at your best every game, avoid slumps)',
  'Resetting After Mistakes or Losses (shake off a bad play, missed shots or tough losses)',
  'Attacking & Finishing at the Rim (confidence vs defenders, decision-making at the hoop)',
  'Leadership & Mental Toughness (being a vocal leader, motivating the team, staying calm)',
  'Playing with Freedom & Joy (less stress, more fun, enjoying the game)',
  'All of the Above',
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

  position: z.enum(positionOptions, {
    errorMap: () => ({ message: 'Please select your position' })
  }),

  level: z.enum(levelOptions, {
    errorMap: () => ({ message: 'Please select your level' })
  }),

  goals: z.array(z.string())
    .min(1, 'Please select at least one goal'),

  customGoal: z.string().optional(),

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
  position: Position;
  level: Level;
  goals: string[];
  custom_goal?: string;
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