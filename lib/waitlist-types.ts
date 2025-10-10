import { z } from 'zod';

// Age bracket options
export const ageBracketOptions = ['13-15', '16-18', '19-24', '25+'] as const;
export type AgeBracket = typeof ageBracketOptions[number];

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

  firstName: z.string().optional(),

  ageBracket: z.enum(ageBracketOptions, {
    errorMap: () => ({ message: 'Please select your age bracket' })
  }),

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
  first_name?: string;
  age_bracket: AgeBracket;
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