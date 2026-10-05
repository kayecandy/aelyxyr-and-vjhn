"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Item = { src: string; alt: string };

export default function FeaturedItems({ items }: { items: Item[] }) {
  const [active, setActive] = useState<Item | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(item)}
            className="block cursor-zoom-in transition hover:brightness-110 active:scale-[0.98]"
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={768}
              height={1152}
              className="h-auto w-full rounded"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 text-3xl text-amber-300"
            onClick={() => setActive(null)}
          >
            &times;
          </button>
          <Image
            src={active.src}
            alt={active.alt}
            width={768}
            height={1152}
            className="max-h-full w-auto max-w-full rounded object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
