import { useMemo, useState } from "react";
import {
  AGENTS, CASES, CHANNEL_LABEL, CUSTOMERS, DAILY, NOW, STAFF, TOTAL_VOLUME, UNIT_SLA, VOLUME,
  ago, customer, dueLabel, fmtDay, fmtTime, staffName, timelineFor,
  type CaseT, type Extension, type Status,
} from "./data";
import { Avatar, BarList, Icon, LineChart, Switch, channelIcon, priorityPill, statusPill, useMedia } from "./ui";

export interface Store {
  cases: CaseT[]; extensions: Extension[]; query: string;
  send: (id: string, text: string, fromDraft: boolean) => void;
  discard: (id: string) => void;
  setStatus: (id: string, s: Status) => void;
  assign: (id: string, who: string | null) => void;
  endorse: (id: string, unit: string) => void;
  decide: (id: string, ok: boolean) => void;
  go: (path: string) => void;
  toast: (t: string) => void;
}
const open = (c: CaseT) => c.status !== "Resolved";

// ---------------------------------------------------------------- shared bits
function Tat({ c }: { c: CaseT }) {
  const d = dueLabel(c.due);
  const pct = c.status === "Resolved" ? 100 : Math.min(100, Math.max(4, ((NOW - c.opened) / (c.due - c.opened)) * 100));
  return (
    <div className={`tat ${c.status === "Resolved" ? "" : d.tone}`}>
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <div className="txt">
        <b>{c.status === "Resolved" ? "Resolved within the deadline" : d.text}</b>
        <span className="muted">Deadline {fmtTime(c.due)}</span>
      </div>
    </div>
  );
}

function Titlebar({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="titlebar">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}

function Timeline({ customerId, caseId }: { customerId: string; caseId?: string }) {
  const ev = timelineFor(customerId);
  if (!ev.length) return <div className="muted">No earlier contacts.</div>;
  return (
    <ol className="tl">
      {ev.map((e, i) => (
        <li key={i}>
          <span className={`mk ${e.caseId && e.caseId === caseId ? "this" : ""}`}>{channelIcon(e.channel, 12)}</span>
          <div>
            <div>{e.text}</div>
            <div className="t">
              {CHANNEL_LABEL[e.channel]} · {fmtDay(e.at)}{e.caseId ? ` · ${e.caseId}` : ""}{e.note ? ` · ${e.note}` : ""}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------- inbox
const VIEWS = ["Mine", "Unassigned", "At risk", "All open", "Resolved"] as const;
type View = (typeof VIEWS)[number];
const inView = (c: CaseT, v: View) =>
  v === "Mine" ? open(c) && c.assignee === "ana"
  : v === "Unassigned" ? open(c) && !c.assignee
  : v === "At risk" ? open(c) && dueLabel(c.due).tone !== "ok"
  : v === "All open" ? open(c)
  : c.status === "Resolved";

export function Inbox({ s, selected }: { s: Store; selected: string | null }) {
  const phone = useMedia("(max-width: 640px)");
  const [view, setView] = useState<View>("Mine");
  const [drawer, setDrawer] = useState(false);
  const q = s.query.trim().toLowerCase();
  const rows = useMemo(
    () => s.cases.filter((c) => inView(c, view) && (!q || (c.subject + customer(c.customerId).name + c.id).toLowerCase().includes(q)))
      .sort((a, b) => a.due - b.due),
    [s.cases, view, q]
  );
  const sel = selected ? s.cases.find((c) => c.id === selected) ?? null : null;
  const active = sel ?? (phone ? null : rows[0] ?? null);

  const list = (
    <section className="col list-col" aria-label="Case list">
      <div className="list-head">
        <h1>Inbox <span>{rows.length} cases</span></h1>
        <div className="tabs" role="tablist" aria-label="Views">
          {VIEWS.map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
              {v}<span className="n">{s.cases.filter((c) => inView(c, v)).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rows">
        {rows.length === 0 && <div className="empty"><b>Nothing here</b>No cases match this view.</div>}
        {rows.map((c) => {
          const d = dueLabel(c.due);
          return (
            <button key={c.id} className={`row ${c.unread ? "unread" : ""}`} aria-selected={active?.id === c.id} onClick={() => s.go(`/inbox/${c.id}`)}>
              <span className="who">{c.unread && <i className="dot" aria-label="Unread" />}{customer(c.customerId).name}</span>
              <span className="when">{ago(c.opened)}</span>
              <span className="subj">{c.subject}</span>
              <span className="meta">
                <span className="ch">{channelIcon(c.channel, 14)} {CHANNEL_LABEL[c.channel]}</span>
                {priorityPill(c.priority)}
                {c.status !== "Resolved" && <span className={`due ${d.tone === "ok" ? "" : d.tone}`}>{d.text}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  if (phone) return active ? <CaseView s={s} c={active} phone onBack={() => s.go("/inbox")} /> : list;

  return (
    <div className="inbox">
      {list}
      {active ? (
        <>
          <section className="col case-col" aria-label="Case">
            <CaseView s={s} c={active} onDetails={() => setDrawer((d) => !d)} />
          </section>
          <aside className={`col details-col ${drawer ? "open" : ""}`} aria-label="Customer and case details">
            <Details c={active} />
          </aside>
        </>
      ) : (
        <section className="col case-col"><div className="empty"><b>No case selected</b>Choose a case from the list.</div></section>
      )}
    </div>
  );
}

function Details({ c }: { c: CaseT }) {
  const cu = customer(c.customerId);
  return (
    <div className="details">
      <div>
        <h3>Customer</h3>
        <div className="item-top" style={{ marginBottom: 8 }}><Avatar name={cu.name} /><div><b style={{ fontWeight: 600 }}>{cu.name}</b><div className="muted" style={{ fontSize: 12 }}>{cu.segment}</div></div></div>
        <dl className="kv">
          <dt>Customer since</dt><dd>{cu.since ? cu.since : "Not on file"}</dd>
          <dt>Branch</dt><dd>{cu.branch}</dd>
          <dt>Products</dt><dd>{cu.products.length ? cu.products.join(", ") : "None"}</dd>
          <dt>Prefers</dt><dd>{CHANNEL_LABEL[cu.preferred]}</dd>
        </dl>
      </div>
      <div>
        <h3>Case</h3>
        <dl className="kv">
          <dt>Category</dt><dd>{c.category}</dd>
          <dt>Unit</dt><dd>{c.unit}</dd>
          <dt>Opened</dt><dd>{fmtTime(c.opened)}</dd>
          <dt>Assigned to</dt><dd>{staffName(c.assignee)}</dd>
        </dl>
      </div>
      <div>
        <h3>AI summary</h3>
        <p style={{ margin: 0, fontSize: 13 }}>{c.summary}</p>
      </div>
      <div>
        <h3>Checks done by the agent</h3>
        <ul className="checks">{c.checks.map((k) => <li key={k}>{Icon.tick({ size: 14 })}<span>{k}</span></li>)}</ul>
      </div>
      <div>
        <h3>All contacts of {cu.name.split(" ")[0]}</h3>
        <Timeline customerId={c.customerId} caseId={c.id} />
      </div>
    </div>
  );
}

function CaseView({ s, c, phone, onBack, onDetails }: { s: Store; c: CaseT; phone?: boolean; onBack?: () => void; onDetails?: () => void }) {
  const cu = customer(c.customerId);
  const [tab, setTab] = useState<"Conversation" | "Details">("Conversation");
  const [text, setText] = useState("");
  const [seen, setSeen] = useState(c.id);
  if (seen !== c.id) { setSeen(c.id); setText(""); setTab("Conversation"); }
  const draftText = text || c.draft?.text || "";
  const needsReview = c.draft ? c.draft.confidence < 0.85 : false;
  const units = ["Loans", "Deposits", "Cards", "Digital Banking", "Remittance"];

  return (
    <div className="case-view" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div className="case-head">
        {phone && <div><button className="btn ghost" style={{ marginLeft: -8, paddingLeft: 4 }} onClick={onBack}>{Icon.back({})} Inbox</button></div>}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <h2 style={{ flex: 1 }}>{c.subject}</h2>
          {onDetails && <button className="btn detail-toggle" onClick={onDetails} aria-label="Toggle details">{Icon.panel({})} Details</button>}
        </div>
        <div className="line">
          <span style={{ color: "var(--text)" }}>{cu.name}</span><span className="mono">{c.id}</span>{statusPill(c.status)}{priorityPill(c.priority)}
          <span className="ch">{channelIcon(c.channel)} {CHANNEL_LABEL[c.channel]}</span>
        </div>
        <Tat c={c} />
        <div className="acts">
          <select className="select" aria-label="Assign to" value={c.assignee ?? ""} onChange={(e) => s.assign(c.id, e.target.value || null)}>
            <option value="">Unassigned</option>
            {STAFF.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select" aria-label="Status" value={c.status} onChange={(e) => s.setStatus(c.id, e.target.value as Status)}>
            {["New", "Open", "Waiting on customer", "Waiting on unit", "Resolved"].map((x) => <option key={x}>{x}</option>)}
          </select>
          <select className="select" aria-label="Endorse to a unit" value="" onChange={(e) => e.target.value && s.endorse(c.id, e.target.value)}>
            <option value="">Endorse to unit…</option>
            {units.filter((u) => u !== c.unit).map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        {phone && (
          <div className="tabs" role="tablist" style={{ marginBottom: -12 }}>
            {(["Conversation", "Details"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}
          </div>
        )}
      </div>
      {phone && tab === "Details" ? (
        <div style={{ overflow: "auto", flex: 1 }}><Details c={c} /></div>
      ) : (
        <>
          <div className="thread">
            {c.messages.map((m, i) => (
              <div key={i} className={`msg ${m.from === "customer" ? "" : "out"}`}>
                <Avatar name={m.who} size={28} />
                <div className="bub">
                  <div className="by"><b style={{ fontWeight: 600, color: "var(--text)" }}>{m.who}</b>{m.from === "agent" && <span className="pill">AI agent</span>}<span>{fmtTime(m.at)}</span></div>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {c.status === "Resolved" && <div className="sys">Case resolved</div>}
          </div>
          {c.status !== "Resolved" && (
            <div className="compose">
              {c.draft && (
                <div className="draft-note">
                  <span className="pill pos">AI draft</span><span>{c.draft.agent} suggests a reply</span>
                  <span className="conf">{needsReview ? "Needs a careful read · " : ""}{Math.round(c.draft.confidence * 100)}% confidence</span>
                </div>
              )}
              <textarea className="textarea" rows={phone ? 2 : 3} aria-label="Reply" placeholder="Write a reply…" value={draftText} onChange={(e) => setText(e.target.value)} />
              <div className="row-actions">
                <button className="btn primary" disabled={!draftText.trim()} onClick={() => { s.send(c.id, draftText.trim(), !!c.draft && !text); setText(""); }}>
                  {c.draft ? "Approve and send" : "Send reply"}
                </button>
                {c.draft && <button className="btn" onClick={() => s.discard(c.id)}>Discard draft</button>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ customers
export function Customers({ s, selected }: { s: Store; selected: string | null }) {
  const phone = useMedia("(max-width: 640px)");
  const [q, setQ] = useState("");
  const rows = CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const sel = CUSTOMERS.find((c) => c.id === selected) ?? (phone ? null : rows[0] ?? null);
  const list = (
    <section className="col list-col" aria-label="Customers">
      <div className="list-head">
        <h1>Customers <span>{rows.length}</span></h1>
        <input className="input" placeholder="Search customers" aria-label="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="rows" style={{ marginTop: 10 }}>
        {rows.map((c) => (
          <button key={c.id} className="row" aria-selected={sel?.id === c.id} onClick={() => s.go(`/customers/${c.id}`)} style={{ minHeight: 60 }}>
            <span className="who"><Avatar name={c.name} size={24} /> {c.name}</span>
            <span className="when">{s.cases.filter((x) => x.customerId === c.id && open(x)).length || "–"} open</span>
            <span className="subj">{c.segment} · {c.branch}</span>
          </button>
        ))}
        {rows.length === 0 && <div className="empty"><b>No customers found</b>Try another name.</div>}
      </div>
    </section>
  );
  if (phone && !sel) return list;
  const profile = sel && (
    <section className="col case-col" style={{ overflow: "auto" }} aria-label="Customer profile">
      <div className="page" style={{ maxWidth: 760 }}>
        {phone && <div><button className="btn ghost" style={{ marginLeft: -8 }} onClick={() => s.go("/customers")}>{Icon.back({})} Customers</button></div>}
        <div className="item-top"><Avatar name={sel.name} size={40} /><div className="grow"><h1 style={{ margin: 0, font: "600 20px var(--font)" }}>{sel.name}</h1><div className="muted">{sel.segment} · {sel.branch}{sel.since ? ` · customer since ${sel.since}` : ""}</div></div></div>
        <div className="card">
          <header><h2>Customer timeline</h2><span className="muted">Every case and contact, from every channel</span></header>
          <div className="body"><Timeline customerId={sel.id} /></div>
        </div>
        <div className="card">
          <header><h2>Open cases</h2></header>
          <div className="body">
            {s.cases.filter((c) => c.customerId === sel.id && open(c)).length === 0 && <div className="muted">No open cases.</div>}
            {s.cases.filter((c) => c.customerId === sel.id && open(c)).map((c) => (
              <div key={c.id} className="line-item">
                <span className="ch">{channelIcon(c.channel)}</span>
                <div className="grow"><button className="btn ghost" style={{ padding: 0, height: "auto", textAlign: "left", whiteSpace: "normal" }} onClick={() => s.go(`/inbox/${c.id}`)}>{c.subject}</button><div className="muted" style={{ fontSize: 12 }}>{c.id} · {dueLabel(c.due).text}</div></div>
                {statusPill(c.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
  return phone ? profile : <div className="inbox" style={{ gridTemplateColumns: "340px minmax(0,1fr)" }}>{list}{profile}</div>;
}

// ------------------------------------------------------------------ approvals
export function Approvals({ s }: { s: Store }) {
  const [tab, setTab] = useState<"AI replies" | "Deadline extensions">("AI replies");
  const drafts = s.cases.filter((c) => c.draft && open(c));
  const high = drafts.filter((c) => c.draft!.confidence >= 0.9);
  return (
    <div className="view"><div className="page" style={{ maxWidth: 920 }}>
      <Titlebar title="Approvals" sub="What the AI proposes and what people ask for, waiting for a decision">
        {tab === "AI replies" && high.length > 0 && (
          <button className="btn primary" onClick={() => high.forEach((c) => s.send(c.id, c.draft!.text, true))}>Approve {high.length} above 90%</button>
        )}
      </Titlebar>
      <div className="tabs" role="tablist">
        {(["AI replies", "Deadline extensions"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}<span className="n">{t === "AI replies" ? drafts.length : s.extensions.length}</span></button>
        ))}
      </div>
      {tab === "AI replies" ? (
        drafts.length === 0 ? <div className="empty"><b>All caught up</b>No AI replies are waiting.</div> :
        <ul className="list-rows card">
          {drafts.map((c) => (
            <li key={c.id}>
              <div className="item-top">
                <span className="ch">{channelIcon(c.channel)}</span>
                <div className="grow"><button className="btn ghost" style={{ padding: 0, height: "auto", fontWeight: 600, textAlign: "left", whiteSpace: "normal" }} onClick={() => s.go(`/inbox/${c.id}`)}>{c.subject}</button>
                  <div className="muted" style={{ fontSize: 12 }}>{customer(c.customerId).name} · {c.draft!.agent} · {Math.round(c.draft!.confidence * 100)}% confidence</div></div>
                {c.draft!.confidence < 0.85 && <span className="pill warn">Needs a careful read</span>}
              </div>
              <p className="quote" style={{ margin: 0 }}>{c.draft!.text}</p>
              <div className="acts">
                <button className="btn primary" onClick={() => s.send(c.id, c.draft!.text, true)}>Approve and send</button>
                <button className="btn" onClick={() => s.go(`/inbox/${c.id}`)}>Edit in case</button>
                <button className="btn danger" onClick={() => s.discard(c.id)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      ) : s.extensions.length === 0 ? <div className="empty"><b>All caught up</b>No extension requests are waiting.</div> : (
        <ul className="list-rows card">
          {s.extensions.map((x) => {
            const c = s.cases.find((k) => k.id === x.caseId)!;
            return (
              <li key={x.id}>
                <div className="item-top"><div className="grow"><b style={{ fontWeight: 600 }}>{c.subject}</b><div className="muted" style={{ fontSize: 12 }}>{c.id} · asked by {staffName(x.by)} at {fmtTime(x.asked)}</div></div></div>
                <p className="quote" style={{ margin: 0 }}>{x.reason}</p>
                <div className="muted" style={{ fontSize: 13 }}>Deadline moves from <b>{fmtTime(x.oldDue)}</b> to <b>{fmtTime(x.newDue)}</b></div>
                <div className="acts">
                  <button className="btn primary" onClick={() => s.decide(x.id, true)}>Approve extension</button>
                  <button className="btn danger" onClick={() => s.decide(x.id, false)}>Reject</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div></div>
  );
}

// ----------------------------------------------------------- team and deadlines
export function Team({ s }: { s: Store }) {
  const openCases = s.cases.filter(open);
  const risk = openCases.filter((c) => dueLabel(c.due).tone !== "ok").sort((a, b) => a.due - b.due);
  const overdue = openCases.filter((c) => dueLabel(c.due).tone === "breach");
  const today = openCases.filter((c) => new Date(c.due).toDateString() === new Date(NOW).toDateString());
  const load = STAFF.map((p) => ({ p, n: openCases.filter((c) => c.assignee === p.id).length }));
  const unassigned = openCases.filter((c) => !c.assignee).length;
  return (
    <div className="view"><div className="page">
      <Titlebar title="Team and deadlines" sub="Who has what, and which cases are close to a deadline" />
      <div className="kpis">
        <div className="kpi"><div className="l">Open cases</div><div className="v">{openCases.length}</div><div className="d">{unassigned} not assigned</div></div>
        <div className="kpi"><div className="l">Due today</div><div className="v">{today.length}</div><div className="d">{today.length ? `last one at ${new Date(Math.max(...today.map((c) => c.due))).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}` : "Nothing due"}</div></div>
        <div className="kpi"><div className="l">At risk</div><div className="v">{risk.length - overdue.length}</div><div className="d">under 4 hours left</div></div>
        <div className="kpi"><div className="l">Overdue</div><div className={`v`} style={{ color: overdue.length ? "var(--negative)" : undefined }}>{overdue.length}</div><div className={`d ${overdue.length ? "neg" : ""}`}>{overdue.length ? (overdue.every((c) => s.extensions.some((x) => x.caseId === c.id)) ? "Extension asked, not decided" : "Needs action now") : "None"}</div></div>
      </div>
      <div className="cols">
        <div className="card">
          <header><h2>Cases that need action</h2><span className="muted">Closest deadline first</span></header>
          <div className="body" style={{ paddingTop: 4 }}>
            {risk.length === 0 && <div className="muted">No case is close to a deadline.</div>}
            {risk.map((c) => {
              const d = dueLabel(c.due);
              return (
                <div key={c.id} className="line-item" style={{ flexWrap: "wrap" }}>
                  <div className="grow" style={{ minWidth: 200 }}>
                    <button className="btn ghost" style={{ padding: 0, height: "auto", textAlign: "left", whiteSpace: "normal", fontWeight: 600 }} onClick={() => s.go(`/inbox/${c.id}`)}>{c.subject}</button>
                    <div style={{ fontSize: 12, color: d.tone === "breach" ? "var(--negative)" : "var(--warning)", fontWeight: 500 }}>{d.text} · <span className="muted" style={{ fontWeight: 400 }}>{c.id} · {c.unit}</span></div>
                  </div>
                  <select className="select" aria-label={`Reassign ${c.id}`} value={c.assignee ?? ""} onChange={(e) => { s.assign(c.id, e.target.value || null); s.toast(`Reassigned to ${staffName(e.target.value || null)}`); }}>
                    <option value="">Unassigned</option>{STAFF.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <header><h2>Workload</h2><span className="muted">Open cases against capacity</span></header>
          <div className="body">
            <BarList max={12} rows={load.map(({ p, n }) => ({ label: p.name.split(" ")[0], value: n, risk: n > p.capacity * 0.8 }))} fmt={(v) => `${v}`} />
            <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>Capacity: 12 cases for support executives, 10 for unit support executives.</div>
          </div>
        </div>
      </div>
    </div></div>
  );
}

// ----------------------------------------------------------------- reports
export function Reports() {
  const solved = AGENTS.reduce((a, g) => a + g.solved, 0);
  const handed = AGENTS.reduce((a, g) => a + g.handed, 0);
  const within = Math.round(UNIT_SLA.reduce((a, u) => a + u.within * u.cases, 0) / TOTAL_VOLUME);
  const labels = Array.from({ length: 30 }, (_, i) => new Date(NOW - (29 - i) * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Manila" }));
  return (
    <div className="view"><div className="page">
      <Titlebar title="Reports" sub="Last 30 days, 24 Oct to 22 Nov 2026, all channels">
        <button className="btn">Export CSV</button>
      </Titlebar>
      <div className="kpis">
        <div className="kpi"><div className="l">Cases opened</div><div className="v">{TOTAL_VOLUME.toLocaleString("en-US")}</div><div className="d">across 5 channels</div></div>
        <div className="kpi"><div className="l">Solved by AI alone</div><div className="v">{Math.round((solved / TOTAL_VOLUME) * 100)}<small>%</small></div><div className="d">{solved} cases, no person needed</div></div>
        <div className="kpi"><div className="l">Handed to people</div><div className="v">{handed}</div><div className="d">with summary and draft</div></div>
        <div className="kpi"><div className="l">Within deadline</div><div className="v">{within}<small>%</small></div><div className="d">target 90%</div></div>
      </div>
      <div className="charts">
        <div className="card"><header><h2>Cases opened per day</h2><span className="muted">Weekends are quieter</span></header><div className="body"><LineChart values={DAILY} labels={labels} unit="last 30 days" /></div></div>
        <div className="card"><header><h2>Cases by channel</h2></header><div className="body"><BarList max={700} rows={VOLUME} fmt={(v) => v.toLocaleString("en-US")} /></div></div>
      </div>
      <div className="card">
        <header><h2>Deadline compliance by unit</h2><span className="muted">Share of cases closed within their deadline. The dashed line is the 90% target.</span></header>
        <div className="body"><BarList max={100} target={90} rows={UNIT_SLA.map((u) => ({ label: u.unit, value: u.within, risk: u.within < 90 }))} fmt={(v) => `${v}%`} /></div>
      </div>
    </div></div>
  );
}

// --------------------------------------------------------------------- agents
export function Agents({ s }: { s: Store }) {
  const [paused, setPaused] = useState<Record<string, boolean>>({});
  const money = (n: number) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const total = AGENTS.reduce((a, g) => a + g.runs * g.costPerRun, 0);
  return (
    <div className="view"><div className="page">
      <Titlebar title="AI agents" sub="Which agents work for the bank, what they did and what they cost. Last 30 days." />
      <div className="kpis three">
        <div className="kpi"><div className="l">Runs</div><div className="v">{AGENTS.reduce((a, g) => a + g.runs, 0).toLocaleString("en-US")}</div><div className="d">{AGENTS.length} agents</div></div>
        <div className="kpi"><div className="l">Cost</div><div className="v">{money(total)}</div><div className="d">supplied by AgenticOrg</div></div>
        <div className="kpi"><div className="l">Cost per run</div><div className="v">{money(total / AGENTS.reduce((a, g) => a + g.runs, 0))}</div><div className="d">average across agents</div></div>
      </div>
      <div className="card tbl-wrap">
        <table className="tbl stack">
          <thead><tr><th>Agent</th><th>Status</th><th className="num">Runs</th><th className="num">Solved</th><th className="num">Handed over</th><th className="num">Failed</th><th className="num">Cost per run</th><th className="num">Replies approved / edited / rejected</th><th /></tr></thead>
          <tbody>
            {AGENTS.map((a) => (
              <tr key={a.id}>
                <td><span className="ch" style={{ color: "var(--text)" }}>{channelIcon(a.channel)} <b style={{ fontWeight: 600 }}>{a.name}</b></span></td>
                <td data-l="Status">{paused[a.id] ? <span className="pill">Paused</span> : <span className="pill pos">Active</span>}</td>
                <td className="num" data-l="Runs">{a.runs}</td>
                <td className="num" data-l="Solved">{a.solved}</td>
                <td className="num" data-l="Handed over">{a.handed}</td>
                <td className="num" data-l="Failed">{a.failed}</td>
                <td className="num" data-l="Cost per run">{money(a.costPerRun)}</td>
                <td className="num" data-l="Replies">{a.approved + a.edited + a.rejected === 0 ? "–" : `${a.approved} / ${a.edited} / ${a.rejected}`}</td>
                <td className="num"><button className="btn" onClick={() => { setPaused({ ...paused, [a.id]: !paused[a.id] }); s.toast(`${a.name} ${paused[a.id] ? "resumed" : "paused"}`); }}>{paused[a.id] ? "Resume" : "Pause"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="muted" style={{ fontSize: 13 }}>Edited and rejected replies go to the subject matter experts, who use them to improve the knowledge base.</div>
    </div></div>
  );
}

// ------------------------------------------------------------------- settings
export function Settings({ s }: { s: Store }) {
  const [tab, setTab] = useState("Brand");
  const [notify, setNotify] = useState({ Email: true, SMS: true, "In-app": true, WhatsApp: false });
  const [hooks, setHooks] = useState({ "case.created": true, "deadline.near": true, "case.closed": true, "approval.decided": false });
  const [keys, setKeys] = useState([
    { id: "k1", name: "Email agent", scope: "cases:write, customers:read", last: "2 min ago", tail: "8f3a", revoked: false },
    { id: "k2", name: "Chat agent", scope: "cases:write, customers:read", last: "just now", tail: "c71e", revoked: false },
    { id: "k3", name: "Social media agent", scope: "cases:write", last: "14 min ago", tail: "2b90", revoked: false },
    { id: "k4", name: "Voice agent", scope: "cases:write, customers:read", last: "3 h ago", tail: "d04c", revoked: false },
  ]);
  const tabs = ["Brand", "Routing and deadlines", "Notifications", "Agent keys and webhooks"];
  return (
    <div className="view"><div className="page" style={{ maxWidth: 1040 }}>
      <Titlebar title="Settings" sub="Land Bank workspace. Set up by the bank admin, without an engineer." />
      <div className="tabs" role="tablist">{tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "Brand" && (
        <div>
          <div className="srow"><div><h2>Logo and colours</h2><p>Customers and staff see the bank's brand, not ours.</p></div>
            <div className="card brand-preview"><img src="/logo.png" alt="Pine Labs and Land Bank logos" />
              <div className="item-top"><span className="swatch" style={{ background: "#2c7a3a" }} /> <span>Primary #2C7A3A</span><span className="swatch" style={{ background: "#e3f1e4" }} /><span>Tint #E3F1E4</span></div></div></div>
          <div className="srow"><div><h2>Domain and sender</h2><p>Where the desk lives and who customers hear from.</p></div>
            <div className="card"><div className="body"><dl className="kv" style={{ gridTemplateColumns: "140px 1fr" }}><dt>Desk address</dt><dd className="mono">support.landbank.example</dd><dt>Sender address</dt><dd className="mono">care@landbank.example</dd><dt>Reply-to name</dt><dd>Land Bank Customer Care</dd></dl></div></div></div>
        </div>
      )}
      {tab === "Routing and deadlines" && (
        <div>
          <div className="srow"><div><h2>Routing rules</h2><p>Where a new case goes, by category. Fraud goes to the priority lane.</p></div>
            <div className="card tbl-wrap"><table className="tbl stack"><thead><tr><th>Category</th><th>Unit</th><th className="num">Deadline</th><th>Lane</th></tr></thead><tbody>
              {[["Fraud", "Cards", "8 hours", "Priority"], ["ATM and cards", "Cards", "1 day", "Standard"], ["Loans", "Loans", "3 working days", "Standard"], ["Deposits", "Deposits", "3 working days", "Standard"], ["Digital banking", "Digital Banking", "2 working days", "Standard"], ["Remittance", "Remittance", "2 working days", "Standard"]].map((r) => (
                <tr key={r[0]}><td>{r[0]}</td><td data-l="Unit">{r[1]}</td><td className="num" data-l="Deadline">{r[2]}</td><td data-l="Lane">{r[3] === "Priority" ? <span className="pill neg">Priority</span> : r[3]}</td></tr>))}
            </tbody></table></div></div>
          <div className="srow"><div><h2>Working calendar</h2><p>Deadlines count working days only.</p></div>
            <div className="card"><div className="body"><dl className="kv" style={{ gridTemplateColumns: "140px 1fr" }}><dt>Working days</dt><dd>Monday to Friday</dd><dt>Working hours</dt><dd>08:00 to 17:00, Asia/Manila</dd><dt>Holidays</dt><dd>2026 national holiday list, 18 days</dd></dl></div></div></div>
        </div>
      )}
      {tab === "Notifications" && (
        <div className="srow"><div><h2>Channels for notices</h2><p>Customer and internal notices use approved, versioned templates.</p></div>
          <div className="card"><div className="body">
            {Object.entries(notify).map(([k, v]) => (
              <div key={k} className="line-item"><div className="grow">{k}</div><Switch label={k} checked={v} onChange={(x) => setNotify({ ...notify, [k]: x })} /></div>))}
          </div></div></div>
      )}
      {tab === "Agent keys and webhooks" && (
        <div>
          <div className="srow"><div><h2>Agent keys</h2><p>Each AgenticOrg agent has its own key with limited scope, so the audit log shows which agent did what.</p></div>
            <div className="card"><div className="body">
              {keys.map((k) => (
                <div key={k.id} className="line-item" style={{ flexWrap: "wrap" }}>
                  <div className="grow" style={{ minWidth: 180 }}><b style={{ fontWeight: 600 }}>{k.name}</b><div className="muted" style={{ fontSize: 12 }}>{k.scope} · used {k.last}</div></div>
                  <span className="mono">pd_live_••••{k.tail}</span>
                  {k.revoked ? <span className="pill neg">Revoked</span> : <>
                    <button className="btn" onClick={() => s.toast(`New secret created for ${k.name}`)}>Rotate</button>
                    <button className="btn danger" onClick={() => setKeys(keys.map((x) => x.id === k.id ? { ...x, revoked: true } : x))}>Revoke</button></>}
                </div>))}
            </div></div></div>
          <div className="srow"><div><h2>Webhooks</h2><p>Signed events that tell AgenticOrg what happens next.</p></div>
            <div className="card"><div className="body">
              {Object.entries(hooks).map(([k, v]) => (
                <div key={k} className="line-item"><div className="grow mono">{k}</div><Switch label={k} checked={v} onChange={(x) => setHooks({ ...hooks, [k]: x })} /></div>))}
            </div></div></div>
        </div>
      )}
    </div></div>
  );
}
