"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useLayoutEffect, useRef } from "react";

// Motion for the landing page: Lenis smooth scrolling driven by GSAP's ticker, the hero's intro
// and the scroll choreography, all keyed off data attributes in the server-rendered markup. The
// markup is complete without it. Under reduced motion nothing here runs, so every section shows
// its final state and scrolling stays native. Everything runs on phones as well; only the two
// pinned sequences are wide-screen only, and phones get their own version of each.
//
// html[data-lp-motion] coordinates with CSS in globals.css: "pending" (set by an inline script
// before first paint) hides the hero's words until the intro plays, with a CSS failsafe that shows
// them anyway if this component never loads; "ready" means this component owns the animation.

const DESKTOP = "(min-width: 1024px)";
const MOBILE = "(max-width: 1023px)";
// Blocks are revealed by unclipping rather than fading: text is never drawn at partial opacity,
// so its contrast holds at every frame.
const HIDDEN = "inset(0% 0% 100% 0%)";
const SHOWN = "inset(0% 0% 0% 0%)";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      delete html.dataset.lpMotion;
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Lenis smooths wheel scrolling only; touch keeps the platform's native scrolling.
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Hand the hero over from the CSS hold to GSAP before any tween reads its natural state.
    html.dataset.lpMotion = "ready";
    const cleanups: (() => void)[] = [];
    let media: gsap.MatchMedia | undefined;
    const context = gsap.context(() => {
      const scope = root.current!;
      const all = <T extends Element = HTMLElement>(selector: string, within: Element = scope) =>
        gsap.utils.toArray<T>(within.querySelectorAll(selector));

      // Hero: the masthead settles, the title's letters rise, then the lead and actions.
      const title = scope.querySelector<HTMLElement>("[data-hero-title]");
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .fromTo(all("[data-hero-fade='top']"), { y: -12, clipPath: HIDDEN }, { y: 0, clipPath: SHOWN, clearProps: "clipPath", duration: 0.8 })
        .from(all("[data-mask] [data-char], [data-rotator-item]:first-child [data-char]", title ?? scope), {
          yPercent: 120,
          rotate: 6,
          duration: 1.3,
          stagger: 0.022,
        }, 0.1)
        .fromTo(
          all("[data-hero-fade='bottom']"),
          { y: 24, clipPath: HIDDEN },
          { y: 0, clipPath: SHOWN, clearProps: "clipPath", duration: 1, stagger: 0.1 },
          0.6,
        );

      // The emphasised word cycles through its alternates, letters out and in.
      const items = title ? all("[data-rotator-item]", title) : [];
      if (items.length > 1) {
        items.forEach((item, index) => {
          if (index > 0) gsap.set(all("[data-char]", item), { yPercent: 120 });
          gsap.set(item, { visibility: "visible" });
        });
        const cycle = gsap.timeline({ repeat: -1, delay: 3.2 });
        items.forEach((item, index) => {
          const next = items[(index + 1) % items.length];
          cycle
            .to(all("[data-char]", item), { yPercent: -120, duration: 0.7, ease: "expo.in", stagger: 0.03 }, "+=2.6")
            .fromTo(all("[data-char]", next), { yPercent: 120 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.03 }, "-=0.25");
        });
      }

      // As the hero scrolls away its title drifts up a little faster than the page.
      const hero = scope.querySelector<HTMLElement>("[data-hero]");
      if (hero) {
        gsap.to(all("[data-hero-parallax]"), {
          yPercent: -18,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
        });
      }

      // Reading progress: a hairline across the top of the window.
      if (progress.current) {
        gsap.fromTo(progress.current, { scaleX: 0 }, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: scope, start: "top top", end: "bottom bottom", scrub: 0.3 },
        });
      }

      // The site header steps aside while reading down and returns on the way up.
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const hide = self.direction === 1 && self.scroll() > window.innerHeight * 0.6;
          if (hide) html.dataset.lpHeader = "hidden";
          else delete html.dataset.lpHeader;
        },
      });
      cleanups.push(() => delete html.dataset.lpHeader);

      // Section headings: words, or letters, rise as they enter.
      for (const heading of all("[data-split]")) {
        const chars = heading.dataset.split === "chars";
        gsap.from(all(chars ? "[data-char]" : "[data-word]", heading), {
          yPercent: 120,
          rotate: chars ? 8 : 3,
          duration: chars ? 1.2 : 1.1,
          ease: "expo.out",
          stagger: chars ? 0.018 : 0.05,
          scrollTrigger: { trigger: heading, start: "top 88%", once: true },
        });
      }

      // Section labels read in: their letters shuffle before settling.
      for (const label of all("[data-scramble]")) {
        const text = label.textContent ?? "";
        const state = { progress: 0 };
        gsap.to(state, {
          progress: 1,
          duration: 0.9,
          ease: "none",
          scrollTrigger: { trigger: label, start: "top 92%", once: true },
          onStart: () => label.style.setProperty("min-width", `${label.offsetWidth}px`),
          onUpdate: () => {
            const settled = Math.floor(state.progress * text.length);
            label.textContent = Array.from(text, (char, index) =>
              index < settled || char === " " ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            ).join("");
          },
          onComplete: () => {
            label.textContent = text;
            label.style.removeProperty("min-width");
          },
        });
      }

      // Supporting copy and media follow their heading.
      for (const block of all("[data-reveal]")) {
        gsap.fromTo(block, { y: 28, clipPath: HIDDEN }, {
          y: 0,
          clipPath: SHOWN,
          clearProps: "clipPath",
          duration: 1,
          ease: "power3.out",
          delay: Number(block.dataset.reveal || 0),
          scrollTrigger: { trigger: block, start: "top 92%", once: true },
        });
      }

      // Rules draw across from the left, the page's lines echoing the hero's.
      for (const rule of all("[data-rule]")) {
        gsap.from(rule, {
          scaleX: 0,
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: rule, start: "top 94%", once: true },
        });
      }

      // Manifesto: words light up from muted to full ink as the paragraph scrolls through.
      const manifesto = scope.querySelector<HTMLElement>("[data-manifesto]");
      if (manifesto) {
        const words = all("[data-manifesto] > span");
        ScrollTrigger.create({
          trigger: manifesto,
          start: "top 80%",
          end: "bottom 50%",
          onUpdate: ({ progress }) => {
            const lit = Math.round(progress * words.length);
            words.forEach((word, index) => word.classList.toggle("is-lit", index < lit));
          },
        });
      }

      // Marquee: each row drifts on its own and speeds up with the scroll, in the scroll's direction.
      const rows = all("[data-marquee]");
      if (rows.length) {
        const loops = rows.map((row) => {
          const direction = Number(row.dataset.marquee);
          return gsap.fromTo(
            row,
            { xPercent: direction > 0 ? 0 : -50 },
            { xPercent: direction > 0 ? -50 : 0, duration: 38, ease: "none", repeat: -1, paused: true },
          );
        });
        let boost = 1;
        ScrollTrigger.create({
          trigger: rows[0].parentElement,
          start: "top bottom",
          end: "bottom top",
          onToggle: ({ isActive }) => loops.forEach((loop) => (isActive ? loop.resume() : loop.pause())),
          onUpdate: (self) => {
            const velocity = gsap.utils.clamp(-6, 6, self.getVelocity() / 300);
            boost = velocity === 0 ? boost : velocity;
          },
        });
        const settle = () => {
          boost += ((boost < 0 ? -1 : 1) - boost) * 0.06;
          loops.forEach((loop) => loop.timeScale(boost));
        };
        gsap.ticker.add(settle);
        cleanups.push(() => gsap.ticker.remove(settle));
      }

      // Facts: numerals count up once.
      for (const numeral of all("[data-count]")) {
        const value = Number(numeral.dataset.count);
        const counter = { value: 0 };
        numeral.textContent = "0";
        gsap.to(counter, {
          value,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: { trigger: numeral, start: "top 90%", once: true },
          onUpdate: () => {
            numeral.textContent = String(Math.round(counter.value));
          },
        });
      }

      // Closing figure: the team's curves draw, then the person's score rises within them.
      const curve = scope.querySelector<HTMLElement>("[data-curve]");
      if (curve) {
        const lines = all<SVGGeometryElement>("[data-curve-line]", curve);
        const tick = curve.querySelector("[data-curve-tick]");
        gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 });
        if (tick) gsap.set(tick, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap
          .timeline({ scrollTrigger: { trigger: curve, start: "top 85%", end: "bottom 55%", scrub: 0.6 } })
          .to(lines, { strokeDashoffset: 0, ease: "none", stagger: 0.15 })
          .to(tick, { strokeDashoffset: 0, ease: "none", duration: 0.35 });
      }

      // Specimen: each scale's score sweeps to its sten and the notes take turns. Pinned on wide
      // screens; on phones it plays as the figure scrolls through the window.
      const specimen = scope.querySelector<HTMLElement>("[data-specimen]");
      const paintSpecimen = (() => {
        if (!specimen) return () => {};
        const scales = all("[data-scale]", specimen);
        const notes = all("[data-note]", specimen);
        const readouts = all("[data-readout]", specimen);
        return (progress: number) => {
          scales.forEach((row, index) => {
            const value = Number(row.dataset.scale);
            // Each row starts a little after the one above it.
            const local = gsap.utils.clamp(0, 1, (progress - index * 0.1) / 0.55);
            const current = Math.max(1, Math.round(local * value));
            row.querySelectorAll<HTMLElement>("[data-cell]").forEach((cell) => {
              const step = Number(cell.dataset.cell);
              cell.toggleAttribute("data-on", step === current);
              cell.toggleAttribute("data-trail", step < current);
            });
            if (readouts[index]) readouts[index].textContent = String(current);
          });
          const active = Math.min(notes.length - 1, Math.floor(progress * notes.length));
          notes.forEach((note, index) => note.toggleAttribute("data-active", index === active));
        };
      })();

      media = gsap.matchMedia();
      media.add(DESKTOP, () => {
        if (!specimen) return;
        specimen.setAttribute("data-animated", "");
        paintSpecimen(0);
        ScrollTrigger.create({
          trigger: specimen,
          start: "top top+=64",
          end: "+=140%",
          pin: true,
          scrub: true,
          onUpdate: ({ progress }) => paintSpecimen(progress),
        });
        return () => {
          specimen.removeAttribute("data-animated");
          paintSpecimen(1);
        };
      });
      media.add(MOBILE, () => {
        const figure = specimen?.querySelector<HTMLElement>("[data-specimen-figure]");
        if (!specimen || !figure) return;
        specimen.setAttribute("data-animated", "");
        paintSpecimen(0);
        ScrollTrigger.create({
          trigger: figure,
          start: "top 75%",
          end: "bottom 45%",
          scrub: true,
          onUpdate: ({ progress }) => paintSpecimen(progress),
        });
        return () => {
          specimen.removeAttribute("data-animated");
          paintSpecimen(1);
        };
      });

      media.add(DESKTOP, () => {
        // Round steps: the panels travel sideways while the section is pinned.
        const track = scope.querySelector<HTMLElement>("[data-track]");
        const section = track?.closest<HTMLElement>("[data-track-section]");
        if (!track || !section) return;
        const distance = () => track.scrollWidth - track.clientWidth;
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top+=64",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      });
      media.add(MOBILE, () => {
        // Round steps: the cards stick and stack; each one sinks back as the next covers it.
        const steps = all("[data-step]");
        steps.slice(0, -1).forEach((step, index) => {
          gsap.to(step, {
            scale: 0.94,
            ease: "none",
            scrollTrigger: { trigger: steps[index + 1], start: "top bottom", end: "top top+=96", scrub: true },
          });
        });
      });
    }, root);

    // Measurements change once the web fonts and images arrive.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      cleanups.forEach((cleanup) => cleanup());
      media?.revert();
      context.revert();
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      delete html.dataset.lpMotion;
    };
  }, []);

  return (
    <div ref={root} className="overflow-x-clip">
      <div ref={progress} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-primary" />
      {children}
    </div>
  );
}
