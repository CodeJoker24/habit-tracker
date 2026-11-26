import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const features = [
  { title: 'Tasks', description: 'Plan, prioritize and complete your work.' },
  { title: 'Habits', description: 'Build consistency with targets and streaks.' },
  { title: 'Focus timer', description: 'Protect blocks of deep work and save every session.' },
  { title: 'Analytics', description: 'Track completions, streaks and focus time over weeks.' },
  { title: 'Rewards', description: 'Earn XP, badges and leaderboard positions.' },
];

export default function HomePage() {
  const { session } = useAuth();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-egyptian-600/15 via-slate-900 to-slate-900 p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
          Phase 3 · Productivity workspace
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Build better days, one habit at a time.
        </h1>
        <p className="mt-4 max-w-xl text-slate-300">
          A scalable workspace for tracking tasks, habits, streaks and achievements. Create an
          account to get started.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={session ? '/dashboard' : '/register'}
            className="rounded-lg bg-scarlet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-scarlet-500"
          >
            {session ? 'Open dashboard' : 'Create account'}
          </Link>
          {!session ? (
            <Link
              to="/login"
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-egyptian-400/40"
          >
            <h2 className="font-semibold text-white">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
