import { useEffect, useState } from 'react';
import { applyUpdate } from '../services/pwa.js';

export default function UpdateBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const onUpdate = () => setAvailable(true);
    window.addEventListener('pwa-update', onUpdate);
    return () => window.removeEventListener('pwa-update', onUpdate);
  }, []);

  if (!available) return null;

  return (
    <div className="rounded-xl border border-egyptian-400/40 bg-slate-900/95 p-4 shadow-xl backdrop-blur">
      <p className="text-sm font-semibold text-white">A new version is ready</p>
      <p className="mt-1 text-xs text-slate-300">Update now to get the latest features.</p>
      <button
        type="button"
        onClick={applyUpdate}
        className="mt-3 rounded-lg bg-egyptian-600 px-4 py-2 text-xs font-semibold text-white hover:bg-egyptian-500"
      >
        Update now
      </button>
    </div>
  );
}
