import { useSearchParams } from 'react-router-dom';
import { Waves, TreePine, Building2, Wheat, WavesLadder, Mountain, Sailboat, Palmtree, LayoutGrid, type LucideIcon } from 'lucide-react';
import { CATEGORIES, type Category } from '../types/db';

const ICONS: Record<Category, LucideIcon> = {
  Beach: Waves, Cabins: TreePine, City: Building2, Countryside: Wheat,
  Pools: WavesLadder, Mountains: Mountain, Lakefront: Sailboat, Tropical: Palmtree,
};

export default function CategoryBar() {
  const [params, setParams] = useSearchParams();
  const active = params.get('category');

  const select = (c: string | null) => {
    const next = new URLSearchParams(params);
    if (c) next.set('category', c); else next.delete('category');
    setParams(next);
  };

  const btn = (key: string, label: string, Icon: LucideIcon, on: boolean, onClick: () => void) => (
    <button key={key} onClick={onClick} aria-pressed={on}
      className={`flex flex-col items-center gap-2 pb-3 pt-1 border-b-2 shrink-0 transition-colors ${
        on ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink hover:border-gray-300'}`}>
      <Icon size={24} strokeWidth={1.6} />
      <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="sticky top-[81px] z-30 bg-white">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 xl:px-20 pt-4 flex gap-8 sm:gap-10 overflow-x-auto no-scrollbar">
        {btn('all', 'All', LayoutGrid, !active, () => select(null))}
        {CATEGORIES.map(c => btn(c, c, ICONS[c], active === c, () => select(c)))}
      </div>
    </div>
  );
}
