"use client";

import { cn } from "@/utils/utils";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FieldRenderer } from "./field-renderer";

// The hero's ridgeline. It renders two things: a figure whose "slot" sits in the hero's layout and
// says where the field goes on this screen size, and a canvas that covers the whole hero,
// behind its text, and draws the field into the slot. The hero must be `relative isolate`, and
// nothing between it and this component may be positioned.
//
// The posters (public/landing/field-*.png) are captures of this canvas, so they are original to
// the site. A poster is the complete picture on its own: it shows without JavaScript, under reduced
// motion, and when WebGL fails, and it only hides once the live canvas has drawn its first frame.
export function HeroField({ caption, hint, className }: { caption: string; hint: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"poster" | "live" | "fallback">("poster");

  useEffect(() => {
    const canvas = canvasRef.current;
    const slot = slotRef.current;
    const surface = slot?.closest<HTMLElement>("[data-hero]");
    if (!canvas || !slot || !surface || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: FieldRenderer | null = null;
    let cancelled = false;
    let themeObserver: MutationObserver | undefined;
    let tween: { kill(): void } | undefined;
    let trigger: { kill(): void } | undefined;

    async function mount(canvas: HTMLCanvasElement, slot: HTMLElement, surface: HTMLElement) {
      const modules = await Promise.all([import("./field-renderer"), import("gsap"), import("gsap/ScrollTrigger")]).catch(() => null);
      if (cancelled) return;
      if (!modules) return setState("fallback");
      const [{ createFieldRenderer }, { gsap }, { ScrollTrigger }] = modules;
      gsap.registerPlugin(ScrollTrigger);
      renderer = createFieldRenderer(canvas, {
        slot,
        surface,
        onReady: () => setState("live"),
        onFail: () => setState("fallback"),
      });
      if (!renderer) return setState("fallback");
      const reveal = { value: 0 };
      tween = gsap.to(reveal, {
        value: 1,
        duration: 2.8,
        delay: 0.15,
        ease: "power3.out",
        onUpdate: () => renderer?.setReveal(reveal.value),
      });
      // Scrolling past the hero settles the crowd until only the person's line stands.
      trigger = ScrollTrigger.create({
        trigger: surface,
        start: "top top",
        end: "bottom top",
        onUpdate: ({ progress }) => renderer?.setSettle(progress),
      });
      // Line colours follow the theme toggle.
      themeObserver = new MutationObserver(() => renderer?.setColors());
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }
    mount(canvas, slot, surface);

    return () => {
      cancelled = true;
      tween?.kill();
      trigger?.kill();
      themeObserver?.disconnect();
      renderer?.destroy();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 -z-10 size-full", state === "fallback" && "hidden")}
      />
      <figure className={cn("pointer-events-none flex flex-col gap-3", className)}>
        <div ref={slotRef} data-field-slot className="relative -z-10 min-h-0 flex-1">
          <div data-hero-poster className={cn("absolute inset-0 transition-opacity duration-1000", state === "live" && "opacity-0")}>
            <Image src="/landing/field-light.png" alt="" fill loading="eager" sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain object-bottom dark:hidden" />
            <Image src="/landing/field-dark.png" alt="" fill loading="eager" sizes="(min-width: 1024px) 60vw, 100vw" className="hidden object-contain object-bottom dark:block" />
          </div>
        </div>
        <p aria-hidden className="-mt-1 px-4 font-mono sm:px-8 text-[0.625rem] uppercase tracking-[0.1em] text-muted-foreground lg:hidden">
          {hint}
        </p>
        <figcaption className="max-w-[20rem] self-end px-4 sm:px-8 lg:px-0 text-right font-mono text-[0.625rem] leading-relaxed text-muted-foreground sm:max-w-xs sm:text-[0.6875rem]">
          {caption}
        </figcaption>
      </figure>
    </>
  );
}
