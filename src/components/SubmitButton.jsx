export default function SubmitButton({ children, busy }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-lg bg-scarlet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-scarlet-500 disabled:opacity-60"
    >
      {busy ? 'Please wait…' : children}
    </button>
  );
}
