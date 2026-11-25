import { ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Channel, TurnTone } from "./data";

export function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener("change", f);
    f();
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}

// ---------------------------------------------------------------- icons
const PATHS: Record<string, ReactNode> = {
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  approve: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  bot: <><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><path d="M8 16h.01M16 16h.01" /></>,
  sliders: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 8h6M17 16h6" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  phoneOff: <><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" /><path d="M3 3l18 18" /><path d="M5.13 5.13A19.79 19.79 0 0 0 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" /></>,
  clip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  down: <path d="m6 9 6 6 6-6" />,
  up: <path d="m18 15-6-6-6 6" />,
  left: <path d="m15 18-6-6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  more: <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />,
  sort: <><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></>,
  note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
  reply: <><path d="M9 17 4 12l5-5" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></>,
  spark: <><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  pause: <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
  play: <path d="M6 4l14 8-14 8z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4M12 17h.01" /></>,
  flag: <><path d="M4 2h2v20H4z" /><path d="M6 4h12l-3 4.5L18 13H6z" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  pin: <><path d="M12 17v5" /><path d="M9 3h6l-1 7 3 3v2H7v-2l3-3z" /></>,
  star: <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  menu: <><path d="M3 12h18M3 6h18M3 18h18" /></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /></>,
  volume: <><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>,
  home: <><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" /></>,
  pulse: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  plug: <><path d="M9 2v6M15 2v6" /><path d="M6 8h12v4a6 6 0 0 1-12 0z" /><path d="M12 18v4" /></>,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  msg: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  layers: <><path d="m12 2 10 5-10 5L2 7z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></>,
};
export function Icon({ n, s = 18, className = "" }: { n: keyof typeof PATHS | string; s?: number; className?: string }) {
  return (
    <svg className={`i ${className}`} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[n]}
    </svg>
  );
}

// ---------------------------------------------------------------- channel marks
export function Chan({ c, s = 20, ring = false }: { c: Channel; s?: number; ring?: boolean }) {
  const common = { width: s, height: s, viewBox: "0 0 24 24", "aria-hidden": true, className: `ch${ring ? " ring" : ""}` } as const;
  switch (c) {
    case "facebook": return <svg {...common}><circle cx="12" cy="12" r="12" fill="#1877f2" /><path fill="#fff" d="M13.3 19v-6.2h2.1l.4-2.6h-2.5V8.6c0-.8.3-1.3 1.4-1.3h1.2V5.2c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.8H8.7v2.6h2.1V19z" /></svg>;
    case "messenger": return <svg {...common}><circle cx="12" cy="12" r="12" fill="#0a7cff" /><path fill="#fff" d="M12 4.6c-4.1 0-7.2 3-7.2 7 0 2.1.9 3.9 2.3 5.2v2.3l2.1-1.2c.9.3 1.8.4 2.8.4 4.1 0 7.2-3 7.2-7s-3.1-6.7-7.2-6.7zm.7 8.9-1.8-1.9-3.5 1.9 3.9-4.1 1.8 1.9 3.5-1.9z" /></svg>;
    case "x": return <svg {...common}><circle cx="12" cy="12" r="12" fill="#0f1419" /><path fill="#fff" d="m13.4 11.1 4.5-5.2h-1.1l-3.9 4.5-3.1-4.5H6.2l4.7 6.9-4.7 5.4h1.1l4.1-4.7 3.3 4.7h3.6zm-1.5 1.7-.5-.7-3.8-5.4h1.6l3 4.4.5.7 4 5.7h-1.6z" /></svg>;
    case "linkedin": return <svg {...common}><circle cx="12" cy="12" r="12" fill="#0a66c2" /><path fill="#fff" d="M7.4 9.9h2.1v6.7H7.4zM8.45 6.7a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM10.9 9.9h2v.9c.3-.5 1-1.1 2-1.1 2.1 0 2.5 1.4 2.5 3.2v3.7h-2.1v-3.3c0-.8 0-1.8-1.1-1.8s-1.3.9-1.3 1.7v3.4h-2.1z" /></svg>;
    case "email": return <svg {...common}><circle cx="12" cy="12" r="12" fill="#e5eaf5" /><g fill="none" stroke="#3f4b66" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5.5" y="7.5" width="13" height="9" rx="1.6" /><path d="m6 8.5 6 4.2 6-4.2" /></g></svg>;
    case "chat": return <svg {...common}><circle cx="12" cy="12" r="12" fill="#e5eaf5" /><path fill="none" stroke="#3f4b66" strokeWidth="1.6" strokeLinejoin="round" d="M17.5 14.2a1.4 1.4 0 0 1-1.4 1.4H10l-2.6 2.2V8.4A1.4 1.4 0 0 1 8.8 7h7.3a1.4 1.4 0 0 1 1.4 1.4z" /></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="12" fill="#e5eaf5" /><path fill="none" stroke="#3f4b66" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M17.6 14.9v1.6a1.1 1.1 0 0 1-1.2 1.1 9.5 9.5 0 0 1-4.1-1.5 9.4 9.4 0 0 1-2.9-2.9 9.5 9.5 0 0 1-1.5-4.2 1.1 1.1 0 0 1 1.1-1.2h1.6a1.1 1.1 0 0 1 1.1.9c.1.5.2.9.4 1.3a1.1 1.1 0 0 1-.2 1.1l-.7.7a8.8 8.8 0 0 0 2.9 2.9l.7-.7a1.1 1.1 0 0 1 1.1-.2c.4.2.9.3 1.3.4a1.1 1.1 0 0 1 .9 1.1z" /></svg>;
  }
}

// ---------------------------------------------------------------- avatar and small parts
const HUES: [string, string][] = [["#fde8d8", "#9a3d0a"], ["#e0ecff", "#1e48c8"], ["#dff5ec", "#0d6b47"], ["#fdeaf1", "#9d1d52"], ["#e9e7fb", "#3a2f9b"], ["#e0f1f7", "#0e5f7a"], ["#f1e8fb", "#5b2a8c"], ["#fff0cf", "#7a4a05"]];
export function Avatar({ name, size = 36, ai = false }: { name: string; size?: number; ai?: boolean }) {
  if (ai) return <span className="av ai" style={{ width: size, height: size }}><Icon n="spark" s={Math.round(size * 0.46)} /></span>;
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const [bg, fg] = HUES[h % HUES.length];
  const ini = name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  return <span className="av" style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.max(11, Math.round(size * 0.34)) }}>{ini}</span>;
}
export function Pill({ tone = "", children, icon }: { tone?: TurnTone | "neg" | "warn" | "pos" | "ai" | "pri" | "info" | ""; children: ReactNode; icon?: string }) {
  return <span className={`pill ${tone}`}>{icon && <Icon n={icon} s={13} />}{children}</span>;
}
export function Toast({ text }: { text: string | null }) {
  return text ? <div className="toast" role="status">{text}</div> : null;
}
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <i />
    </label>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><b>{title}</b>{children}</div>;
}

// ---------------------------------------------------------------- popover (portal, never clipped)
export function Popover({ button, children, align = "start", width }: {
  button: (p: { open: boolean; toggle: () => void; ref: RefObject<HTMLButtonElement | null> }) => ReactNode;
  children: (close: () => void) => ReactNode; align?: "start" | "end"; width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const w = width ?? 240;
    let left = align === "end" ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    setPos({ top: r.bottom + 6, left });
  }, [open, align, width]);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (box.current?.contains(e.target as Node) || ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  return (
    <>
      {button({ open, toggle: () => setOpen((o) => !o), ref })}
      {open && pos && createPortal(
        <div ref={box} className="pop" role="menu" style={{ top: pos.top, left: pos.left, width: width ?? 240 }}>{children(() => setOpen(false))}</div>,
        document.body
      )}
    </>
  );
}
export function MenuItem({ children, onClick, active, icon, danger }: { children: ReactNode; onClick: () => void; active?: boolean; icon?: string; danger?: boolean }) {
  return <button role="menuitem" className={`mi ${active ? "on" : ""} ${danger ? "danger" : ""}`} onClick={onClick}>{icon && <Icon n={icon} s={16} />}<span>{children}</span>{active && <Icon n="check" s={14} className="tick" />}</button>;
}

// ---------------------------------------------------------------- charts
export function BarList({ rows, max, target, fmt }: { rows: { label: string; value: number; risk?: boolean }[]; max: number; target?: number; fmt: (v: number) => string }) {
  return (
    <div className="barlist">
      {rows.map((r) => (
        <div className="bl" key={r.label}>
          <span>{r.label}</span>
          <span className="track">
            <i className={r.risk ? "risk" : ""} style={{ width: `${(r.value / max) * 100}%` }} />
            {target != null && <span className="target" style={{ left: `${(target / max) * 100}%` }} />}
          </span>
          <span className="v">{fmt(r.value)}</span>
        </div>
      ))}
    </div>
  );
}
export function Heat({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values);
  return (
    <div className="heat" role="img" aria-label="Cases per hour of the day">
      {values.map((v, i) => (
        <div key={i} className="hc">
          <i style={{ opacity: 0.12 + (v / max) * 0.88 }} title={`${labels[i]}: ${v} cases`} />
          <span>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
