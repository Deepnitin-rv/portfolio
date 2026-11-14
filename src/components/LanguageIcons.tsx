import type { SkillItem } from '../data/portfolio';

interface LanguageIconProps {
  id: SkillItem['id'];
  className?: string;
}

export function LanguageIcon({ id, className = 'w-7 h-7' }: LanguageIconProps) {
  switch (id) {
    case 'python':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M15.88 4C10.95 4 11.27 6.13 11.27 6.13l.01 2.21h4.69v.67H9.42S6 8.62 6 13.78c0 5.16 2.98 4.98 2.98 4.98h1.78v-2.4s-.1-2.98 2.93-2.98h5.05s2.84.05 2.84-2.75V6.71S22 4 15.88 4zm-2.8 1.56a.92.92 0 1 1 0 1.84.92.92 0 0 1 0-1.84z"
            fill="#38BDF8"
          />
          <path
            d="M16.12 28c4.93 0 4.61-2.13 4.61-2.13l-.01-2.21h-4.69v-.67h6.55S26 23.38 26 18.22c0-5.16-2.98-4.98-2.98-4.98h-1.78v2.4s.1 2.98-2.93 2.98h-5.05s-2.84-.05-2.84 2.75v3.92S10 28 16.12 28zm2.8-1.56a.92.92 0 1 1 0-1.84.92.92 0 0 1 0 1.84z"
            fill="#818CF8"
          />
        </svg>
      );
    case 'c':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 4L26.39 10V22L16 28L5.61 22V10L16 4Z"
            stroke="#38BDF8"
            strokeWidth="1.75"
            fill="rgba(56, 189, 248, 0.12)"
          />
          <path
            d="M20.2 12.6A5.2 5.2 0 0 0 16 10.6c-2.98 0-5.4 2.42-5.4 5.4s2.42 5.4 5.4 5.4c1.75 0 3.31-.83 4.3-2.12"
            stroke="#E0F2FE"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'cpp':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M16 4L26.39 10V22L16 28L5.61 22V10L16 4Z"
            stroke="#60A5FA"
            strokeWidth="1.75"
            fill="rgba(96, 165, 250, 0.12)"
          />
          <path
            d="M16.8 12.7A4.6 4.6 0 0 0 13.2 11c-2.65 0-4.8 2.24-4.8 5s2.15 5 4.8 5c1.5 0 2.84-.72 3.72-1.85"
            stroke="#E0F2FE"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M19.2 14.4v3.2M17.6 16h3.2M23.5 14.4v3.2M21.9 16h3.2"
            stroke="#38BDF8"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'java':
      return (
        <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <path
            d="M10.5 21.2c0 1.4 2.46 2.5 5.5 2.5s5.5-1.1 5.5-2.5V14.5h-11v6.7z"
            stroke="#A78BFA"
            strokeWidth="1.8"
            fill="rgba(167, 139, 250, 0.12)"
          />
          <path
            d="M21.5 15.8h1.7a2.1 2.1 0 0 1 0 4.2h-1.7"
            stroke="#A78BFA"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8.5 26.2c2.2.8 5.2 1.2 7.5 1.2s5.3-.4 7.5-1.2"
            stroke="#38BDF8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M13.5 11.2c-.8-1.4.9-2.5.3-4.2M18 11.2c-.8-1.4.9-2.5.3-4.2"
            stroke="#7DD3FC"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
