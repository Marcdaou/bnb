import { CalendarDays } from 'lucide-react';

export default function DatePrompt() {
  return (
    <div role="status" className="flex items-center gap-3 mb-6 px-4 py-3 bg-orange-50 border border-orange-300 rounded-xl text-sm">
      <CalendarDays size={20} className="text-orange-600 shrink-0" />
      <span>Pick both dates to check availability</span>
    </div>
  );
}
