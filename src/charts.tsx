import { useRef, useState, type ReactNode } from "react";
import { useChartIn } from "./motion";
import { useMedia } from "./ui";

export interface Series { key: string; label: string; color: string; values: number[] }

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="legend">
      {items.map((i) => <li key={i.label}><i style={{ background: i.color }} />{i.label}{i.value && <b>{i.value}</b>}</li>)}
    </ul>
  );
}

const niceMax = (v: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, v))));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};

/** Stacked columns, one per day or week. Hover a column to read its numbers. */
export function StackedBars({ series, labels, height = 220, label, every }: { series: Series[]; labels: string[]; height?: number; label: string; every?: number }) {
  const phone = useMedia("(max-width: 640px)");
  const ref = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  useChartIn(ref, series.map((s) => s.values.join()).join("|"));
  const W = phone ? 360 : 680, H = height, L = 34, R = 6, T = 12, B = 26;
  const totals = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
  const max = niceMax(Math.max(...totals));
  const bw = (W - L - R) / labels.length;
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const step = every ?? (labels.length > 10 ? (phone ? 4 : 2) : 1);
  return (
    <div className="chartbox">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
        {[0, max / 2, max].map((tk) => (
          <g key={tk}><line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} className="grid" /><text x={L - 8} y={y(tk) + 4} textAnchor="end" className="tick">{tk}</text></g>
        ))}
        {labels.map((lb, i) => {
          let acc = 0;
          const x = L + i * bw + bw * 0.18, w = bw * 0.64;
          return (
            <g key={lb} onMouseEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.45}>
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              {series.map((s, si) => {
                const v = s.values[i]; const y0 = y(acc); acc += v; const y1 = y(acc);
                return <rect key={s.key} data-bar x={x} y={y1} width={w} height={Math.max(0, y0 - y1)} rx={si === series.length - 1 ? 3 : 0} fill={s.color} />;
              })}
              {i % step === 0 && <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="tick">{lb}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="tip" style={{ left: `${((L + hover * bw + bw / 2) / W) * 100}%` }}>
          <b>{labels[hover]}</b>
          {series.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}<em>{s.values[hover]}</em></span>)}
          <span className="tot">Total<em>{totals[hover]}</em></span>
        </div>
      )}
    </div>
  );
}

/** Two series as paired columns: this period against the one before. */
export function PairedBars({ rows, a, b, label }: { rows: { label: string; a: number; b: number }[]; a: { label: string; color: string }; b: { label: string; color: string }; label: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  useChartIn(ref, rows.map((r) => r.a + r.b).join());
  const W = 680, H = 220, L = 34, R = 6, T = 12, B = 26;
  const max = niceMax(Math.max(...rows.flatMap((r) => [r.a, r.b])));
  const bw = (W - L - R) / rows.length;
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  return (
    <div className="chartbox">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {[0, max / 2, max].map((tk) => <g key={tk}><line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} className="grid" /><text x={L - 8} y={y(tk) + 4} textAnchor="end" className="tick">{tk}</text></g>)}
        {rows.map((r, i) => {
          const x = L + i * bw + bw * 0.2, w = bw * 0.28;
          return (
            <g key={r.label}>
              <rect data-bar x={x} y={y(r.b)} width={w} height={H - B - y(r.b)} rx={3} fill={b.color}><title>{`${r.label}, ${b.label}: ${r.b}`}</title></rect>
              <rect data-bar x={x + w + 4} y={y(r.a)} width={w} height={H - B - y(r.a)} rx={3} fill={a.color}><title>{`${r.label}, ${a.label}: ${r.a}`}</title></rect>
              <text x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="tick">{r.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Lines over time, for rates and trends. */
export function Lines({ series, labels, label, suffix = "", max: fixed }: { series: Series[]; labels: string[]; label: string; suffix?: string; max?: number }) {
  const phone = useMedia("(max-width: 640px)");
  const ref = useRef<SVGSVGElement | null>(null);
  useChartIn(ref, series.map((s) => s.values.join()).join("|"));
  const W = phone ? 360 : 680, H = 200, L = 38, R = 10, T = 12, B = 26;
  const max = fixed ?? niceMax(Math.max(...series.flatMap((s) => s.values)));
  const x = (i: number) => L + (i * (W - L - R)) / (labels.length - 1);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const step = labels.length > 10 ? (phone ? 4 : 2) : 1;
  return (
    <div className="chartbox">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {[0, max / 2, max].map((tk) => <g key={tk}><line x1={L} x2={W - R} y1={y(tk)} y2={y(tk)} className="grid" /><text x={L - 8} y={y(tk) + 4} textAnchor="end" className="tick">{tk}{suffix}</text></g>)}
        {series.map((s) => (
          <g key={s.key}>
            <polyline data-line points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r={3.5} fill={s.color} />
          </g>
        ))}
        {labels.map((lb, i) => i % step === 0 || i === labels.length - 1 ? <text key={lb} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} className="tick">{lb}</text> : null)}
      </svg>
    </div>
  );
}

/** Horizontal bars with a label column, value and optional change against the last period. */
export function HBars({ rows, max, fmt = String, color, target, compact }: {
  rows: { label: ReactNode; value: number; prev?: number; color?: string; note?: string; tone?: "risk" }[];
  max?: number; fmt?: (v: number) => string; color?: string; target?: number; compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useChartIn(ref, rows.map((r) => r.value).join());
  const m = max ?? niceMax(Math.max(...rows.map((r) => r.value)));
  return (
    <div className={`hbars ${compact ? "compact" : ""}`} ref={ref}>
      {rows.map((r, i) => {
        const ch = r.prev !== undefined && r.prev > 0 ? Math.round(((r.value - r.prev) / r.prev) * 100) : null;
        return (
          <div className="hb" key={i}>
            <span className="hl">{r.label}{r.note && <small>{r.note}</small>}</span>
            <span className="ht">
              <i data-hbar className={r.tone === "risk" ? "risk" : ""} style={{ width: `${(r.value / m) * 100}%`, background: r.color ?? color }} />
              {target !== undefined && <span className="tg" style={{ left: `${(target / m) * 100}%` }} />}
            </span>
            <span className="hv">{fmt(r.value)}{ch !== null && <em className={ch > 0 ? "up" : ch < 0 ? "down" : ""}>{ch > 0 ? "+" : ""}{ch}%</em>}</span>
          </div>
        );
      })}
    </div>
  );
}

/** One bar split by share, for mixes like sentiment or review outcomes. */
export function SplitBar({ parts, label }: { parts: { label: string; value: number; color: string }[]; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useChartIn(ref, parts.map((p) => p.value).join());
  const tot = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div ref={ref}>
      <div className="split" role="img" aria-label={`${label}: ${parts.map((p) => `${p.label} ${Math.round((p.value / tot) * 100)}%`).join(", ")}`}>
        {parts.map((p) => p.value > 0 && <i key={p.label} data-hbar style={{ width: `${(p.value / tot) * 100}%`, background: p.color }} title={`${p.label}: ${p.value}`} />)}
      </div>
      <Legend items={parts.map((p) => ({ label: p.label, color: p.color, value: `${Math.round((p.value / tot) * 100)}%` }))} />
    </div>
  );
}
