'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserCheatCodes } from '@/lib/cheatcodes';
import { getUserProgress } from '@/lib/progress';
import FeedbackButton from '@/components/FeedbackButton';
import FeedbackModal from '@/components/FeedbackModal';
import BypassCodeModal from '@/components/BypassCodeModal';
import { DbCheatCode } from '@/lib/types';

interface UserProfile {
  full_name: string;
  email: string;
  created_at: string;
}

interface UserStats {
  totalCodes: number;
  activeCodes: number;
  archivedCodes: number;
  mostUsedCode: string;
  momentum: number;
  daysActive: number;
}

export default function Profile() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showBypassModal, setShowBypassModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, email, created_at')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user profile:', userError);
        } else {
          setUserProfile(userData);
        }

        // Fetch user's cheat codes
        const { cheatCodes: codes, error: codesError } = await getUserCheatCodes(user.id);

        // Fetch user's momentum/progress
        const progressData = await getUserProgress(supabase, user.id);

        if (codesError) {
          console.error('Error fetching cheat codes:', codesError);
        } else if (codes) {
          // Calculate stats
          const activeCodes = codes.filter((code: DbCheatCode) => code.is_active !== false);
          const archivedCodes = codes.filter((code: DbCheatCode) => code.is_active === false);

          // Find most used code
          let mostUsedCode = 'None yet';
          if (codes.length > 0) {
            const sortedByUsage = [...codes].sort((a: DbCheatCode, b: DbCheatCode) => (b.times_used || 0) - (a.times_used || 0));
            const topCode = sortedByUsage[0];
            if (topCode && topCode.times_used > 0) {
              mostUsedCode = topCode.title;
            }
          }

          // Calculate days active (days since account creation)
          const createdAt = new Date(userData?.created_at || user.created_at);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdAt.getTime());
          const daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          setUserStats({
            totalCodes: codes.length,
            activeCodes: activeCodes.length,
            archivedCodes: archivedCodes.length,
            mostUsedCode,
            momentum: progressData.progress,
            daysActive,
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading user data:', err);
        setLoading(false);
      }
    };

    loadUserData();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleEditProfile = () => {
    setEditedName(userProfile?.full_name || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ full_name: editedName })
        .eq('id', user.id);

      if (error) throw error;

      setUserProfile(prev => prev ? { ...prev, full_name: editedName } : null);
      setIsEditing(false);
      showToast('Profile updated successfully');
    } catch (err) {
      // Error updating profile handled silently
      showToast('Failed to update profile', 'error');
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all user data
      const { cheatCodes } = await getUserCheatCodes(user.id);
      const { data: chats } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        profile: userProfile,
        stats: userStats,
        cheatCodes: cheatCodes || [],
        chats: chats || [],
        exportedAt: new Date().toISOString(),
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mycheatcode-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Data exported successfully');
    } catch (err) {
      // Error exporting data handled silently
      showToast('Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete user data from all tables
      await supabase.from('momentum_gains').delete().eq('user_id', user.id);
      await supabase.from('code_completions').delete().eq('user_id', user.id);
      await supabase.from('cheat_codes').delete().eq('user_id', user.id);
      await supabase.from('chats').delete().eq('user_id', user.id);
      await supabase.from('activity_log').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);

      // Delete auth user
      await supabase.auth.admin.deleteUser(user.id);

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/signup');
    } catch (err) {
      // Error deleting account handled silently
      showToast('Failed to delete account. Please contact support at team@mycheatcode.ai', 'error');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen font-sans" style={{ color: 'var(--text-primary)' }}>
      {/* Mobile & Desktop Header with Menu */}
      <div className="lg:hidden absolute top-0 left-0 right-0 px-4 py-4 flex items-center gap-4 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--accent-color)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="text-lg font-semibold" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
      </div>

      {/* Sidebar Navigation */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-30 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#000000' }}
      >
        <div className="pt-6 px-6">
          <div className="text-xs font-bold tracking-widest mb-6" style={{ color: 'var(--accent-color)' }}>NAVIGATION</div>
        </div>
        <nav className="flex-1 px-4">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
            </Link>
            <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>My Codes</span>
            </Link>
            <Link href="/relatable-topics" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span>Relatable Topics</span>
            </Link>
            <Link href="/chat-history" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <span>Chat History</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>Profile</span>
            </Link>
            <button onClick={() => setFeedbackModalOpen(true)} className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5 w-full text-left" style={{ color: 'var(--text-secondary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
              </svg>
              <span>Got Feedback?</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Design */}
      <div className="lg:hidden min-h-screen relative flex flex-col pt-16">
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Profile</div>
          <div className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Track your progress and stats</div>
        </div>

        <div className="flex-1 flex flex-col p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="rounded-xl p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--card-border)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-secondary)' }}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-lg font-semibold mb-1"
                        style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-text)' }}
                      />
                    ) : (
                      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {userProfile?.full_name || 'Player'}
                      </h2>
                    )}
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {userProfile?.email || 'Basketball Athlete'}
                    </p>
                  </div>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium"
                      style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEditProfile}
                    className="w-full px-4 py-2 rounded-lg transition-colors font-medium"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Stats */}
              <div className="rounded-xl p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Profile Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Total Cheat Codes</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userStats?.totalCodes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Active Codes</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userStats?.activeCodes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Archived Codes</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userStats?.archivedCodes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Most Used Code</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userStats?.mostUsedCode || 'None yet'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Current Momentum</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userStats?.momentum || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Days Active</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userStats?.daysActive || 0}</span>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="rounded-xl p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Account</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowBypassModal(true)}
                    className="w-full text-left p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}
                  >
                    Beta Access
                  </button>
                  <button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="w-full text-left p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}
                  >
                    {isExporting ? 'Exporting...' : 'Export My Data'}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-left p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff6464' }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="max-w-md w-full rounded-xl p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Delete Account?</h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              This will permanently delete your account and all associated data including cheat codes, chats, and progress. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#ff6464', color: '#ffffff' }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Design */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Header with Menu Button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-4 z-20">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-color)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="text-xl app-label" style={{ color: 'var(--accent-color)' }}>MYCHEATCODE.AI</div>
        </div>

        {/* Sidebar Navigation - Hidden by default, shown when menu is open */}
        <div
          className={`absolute top-0 left-0 h-full w-72 lg:w-80 flex flex-col transform transition-transform duration-300 z-10 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ backgroundColor: '#000000' }}
        >
          <div className="pt-6 px-6">
            <div className="text-xs font-bold tracking-widest mb-6" style={{ color: 'var(--accent-color)' }}>NAVIGATION</div>
          </div>

          <nav className="flex-1 px-4">
            <div className="space-y-1">
              <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </Link>

              <Link href="/my-codes" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>My Codes</span>
              </Link>

              <Link href="/relatable-topics" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>Relatable Topics</span>
              </Link>

              <Link href="/chat-history" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <span>Chat History</span>
              </Link>

              <Link href="/profile" className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all" style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>Profile</span>
              </Link>
              <button onClick={() => setFeedbackModalOpen(true)} className="flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium cursor-pointer transition-all hover:bg-white/5 w-full text-left" style={{ color: 'var(--text-secondary)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                </svg>
                <span>Got Feedback?</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Overlay when menu is open */}
        {menuOpen && (
          <div
            className="absolute inset-0 z-5"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setMenuOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className={`flex-1 pt-20 px-8 pb-8 max-w-4xl mx-auto transition-all duration-300 ${menuOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
          <div className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Profile</div>
          <div className="text-lg leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>Track your progress and stats</div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-xl" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <div className="rounded-xl p-8 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--card-border)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-secondary)' }}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {userProfile?.full_name || 'Player'}
                    </h2>
                    <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                      {userProfile?.email || 'Basketball Athlete'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Stats */}
              <div className="rounded-xl p-8 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Profile Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>Total Cheat Codes</span>
                    <span className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>{userStats?.totalCodes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>Active Codes</span>
                    <span className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>{userStats?.activeCodes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>Archived Codes</span>
                    <span className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>{userStats?.archivedCodes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>Most Used Code</span>
                    <span className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>{userStats?.mostUsedCode || 'None yet'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>Current Momentum</span>
                    <span className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>{userStats?.momentum || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>Days Active</span>
                    <span className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>{userStats?.daysActive || 0}</span>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="rounded-xl p-8 border md:col-span-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Account</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowBypassModal(true)}
                    className="px-6 py-4 rounded-lg transition-colors text-lg"
                    style={{ backgroundColor: 'rgba(0, 255, 65, 0.1)', color: 'var(--accent-color)' }}
                  >
                    Beta Access
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-6 py-4 rounded-lg transition-colors text-lg"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Feedback Button */}
      <FeedbackButton />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 transition-all"
          style={{
            backgroundColor: toastType === 'success' ? '#22c55e' : '#ef4444',
            color: '#ffffff'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Bypass Code Modal */}
      <BypassCodeModal
        isOpen={showBypassModal}
        onClose={() => setShowBypassModal(false)}
      />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
    </div>
  );
}
