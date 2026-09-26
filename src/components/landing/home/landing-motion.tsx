"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useLayoutEffect, useRef } from "react";

// Motion for the landing page: Lenis smooth scrolling driven by GSAP's ticker, the hero's intro
// and the scroll choreography, all keyed off data attributes in the server-rendered markup. The
// markup is complete without it. Under reduced motion nothing here runs, so every section shows
// its final state and scrolling stays native.
//
// html[data-lp-motion] coordinates with CSS in globals.css: "pending" (set by an inline script
// before first paint) hides the hero's words until the intro plays, with a CSS failsafe that shows
// them anyway if this component never loads; "ready" means this component owns the animation.

const DESKTOP = "(min-width: 1024px)";
// Blocks are revealed by unclipping rather than fading: text is never drawn at partial opacity,
// so its contrast holds at every frame.
const HIDDEN = "inset(0% 0% 100% 0%)";
const SHOWN = "inset(0% 0% 0% 0%)";

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      delete html.dataset.lpMotion;
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ autoRaf: false, lerp: 0.11 });
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Hand the hero over from the CSS hold to GSAP before any tween reads its natural state.
    html.dataset.lpMotion = "ready";
    let media: gsap.MatchMedia | undefined;
    const context = gsap.context(() => {
      const scope = root.current!;
      const all = <T extends Element = HTMLElement>(selector: string, within: Element = scope) =>
        gsap.utils.toArray<T>(within.querySelectorAll(selector));

      // Hero: the masthead settles, the title rises word by word, then the lead and actions.
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .fromTo(all("[data-hero-fade='top']"), { y: -12, clipPath: HIDDEN }, { y: 0, clipPath: SHOWN, clearProps: "clipPath", duration: 0.8 })
        .from(all("[data-hero-word] > [data-word]"), { yPercent: 115, duration: 1.2, stagger: 0.07 }, 0.1)
        .fromTo(
          all("[data-hero-fade='bottom']"),
          { y: 24, clipPath: HIDDEN },
          { y: 0, clipPath: SHOWN, clearProps: "clipPath", duration: 1, stagger: 0.1 },
          0.55,
        );

      // Section headings: words rise as they enter.
      for (const heading of all("[data-split]")) {
        gsap.from(all("[data-word]", heading), {
          yPercent: 115,
          duration: 1,
          ease: "expo.out",
          stagger: 0.045,
          scrollTrigger: { trigger: heading, start: "top 88%", once: true },
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
          scrollTrigger: { trigger: block, start: "top 90%", once: true },
        });
      }

      // Manifesto: words darken from muted to full ink as the paragraph scrolls through.
      const manifesto = scope.querySelector<HTMLElement>("[data-manifesto]");
      if (manifesto) {
        const words = all("[data-manifesto] > span");
        ScrollTrigger.create({
          trigger: manifesto,
          start: "top 75%",
          end: "bottom 45%",
          onUpdate: ({ progress }) => {
            const lit = Math.round(progress * words.length);
            words.forEach((word, index) => word.classList.toggle("is-lit", index < lit));
          },
        });
      }

      // Facts: numerals count up once.
      for (const numeral of all("[data-count]")) {
        const value = Number(numeral.dataset.count);
        const counter = { value: 0 };
        numeral.textContent = "0";
        gsap.to(counter, {
          value,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: numeral, start: "top 88%", once: true },
          onUpdate: () => {
            numeral.textContent = String(Math.round(counter.value));
          },
        });
      }

      media = gsap.matchMedia();
      media.add(DESKTOP, () => {
        // Specimen: pinned while each scale's score sweeps to its sten and the notes take turns.
        const specimen = scope.querySelector<HTMLElement>("[data-specimen]");
        if (specimen) {
          const rows = all("[data-scale]", specimen);
          const notes = all("[data-note]", specimen);
          const readouts = all("[data-readout]", specimen);
          const paint = (progress: number) => {
            rows.forEach((row, index) => {
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
          specimen.setAttribute("data-animated", "");
          paint(0);
          ScrollTrigger.create({
            trigger: specimen,
            start: "top top+=64",
            end: "+=140%",
            pin: true,
            scrub: true,
            onUpdate: ({ progress }) => paint(progress),
          });
          return () => {
            specimen.removeAttribute("data-animated");
            paint(1);
          };
        }
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
    }, root);

    // Measurements change once the web fonts and images arrive.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      media?.revert();
      context.revert();
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      delete html.dataset.lpMotion;
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
