import { useId } from 'react';

export default function Logo({ size = 36, className = '' }) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Habit Tracker logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1034a6" />
          <stop offset="100%" stopColor="#5f7c93" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#${gradientId})`} />
      <path
        d="M13 25l6 6 15-16"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="34" r="3" fill="#e5484d" />
    </svg>
  );
}
