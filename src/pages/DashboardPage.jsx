import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Icon from '../components/Icon.jsx';
import PageHeading from '../components/PageHeading.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getAnalytics, getSessions } from '../services/timer.js';

const chartTooltip = {
  contentStyle: { background: '#142331', border: '1px solid #5f7c93', borderRadius: 12, color: '#d2dee8' },
  labelStyle: { color: '#d2dee8' },
};

const shortcuts = [
  { to: '/tasks', label: 'Tasks', icon: 'tasks', text: 'Plan and complete your work.' },
  { to: '/habits', label: 'Habits', icon: 'habits', text: 'Build consistency with daily reps.' },
  { to: '/timer', label: 'Focus timer', icon: 'timer', text: 'Protect blocks of deep work.' },
  { to: '/analytics', label: 'Analytics', icon: 'chart', text: 'See the full picture.' },
];

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    Promise.all([getAnalytics(), getSessions()])
      .then(([analytics, focusSessions]) => {
        setData(analytics);
        setSessions(focusSessions);
      })
      .catch(() => null);
  }, []);

  const focusSeries = useMemo(
    () =>
      sessions
        .slice(0, 7)
        .reverse()
        .map((session) => ({
          label: new Date(session.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          minutes: session.duration_minutes,
        })),
    [sessions],
  );

  const taskSplit = data
    ? [
        { name: 'Completed', value: data.completedTasks },
        { name: 'Pending', value: data.pendingTasks },
      ]
    : [];

  const stats = data
    ? [
        { label: 'Completed tasks', value: data.completedTasks, icon: 'tasks', tone: 'egyptian' },
        { label: 'Pending tasks', value: data.pendingTasks, icon: 'spark', tone: 'scarlet' },
        { label: 'Day streak', value: data.currentStreak, icon: 'habits', tone: 'egyptian' },
        { label: 'Focus minutes', value: data.focusMinutes, icon: 'timer', tone: 'stone' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Your workspace"
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description="Here is what your progress looks like today."
        actions={
          isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              <Icon name="shield" size={16} />
              Admin
            </Link>
          ) : null
        }
      />

      {!profile?.is_active ? (
        <div className="rounded-xl border border-scarlet-600/40 bg-scarlet-600/10 p-4 text-sm text-scarlet-200">
          Your account is suspended. Ask an administrator to reactivate it before using the productivity tools.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 ${
              stat.tone === 'egyptian'
                ? 'border-egyptian-400/30 bg-gradient-to-br from-egyptian-600/40 to-slate-900'
                : stat.tone === 'scarlet'
                  ? 'border-scarlet-500/30 bg-gradient-to-br from-scarlet-600/20 to-slate-900'
                  : 'border-slate-500/30 bg-slate-900/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-300">{stat.label}</p>
              <Icon name={stat.icon} size={18} className="text-slate-300" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Task completions</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Last 7 days</h2>
              </div>
              <Icon name="chart" size={18} className="text-egyptian-400" />
            </div>
            <div className="mt-5 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3d67d6" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#1034a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#5f7c93" strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="label" stroke="#7f9ab0" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#7f9ab0" fontSize={12} />
                  <Tooltip {...chartTooltip} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#3d67d6"
                    strokeWidth={2.5}
                    fill="url(#dashboardArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Task balance</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Done vs pending</h2>
            <div className="mt-2 h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskSplit} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={4}>
                    <Cell fill="#1034a6" />
                    <Cell fill="#e5484d" />
                  </Pie>
                  <Tooltip {...chartTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-egyptian-600" />Completed</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-scarlet-500" />Pending</span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Habit consistency</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Completions this week</h2>
            <div className="mt-5 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.habits} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#5f7c93" strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="label" stroke="#7f9ab0" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#7f9ab0" fontSize={12} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="completed" fill="#e5484d" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
            <p className="text-xs uppercase tracking-wider text-slate-400">Focus history</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Minutes per recent session</h2>
            <div className="mt-5 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#5f7c93" strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="label" stroke="#7f9ab0" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#7f9ab0" fontSize={12} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="minutes" fill="#1034a6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-egyptian-400/50"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-egyptian-600 text-white">
              <Icon name={item.icon} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-sm text-slate-300">{item.text}</p>
            </div>
            <Icon name="arrow" size={18} className="text-slate-400 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </section>
    </div>
  );
}
