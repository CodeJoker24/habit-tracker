import { Link, NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/habits', label: 'Habits', icon: 'habits' },
  { to: '/timer', label: 'Focus timer', icon: 'timer' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/rewards', label: 'Rewards', icon: 'trophy' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export default function Sidebar({ open, onClose, user, profile, isAdmin, onSignOut }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-scarlet-600/20 text-white shadow-sm shadow-scarlet-600/25 ring-1 ring-scarlet-500/30'
        : 'text-slate-200/80 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-gradient-to-b from-egyptian-700 via-egyptian-600 to-slate-900 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/dashboard" className="flex items-center gap-3 text-white">
            <Logo size={36} />
            <span className="font-semibold tracking-tight">Habit Tracker</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-200 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
              <Icon name={item.icon} size={19} />
              {item.label}
            </NavLink>
          ))}
          {isAdmin ? (
            <NavLink to="/admin" className={linkClass} onClick={onClose}>
              <Icon name="shield" size={19} />
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-slate-200">
              <Icon name="user" size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'Your account'}</p>
              <p className="truncate text-xs text-slate-300/70">{user?.email || profile?.email || ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/80 transition-colors hover:bg-scarlet-600/20 hover:text-scarlet-200"
          >
            <Icon name="logout" size={19} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
