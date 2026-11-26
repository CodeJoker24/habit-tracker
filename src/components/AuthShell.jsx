import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-900 lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-egyptian-700 via-egyptian-600 to-slate-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-white/10" />

        <Link to="/" className="relative flex items-center gap-3 text-white">
          <Logo size={40} />
          <span className="text-lg font-semibold tracking-tight">Habit Tracker</span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/70">Built for consistency</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
            Small steps, repeated daily, become a different life.
          </h2>
          <div className="mt-8 space-y-3">
            {['Plan tasks with clear priorities', 'Track habits and protect streaks', 'See real progress in charts'].map((item) => (
              <p key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-scarlet-600/20 text-scarlet-200">
                  <Icon name="spark" size={14} />
                </span>
                {item}
              </p>
            ))}
          </div>
        </div>

      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={40} />
            <span className="text-lg font-semibold text-white">Habit Tracker</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-300">{subtitle}</p> : null}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">{children}</div>
          {footer ? <div className="mt-6 text-sm text-slate-300">{footer}</div> : null}
          <Link to="/" className="mt-8 inline-block text-xs text-slate-400 hover:text-slate-200">
            ← Back to home
          </Link>
        </div>
      </section>
    </div>
  );
}
