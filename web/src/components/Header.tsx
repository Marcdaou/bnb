import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Search as SearchIcon, UserCircle2, Minus, Plus } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

function SearchBar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [city, setCity] = useState(params.get('city') ?? '');
  const [checkIn, setCheckIn] = useState(params.get('check_in') ?? '');
  const [checkOut, setCheckOut] = useState(params.get('check_out') ?? '');
  const [guests, setGuests] = useState(Number(params.get('guests') ?? 0) || 0);
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (city.trim()) q.set('city', city.trim());
    if (checkIn) q.set('check_in', checkIn);
    if (checkOut) q.set('check_out', checkOut);
    if (guests > 0) q.set('guests', String(guests));
    const cat = params.get('category');
    if (cat) q.set('category', cat);
    navigate(`/search?${q.toString()}`);
  };

  const field = 'px-5 py-2 rounded-full hover:bg-gray-100 text-left min-w-0';
  const label = 'block text-[11px] font-semibold';
  const input = 'w-full bg-transparent text-sm text-muted placeholder:text-muted outline-none';

  return (
    <form onSubmit={submit} className="flex items-center border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow bg-white w-full max-w-3xl">
      <label className={`${field} flex-[1.4]`}>
        <span className={label}>Where</span>
        <input className={input} placeholder="Search destinations" value={city} onChange={e => setCity(e.target.value)} />
      </label>
      <span className="h-8 w-px bg-gray-200 hidden sm:block" />
      <label className={`${field} flex-1 hidden sm:block`}>
        <span className={label}>Check in</span>
        <input type="date" min={today} className={input} value={checkIn}
          onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }} />
      </label>
      <span className="h-8 w-px bg-gray-200 hidden sm:block" />
      <label className={`${field} flex-1 hidden sm:block`}>
        <span className={label}>Check out</span>
        <input type="date" min={checkIn || today} className={input} value={checkOut} onChange={e => setCheckOut(e.target.value)} />
      </label>
      <span className="h-8 w-px bg-gray-200 hidden md:block" />
      <div className={`${field} hidden md:flex items-center gap-2 flex-1`}>
        <div className="min-w-0">
          <span className={label}>Who</span>
          <span className="text-sm text-muted whitespace-nowrap">{guests ? `${guests} guest${guests > 1 ? 's' : ''}` : 'Add guests'}</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button type="button" aria-label="Fewer guests" disabled={guests <= 0} onClick={() => setGuests(g => Math.max(0, g - 1))}
            className="w-6 h-6 grid place-items-center rounded-full border border-gray-300 disabled:opacity-30"><Minus size={12} /></button>
          <button type="button" aria-label="More guests" onClick={() => setGuests(g => Math.min(16, g + 1))}
            className="w-6 h-6 grid place-items-center rounded-full border border-gray-300"><Plus size={12} /></button>
        </div>
      </div>
      <button type="submit" aria-label="Search" className="m-2 shrink-0 bg-brand hover:bg-brand-dark text-white rounded-full p-3 transition-colors">
        <SearchIcon size={16} strokeWidth={3} />
      </button>
    </form>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  useClickOutside(ref, () => setOpen(false));
  useEffect(() => setOpen(false), [location]);

  const item = 'block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50';
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '';

  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(o => !o)} aria-label="User menu"
        className="flex items-center gap-2 border border-gray-300 rounded-full pl-3 pr-1.5 py-1.5 hover:shadow-md transition-shadow">
        <Menu size={16} />
        {user ? (
          <span className="w-8 h-8 rounded-full bg-ink text-white grid place-items-center text-sm font-semibold">
            {name.charAt(0).toUpperCase()}
          </span>
        ) : <UserCircle2 size={30} className="text-muted" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.15)] py-2 z-50">
          {user ? (
            <>
              <div className="px-4 py-2 text-xs text-muted truncate">Signed in as {name}</div>
              <Link to="/trips" className={`${item} font-semibold`}>Trips</Link>
              <Link to="/wishlists" className={`${item} font-semibold`}>Wishlists</Link>
              <hr className="my-2 border-gray-200" />
              <button className={item} onClick={async () => { await signOut(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login?mode=signup" className={`${item} font-semibold`}>Sign up</Link>
              <Link to="/login" className={item}>Log in</Link>
              <hr className="my-2 border-gray-200" />
              <Link to="/wishlists" className={item}>Wishlists</Link>
              <Link to="/trips" className={item}>Trips</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 xl:px-20 py-4 flex items-center gap-4 justify-between">
        <Logo />
        <div className="flex-1 flex justify-center min-w-0">
          {/* key forces the bar to re-read URL params on navigation */}
          <SearchBar key={location.search} />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
