import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-1.5 text-brand shrink-0" aria-label="Staybnb home">
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="currentColor" aria-hidden>
        <path d="M16 3 3 14.5V29h9.5v-8h7v8H29V14.5z" />
        <circle cx="16" cy="14" r="2.6" fill="#fff" />
      </svg>
      <span className="hidden md:inline text-[22px] font-extrabold tracking-tight">staybnb</span>
    </Link>
  );
}
