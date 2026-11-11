import { Wifi, Car, Waves, Utensils, Tv, Wind, Flame, WashingMachine, Dumbbell, Coffee, Mountain, Sun, Bath, Laptop, PawPrint, Snowflake, Check, type LucideIcon } from 'lucide-react';

const MAP: [RegExp, LucideIcon][] = [
  [/wifi|internet/i, Wifi], [/parking|garage/i, Car], [/pool|beach|lake|ocean|water/i, Waves],
  [/kitchen/i, Utensils], [/tv/i, Tv], [/air|ac\b/i, Snowflake], [/fan/i, Wind], [/fire|heat|bbq|grill/i, Flame],
  [/wash|dryer|laundry/i, WashingMachine], [/gym|fitness/i, Dumbbell], [/coffee|espresso/i, Coffee],
  [/view|mountain/i, Mountain], [/patio|balcony|terrace|garden/i, Sun], [/tub|sauna|bath/i, Bath],
  [/workspace|desk/i, Laptop], [/pet/i, PawPrint],
];
const iconFor = (a: string) => MAP.find(([re]) => re.test(a))?.[1] ?? Check;

export default function Amenities({ amenities }: { amenities: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {amenities.map((a) => { const Icon = iconFor(a); return (
        <div key={a} className="flex items-center gap-4 text-gray-800"><Icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />{a}</div>
      ); })}
    </div>
  );
}
