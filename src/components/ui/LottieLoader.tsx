"use client";

import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";

// Inline animation data — radar pulse (no external file needed)
const RADAR_ANIMATION = {
  v: "5.7.1", fr: 30, ip: 0, op: 60, w: 200, h: 200,
  layers: [{
    ty: 4, nm: "pulse", sr: 1, ks: {
      o: { a: 1, k: [{ t: 0, s: [100] }, { t: 60, s: [0] }] },
      s: { a: 1, k: [{ t: 0, s: [30, 30, 100] }, { t: 60, s: [100, 100, 100] }] },
      p: { a: 0, k: [100, 100, 0] }, r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0, 0] },
    },
    shapes: [{
      ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [160, 160] },
    }, {
      ty: "st", c: { a: 0, k: [0, 0.898, 1, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 },
    }],
    ip: 0, op: 60, st: 0,
  }, {
    ty: 4, nm: "pulse2", sr: 1, ks: {
      o: { a: 1, k: [{ t: 15, s: [100] }, { t: 60, s: [0] }] },
      s: { a: 1, k: [{ t: 15, s: [30, 30, 100] }, { t: 60, s: [100, 100, 100] }] },
      p: { a: 0, k: [100, 100, 0] }, r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0, 0] },
    },
    shapes: [{
      ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [160, 160] },
    }, {
      ty: "st", c: { a: 0, k: [0, 0.898, 1, 1] }, o: { a: 0, k: 60 }, w: { a: 0, k: 1.5 },
    }],
    ip: 0, op: 60, st: 0,
  }, {
    ty: 4, nm: "center", sr: 1, ks: {
      o: { a: 0, k: 100 },
      s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 30, s: [120, 120, 100] }, { t: 60, s: [100, 100, 100] }] },
      p: { a: 0, k: [100, 100, 0] }, r: { a: 0, k: 0 }, a: { a: 0, k: [0, 0, 0] },
    },
    shapes: [{
      ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [16, 16] },
    }, {
      ty: "fl", c: { a: 0, k: [0, 0.898, 1, 1] }, o: { a: 0, k: 100 },
    }],
    ip: 0, op: 60, st: 0,
  }],
};

type LoaderVariant = "radar" | "globe" | "signal";

interface LottieLoaderProps {
  variant?: LoaderVariant;
  size?: number;
  label?: string;
  className?: string;
}

export function LottieLoader({ variant = "radar", size = 64, label, className = "" }: LottieLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // All variants use the same radar animation with different speed
    const speed = variant === "globe" ? 0.7 : variant === "signal" ? 1.5 : 1;

    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: RADAR_ANIMATION,
    });
    animRef.current.setSpeed(speed);

    return () => {
      animRef.current?.destroy();
    };
  }, [variant]);

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div ref={containerRef} style={{ width: size, height: size }} />
      {label && (
        <span className="font-mono text-[9px] text-hud-muted animate-pulse uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
