import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Client-side Supabase client
export const createClient = () => {
  return createClientComponentClient();
};

// Server-side Supabase client
export const createServerClient = () => {
  return createServerComponentClient({ cookies });
};

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const supabase = createClient();
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const supabase = createClient();
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // Sign out
  signOut: async () => {
    const supabase = createClient();
    return await supabase.auth.signOut();
  },

  // Get current session
  getSession: async () => {
    const supabase = createClient();
    return await supabase.auth.getSession();
  },

  // Get current user
  getUser: async () => {
    const supabase = createClient();
    return await supabase.auth.getUser();
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const supabase = createClient();
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions
export const dbHelpers = {
  // Generic select function
  select: async (table: string, columns = '*', filters?: Record<string, any>) => {
    const supabase = createClient();
    let query = supabase.from(table).select(columns);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    return await query;
  },

  // Generic insert function
  insert: async (table: string, data: Record<string, any>) => {
    const supabase = createClient();
    return await supabase.from(table).insert(data);
  },

  // Generic update function
  update: async (table: string, data: Record<string, any>, filters: Record<string, any>) => {
    const supabase = createClient();
    let query = supabase.from(table).update(data);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return await query;
  },

  // Generic delete function
  delete: async (table: string, filters: Record<string, any>) => {
    const supabase = createClient();
    let query = supabase.from(table).delete();

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return await query;
  },
};

export default createClient;