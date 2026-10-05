"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "aelyxye_visited";
const MIN_MS = 3000;

export default function FirstVisitLoader() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setMounted(false);
      return;
    }
    const id = setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setFading(true);
    }, MIN_MS);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;

  return (
    <div
      onTransitionEnd={() => setMounted(false)}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b060b] font-(family-name:--font-cinzel) text-amber-100 transition-opacity duration-1000"
      style={{ opacity: fading ? 0 : 1 }}
    >
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
