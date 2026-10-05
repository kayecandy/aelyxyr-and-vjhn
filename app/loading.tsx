export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b060b] font-(family-name:--font-cinzel) text-amber-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/loading-fairy4.webp"
        alt=""
        aria-hidden
        width={500}
        height={500}
      />
      <p className="mt-4 text-[10px] tracking-[0.4em] text-amber-300/70">
        SUMMONING THE MIRACLE…
      </p>
    </div>
  );
}
