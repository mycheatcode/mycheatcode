'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    // Initialize Supabase client
    try {
      const client = createClientComponentClient();
      setSupabase(client);
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
    }

    // Check environment variables
    const envCheck = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    };
    setDebugInfo(envCheck);
  }, []);

  const testConnection = async () => {
    if (!supabase) {
      setTestResult('Supabase client not initialized');
      return;
    }

    setLoading(true);
    setTestResult('Testing connection...');

    try {
      // Test basic connection
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setTestResult(`Auth Error: ${error.message}`);
      } else {
        setTestResult('Connection successful! No current session.');
      }
    } catch (err: any) {
      setTestResult(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignup = async () => {
    if (!supabase) {
      setTestResult('Supabase client not initialized');
      return;
    }

    setLoading(true);
    setTestResult('Testing signup...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123',
      });

      if (error) {
        setTestResult(`Signup Error: ${error.message}`);
      } else {
        setTestResult('Signup test successful (user may already exist)');
      }
    } catch (err: any) {
      setTestResult(`Signup Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase) {
      setTestResult('Supabase client not initialized');
      return;
    }

    setLoading(true);
    setTestResult('Signing out...');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setTestResult(`Sign out error: ${error.message}`);
      } else {
        setTestResult('Signed out successfully! You can now test the signup flow.');
        window.location.href = '/welcome';
      }
    } catch (err: any) {
      setTestResult(`Sign out error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Debug</h1>

        <div className="space-y-6">
          {/* Environment Variables */}
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <div>Supabase URL: <span className="text-green-400">{debugInfo.supabaseUrl || 'Not set'}</span></div>
              <div>Has Anon Key: <span className={debugInfo.hasAnonKey ? 'text-green-400' : 'text-red-400'}>{debugInfo.hasAnonKey ? 'Yes' : 'No'}</span></div>
              <div>Anon Key Length: <span className="text-yellow-400">{debugInfo.anonKeyLength} characters</span></div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Connection Tests</h2>
            <div className="space-x-4">
              <button
                onClick={testConnection}
                disabled={loading || !supabase}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
              >
                Test Connection
              </button>
              <button
                onClick={testSignup}
                disabled={loading || !supabase}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
              >
                Test Signup
              </button>
              <button
                onClick={signOut}
                disabled={loading || !supabase}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded disabled:opacity-50"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="text-sm">
              {testResult || 'No tests run yet'}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-zinc-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Common Issues</h2>
            <ul className="text-sm space-y-2">
              <li>• Check if the Supabase URL matches your project URL exactly</li>
              <li>• Verify the anon key is correct and not expired</li>
              <li>• Ensure your Supabase project is not paused</li>
              <li>• Check if email authentication is enabled in Supabase</li>
              <li>• Verify CORS settings allow your domain</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}