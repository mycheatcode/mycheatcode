import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('waitlist_signups')
      .delete()
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Database delete error:', error);
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Deleted submission for ${email}` });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}