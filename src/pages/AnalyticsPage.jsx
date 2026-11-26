import { useCallback, useEffect, useMemo, useState } from 'react';
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
import Swal from 'sweetalert2';
import PageHeading from '../components/PageHeading.jsx';
import { getAnalytics, getSessions } from '../services/timer.js';

const ranges = [
  { key: 'daily', label: '7 days' },
  { key: 'weekly', label: '4 weeks' },
  { key: 'monthly', label: '6 months' },
];

const chartTooltip = {
  contentStyle: { background: '#142331', border: '1px solid #5f7c93', borderRadius: 12, color: '#d2dee8' },
  labelStyle: { color: '#d2dee8' },
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [range, setRange] = useState('daily');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analytics, focusSessions] = await Promise.all([getAnalytics(), getSessions()]);
      setData(analytics);
      setSessions(focusSessions);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not load analytics', text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const focusSeries = useMemo(
    () =>
      sessions
        .slice(0, 10)
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

  const cards = data
    ? [
        { label: 'Completed tasks', value: data.completedTasks },
        { label: 'Pending tasks', value: data.pendingTasks },
        { label: 'Habit completion', value: `${data.habitCompletionRate}%` },
        { label: 'Current streak', value: `${data.currentStreak} days` },
        { label: 'Focus time', value: `${data.focusMinutes} min` },
        { label: 'Sessions', value: data.sessions },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Insights"
        title="Analytics"
        description="A honest view of what you actually did, not what you planned to do."
        actions={
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Refresh
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-slate-300">Loading analytics…</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap gap-2">
              {ranges.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRange(item.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    range === item.key
                      ? 'bg-scarlet-600 text-white'
                      : 'border border-white/15 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data[range]} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#5f7c93" strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="label" stroke="#7f9ab0" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#7f9ab0" fontSize={12} />
                  <Tooltip {...chartTooltip} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="completed" fill="#3d67d6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">Task split</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Completion ratio</h2>
              <div className="mt-4 h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskSplit} dataKey="value" nameKey="name" outerRadius={78} paddingAngle={4}>
                      <Cell fill="#1034a6" />
                      <Cell fill="#5f7c93" />
                    </Pie>
                    <Tooltip {...chartTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">Habits</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Daily completions</h2>
              <div className="mt-4 h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.habits} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsHabitArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5f7c93" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#5f7c93" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#5f7c93" strokeOpacity={0.15} vertical={false} />
                    <XAxis dataKey="label" stroke="#7f9ab0" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="#7f9ab0" fontSize={12} />
                    <Tooltip {...chartTooltip} />
                    <Area type="monotone" dataKey="completed" stroke="#7f9ab0" strokeWidth={2} fill="url(#analyticsHabitArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">Focus</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Minutes per session</h2>
              <div className="mt-4 h-52 w-full">
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
        </>
      ) : null}
    </div>
  );
}
