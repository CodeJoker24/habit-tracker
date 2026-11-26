import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getGamification,
  markAllNotificationsRead,
  markNotificationRead,
  recomputeGamification,
} from '../services/gamification.js';
import Icon from '../components/Icon.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import PageHeading from '../components/PageHeading.jsx';
import { onRealtime } from '../services/realtime.js';

const xpForLevel = (level) => level * 100 - 100;
const rarityLabel = { rare: 'Rare', very_rare: 'Very Rare', epic: 'Epic', legendary: 'Legendary' };
const categoryLabel = {
  productivity: 'Productivity', task: 'Task completion', habit: 'Habit consistency', streak: 'Streak',
  time_management: 'Time management', early_riser: 'Early riser', night_owl: 'Night productivity',
  weekly: 'Weekly', monthly: 'Monthly', xp: 'XP milestone', improvement: 'Personal improvement',
  special: 'Special event', secret: 'Secret', long_term: 'Long-term consistency',
};
const pageSize = 24;

export default function RewardsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(pageSize);

  const load = useCallback(async () => {
    try {
      setData(await getGamification());
      setError(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => onRealtime('gamification:updated', load), [load]);
  useEffect(() => onRealtime('notification:new', load), [load]);

  const refresh = async () => {
    try {
      setData(await recomputeGamification());
      setError(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const unread = data?.notifications?.filter((notification) => !notification.read) ?? [];

  const readOne = async (id) => {
    await markNotificationRead(id).catch(() => null);
    load();
  };

  const readAll = async () => {
    await markAllNotificationsRead().catch(() => null);
    load();
  };

  const filteredBadges = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.badges.filter((badge) => {
      if (status === 'earned' && !badge.earned) return false;
      if (status === 'locked' && badge.earned) return false;
      if (rarity !== 'all' && badge.rarity !== rarity) return false;
      if (category !== 'all' && badge.category !== category) return false;
      if (query && !`${badge.name} ${badge.description}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [data, status, rarity, category, search]);

  useEffect(() => {
    setVisible(pageSize);
  }, [status, rarity, category, search]);

  if (!data) return error ? <div className="rounded-xl border border-scarlet-600/40 bg-scarlet-600/10 p-5 text-sm text-scarlet-200">{error}</div> : <LoadingScreen />;

  const stats = data.stats;
  const levelStart = xpForLevel(stats.level);
  const levelEnd = xpForLevel(stats.level + 1);
  const levelProgress = Math.min(100, Math.max(0, Math.round(((stats.xp - levelStart) / (levelEnd - levelStart)) * 100)));
  const earnedCount = data.badges.filter((badge) => badge.earned).length;

  const cards = [
    { label: 'Total XP', value: stats.xp, icon: 'spark' },
    { label: 'Tasks completed', value: stats.total_tasks_completed, icon: 'tasks' },
    { label: 'Habit check-ins', value: stats.total_habit_completions, icon: 'habits' },
    { label: 'Focus minutes', value: stats.total_focus_minutes, icon: 'timer' },
    { label: 'Current streak', value: `${stats.current_streak} days`, icon: 'spark' },
    { label: 'Longest streak', value: `${stats.longest_streak} days`, icon: 'trophy' },
  ];

  const rarityTone = {
    rare: 'text-slate-300 bg-white/10',
    very_rare: 'text-egyptian-400 bg-egyptian-600/20',
    epic: 'text-egyptian-300 bg-egyptian-500/20',
    legendary: 'text-white bg-scarlet-600/40',
  };

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Gamification"
        title="Rewards & progress"
        description="Earn XP from real work, unlock badges and climb the leaderboard."
        actions={
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl bg-scarlet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-scarlet-500"
          >
            Sync progress
          </button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-scarlet-600/40 bg-scarlet-600/10 p-4 text-sm text-scarlet-200">{error}</div>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl border border-egyptian-400/30 bg-gradient-to-br from-egyptian-600/50 to-slate-900 p-6">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-white">
              <Icon name="trophy" size={30} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-200/70">Your level</p>
              <p className="text-4xl font-semibold text-white">Level {stats.level}</p>
              <p className="mt-1 text-sm text-slate-200">{stats.xp} XP total{data.rank ? ` · Rank #${data.rank}` : ''}</p>
            </div>
          </div>
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-slate-200">
              <span>{stats.xp - levelStart} XP into level</span>
              <span>{levelEnd - levelStart} XP</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-scarlet-500" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400">{card.label}</p>
              <Icon name={card.icon} size={17} className="text-egyptian-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Achievements</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Badge collection</h2>
          </div>
          <span className="rounded-full bg-egyptian-600 px-3 py-1 text-xs font-semibold text-white">
            {earnedCount}/{data.badges.length}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search badges"
            className="w-full max-w-xs rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm text-white"
          />
          {[
            ['all', 'All'],
            ['earned', 'Earned'],
            ['locked', 'Locked'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${status === value ? 'bg-egyptian-600 text-white' : 'border border-white/15 text-slate-300 hover:bg-white/10'}`}
            >
              {label}
            </button>
          ))}
          <select
            value={rarity}
            onChange={(event) => setRarity(event.target.value)}
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-xs text-white"
          >
            <option value="all">All rarities</option>
            {Object.entries(rarityLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-xs text-white"
          >
            <option value="all">All categories</option>
            {Object.entries(categoryLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBadges.slice(0, visible).map((badge) => (
            <div
              key={badge.id}
              className={`flex gap-3 rounded-xl border p-4 ${
                badge.earned ? 'border-egyptian-400/40 bg-egyptian-600/15' : 'border-white/10 bg-white/5 opacity-75'
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  badge.earned ? 'bg-egyptian-600 text-white' : 'bg-white/10 text-slate-400'
                }`}
              >
                <Icon name={badge.icon} size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">{badge.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${rarityTone[badge.rarity] || rarityTone.rare}`}>
                    {rarityLabel[badge.rarity] || badge.rarity}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{badge.description}</p>
                <p className="mt-1 text-[11px] text-slate-400">{categoryLabel[badge.category] || badge.category}</p>
                {!badge.earned && badge.progress !== null && badge.progress !== undefined ? (
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-egyptian-400" style={{ width: `${badge.progress}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {badge.progressCurrent}/{badge.progressTarget} · {badge.progress}%
                    </p>
                  </div>
                ) : null}
                <p className="mt-2 text-[11px] font-medium text-slate-400">
                  {badge.earned ? `Earned · +${badge.xp_reward} XP` : `+${badge.xp_reward} XP`}
                </p>
              </div>
            </div>
          ))}
        </div>
        {filteredBadges.length === 0 ? (
          <p className="mt-5 text-sm text-slate-300">No badges match these filters.</p>
        ) : null}
        {filteredBadges.length > visible ? (
          <button
            type="button"
            onClick={() => setVisible((current) => current + pageSize)}
            className="mt-5 w-full rounded-lg border border-white/15 py-2 text-xs text-slate-300 hover:bg-white/10"
          >
            Show more ({filteredBadges.length - visible} remaining)
          </button>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Community</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Leaderboard</h2>
            </div>
            <Icon name="chart" size={18} className="text-egyptian-400" />
          </div>
          {data.leaderboard.length ? (
            <div className="mt-5 space-y-2">
              {data.leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                    entry.userId === data.stats.user_id ? 'bg-egyptian-600/20' : 'bg-white/5'
                  }`}
                >
                  <span className="w-6 text-center text-sm font-semibold text-slate-300">{entry.rank}</span>
                  <span className="flex h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
                    {entry.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{entry.name}</span>
                  <span className="text-xs text-slate-400">Lv {entry.level}</span>
                  <span className="w-16 text-right text-sm font-semibold text-white">{entry.xp} XP</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-300">No ranked members yet. Complete tasks and habits to appear here.</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Inbox</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Notifications</h2>
            </div>
            {unread.length ? (
              <button type="button" onClick={readAll} className="text-xs text-slate-300 hover:text-white">
                Mark all read
              </button>
            ) : null}
          </div>
          {data.notifications.length ? (
            <div className="mt-5 max-h-[520px] space-y-2 overflow-auto pr-1">
              {data.notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => !notification.read && readOne(notification.id)}
                  className={`flex w-full gap-3 rounded-xl border p-3 text-left ${
                    notification.read
                      ? 'border-white/5 bg-white/[0.02]'
                      : 'border-egyptian-400/30 bg-egyptian-600/10'
                  }`}
                >
                  <Icon
                    name={notification.type === 'badge' ? 'trophy' : 'spark'}
                    size={18}
                    className="mt-0.5 shrink-0 text-egyptian-400"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">{notification.title}</span>
                    <span className="mt-1 block text-xs text-slate-300">{notification.body}</span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-2 py-8 text-center">
              <Icon name="bell" size={26} className="text-slate-500" />
              <p className="text-sm text-slate-300">Nothing here yet. Your achievements will appear after you sync progress.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
