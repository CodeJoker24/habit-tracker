import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SyncStatus from '../components/SyncStatus.jsx';
import UpdateBanner from '../components/UpdateBanner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { requestBackgroundSync } from '../services/pwa.js';
import { startSyncListener } from '../services/syncService.js';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const stop = startSyncListener(user.id);
    requestBackgroundSync();
    return stop;
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-white/15 p-2 text-white hover:bg-white/10"
            aria-label="Open navigation menu"
            aria-expanded={open}
          >
            <Icon name="menu" size={20} />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-white">
            <Logo size={28} />
            Habit Tracker
          </Link>
          <span className="w-9" />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] space-y-2">
        <div className="pointer-events-auto">
          <UpdateBanner />
        </div>
        <div className="pointer-events-auto">
          <SyncStatus userId={user?.id} />
        </div>
      </div>
    </div>
  );
}
