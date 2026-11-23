import { ReactNode, useEffect, useState } from "react";
import type { Channel, Priority, Status } from "./data";

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

type P = { size?: number };
const I = ({ d, size = 16, children }: { d?: string; size?: number; children?: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);
export const Icon = {
  inbox: (p: P) => <I {...p}><path d="M2 9l2-6h8l2 6v4H2z" /><path d="M2 9h3.5l1 1.5h3L11 9h3" /></I>,
  users: (p: P) => <I {...p}><circle cx="6" cy="5.5" r="2.5" /><path d="M1.5 13c.3-2.4 2-3.5 4.5-3.5s4.2 1.1 4.5 3.5" /><path d="M10.5 3.2a2.4 2.4 0 010 4.6M12 9.6c1.4.5 2.3 1.6 2.5 3.4" /></I>,
  check: (p: P) => <I {...p} d="M3 8.5l3.2 3L13 4.5" />,
  clock: (p: P) => <I {...p}><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.3 1.5" /></I>,
  chart: (p: P) => <I {...p}><path d="M2.5 13.5h11" /><path d="M4.5 11V8M8 11V4.5M11.5 11V6.5" /></I>,
  bot: (p: P) => <I {...p}><rect x="3" y="5" width="10" height="7.5" rx="2" /><path d="M8 2.5V5M6 8.5v.5M10 8.5v.5" /></I>,
  gear: (p: P) => <I {...p}><circle cx="8" cy="8" r="2" /><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1" /></I>,
  search: (p: P) => <I {...p}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></I>,
  more: (p: P) => <I {...p}><circle cx="3.5" cy="8" r=".6" /><circle cx="8" cy="8" r=".6" /><circle cx="12.5" cy="8" r=".6" /></I>,
  back: (p: P) => <I {...p} d="M10 3L5 8l5 5" />,
  mail: (p: P) => <I {...p}><rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path d="M2.5 4.5L8 9l5.5-4.5" /></I>,
  chat: (p: P) => <I {...p} d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />,
  social: (p: P) => <I {...p}><circle cx="8" cy="8" r="2.5" /><path d="M10.5 8v1a2 2 0 004 0V8a6.5 6.5 0 10-2.6 5.2" /></I>,
  voice: (p: P) => <I {...p} d="M3.5 2.5l2 .5 1 3-1.5 1a7 7 0 003.5 3.5l1-1.5 3 1 .5 2c-.5 1-1.5 1.5-2.5 1.5A10 10 0 012 5c0-1 .5-2 1.5-2.5z" />,
  hotline: (p: P) => <I {...p}><rect x="4.5" y="2" width="7" height="12" rx="1.5" /><path d="M7 12h2" /></I>,
  tick: (p: P) => <I {...p} d="M3.5 8.5l3 3 6-6.5" />,
  panel: (p: P) => <I {...p}><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M10 3v10" /></I>,
  x: (p: P) => <I {...p} d="M4 4l8 8M12 4l-8 8" />,
};
export const channelIcon = (c: Channel, size = 14) => {
  const k = { email: Icon.mail, chat: Icon.chat, social: Icon.social, voice: Icon.voice, hotline: Icon.hotline }[c];
  return k({ size });
};

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="7" fill="#e3f1e4" />
      <path d="M14 5l5 6h-3l4 5h-4l3 4H9l3-4H8l4-5H9z" fill="#2c7a3a" />
      <rect x="13" y="20" width="2" height="3" fill="#2c7a3a" />
    </svg>
  );
}

const HUES = [152, 205, 28, 275 - 40, 340, 95];
export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const hue = HUES[h % HUES.length];
  const ini = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <span className="avatar" style={{ width: size, height: size, background: `hsl(${hue} 45% 90%)`, color: `hsl(${hue} 50% 24%)` }}>
      {ini}
    </span>
  );
}

export const statusPill = (s: Status) => {
  const cls = s === "Resolved" ? "pos" : s === "New" ? "warn" : "";
  return <span className={`pill ${cls}`}>{s}</span>;
};
export const priorityPill = (p: Priority) =>
  p === "normal" ? null : <span className={`pill ${p === "urgent" ? "neg" : "warn"}`}>{p === "urgent" ? "Urgent" : "High"}</span>;

// ---- charts: one hue, faint grid, labels in the text face ------------------
export function LineChart({ values, labels, unit }: { values: number[]; labels: string[]; unit: string }) {
  const phone = useMedia("(max-width: 640px)");
  const W = phone ? 340 : 640, H = phone ? 190 : 200, L = 32, R = 8, T = 10, B = 24;
  const max = Math.ceil(Math.max(...values) / 20) * 20;
  const x = (i: number) => L + (i * (W - L - R)) / (values.length - 1);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const ticks = [0, max / 2, max];
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cases opened per day, ${unit}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e6e9e4" strokeDasharray="3 4" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5b605a">{t}</text>
          </g>
        ))}
        <polyline points={pts} fill="none" stroke="#2c7a3a" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="3.5" fill="#2c7a3a" />
        {(phone ? [0, 14, 29] : [0, 7, 14, 21, 29]).map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === 29 ? "end" : "middle"} fontSize="11" fill="#5b605a">{labels[i]}</text>
        ))}
      </svg>
    </div>
  );
}

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
