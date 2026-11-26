import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import Icon from '../../components/Icon.jsx';
import PageHeading from '../../components/PageHeading.jsx';
import { awardBadge, createBadge, findBadgeUsers, getBadges, updateBadge } from '../../services/badges.js';

const rarityOptions = ['rare', 'very_rare', 'epic', 'legendary'];
const categoryOptions = [
  'productivity', 'task', 'habit', 'streak', 'time_management', 'early_riser', 'night_owl',
  'weekly', 'monthly', 'xp', 'improvement', 'special', 'secret', 'long_term',
];
const requirementOptions = ['stat_threshold', 'session_time', 'period', 'manual'];
const statOptions = [
  'total_tasks_completed', 'total_habit_completions', 'total_focus_minutes',
  'current_streak', 'longest_streak', 'xp', 'level', 'active_days',
];
const metricOptions = ['weekly_tasks', 'monthly_tasks', 'weekly_habits', 'monthly_habits', 'early_sessions', 'late_sessions'];
const iconOptions = ['spark', 'tasks', 'habits', 'timer', 'trophy', 'bell', 'user', 'chart', 'shield'];

const emptyForm = {
  code: '',
  name: '',
  description: '',
  icon: 'spark',
  rarity: 'rare',
  category: 'task',
  requirement_type: 'stat_threshold',
  requirement_stat: 'total_tasks_completed',
  requirement_metric: 'weekly_tasks',
  requirement_gte: 1,
  xp_reward: 10,
  is_active: true,
  is_hidden: false,
};

const configFor = (form) => {
  if (form.requirement_type === 'stat_threshold') {
    return { stat: form.requirement_stat, gte: Number(form.requirement_gte) };
  }
  if (form.requirement_type === 'manual') return {};
  return { metric: form.requirement_metric, gte: Number(form.requirement_gte) };
};

export default function AdminBadgesPage({ embedded = false }) {
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [awardId, setAwardId] = useState(null);

  const load = useCallback(async () => {
    try {
      setBadges(await getBadges());
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not load badges', text: error.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        setUsers(await findBadgeUsers(search.trim()));
      } catch {
        setUsers([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const edit = (badge) => {
    const config = badge.requirement_config || {};
    setEditingId(badge.id);
    setForm({
      code: badge.code,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: badge.rarity,
      category: badge.category,
      requirement_type: badge.requirement_type,
      requirement_stat: config.stat || 'total_tasks_completed',
      requirement_metric: config.metric || 'weekly_tasks',
      requirement_gte: config.gte ?? 1,
      xp_reward: badge.xp_reward,
      is_active: badge.is_active,
      is_hidden: badge.is_hidden,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const values = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        rarity: form.rarity,
        category: form.category,
        requirement_type: form.requirement_type,
        requirement_config: configFor(form),
        xp_reward: Number(form.xp_reward),
        is_hidden: form.is_hidden,
        ...(editingId ? { is_active: form.is_active } : { code: form.code }),
      };
      if (editingId) await updateBadge(editingId, values);
      else await createBadge(values);
      setForm(emptyForm);
      setEditingId(null);
      await load();
      Swal.fire({ icon: 'success', title: editingId ? 'Badge updated' : 'Badge created', timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not save badge', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const submitAward = async (event) => {
    event.preventDefault();
    if (!awardId || !selectedUser) return;
    setBusy(true);
    try {
      await awardBadge(awardId, selectedUser);
      setAwardId(null);
      setSelectedUser('');
      setSearch('');
      Swal.fire({ icon: 'success', title: 'Badge awarded', timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not award badge', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const shown = badges.filter((badge) =>
    !filter || `${badge.code} ${badge.name} ${badge.rarity} ${badge.category}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      {!embedded ? (
        <PageHeading
          eyebrow="Administration"
          title="Badge catalogue"
          description="Create, update and award badges without changing application code."
        />
      ) : null}

      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-egyptian-400/20 bg-white/5 p-5 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit badge' : 'New badge'}</h2>
          {editingId ? (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(emptyForm); }}
              className="text-xs text-slate-300 hover:text-white"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
        <label className="text-xs text-slate-300">
          Code
          <input
            disabled={Boolean(editingId)}
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toLowerCase() })}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400 disabled:opacity-50"
          />
        </label>
        <label className="text-xs text-slate-300">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
          />
        </label>
        <label className="text-xs text-slate-300 md:col-span-2">
          Description
          <input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
          />
        </label>
        <label className="text-xs text-slate-300">
          Icon
          <select
            value={form.icon}
            onChange={(event) => setForm({ ...form, icon: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-300">
          Rarity
          <select
            value={form.rarity}
            onChange={(event) => setForm({ ...form, rarity: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {rarityOptions.map((rarity) => <option key={rarity} value={rarity}>{rarity.replace('_', ' ')}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-300">
          Category
          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {categoryOptions.map((category) => <option key={category} value={category}>{category.replace('_', ' ')}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-300">
          Requirement
          <select
            value={form.requirement_type}
            onChange={(event) => setForm({ ...form, requirement_type: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {requirementOptions.map((type) => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
          </select>
        </label>
        {form.requirement_type === 'stat_threshold' ? (
          <label className="text-xs text-slate-300">
            Stat
            <select
              value={form.requirement_stat}
              onChange={(event) => setForm({ ...form, requirement_stat: event.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              {statOptions.map((stat) => <option key={stat} value={stat}>{stat.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
        ) : null}
        {form.requirement_type === 'session_time' || form.requirement_type === 'period' ? (
          <label className="text-xs text-slate-300">
            Metric
            <select
              value={form.requirement_metric}
              onChange={(event) => setForm({ ...form, requirement_metric: event.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              {metricOptions.map((metric) => <option key={metric} value={metric}>{metric.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
        ) : null}
        {form.requirement_type !== 'manual' ? (
          <label className="text-xs text-slate-300">
            Target
            <input
              type="number"
              min="1"
              value={form.requirement_gte}
              onChange={(event) => setForm({ ...form, requirement_gte: event.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </label>
        ) : null}
        <label className="text-xs text-slate-300">
          XP reward
          <input
            type="number"
            min="0"
            value={form.xp_reward}
            onChange={(event) => setForm({ ...form, xp_reward: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </label>
        <div className="flex items-end gap-5">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="accent-egyptian-600"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={form.is_hidden}
              onChange={(event) => setForm({ ...form, is_hidden: event.target.checked })}
              className="accent-egyptian-600"
            />
            Hidden
          </label>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-egyptian-600 px-4 py-2 text-sm font-semibold text-white hover:bg-egyptian-500 disabled:opacity-60 md:col-span-2"
        >
          {editingId ? 'Save changes' : 'Create badge'}
        </button>
      </form>

      <form onSubmit={submitAward} className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="min-w-[220px] flex-1">
          <label className="text-xs text-slate-300" htmlFor="award-user">Award to user</label>
          <input
            id="award-user"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setSelectedUser(''); }}
            placeholder="Search by email"
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          {users.length ? (
            <div className="mt-2 space-y-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => { setSelectedUser(user.id); setSearch(user.full_name || user.email); setUsers([]); }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-xs ${selectedUser === user.id ? 'bg-egyptian-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {user.full_name || user.email} · {user.email}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <label className="min-w-[200px] text-xs text-slate-300">
          Badge
          <select
            value={awardId || ''}
            onChange={(event) => setAwardId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="">Select badge</option>
            {badges.filter((badge) => badge.is_active).map((badge) => (
              <option key={badge.id} value={badge.id}>{badge.name}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy || !awardId || !selectedUser}
          className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-400 disabled:opacity-50"
        >
          Award badge
        </button>
      </form>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Catalogue</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{shown.length} badges</h2>
          </div>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter badges"
            className="w-full max-w-xs rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="mt-5 max-h-[620px] space-y-2 overflow-auto pr-1">
          {shown.slice(0, 400).map((badge) => (
            <div key={badge.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-egyptian-600/25 text-egyptian-400">
                <Icon name={badge.icon} size={18} />
              </span>
              <div className="min-w-[180px] flex-1">
                <p className="text-sm font-medium text-white">{badge.name}</p>
                <p className="text-[11px] text-slate-400">{badge.code} · {badge.category.replace('_', ' ')} · {badge.rarity.replace('_', ' ')}</p>
              </div>
              <span className="text-xs text-slate-300">+{badge.xp_reward} XP</span>
              {!badge.is_active ? <span className="text-[11px] text-scarlet-200">Inactive</span> : null}
              {badge.is_hidden ? <span className="text-[11px] text-slate-400">Hidden</span> : null}
              <button
                type="button"
                onClick={() => edit(badge)}
                className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
        {shown.length > 400 ? <p className="mt-3 text-xs text-slate-500">Showing first 400 results. Use the filter to narrow them down.</p> : null}
      </section>
    </div>
  );
}
