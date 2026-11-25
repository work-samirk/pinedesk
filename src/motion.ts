import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const EASE = "expo.out";
export const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Page content settles in when the route changes. Content stays visible if scripts fail. */
export function usePageEnter(scope: RefObject<HTMLElement | null>, key: string) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-enter]", { y: 10, opacity: 0, duration: 0.42, ease: EASE, stagger: 0.035, clearProps: "transform,opacity" });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.from("[data-enter]", { opacity: 0, duration: 0.18, clearProps: "opacity" });
    });
  }, { scope, dependencies: [key], revertOnUpdate: true });
}

/** Bars grow from their baseline, lines draw, once per mount. The signature moment of the dashboards. */
export function useChartIn(scope: RefObject<SVGSVGElement | HTMLDivElement | null>, dep: unknown) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-bar]", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, ease: EASE, stagger: { each: 0.012, from: "start" } });
      gsap.from("[data-hbar]", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.7, ease: EASE, stagger: 0.04 });
      scope.current?.querySelectorAll<SVGPathElement | SVGPolylineElement>("[data-line]").forEach((el) => {
        const len = (el as SVGGeometryElement).getTotalLength?.() ?? 0;
        if (!len) return;
        gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out", clearProps: "strokeDasharray,strokeDashoffset" });
      });
    });
  }, { scope, dependencies: [dep], revertOnUpdate: true });
}

/** Slide-over panel: enters from the right, the backdrop fades. Returns a close() that plays the exit first. */
export function useSheet(open: boolean, panel: RefObject<HTMLElement | null>, backdrop: RefObject<HTMLElement | null>, onClosed: () => void) {
  const closing = useRef(false);
  useEffect(() => {
    if (!open || !panel.current) return;
    closing.current = false;
    if (reduced()) { gsap.fromTo(panel.current, { opacity: 0 }, { opacity: 1, duration: 0.15 }); return; }
    gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
    gsap.fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: EASE });
  }, [open, panel, backdrop]);
  return () => {
    if (closing.current) return;
    closing.current = true;
    if (!panel.current || reduced()) { onClosed(); return; }
    gsap.to(backdrop.current, { opacity: 0, duration: 0.2 });
    gsap.to(panel.current, { xPercent: 100, duration: 0.28, ease: "power3.in", onComplete: onClosed });
  };
}

/** Sidebar width change between full and icon rail. */
export function animateRail(el: HTMLElement | null, collapsed: boolean) {
  if (!el) return;
  const w = collapsed ? 76 : 236;
  if (reduced()) { gsap.set(el, { width: w }); return; }
  gsap.to(el, { width: w, duration: 0.42, ease: EASE });
  gsap.fromTo(el.querySelectorAll("[data-label]"), { opacity: 0 }, { opacity: 1, duration: 0.3, delay: collapsed ? 0 : 0.12 });
}
