import { useHealth } from '../hooks/useHealth.js';

const colors = {
  connected: 'bg-egyptian-400',
  configured: 'bg-slate-400',
  unavailable: 'bg-scarlet-500',
};

export default function HealthStatus() {
  const { loading, data, error } = useHealth();

  if (loading) {
    return (
      <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        Checking backend connection…
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline-flex items-center gap-3 rounded-xl border border-scarlet-500/30 bg-scarlet-600/10 px-4 py-3 text-sm text-scarlet-200">
        <span className="h-2 w-2 rounded-full bg-scarlet-500" />
        Backend unreachable: {error}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        API online
      </span>
      {Object.entries(data?.services ?? {}).map(([name, value]) => (
        <span key={name} className="inline-flex items-center gap-2 capitalize">
          <span className={`h-2 w-2 rounded-full ${colors[value] ?? 'bg-slate-500'}`} />
          {name}: {value}
        </span>
      ))}
    </div>
  );
}
