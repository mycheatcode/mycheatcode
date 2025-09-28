-- Supabase table setup for waitlist signups
-- Run this in your Supabase SQL editor

-- Create the waitlist_signups table
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('Player','Coach','Parent','Trainer')),
  level text not null check (level in ('Middle School','High School','College','Pro','Other')),
  goal text not null,
  urgency text,
  referral_code text,
  consent boolean not null default true,
  status text not null default 'pending' check (status in ('pending','confirmed','invited','unsubscribed')),
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (lower(email))
);

-- Enable Row Level Security
alter table public.waitlist_signups enable row level security;

-- Create policies for anonymous access
create policy "insert via anon" on public.waitlist_signups
  for insert to anon with check (true);

create policy "read none" on public.waitlist_signups
  for select using (false);

-- Create rate limiting table for IP tracking
create table public.waitlist_rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  attempts integer not null default 1,
  window_start timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS for rate limits table
alter table public.waitlist_rate_limits enable row level security;

-- Allow anonymous to insert/update rate limits
create policy "manage rate limits anon" on public.waitlist_rate_limits
  for all to anon using (true) with check (true);

-- Create index for email lookups
create index idx_waitlist_signups_email on public.waitlist_signups (lower(email));
create index idx_waitlist_signups_status on public.waitlist_signups (status);
create index idx_rate_limits_ip on public.waitlist_rate_limits (ip, window_start);

-- Function to clean up old rate limit entries (call this periodically)
create or replace function cleanup_rate_limits()
returns void as $$
begin
  delete from public.waitlist_rate_limits
  where window_start < now() - interval '1 hour';
end;
$$ language plpgsql;