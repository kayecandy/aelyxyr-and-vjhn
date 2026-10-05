"use client";
import { useEffect, useRef } from "react";

interface Props {
  // What fraction of normal scroll speed the panel moves at (0 = fixed, 1 = same as content).
  scrollFactor?: number;
  // Lerp smoothing — lower = lazier drift.
  lerpSpeed?: number;
}

export default function ParallaxFormPanel({ scrollFactor = 0.55, lerpSpeed = 0.06 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let current = 0;
    let target = 0;
    let rafId: number;

    const onScroll = () => { target = window.scrollY; };

    const tick = () => {
      current += (target - current) * lerpSpeed;
      // translateX(-50%) centers the fixed element; translateY controls scroll parallax.
      el.style.transform = `translateX(-50%) translateY(${-current * scrollFactor}px)`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [scrollFactor, lerpSpeed]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed left-1/2 top-0 w-3/5 bg-cover bg-top"
      style={{
        transform: "translateX(-50%)",
        aspectRatio: "2 / 3",
        backgroundImage: "url(/bg-form.png)",
        zIndex: 1,
      }}
    />
  );
}
