import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CHANNEL_GROUPS, CHANNEL_LABEL, OUTER, PIPE, STAFF, agentKind, agentOf, caseById, customer, dueLabel, eventsFor, evidence, fmtClock, fmtDay, fmtDur, fmtTime,
  agoLong, ago, firstName, staffName, stepState, stepTime, turnOf, type CaseT, type Status,
} from "./data";
import { Due, PriorityPill, StatusPill, CallBox } from "./parts";
import { isOpen, type Store } from "./store";
import { Avatar, Chan, Empty, Icon, MenuItem, Pill, Popover, useMedia } from "./ui";

// ---------------------------------------------------------------- views
const VIEWS = ["Mine", "Unassigned", "At risk", "Needs my approval", "Waiting on customer", "Waiting on unit", "Repeat contacts", "Fraud and distress", "All open", "Resolved", "Handled by AI"] as const;
type View = (typeof VIEWS)[number];
const QUICK: View[] = ["Mine", "Unassigned", "At risk", "All open"];
const UNITS = ["Cards", "Loans", "Deposits", "Digital Banking", "Remittance", "Customer care"];
const inView = (c: CaseT, v: View): boolean => {
  switch (v) {
    case "Mine": return isOpen(c) && c.assignee === "ana";
    case "Unassigned": return isOpen(c) && !c.assignee;
    case "At risk": return isOpen(c) && dueLabel(c.due).tone !== "ok";
    case "Needs my approval": return isOpen(c) && !!c.draft && c.assignee === "ana";
    case "Waiting on customer": return c.status === "Waiting on customer";
    case "Waiting on unit": return c.status === "Waiting on unit";
    case "Repeat contacts": return isOpen(c) && !!c.repeat;
    case "Fraud and distress": return isOpen(c) && !!c.fraud;
    case "All open": return isOpen(c);
    case "Resolved": return c.status === "Resolved" && !c.handledByAI;
    case "Handled by AI": return !!c.handledByAI;
  }
};
const PRI = { urgent: 0, high: 1, normal: 2 };

export function Inbox({ s, selected }: { s: Store; selected: string | null }) {
  const single = useMedia("(max-width: 900px)");
  const wide = useMedia("(min-width: 1301px)");
  const [view, setView] = useState<View>("Mine");
  const [chs, setChs] = useState<string[]>([]);
  const [sort, setSort] = useState<"due" | "new" | "priority">("due");
  const [prio, setPrio] = useState<"any" | "urgent" | "high">("any");
  const [unit, setUnit] = useState("any");
  const [drawer, setDrawer] = useState(false);
  const q = s.query.trim().toLowerCase();

  const inViewRows = useMemo(() => s.cases.filter((c) => inView(c, view)), [s.cases, view]);
  const rows = useMemo(() => {
    const out = inViewRows.filter((c) =>
      (chs.length === 0 || CHANNEL_GROUPS.some((g) => chs.includes(g.key) && g.channels.includes(c.channel))) &&
      (prio === "any" || c.priority === prio) && (unit === "any" || c.unit === unit) &&
      (!q || (c.subject + customer(c.customerId).name + c.id + customer(c.customerId).cif).toLowerCase().includes(q)));
    return out.sort((a, b) => sort === "due" ? a.due - b.due : sort === "new" ? b.opened - a.opened : PRI[a.priority] - PRI[b.priority] || a.due - b.due);
  }, [inViewRows, chs, prio, unit, q, sort]);

  const sel = selected ? s.cases.find((c) => c.id === selected) ?? null : null;
  const active = sel ?? (single ? null : rows[0] ?? null);
  const idx = active ? rows.findIndex((r) => r.id === active.id) : -1;
  const prevId = idx > 0 ? rows[idx - 1].id : null;
  const nextId = idx >= 0 && idx < rows.length - 1 ? rows[idx + 1].id : null;
  const filtered = prio !== "any" || unit !== "any";

  const list = (
    <section className="panel" aria-label="Cases">
      <div className="lh">
        <div className="t">
          <Popover width={250} button={({ toggle, ref }) => (
            <button ref={ref} className="viewbtn" onClick={toggle} aria-haspopup="menu"><h1>{view === "Mine" ? "My open cases" : view}</h1><Icon n="down" s={16} /></button>
          )}>
            {(close) => <>{VIEWS.map((v) => (
              <MenuItem key={v} active={v === view} onClick={() => { setView(v); close(); }}>{v}<span className="muted" style={{ marginLeft: 8, flex: "none" }}>{s.cases.filter((c) => inView(c, v)).length}</span></MenuItem>
            ))}</>}
          </Popover>
          <span className="cnt">{rows.length}</span>
          <div className="sp">
            <Popover width={240} align="end" button={({ toggle, ref }) => (
              <button ref={ref} className="icb" aria-label="Filter cases" aria-pressed={filtered} onClick={toggle}><Icon n="filter" s={16} /></button>
            )}>
              {(close) => <>
                <h5>Priority</h5>
                {(["any", "urgent", "high"] as const).map((p) => <MenuItem key={p} active={prio === p} onClick={() => { setPrio(p); close(); }}>{p === "any" ? "Any priority" : p === "urgent" ? "Urgent" : "High"}</MenuItem>)}
                <h5>Unit</h5>
                {["any", ...UNITS].map((u) => <MenuItem key={u} active={unit === u} onClick={() => { setUnit(u); close(); }}>{u === "any" ? "Any unit" : u}</MenuItem>)}
              </>}
            </Popover>
            <Popover width={200} align="end" button={({ toggle, ref }) => (
              <button ref={ref} className="icb" aria-label="Sort cases" onClick={toggle}><Icon n="sort" s={16} /></button>
            )}>
              {(close) => <>{([["due", "Due soonest"], ["new", "Newest"], ["priority", "Priority"]] as const).map(([k, l]) => <MenuItem key={k} active={sort === k} onClick={() => { setSort(k); close(); }}>{l}</MenuItem>)}</>}
            </Popover>
          </div>
        </div>
        <div className="tabs" role="tablist" aria-label="Views">
          {QUICK.map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>{v}<span className="n">{s.cases.filter((c) => inView(c, v)).length}</span></button>
          ))}
        </div>
      </div>
      <div className="chs" aria-label="Channels">
                {CHANNEL_GROUPS.map((g) => {
          const n = inViewRows.filter((c) => g.channels.includes(c.channel)).length;
          const on = chs.includes(g.key);
          return (
            <button key={g.key} className="chip-f" aria-pressed={on} aria-label={`${g.label}, ${n} cases`} title={g.label}
              onClick={() => setChs(on ? chs.filter((k) => k !== g.key) : [...chs, g.key])}>
              <Chan c={g.channels[0]} s={16} />{n}
            </button>
          );
        })}
        {chs.length > 0 && <button className="link" style={{ fontSize: 12.5, marginLeft: 4 }} onClick={() => setChs([])}>Clear</button>}
      </div>
      <div className="rows">
        {rows.length === 0 && <Empty title="Nothing here">No cases match this view and these filters.</Empty>}
        {rows.map((c) => {
          const cu = customer(c.customerId);
          const turn = turnOf(c);
          return (
            <button key={c.id} className="row" aria-selected={active?.id === c.id} onClick={() => s.go(`/inbox/${c.id}`)}>
              <span className="avw"><Avatar name={cu.name} size={40} /><Chan c={c.channel} s={18} ring /></span>
              <span>
                <span className="l1">
                  {c.unread && <i className="u" aria-label="Unread" />}<b>{cu.name}</b>
                  {c.priority !== "normal" && c.status !== "Resolved" && <Icon n="flag" s={14} className={`flag ${c.priority === "urgent" ? "neg" : "warn"}`} />}
                  <time>{ago(c.opened)}</time>
                </span>
                <span className="sj">{c.subject}</span>
                <span className="l3"><Pill tone={turn.tone} icon={turn.tone === "pri" || turn.tone === "ai" ? "spark" : turn.tone === "warn" && c.callbackAt ? "phone" : undefined}>{turn.label}</Pill><Due c={c} /></span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="lf"><span>{rows.length} of {inViewRows.length} cases</span><span>{sort === "due" ? "Due soonest" : sort === "new" ? "Newest first" : "By priority"}</span></div>
    </section>
  );

  if (single) {
    return active ? <CaseView s={s} c={active} single onBack={() => s.go("/inbox")} prevId={prevId} nextId={nextId} onCustomer={() => setDrawer(true)} drawer={drawer} closeDrawer={() => setDrawer(false)} /> : <div className="work">{list}</div>;
  }
  return (
    <div className={`work ${wide ? "" : "two"}`}>
      {list}
      {active ? (
        <>
          <section className="panel" aria-label="Case">
            <CaseView s={s} c={active} prevId={prevId} nextId={nextId} onCustomer={() => setDrawer(true)} drawer={drawer} closeDrawer={() => setDrawer(false)} />
          </section>
          {wide && <aside className="panel rail" aria-label="Customer"><CustomerRail s={s} c={active} /></aside>}
        </>
      ) : <section className="panel"><Empty title="No case selected">Choose a case from the list.</Empty></section>}
    </div>
  );
}

// ---------------------------------------------------------------- customer rail
export function CustomerRail({ s, c }: { s: Store; c: CaseT }) {
  const cu = customer(c.customerId);
  const ev = eventsFor(cu.id, s.cases, s.notes).filter((e) => e.type === "case_opened" || (e.caseId && !s.cases.some((x) => x.id === e.caseId))).slice(0, 3);
  const goProfile = () => s.go(`/customers/${cu.id}/${c.id}`);
  const stale = c.crmSyncMin > 120;
  return (
    <>
      <div className="sec">
        <div className="who"><Avatar name={cu.name} size={48} /><div><b>{cu.name}</b><span className="sub">{cu.matched ? `${cu.segment} customer since ${cu.since}` : "Not a customer on file"}</span></div></div>
        <div className="tags">
          {cu.matched && cu.kyc && <Pill tone={cu.kyc.status === "Verified" ? "pos" : "warn"} icon="shield">KYC {cu.kyc.status.toLowerCase()}</Pill>}
          {cu.matched && c.verified && <Pill tone="pos">Verified in this {c.channel === "voice" ? "call" : "contact"}</Pill>}
          {!cu.matched && <Pill tone="warn">Not matched</Pill>}
        </div>
        {cu.alerts.map((a) => <div key={a} className={`alert ${a.startsWith("Fraud") ? "" : "warn"}`}><Icon n="alert" s={16} /><span>{a}</span></div>)}
      </div>
      <div className="sec">
        <h3>Details<button className="link" onClick={goProfile}>View profile</button></h3>
        {cu.matched ? (
          <dl className="kv">
            <dt>Customer ID</dt><dd className="mono">{cu.cif}</dd>
            <dt>Branch</dt><dd>{cu.branch}</dd>
            {cu.products.slice(0, 3).map((p) => <Fragment key={p.label}><dt>{p.kind}</dt><dd>{p.label}{p.mask ? ` ${p.mask}` : ""}<small>{p.detail ?? p.status}</small></dd></Fragment>)}
            <dt>Prefers</dt><dd>{CHANNEL_LABEL[cu.preferred]}</dd>
            <dt>Tone now</dt><dd>{c.tone}<small>From the agent's notes</small></dd>
          </dl>
        ) : (
          <dl className="kv"><dt>Handle</dt><dd>{cu.handles.facebook ?? cu.handles.x ?? cu.handles.linkedin}</dd><dt>Source</dt><dd>{CHANNEL_LABEL[c.channel]}</dd><dt>Tone now</dt><dd>{c.tone}</dd></dl>
        )}
        <div className="sync"><Icon n="refresh" s={14} />Bank data synced {c.crmSyncMin < 60 ? `${c.crmSyncMin} min` : `${Math.round(c.crmSyncMin / 60)} h`} ago{stale && <button className="link" onClick={() => s.refreshCrm(c.id)}>Refresh</button>}</div>
      </div>
      <div className="sec">
        <h3>Recent activity<button className="link" onClick={goProfile}>View all</button></h3>
        <ul className="tl">
          {ev.map((e) => (
            <li key={e.id}><Chan c={e.channel ?? "email"} s={18} /><div><b style={{ fontWeight: e.caseId === c.id ? 600 : 500 }}>{e.type === "case_opened" ? e.snippet : e.title}</b><small>{e.caseId === c.id ? `This case, ${c.status.toLowerCase()}` : `${fmtDay(e.at)}, ${(e.caseStatus ?? "resolved").toLowerCase()}`}</small></div></li>
          ))}
          {ev.length === 0 && <li><span /><span className="muted">No earlier contacts.</span></li>}
        </ul>
      </div>
      <div className="sec">
        <h3>Case details</h3>
        <dl className="kv">
          <dt>Category</dt><dd>{c.category}</dd><dt>Unit</dt><dd>{c.unit}</dd>
          <dt>Opened</dt><dd>{fmtTime(c.opened)}</dd><dt>Language</dt><dd>{c.language}</dd>
          <dt>Linked cases</dt><dd>{c.dupOf ? c.dupOf : s.cases.filter((x) => x.customerId === c.customerId && x.id !== c.id).length || "None"}</dd>
        </dl>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- case view
const TEMPLATES = [
  { name: "Acknowledge the request", text: "Thank you for contacting Land Bank. We have received your request and will update you within the deadline." },
  { name: "Ask for a valid ID", text: "To protect your account, please send a clear photo of a valid ID. Never share your PIN or one-time password with anyone." },
  { name: "Close the conversation", text: "We are glad we could help. If you need anything else, reply here and we will be happy to assist." },
];
const TABS = ["Conversation", "Pipeline", "Resolution", "Time", "Attachments", "Activity", "Approvals", "Linked"] as const;
type Tab = (typeof TABS)[number];
const STATUSES: Status[] = ["New", "Open", "Waiting on customer", "Waiting on unit", "Resolved"];
const ROOTS = ["Customer query", "Fraud", "Branch process", "System issue", "Data error", "Other"];

function CaseView({ s, c, single, onBack, prevId, nextId, onCustomer, drawer, closeDrawer }: {
  s: Store; c: CaseT; single?: boolean; onBack?: () => void; prevId: string | null; nextId: string | null;
  onCustomer: () => void; drawer: boolean; closeDrawer: () => void;
}) {
  const cu = customer(c.customerId);
  const wide = useMedia("(min-width: 1301px)");
  const [tab, setTab] = useState<Tab>("Conversation");
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [text, setText] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [seen, setSeen] = useState(c.id);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  if (seen !== c.id) { setSeen(c.id); setText(null); setNoteText(""); setTab("Conversation"); setMode("reply"); }

  // ticket timer: starts when the owner opens the case, pauses when they leave
  const timer = s.timers[c.id] ?? { running: false, seconds: 0 };
  const sref = useRef(s);
  sref.current = s;
  useEffect(() => {
    if (c.assignee === "ana" && isOpen(c)) sref.current.setTimer(c.id, true);
    return () => sref.current.setTimer(c.id, false);
  }, [c.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!timer.running) return;
    const h = window.setInterval(() => sref.current.tick(c.id), 1000);
    return () => window.clearInterval(h);
  }, [timer.running, c.id]);
  const clock = `${String(Math.floor(timer.seconds / 3600)).padStart(2, "0")}:${String(Math.floor((timer.seconds % 3600) / 60)).padStart(2, "0")}:${String(timer.seconds % 60).padStart(2, "0")}`;

  const turn = turnOf(c);
  const d = dueLabel(c.due);
  const draftText = text ?? c.draft?.text ?? "";
  const edited = text !== null && c.draft !== undefined && text !== c.draft.text;
  const needsCare = c.draft ? c.draft.confidence < 0.85 : false;
  const stale = c.crmSyncMin > 120 && isOpen(c);
  const dupOpen = c.dupOf && !s.dupDecided[c.id] && isOpen(c);
  const warnSecret = /(send|share|give|tell|provide|confirm).{0,30}(pin|otp|one-time|password)/i.test(draftText);
  const kind = agentKind(c.channel);
  const steps = PIPE[kind];
  const [stepId, setStepId] = useState<string | null>(null);
  const chosen = steps.find((x) => x.id === stepId) ?? steps.find((x) => stepState(c, x) !== "done") ?? steps[steps.length - 1];
  const stageName = c.stage > 8 ? "Learn" : OUTER[c.stage];
  const notes = s.notes.filter((n) => n.caseId === c.id);
  const entries = s.entries.filter((e) => e.caseId === c.id);
  const logged = entries.reduce((a, e) => a + e.minutes, 0);
  const [mins, setMins] = useState("10");
  const [tnote, setTnote] = useState("");
  const [rnote, setRnote] = useState("");
  const [root, setRoot] = useState(ROOTS[0]);
  const [notify, setNotify] = useState(true);

  const conv = [
    ...c.messages.map((m) => ({ at: m.at, kind: "msg" as const, m })),
    ...notes.map((n) => ({ at: n.at, kind: "note" as const, n })),
    ...(c.assignee ? [{ at: c.opened + 300000, kind: "sys" as const, text: `Assigned to ${staffName(c.assignee)}, ${c.unit} unit, ${fmtTime(c.opened + 300000)}` }] : []),
  ].sort((a, b) => a.at - b.at);
  const activity = [
    { at: c.opened, text: `Case opened from ${CHANNEL_LABEL[c.channel]} by ${agentOf(c)}` },
    { at: c.opened + 4000, text: `Routed to the ${c.unit} unit. Deadline ${fmtTime(c.due)}` },
    ...(c.assignee ? [{ at: c.opened + 300000, text: `Assigned to ${staffName(c.assignee)}` }] : []),
    ...(s.activity[c.id] ?? []),
  ].sort((a, b) => b.at - a.at);

  const doSend = () => { s.send(c.id, draftText.trim(), !!c.draft && !edited); setText(null); };
  const channelNote = c.channel === "facebook" ? "Public reply on Facebook" : `Sends on ${CHANNEL_LABEL[c.channel]}`;
  const focusComposer = (m: "reply" | "note") => { setMode(m); window.setTimeout(() => (document.querySelector(".compose textarea") as HTMLTextAreaElement | null)?.focus(), 0); };

  return (
    <div className="case">
      <div className="ch-head">
        <div className="crumb">
          {single && <button className="icb" aria-label="Back to inbox" onClick={onBack} style={{ marginLeft: -8 }}><Icon n="left" s={18} /></button>}
          <span className="mono">{c.id}</span>
          <span className="sp">
            <Popover width={230} align="end" button={({ toggle, ref }) => (
              <button ref={ref} className="menu" onClick={toggle} aria-label="Assignee">{c.assignee ? <Avatar name={staffName(c.assignee)} size={22} /> : <Icon n="user" s={16} />}{c.assignee ? firstName(staffName(c.assignee)) : "Unassigned"}<Icon n="down" s={14} /></button>
            )}>
              {(close) => <><MenuItem active={!c.assignee} onClick={() => { s.assign(c.id, null); close(); }}>Unassigned</MenuItem>
                {STAFF.map((p) => <MenuItem key={p.id} active={c.assignee === p.id} onClick={() => { s.assign(c.id, p.id); close(); }}>{p.name}</MenuItem>)}</>}
            </Popover>
            <button className="timer" aria-label={timer.running ? "Pause the ticket timer" : "Start the ticket timer"} onClick={() => s.setTimer(c.id, !timer.running)}>
              <Icon n={timer.running ? "pause" : "play"} s={14} />{clock}
            </button>
            <button className="icb" aria-label="Previous case" disabled={!prevId} onClick={() => prevId && s.go(`/inbox/${prevId}`)}><Icon n="left" s={16} /></button>
            <button className="icb" aria-label="Next case" disabled={!nextId} onClick={() => nextId && s.go(`/inbox/${nextId}`)}><Icon n="right" s={16} /></button>
            <Popover width={230} align="end" button={({ toggle, ref }) => <button ref={ref} className="icb" aria-label="More actions" onClick={toggle}><Icon n="more" s={16} /></button>}>
              {(close) => <>
                {c.status === "Resolved" ? <MenuItem icon="refresh" onClick={() => { s.reopen(c.id); close(); }}>Reopen case</MenuItem> : null}
                {["Request an extension", "Link to another case", "Merge with a duplicate", "Split into two cases", "Change customer"].map((l) => <MenuItem key={l} onClick={() => { s.toast(`${l}: not part of the prototype`); close(); }}>{l}</MenuItem>)}
              </>}
            </Popover>
          </span>
        </div>
        {single ? <h1>{c.subject}</h1> : <h2>{c.subject}</h2>}
        <div className="meta">
          <Popover width={220} button={({ toggle, ref }) => <button ref={ref} style={{ background: "none", border: 0, padding: 0 }} onClick={toggle} aria-label="Change status"><StatusPill status={c.status} /></button>}>
            {(close) => <>{STATUSES.map((x) => <MenuItem key={x} active={c.status === x} onClick={() => { s.setStatus(c.id, x); close(); }}>{x}</MenuItem>)}</>}
          </Popover>
          <PriorityPill p={c.priority} />
          <span className="sep" /><Chan c={c.channel} s={18} /><span>{CHANNEL_LABEL[c.channel]}</span>
          <span className="sep" />
          <button className="link" onClick={() => s.go(`/customers/${cu.id}/${c.id}`)}>{cu.name}</button>
          {!wide && <button className="btn g sm only-narrow" onClick={onCustomer}><Icon n="user" s={14} />Customer details</button>}
        </div>
        <div className="tool">
          <button className="btn sm" onClick={() => focusComposer("reply")}><Icon n="reply" s={16} />Reply</button>
          <button className="btn sm" onClick={() => focusComposer("note")}><Icon n="note" s={16} />Note</button>
          <button className="btn sm" onClick={() => s.startCall(c.id)} disabled={!cu.matched}><Icon n="phone" s={16} />Call</button>
          <Popover width={220} button={({ toggle, ref }) => <button ref={ref} className="btn sm" onClick={toggle}>Endorse<Icon n="down" s={14} /></button>}>
            {(close) => <>{UNITS.filter((u) => u !== c.unit).map((u) => <MenuItem key={u} onClick={() => { s.endorse(c.id, u); close(); }}>{u}</MenuItem>)}</>}
          </Popover>
          <button className="btn sm" onClick={() => setTab("Resolution")}><Icon n="check" s={16} />Resolve</button>
        </div>
      </div>

      <div className="cscroll" ref={bodyRef}>
        <div className="stage" aria-label="Case stage">
          <div className="top2">
            <b>{c.status === "Resolved" ? (c.handledByAI ? "Closed by the AI agent" : "Resolved") : turn.tone === "pri" ? "Your turn: approve the AI draft" : turn.tone === "ai" ? "The AI agent is working on it" : turn.label === "With you" ? "Your turn: reply or resolve" : turn.label.startsWith("Call back") ? `Your turn: call back at ${c.callbackAt}` : turn.label}</b>
            <span>{c.stage > 8 ? "All 9 stages done" : `${stageName}, stage ${c.stage + 1} of 9`}</span>
            <span className={`r ${c.status === "Resolved" || d.tone === "ok" ? "ok" : ""}`}>{c.status === "Resolved" ? "Closed" : d.text}</span>
          </div>
          <div className="seg" role="img" aria-label={`Stage ${Math.min(c.stage + 1, 9)} of 9`}>
            {OUTER.map((o, i) => <i key={o} className={i < c.stage ? "d" : i === c.stage ? (c.aiWorking ? "a" : "n") : ""} title={o} />)}
          </div>
        </div>
        {stale && <div className="bannr warn"><Icon n="alert" s={16} />Bank data is {Math.round(c.crmSyncMin / 60)} hours old and may have changed. Refresh before you approve.<span className="sp"><button className="btn sm" onClick={() => s.refreshCrm(c.id)}><Icon n="refresh" s={14} />Refresh</button></span></div>}
        {dupOpen && c.dupOf && <div className="bannr info"><Icon n="link" s={16} />Same issue as <button className="link" onClick={() => s.go(`/inbox/${c.dupOf}`)}>{c.dupOf}</button>, which is open. Join it or keep this one separate.<span className="sp"><button className="btn sm p" onClick={() => s.decideDup(c.id, true)}>Join case</button><button className="btn sm" onClick={() => s.decideDup(c.id, false)}>Keep separate</button></span></div>}
        <div className="sum">
          <header><b><Icon n="spark" s={16} />AI summary</b><span>{agentOf(c)}, {fmtTime(c.opened + 360000)}</span><button className="btn g sm sp" style={{ height: 28 }} onClick={() => s.toast("Summary refreshed")}><Icon n="refresh" s={14} />Refresh</button></header>
          <div className="cols">
            <div className="wide"><h3>Issue</h3><p>{c.summary.issue}</p></div>
            <div><h3>Steps taken</h3><p>{c.summary.steps}</p></div>
            <div><h3>Suggested next step</h3><p>{c.summary.next}</p></div>
          </div>
        </div>

        <div className="ctabs" role="tablist" aria-label="Case sections">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t}{t === "Conversation" && <span className="n">{c.messages.length + notes.length}</span>}{t === "Time" && <span className="n">{entries.length}</span>}{t === "Attachments" && c.attachments.length > 0 && <span className="n">{c.attachments.length}</span>}
            </button>
          ))}
        </div>

        <div className="tabbody">
          {tab === "Conversation" && (
            <div>
              {conv.map((it, i) => {
                if (it.kind === "sys") return <div key={`s${i}`} className="sys">{it.text}</div>;
                if (it.kind === "note") return (
                  <div key={it.n.id} className="msg note"><Avatar name={staffName(it.n.by)} size={36} />
                    <div><div className="h"><b>{staffName(it.n.by)}</b><Pill tone="warn">Private note</Pill><time>{fmtTime(it.n.at)}</time></div><p>{it.n.text}</p></div></div>
                );
                const m = it.m;
                return (
                  <div key={m.id} className="msg">
                    <Avatar name={m.who} size={36} ai={m.from === "agent"} />
                    <div>
                      <div className="h"><b>{m.who}</b>{m.from === "customer" && <Pill>Customer</Pill>}{m.from === "agent" && <Pill tone="ai">AI agent</Pill>}<time>{fmtTime(m.at)}</time><Chan c={m.channel} s={16} /></div>
                      <p>{m.text}</p>
                      {m.call && <CallBox call={m.call} />}
                      {m.delivery && <div className="dl">{m.delivery}</div>}
                    </div>
                  </div>
                );
              })}
              {c.status === "Resolved" && <div className="sys">Case resolved {c.resolution ? fmtTime(c.resolution.at) : ""}</div>}
            </div>
          )}

          {tab === "Pipeline" && (
            <div className="pl">
              <div className="plist" role="list">
                {steps.map((st, i) => {
                  const state = stepState(c, st);
                  return (
                    <button key={st.id} className={`pst ${state}`} aria-selected={chosen.id === st.id} onClick={() => setStepId(st.id)}>
                      <span className="dotp">{state === "done" && <Icon n="check" s={11} />}</span>
                      <span>{st.name}<span className="ot">{OUTER[st.outer]}</span></span>
                      <span className="tm">{state === "done" ? fmtClock(stepTime(c, i)) : state === "now" ? "Needs you" : state === "ai" ? "Running" : "Next"}</span>
                    </button>
                  );
                })}
              </div>
              <div className="evid">
                <h3>{chosen.name}</h3>
                {(() => { const e = evidence(c, chosen); const state = stepState(c, chosen); return (
                  <dl>
                    <div><dt>State</dt><dd>{state === "done" ? "Done" : state === "now" ? "Waiting for a person" : state === "ai" ? "The agent is running this step" : "Not started"}</dd></div>
                    <div><dt>Went in</dt><dd>{e.input}</dd></div>
                    <div><dt>Came out</dt><dd>{state === "todo" ? "Nothing yet" : e.output}</dd></div>
                    {e.confidence !== undefined && state !== "todo" && <div><dt>Confidence</dt><dd>{Math.round(e.confidence * 100)}%</dd></div>}
                    {chosen.ms > 0 && state === "done" && <div><dt>Took</dt><dd>{(chosen.ms / 1000).toFixed(1)} s</dd></div>}
                  </dl>); })()}
              </div>
            </div>
          )}

          {tab === "Resolution" && (c.resolution ? (
            <div style={{ maxWidth: 520, paddingTop: 12 }}>
              <dl className="kv" style={{ gridTemplateColumns: "130px 1fr" }}>
                <dt>Resolved</dt><dd>{fmtTime(c.resolution.at)}</dd><dt>Resolution note</dt><dd>{c.resolution.note}</dd>
                <dt>Root cause</dt><dd>{c.resolution.root}</dd><dt>Customer told</dt><dd>{c.resolution.notified ? "Yes" : "No"}</dd>
              </dl>
              <div className="acts" style={{ marginTop: 16 }}><button className="btn" onClick={() => s.reopen(c.id)}><Icon n="refresh" s={16} />Reopen case</button></div>
            </div>
          ) : (
            <div style={{ maxWidth: 520, paddingTop: 12 }}>
              <div className="field"><label htmlFor="rn">Resolution note</label><textarea id="rn" className="textarea" value={rnote} onChange={(e) => setRnote(e.target.value)} placeholder="What was done to solve it" /></div>
              <div className="field"><label htmlFor="rr">Root cause</label><select id="rr" className="select" value={root} onChange={(e) => setRoot(e.target.value)}>{ROOTS.map((r) => <option key={r}>{r}</option>)}</select></div>
              <label className="check" style={{ marginBottom: 16 }}><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />Tell the customer on {CHANNEL_LABEL[c.channel]}</label>
              <button className="btn p" disabled={!rnote.trim()} onClick={() => { s.resolve(c.id, rnote.trim(), root, notify); setRnote(""); }}><Icon n="check" s={16} />Resolve case</button>
            </div>
          ))}

          {tab === "Time" && (
            <div style={{ paddingTop: 12, maxWidth: 640 }}>
              <div className="kpis three" style={{ marginBottom: 16 }}>
                <div className="kpi"><div className="l">Logged</div><div className="v">{logged}<small> min</small></div></div>
                <div className="kpi"><div className="l">Running timer</div><div className="v">{Math.floor(timer.seconds / 60)}<small> min</small></div><div className="d">{timer.running ? "Counting" : "Paused"}</div></div>
                <div className="kpi"><div className="l">Total</div><div className="v">{logged + Math.floor(timer.seconds / 60)}<small> min</small></div></div>
              </div>
              <table className="tbl"><thead><tr><th>Person</th><th>When</th><th className="num">Minutes</th><th>Note</th></tr></thead>
                <tbody>{entries.map((e) => <tr key={e.id}><td>{staffName(e.by)}</td><td>{fmtTime(e.at)}</td><td className="num">{e.minutes}</td><td>{e.note}</td></tr>)}
                  {entries.length === 0 && <tr><td colSpan={4} className="muted">No time logged yet.</td></tr>}</tbody></table>
              <div className="filters" style={{ marginTop: 16 }}>
                <input className="input" style={{ width: 90, minWidth: 90 }} type="number" min={1} aria-label="Minutes" value={mins} onChange={(e) => setMins(e.target.value)} />
                <input className="input" style={{ minWidth: 220 }} aria-label="Note" placeholder="What did you do" value={tnote} onChange={(e) => setTnote(e.target.value)} />
                <button className="btn" onClick={() => { const n = parseInt(mins, 10); if (n > 0) { s.addTime(c.id, n, tnote.trim() || "Manual entry"); setTnote(""); } }}>Add entry</button>
                <button className="btn g" disabled={timer.seconds < 60} onClick={() => { s.addTime(c.id, Math.max(1, Math.round(timer.seconds / 60)), "Ticket timer"); }}>Log the timer</button>
              </div>
            </div>
          )}

          {tab === "Attachments" && (
            <div style={{ paddingTop: 8 }}>
              {c.attachments.length === 0 ? <Empty title="No attachments">Files from email and chat appear here.</Empty> : c.attachments.map((a) => (
                <div key={a.name} className="line-item"><Icon n="clip" s={16} /><div className="grow"><b style={{ fontWeight: 500 }}>{a.name}</b><div className="muted" style={{ fontSize: 12 }}>{a.size}, read by the {agentOf(c).toLowerCase()}</div></div><button className="btn sm" onClick={() => s.toast("Download is not part of the prototype")}>Download</button></div>
              ))}
            </div>
          )}

          {tab === "Activity" && (
            <ul className="tl" style={{ paddingTop: 14 }}>
              {activity.map((a, i) => <li key={i}><Icon n="clock" s={16} /><div>{a.text}<small>{fmtTime(a.at)}, {agoLong(a.at)}</small></div></li>)}
            </ul>
          )}

          {tab === "Approvals" && (
            <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              {c.draft ? <div className="quote"><b>Draft reply waiting.</b> {agentOf(c)} is {Math.round(c.draft.confidence * 100)}% confident. <button className="link" onClick={() => focusComposer("reply")}>Review it in the composer</button></div> : <div className="muted">No draft is waiting on this case.</div>}
              {s.extensions.filter((x) => x.caseId === c.id).map((x) => <div key={x.id} className="quote"><b>Extension requested by {staffName(x.by)}.</b> Deadline moves from {fmtTime(x.oldDue)} to {fmtTime(x.newDue)}. {x.reason}</div>)}
            </div>
          )}

          {tab === "Linked" && (
            <div style={{ paddingTop: 8 }}>
              {[...(c.dupOf ? [caseById(c.dupOf)] : []), ...s.cases.filter((x) => x.customerId === c.customerId && x.id !== c.id && x.id !== c.dupOf)].map((x) => (
                <div key={x.id} className="line-item"><Chan c={x.channel} s={18} /><div className="grow"><button className="rowlink" onClick={() => s.go(`/inbox/${x.id}`)}>{x.subject}</button><div className="muted" style={{ fontSize: 12 }}>{x.id}{x.id === c.dupOf ? ", same issue" : ""}</div></div><StatusPill status={x.status} /></div>
              ))}
              {!c.dupOf && s.cases.filter((x) => x.customerId === c.customerId && x.id !== c.id).length === 0 && <Empty title="No linked cases">Cases about the same issue appear here.</Empty>}
            </div>
          )}
        </div>
      </div>

      {c.status !== "Resolved" ? (
        <div className="compose">
          <div className="ctop">
            <button className="tb" aria-selected={mode === "reply"} onClick={() => setMode("reply")}>Reply</button>
            <button className="tb" aria-selected={mode === "note"} onClick={() => setMode("note")}>Private note</button>
            <span className="sp">{mode === "reply" ? <><Chan c={c.channel} s={16} />{channelNote}</> : "Only staff see this"}</span>
          </div>
          {mode === "reply" ? (
            <>
              {c.draft && (
                <div className="draftbar">
                  <Pill tone="ai" icon="spark">AI draft</Pill>
                  <span className={`conf ${needsCare ? "low" : ""}`}><i><b style={{ width: `${Math.round(c.draft.confidence * 100)}%` }} /></i>{Math.round(c.draft.confidence * 100)}% confident{needsCare ? ", read it carefully" : ""}</span>
                  {edited && <Pill tone="warn">Edited, saved for learning</Pill>}
                  <span className="r">
                    <Popover width={300} align="end" button={({ toggle, ref }) => <button ref={ref} className="link" style={{ fontSize: 12.5 }} onClick={toggle}>Why this draft</button>}>
                      {() => <div className="why"><b>Article used</b>{c.draft!.article}<b style={{ marginTop: 8 }}>Based on</b>{c.summary.steps}</div>}
                    </Popover>
                    <button className="link" style={{ fontSize: 12.5 }} onClick={() => { s.regenerate(c.id); setText(null); }}>Regenerate</button>
                  </span>
                </div>
              )}
              <textarea className="ta" aria-label="Reply" rows={3} placeholder="Write a reply" value={draftText} onChange={(e) => setText(e.target.value)} />
              {warnSecret && <div className="bannr warn" style={{ margin: "0 14px 8px" }}><Icon n="alert" s={16} />Never ask a customer for a PIN or one-time password.</div>}
              <div className="cbot">
                <button className="icb" aria-label="Attach a file" onClick={() => s.toast("Attachments are not part of the prototype")}><Icon n="clip" s={16} /></button>
                <Popover width={290} button={({ toggle, ref }) => <button ref={ref} className="icb" aria-label="Insert a template" onClick={toggle}><Icon n="note" s={16} /></button>}>
                  {(close) => <><h5>Approved templates</h5>{TEMPLATES.map((tp) => <MenuItem key={tp.name} onClick={() => { setText(tp.text); close(); }}>{tp.name}</MenuItem>)}</>}
                </Popover>
                <span className="via">{c.language.split(",")[0]}</span>
                <span className="sp">
                  {c.draft && <button className="btn g sm" onClick={() => s.discard(c.id)}>Discard</button>}
                  <button className="btn p sm" disabled={!draftText.trim()} onClick={doSend}><Icon n="check" s={16} />{c.draft && !edited ? "Approve and send" : "Send reply"}</button>
                </span>
              </div>
            </>
          ) : (
            <>
              <textarea className="ta" aria-label="Private note" rows={3} placeholder="Write a note for your team. The customer never sees it." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <div className="cbot"><span className="sp"><button className="btn p sm" disabled={!noteText.trim()} onClick={() => { s.addNote(c.customerId, noteText.trim(), false, c.id); setNoteText(""); setMode("reply"); }}>Save note</button></span></div>
            </>
          )}
        </div>
      ) : (
        <div className="compose" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Icon n="check" s={16} /><span className="grow">This case is resolved. Reopen it to reply.</span><button className="btn sm" onClick={() => s.reopen(c.id)}>Reopen</button>
        </div>
      )}

      {drawer && !wide && (
        <div className="drawer" onClick={closeDrawer}><div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Customer details">
          <div className="sec" style={{ paddingBottom: 0 }}><button className="btn g sm" onClick={closeDrawer}><Icon n="x" s={16} />Close</button></div>
          <CustomerRail s={s} c={c} />
        </div></div>
      )}
    </div>
  );
}
void fmtDur;
