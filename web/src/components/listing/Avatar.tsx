export default function Avatar({ src, name, size = 48 }: { src: string | null; name: string; size?: number }) {
  const style = { width: size, height: size };
  return src ? (
    <img src={src} alt={name} style={style} className="shrink-0 rounded-full object-cover" />
  ) : (
    <div style={style} className="flex shrink-0 items-center justify-center rounded-full bg-gray-800 font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
