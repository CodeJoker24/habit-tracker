import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeading from '../../components/PageHeading.jsx';
import { onRealtime } from '../../services/realtime.js';
import AdminBadgesPage from './AdminBadgesPage.jsx';
import AdminDashboardPage from './AdminDashboardPage.jsx';

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'shield' },
  { id: 'badges', label: 'Badge catalogue', icon: 'trophy' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [activity, setActivity] = useState([]);

  useEffect(
    () =>
      onRealtime('admin:activity', (event) => {
        setActivity((current) => [event, ...current].slice(0, 12));
      }),
    [],
  );

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Administration"
        title="Admin"
        description="Manage accounts, deletion requests and the badge catalogue in one place."
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? 'bg-scarlet-600 text-white shadow-lg shadow-scarlet-600/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon name={item.icon} size={17} />
            {item.label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-scarlet-500/20 bg-scarlet-600/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-scarlet-200">Live activity</p>
          <span className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-scarlet-500" />
            Live
          </span>
        </div>
        {activity.length ? (
          <ul className="mt-4 space-y-2">
            {activity.map((event, index) => (
              <li key={`${event.at}-${index}`} className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] uppercase text-scarlet-200">{event.type}</span>
                <span>{event.action.replaceAll(':', ' ')}</span>
                <span className="text-xs text-slate-500">{new Date(event.at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-400">Waiting for live updates…</p>
        )}
      </section>

      {tab === 'overview' ? <AdminDashboardPage embedded /> : <AdminBadgesPage embedded />}
    </div>
  );
}
