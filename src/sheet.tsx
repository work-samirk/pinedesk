import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSheet } from "./motion";
import { Icon } from "./ui";
import lbDark from "./assets/landbank-dark.svg";
import lbLight from "./assets/landbank-light.svg";
import plDark from "./assets/pinelabs-dark.svg";
import plLight from "./assets/pinelabs-light.svg";

/** A panel that slides in from the right. Esc and the backdrop close it. */
export function Sheet({ title, sub, onClose, children, footer, width = 520 }: { title: string; sub?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  const panel = useRef<HTMLDivElement | null>(null);
  const back = useRef<HTMLDivElement | null>(null);
  const close = useSheet(true, panel, back, onClose);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeRef.current(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", k);
    const app = document.querySelector<HTMLElement>(".app");
    app?.setAttribute("inert", "");
    const prev = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => (panel.current?.querySelector<HTMLElement>(".sheet-body input, .sheet-body select, .sheet-body textarea, .sheet-body button") ?? panel.current?.querySelector<HTMLElement>("button"))?.focus({ preventScroll: true }), 120);
    return () => { window.clearTimeout(t); document.removeEventListener("keydown", k); app?.removeAttribute("inert"); prev?.focus?.(); };
  }, []);
  return createPortal(
    <div className="sheet-wrap">
      <div className="sheet-back" ref={back} onClick={() => close()} />
      <div className="sheet" ref={panel} role="dialog" aria-modal="true" aria-label={title} style={{ width: `min(${width}px, 100vw)` }}>
        <header><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div><button className="icb" aria-label="Close" onClick={() => close()}><Icon n="x" s={18} /></button></header>
        <div className="sheet-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export const LOGOS = { lbDark, lbLight, plDark, plLight };
