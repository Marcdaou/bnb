export default function Footer() {
  const cols = [
    { h: 'Support', l: ['Help Center', 'Safety information', 'Cancellation options', 'Report a concern'] },
    { h: 'Hosting', l: ['Host your home', 'Hosting resources', 'Community forum', 'Responsible hosting'] },
    { h: 'Staybnb', l: ['Newsroom', 'Careers', 'Investors', 'Gift cards'] },
  ];
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div className="max-w-[1760px] mx-auto px-6 md:px-10 xl:px-20 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        {cols.map(c => (
          <div key={c.h}>
            <h3 className="font-semibold mb-3">{c.h}</h3>
            <ul className="space-y-2 text-muted">{c.l.map(x => <li key={x} className="hover:underline cursor-pointer">{x}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200">
        <div className="max-w-[1760px] mx-auto px-6 md:px-10 xl:px-20 py-6 text-sm text-muted flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Staybnb, Inc. · Privacy · Terms</span>
          <span>English (US) · $ USD</span>
        </div>
      </div>
    </footer>
  );
}
