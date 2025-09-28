# Waitlist System Setup

A production-ready early access waitlist system for MyCheatCode built with Next.js 15, TypeScript, Tailwind CSS, Supabase, and Resend.

## Features

- ✅ Email collection with validation and spam protection
- ✅ Role-based signup (Player, Coach, Parent, Trainer)
- ✅ Competition level tracking
- ✅ Primary goal selection
- ✅ Rate limiting (10 requests per hour per IP)
- ✅ Email confirmation flow
- ✅ Honeypot anti-bot protection
- ✅ Disposable email blocking
- ✅ Social sharing functionality
- ✅ Mobile-responsive design
- ✅ Accessibility features
- ✅ TypeScript + Zod validation

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL setup script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of sql/waitlist_setup.sql
```

3. Get your project credentials from Project Settings → API

### 2. Email Service Setup (Resend)

1. Create a Resend account at [resend.com](https://resend.com)
2. Add and verify your domain (or use the development domain)
3. Generate an API key from the dashboard

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server operations)
- `RESEND_API_KEY` - Your Resend API key
- `WAITLIST_SIGN_SECRET` - Secret for signing confirmation tokens (32+ characters)
- `NEXT_PUBLIC_SITE_URL` - Your site URL (for confirmation links)

### 4. Dependencies

Install required packages:

```bash
npm install @supabase/supabase-js resend zod
```

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## File Structure

```
├── app/
│   ├── api/waitlist/route.ts           # Signup API endpoint
│   ├── waitlist/
│   │   ├── page.tsx                    # Main signup form
│   │   ├── success/page.tsx           # Confirmation success page
│   │   └── confirm/route.ts           # Email confirmation handler
├── lib/
│   ├── waitlist-types.ts              # TypeScript types and Zod schemas
│   └── email-confirmation.ts          # Email utilities
├── sql/
│   └── waitlist_setup.sql            # Database schema
└── .env.example                       # Environment variables template
```

## API Endpoints

### POST /api/waitlist
Handles waitlist signups with validation and rate limiting.

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "Player",
  "level": "High School",
  "goal": "Confidence",
  "urgency": "ASAP",
  "referralCode": "optional",
  "consent": true,
  "nickname": "" // honeypot field
}
```

**Response:**
```json
{
  "ok": true,
  "duplicate": false // if email already exists
}
```

### GET /waitlist/confirm?token=...
Handles email confirmations and redirects to success page.

## Security Features

1. **Rate Limiting**: 10 requests per hour per IP address
2. **Honeypot Protection**: Hidden field catches bots
3. **Email Validation**: Regex + disposable domain blocking
4. **Signed Tokens**: Secure email confirmation with expiration
5. **SQL Injection Prevention**: Parameterized queries via Supabase
6. **CSRF Protection**: Built into Next.js

## Testing Checklist

- [ ] Valid form submission → success page
- [ ] Duplicate email → success (idempotent)
- [ ] Invalid email format → validation error
- [ ] Missing required fields → validation errors
- [ ] Honeypot filled → 400 error
- [ ] Rate limit exceeded → 429 error
- [ ] Email confirmation works
- [ ] Confirmation link expires after 48 hours
- [ ] Social sharing buttons work
- [ ] Mobile responsive
- [ ] Screen reader accessible

## Monitoring & Analytics

Consider adding:
- Error tracking (Sentry)
- Analytics (Vercel Analytics, PostHog)
- Email delivery monitoring
- Database query performance monitoring

## Database Queries

View signups:
```sql
SELECT * FROM waitlist_signups ORDER BY created_at DESC;
```

Count by status:
```sql
SELECT status, COUNT(*) FROM waitlist_signups GROUP BY status;
```

Export confirmed emails:
```sql
SELECT email FROM waitlist_signups WHERE status = 'confirmed';
```

## Customization

### Adding New Fields
1. Update the database schema
2. Add to TypeScript types in `lib/waitlist-types.ts`
3. Update Zod validation schema
4. Add form fields in `app/waitlist/page.tsx`

### Changing Email Template
Edit the HTML template in `lib/email-confirmation.ts`

### Modifying Rate Limits
Adjust the `maxAttempts` value in `app/api/waitlist/route.ts`

## Support

For questions about this implementation:
- Check the code comments for implementation details
- Review the TypeScript types for data structures
- Test the API endpoints directly for debugging