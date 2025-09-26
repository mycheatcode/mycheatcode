'use client';

import Link from 'next/link';

export default function Profile() {
  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* Mobile Design */}
      <div className="lg:hidden bg-black min-h-screen relative flex flex-col">
        {/* Header */}
        <div className="p-4 bg-black border-b border-zinc-800">
          {/* App Title */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-lg font-semibold text-white">mycheatcode.ai</div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="w-8 h-8 flex items-center justify-center text-white cursor-pointer transition-transform active:scale-90">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </Link>
          </div>

          {/* Page Title */}
          <div className="text-[1.8em] font-bold text-white mb-2">Profile</div>
          <div className="text-zinc-400 text-sm leading-relaxed">Your basketball mental performance profile</div>
        </div>

        <div className="flex-1 flex flex-col p-4">

          <div className="space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Player</h2>
                  <p className="text-zinc-400">Basketball Athlete</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <span className="text-white">Edit Profile</span>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <span className="text-white">Preferences</span>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <span className="text-white">Notifications</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Progress Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total Cheat Codes</span>
                  <span className="text-white font-semibold">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Average Power</span>
                  <span className="text-white font-semibold">5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Days Active</span>
                  <span className="text-white font-semibold">7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Desktop Design */}
      <div className="hidden lg:block min-h-screen">
        <div className="p-6 pt-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/" className="p-2 text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
              </Link>
            </div>

            <div className="text-4xl font-bold text-white mb-4">Profile</div>
            <div className="text-zinc-400 text-lg leading-relaxed mb-8">Your basketball mental performance profile</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Player</h2>
                    <p className="text-zinc-400 text-lg">Basketball Athlete</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Progress Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-lg">Total Cheat Codes</span>
                    <span className="text-white font-semibold text-xl">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-lg">Average Power</span>
                    <span className="text-white font-semibold text-xl">5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-lg">Days Active</span>
                    <span className="text-white font-semibold text-xl">7</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Account Settings</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <span className="text-white text-lg">Edit Profile</span>
                  </button>
                  <button className="w-full text-left p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <span className="text-white text-lg">Preferences</span>
                  </button>
                  <button className="w-full text-left p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <span className="text-white text-lg">Notifications</span>
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-zinc-800/30 rounded-lg">
                    <p className="text-white">Created cheat code for "Free Throw Routine"</p>
                    <p className="text-zinc-500 text-sm mt-1">2 days ago</p>
                  </div>
                  <div className="p-4 bg-zinc-800/30 rounded-lg">
                    <p className="text-white">Practiced "Defense Positioning"</p>
                    <p className="text-zinc-500 text-sm mt-1">5 days ago</p>
                  </div>
                  <div className="p-4 bg-zinc-800/30 rounded-lg">
                    <p className="text-white">Joined community discussion</p>
                    <p className="text-zinc-500 text-sm mt-1">1 week ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}