import { useEffect, useState } from 'react';
import { Grid3x3, X } from 'lucide-react';
import type { ListingImage } from '../../types/db';

export default function PhotoGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const [open, setOpen] = useState(false);
  const imgs = [...images].sort((a, b) => a.position - b.position);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open]);
  if (!imgs.length) return <div className="aspect-[2/1] rounded-2xl bg-gray-100" />;

  return (
    <>
      <div className="relative grid h-[300px] grid-cols-1 gap-2 overflow-hidden rounded-2xl md:h-[440px] md:grid-cols-4 md:grid-rows-2">
        {imgs.slice(0, 5).map((img, i) => (
          <button key={img.id} onClick={() => setOpen(true)}
            className={`group overflow-hidden bg-gray-100 ${i === 0 ? 'md:col-span-2 md:row-span-2' : 'hidden md:block'}`}>
            <img src={img.url} alt={`${title} photo ${i + 1}`} className="h-full w-full object-cover transition duration-300 group-hover:brightness-90" />
          </button>
        ))}
        <button onClick={() => setOpen(true)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-gray-900 bg-white px-3 py-1.5 text-sm font-semibold shadow hover:bg-gray-50">
          <Grid3x3 className="h-4 w-4" /> Show all photos
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <div className="sticky top-0 flex items-center justify-between bg-white/95 px-6 py-4 backdrop-blur">
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            <p className="text-sm font-semibold">{imgs.length} photos</p><span className="w-9" />
          </div>
          <div className="mx-auto max-w-3xl space-y-3 px-4 pb-12">
            {imgs.map((img, i) => <img key={img.id} src={img.url} alt={`${title} photo ${i + 1}`} className="w-full rounded-lg" />)}
          </div>
        </div>
      )}
    </>
  );
}
