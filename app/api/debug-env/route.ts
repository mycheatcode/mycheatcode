import { NextResponse } from 'next/server';

export async function GET() {
  // Check which environment variables are present/missing
  const envCheck = {
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    WAITLIST_SIGN_SECRET: !!process.env.WAITLIST_SIGN_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };

  // Show actual values for debugging (safe ones only)
  const envValues = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NODE_ENV: process.env.NODE_ENV
  };

  return NextResponse.json({
    message: 'Environment variables check',
    present: envCheck,
    values: envValues,
    timestamp: new Date().toISOString()
  });
}