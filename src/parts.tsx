import { ReactNode, useState } from "react";
import { dueLabel, fmtDur, type CallT, type CaseT, type Priority, type Status } from "./data";
import { Icon, Pill } from "./ui";

export const statusTone = (s: Status) => (s === "Resolved" ? "pos" : s === "New" ? "warn" : s === "Waiting on customer" ? "" : "pri");
export function StatusPill({ status }: { status: Status }) {
  return <Pill tone={statusTone(status)}>{status}</Pill>;
}
export function PriorityPill({ p }: { p: Priority }) {
  return p === "normal" ? null : <Pill tone={p === "urgent" ? "neg" : "warn"}>{p === "urgent" ? "Urgent" : "High"}</Pill>;
}
export function Due({ c }: { c: CaseT }) {
  if (c.status === "Resolved") return <span className="due">Closed</span>;
  const d = dueLabel(c.due);
  return <span className={`due ${d.tone === "ok" ? "" : "hot"}`}>{d.text}</span>;
}
export function Titlebar({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="titlebar">
      <div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}
const WAVE = [6, 12, 9, 18, 14, 8, 20, 16, 7, 12, 19, 10, 14, 6, 17, 21, 11, 8, 15, 18, 9, 13, 7, 16, 20, 10, 12, 6, 14, 17, 9, 11];
export function Wave() {
  return <span className="wave" aria-hidden="true">{WAVE.map((h, i) => <i key={i} style={{ height: h }} />)}</span>;
}
export function CallBox({ call }: { call: CallT }) {
  const [open, setOpen] = useState(false);
  const [play, setPlay] = useState(false);
  return (
    <div className="callbox">
      <div className="player">
        <button className="icb" style={{ width: 28, height: 28 }} aria-label={play ? "Pause recording" : "Play recording"} onClick={() => setPlay(!play)}>
          <Icon n={play ? "pause" : "play"} s={14} />
        </button>
        <Wave /><span>{fmtDur(call.duration)}</span>
        {call.recorded && <Pill tone="neg">Recorded</Pill>}
      </div>
      <div className="sumline"><Pill tone="ai" icon="spark">AI summary</Pill> {call.summary}</div>
      {call.transcript.length > 0 && (
        <>
          <button className="link" style={{ fontSize: 12.5, marginTop: 6 }} onClick={() => setOpen(!open)}>{open ? "Hide transcript" : "Show full transcript"}</button>
          {open && <div className="tx">{call.transcript.map((l, i) => <div key={i}><span className="t">{l.t}</span><span className="w">{l.who}</span><span>{l.text}</span></div>)}</div>}
        </>
      )}
    </div>
  );
}
