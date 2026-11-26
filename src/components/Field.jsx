export default function Field({ label, type = 'text', name, value, onChange, autoComplete, minLength, options }) {
  const inputClass =
    'mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400';

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {options ? (
        <select className={inputClass} type={type} name={name} value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={inputClass}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
      )}
    </label>
  );
}
