import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../hooks/useAuth.js';

const features = [
  {
    icon: 'tasks',
    title: 'Tasks with intent',
    text: 'Capture work, set priorities and finish what matters.',
  },
  {
    icon: 'habits',
    title: 'Habits that stick',
    text: 'Daily targets and streaks that make consistency visible.',
  },
  {
    icon: 'timer',
    title: 'Protected focus',
    text: 'Timed sessions that survive reloads and save themselves.',
  },
  {
    icon: 'chart',
    title: 'Honest analytics',
    text: 'Charts built from what you actually completed.',
  },
];

const previewBars = [38, 62, 45, 78, 55, 88, 70];

export default function LandingPage() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-egyptian-700/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 font-semibold text-white">
            <Logo size={36} />
            <span>Habit Tracker</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm" aria-label="Primary navigation">
            <a href="#features" className="hidden rounded-lg px-3 py-2 text-slate-200 hover:bg-white/10 sm:block">
              Features
            </a>
            {session ? (
              <Link to="/dashboard" className="rounded-lg bg-scarlet-600 px-4 py-2 font-semibold text-white hover:bg-scarlet-500">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-slate-200 hover:bg-white/10">
                  Sign in
                </Link>
                <Link to="/register" className="rounded-lg bg-scarlet-600 px-4 py-2 font-semibold text-white hover:bg-scarlet-500">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-egyptian-700 via-egyptian-600 to-slate-900">
        <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full border border-white/10" />
        <div className="absolute -bottom-52 -left-32 h-[30rem] w-[30rem] rounded-full border border-white/10" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-scarlet-500/40 bg-scarlet-600/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-scarlet-200">
              <Icon name="spark" size={14} />
              Your personal command centre
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl">
              Build better days, one habit at a time.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Plan tasks, repeat the habits that matter, and watch your focus turn into measurable progress. No noise,
              no vanity metrics — just the work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={session ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-xl bg-scarlet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-scarlet-500"
              >
                {session ? 'Open dashboard' : 'Create free account'}
                <Icon name="arrow" size={16} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-200/70">This week</p>
                  <p className="mt-1 text-2xl font-semibold text-white">Progress overview</p>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">+18%</span>
              </div>
              <div className="mt-8 flex h-48 items-end gap-3" aria-hidden="true">
                {previewBars.map((height, index) => (
                  <div key={index} className="flex h-full flex-1 flex-col justify-end gap-2">
                    <div
                      className={`rounded-t-lg ${index === 5 ? 'bg-scarlet-500' : 'bg-slate-300/90'}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-center text-[10px] text-slate-200/70">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ['Tasks', '24'],
                  ['Streak', '12d'],
                  ['Focus', '9h'],
                ].map(([label, value]) => (
                  <div key={label} className={`rounded-xl p-3 ${label === 'Streak' ? 'bg-scarlet-600/25' : 'bg-egyptian-700/60'}`}>
                    <p className="text-[11px] uppercase tracking-wider text-slate-200/70">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">What you get</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Everything you need to keep showing up</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-scarlet-500/50"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl text-white ${index % 2 === 0 ? 'bg-egyptian-600' : 'bg-scarlet-600'}`}>
                <Icon name={feature.icon} size={20} />
              </span>
              <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-egyptian-700 to-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Ready to start your streak?</h2>
            <p className="mt-2 text-sm text-slate-200">Your dashboard is waiting the moment you sign in.</p>
          </div>
          <Link
            to={session ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl bg-scarlet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-scarlet-500"
          >
            {session ? 'Go to dashboard' : 'Create account'}
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2">
            <Logo size={24} /> Habit Tracker
          </span>
        </div>
      </footer>
    </div>
  );
}
