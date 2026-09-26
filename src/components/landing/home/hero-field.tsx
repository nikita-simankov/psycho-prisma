"use client";

import { cn } from "@/utils/utils";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FieldRenderer } from "./field-renderer";

// The hero's ridgeline. The posters (public/landing/field-light.png and field-dark.png) are captures
// of this canvas in each theme, so they are original to the site. A poster is the complete picture on its
// own: it shows without JavaScript, under reduced motion, and when WebGL fails. While the landing's
// motion runs, CSS hides it and the live canvas draws the rows rising instead.
export function HeroField({ caption, className }: { caption: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: FieldRenderer | null = null;
    let cancelled = false;
    let themeObserver: MutationObserver | undefined;
    let tween: { kill(): void } | undefined;

    async function mount(canvas: HTMLCanvasElement) {
      const modules = await Promise.all([import("./field-renderer"), import("gsap")]).catch(() => null);
      if (cancelled) return;
      if (!modules) return setFallback(true);
      const [{ createFieldRenderer }, { gsap }] = modules;
      renderer = createFieldRenderer(canvas, { onFail: () => setFallback(true) });
      if (!renderer) return setFallback(true);
      const reveal = { value: 0 };
      tween = gsap.to(reveal, {
        value: 1,
        duration: 2.6,
        delay: 0.2,
        ease: "power3.out",
        onUpdate: () => renderer?.setReveal(reveal.value),
      });
      // Line colours follow the theme toggle.
      themeObserver = new MutationObserver(() => renderer?.setColors());
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }
    mount(canvas);

    return () => {
      cancelled = true;
      tween?.kill();
      themeObserver?.disconnect();
      renderer?.destroy();
    };
  }, []);

  return (
    <figure className={cn("pointer-events-none flex flex-col", className)}>
      <div className="relative min-h-0 flex-1">
        <div data-hero-poster data-fallback={fallback || undefined} className="absolute inset-0 transition-opacity duration-700">
          <Image src="/landing/field-light.png" alt="" fill sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover object-bottom dark:hidden" />
          <Image src="/landing/field-dark.png" alt="" fill sizes="(min-width: 1024px) 62vw, 100vw" className="hidden object-cover object-bottom dark:block" />
        </div>
        <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 size-full", fallback && "hidden")} />
      </div>
      <figcaption className="max-w-xs self-end px-4 pb-4 text-right font-mono text-[0.6875rem] leading-relaxed text-muted-foreground sm:px-8">
        {caption}
      </figcaption>
    </figure>
  );
}
