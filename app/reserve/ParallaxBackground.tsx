"use client";
import { useEffect, useRef } from "react";

// Fraction of the remaining gap closed per frame (0–1).
// Lower = lazier/slower drift. Higher = snappier.
const PARALLAX_SPEED = 0.01;

interface Props {
  src?: string;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
}

export default function ParallaxBackground({
  src = "/bg-form.png",
  className = "absolute",
  style = { inset: "-16px", filter: "blur(8px)" },
  "aria-hidden": ariaHidden,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let current = 0;
    let target = 0;
    let rafId: number;

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      target = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    const tick = () => {
      current += (target - current) * PARALLAX_SPEED;
      el.style.backgroundPositionY = `${current * 100}%`;
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden={ariaHidden}
      className={className}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPositionX: "center",
        backgroundPositionY: "0%",
        ...style,
      }}
    />
  );
}
