export default function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-egyptian-400" />
        {label}
      </div>
    </div>
  );
}
