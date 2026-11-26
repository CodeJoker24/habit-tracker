import { useId, useState } from 'react';
import Icon from './Icon.jsx';

export default function PasswordField({ label, name, value, onChange, autoComplete, minLength }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-300">{label}</label>
      <div className="relative mt-1">
        <input
          id={id}
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 pr-11 text-sm text-white outline-none focus:border-egyptian-400"
          type={visible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-white"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
    </div>
  );
}
