import { Fragment, useMemo, useState } from "react";
import {
  CHANNEL_GROUPS, CHANNEL_LABEL, CUSTOMERS, EV_LABEL, NOW, STAFF, agoLong, ago, customer, dayHeader, dayKey, dueLabel, eventsFor, fmtClock, fmtTime, staffName,
  type CaseT, type Customer, type EvType, type TimelineEvent,
} from "./data";
import { CallBox, Due, StatusPill, Titlebar } from "./parts";
import { isOpen, type Store } from "./store";
import { Avatar, Chan, Empty, Icon, MenuItem, Pill, Popover, useMedia } from "./ui";

const NODE_ICON: Record<EvType, string> = {
  message_in: "mail", message_out: "reply", ai_draft: "spark", call: "phone", case_opened: "inbox", case_status: "check",
  assignment: "user", note: "note", identity: "shield", linked: "link",
};

// ---------------------------------------------------------------- customers list
export function Customers({ s, selected, from }: { s: Store; selected: string | null; from: string | null }) {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("All");
  if (selected && CUSTOMERS.some((c) => c.id === selected)) return <Profile s={s} id={selected} from={from} />;
  const segs = ["All", "Retail", "Agri loan", "Business", "Digital", "Public post"];
  const rows = CUSTOMERS.filter((c) => (seg === "All" || c.segment === seg) && (c.name + c.cif + c.branch).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="view"><div className="page">
      <Titlebar title="Customers" sub="Everyone who has contacted the bank, with every case and channel in one place">
        <input className="input" style={{ width: 240 }} placeholder="Search by name, ID or branch" aria-label="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
      </Titlebar>
      <div className="seg-ctl" role="group" aria-label="Segment" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
        {segs.map((x) => <button key={x} aria-pressed={seg === x} onClick={() => setSeg(x)}>{x}</button>)}
      </div>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Customer</th><th>Customer ID</th><th>Segment</th><th>Branch</th><th>Bank record</th><th className="num">Open cases</th><th>Prefers</th></tr></thead>
          <tbody>
            {rows.map((c) => {
              const open = s.cases.filter((x) => x.customerId === c.id && isOpen(x)).length;
              return (
                <tr key={c.id} className="click" onClick={() => s.go(`/customers/${c.id}`)}>
                  <td><span className="item-top"><Avatar name={c.name} size={32} /><button className="rowlink" onClick={(e) => { e.stopPropagation(); s.go(`/customers/${c.id}`); }}>{c.name}</button></span></td>
                  <td className="mono">{c.cif || "Not matched"}</td>
                  <td>{c.segment}</td>
                  <td>{c.branch}</td>
                  <td>{c.matched ? <Pill tone="pos">Matched</Pill> : <Pill tone="warn">Not matched</Pill>}</td>
                  <td className="num">{open || "None"}</td>
                  <td><span className="item-top"><Chan c={c.preferred} s={18} />{CHANNEL_LABEL[c.preferred]}</span></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={7}><Empty title="No customers found">Try another name or ID.</Empty></td></tr>}
          </tbody>
        </table>
      </div>
    </div></div>
  );
}

// ---------------------------------------------------------------- profile page
type PTab = "Timeline" | "Cases" | "Details" | "Documents" | "Audit trail" | "Notes";

function Profile({ s, id, from }: { s: Store; id: string; from: string | null }) {
  const cu = customer(id);
  const wide = useMedia("(min-width: 1301px)");
  const single = useMedia("(max-width: 900px)");
  const [tab, setTab] = useState<PTab>("Timeline");
  const cases = s.cases.filter((c) => c.customerId === id).sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || b.opened - a.opened);
  const open = cases.filter(isOpen);
  const overdue = open.filter((c) => c.due < NOW);
  const events = eventsFor(id, s.cases, s.notes);
  const contacts30 = events.filter((e) => e.byKind === "customer" && NOW - e.at <= 30 * 86400000).length;
  const repeat = cases.filter((c) => c.repeat || c.dupOf).length;
  const dup = cu.dupOf && !s.merged[cu.id] && !s.merged[cu.dupOf] ? customer(cu.dupOf) : null;
  const tabs: PTab[] = ["Timeline", "Cases", "Details", "Documents", "Audit trail", ...(!wide ? (["Notes"] as PTab[]) : [])];
  const latestOpen = open[0];
  const sync = "2 min ago";
  const logAudit = s.activity[`cust:${id}`] ?? [];

  const left = (
    <div className="prof">
      <button className="link" onClick={() => (from ? s.go(`/inbox/${from}`) : s.go("/customers"))} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Icon n="left" s={16} />{from ? `Back to case ${from}` : "All customers"}
      </button>
      <div className="who"><Avatar name={cu.name} size={56} /><div><h1>{cu.name}</h1><span className="sub">{cu.matched ? `${cu.segment}, customer since ${cu.since}` : "Not a customer on file"}</span></div></div>
      <div className="tags" style={{ marginTop: -4 }}>
        {cu.matched && <Pill tone="pos" icon="check">In the bank's records</Pill>}
        {cu.verifiedNow && <Pill tone="pos">Verified in the latest contact</Pill>}
        {!cu.matched && <Pill tone="warn">Not matched</Pill>}
        {s.linked[cu.id] && <Pill tone="pri">Linked to {customer(s.linked[cu.id]).name}</Pill>}
      </div>
      {cu.alerts.map((a) => <div key={a} className={`alert ${a.startsWith("Fraud") ? "" : "warn"}`} style={{ marginTop: 0 }}><Icon n="alert" s={16} /><span>{a}</span></div>)}
      {dup && (
        <div className="bannr info" style={{ margin: 0 }}><Icon n="layers" s={16} /><span>Possible duplicate profile: <b>{dup.name}</b>, same mobile ending 0198 and branch.</span>
          <span className="sp"><button className="btn sm p" onClick={() => s.mergeProfile(cu.id, dup.id)}>Merge</button><button className="btn sm" onClick={() => s.toast("Marked as not a duplicate")}>Not a duplicate</button></span></div>
      )}
      <div className="actbar">
        <button onClick={() => { setTab(wide ? "Timeline" : "Notes"); window.setTimeout(() => (document.getElementById("newnote") as HTMLTextAreaElement | null)?.focus(), 50); }}><Icon n="note" s={18} />Note</button>
        <button onClick={() => s.toast("Creating a case is not part of the prototype")}><Icon n="plus" s={18} />Case</button>
        <button onClick={() => (latestOpen ? s.go(`/inbox/${latestOpen.id}`) : s.toast("No open case. Create a case first"))}><Icon n="reply" s={18} />Reply</button>
        <button disabled={!cu.matched} onClick={() => (latestOpen ? s.startCall(latestOpen.id) : s.toast("Open a case to place a call"))}><Icon n="phone" s={18} />Call</button>
      </div>
      <Popover width={230} button={({ toggle, ref }) => <button ref={ref} className="btn sm" onClick={toggle} style={{ alignSelf: "flex-start" }}>More<Icon n="down" s={14} /></button>}>
        {(close) => <>
          {!cu.matched && <MenuItem icon="link" onClick={() => { close(); document.getElementById("linkbox")?.scrollIntoView({ block: "center" }); }}>Link contact to a customer</MenuItem>}
          <MenuItem icon="layers" onClick={() => { s.toast("Choose the duplicate in the banner when one is found"); close(); }}>Merge profile</MenuItem>
          <MenuItem icon="flag" onClick={() => { s.toast("Profile flagged for the team manager"); close(); }}>Flag profile</MenuItem>
        </>}
      </Popover>

      <div className="contact">
        {cu.mobile && <div><Icon n="phone" s={16} /><span>{cu.mobile}</span>{cu.preferred === "voice" && <Icon n="star" s={14} className="flag warn" />}</div>}
        {cu.email && <div><Icon n="mail" s={16} /><span>{cu.email}</span>{cu.preferred === "email" && <Icon n="star" s={14} className="flag warn" />}</div>}
        {cu.handles.facebook && <div><Chan c="facebook" s={16} /><span>{cu.handles.facebook}</span>{cu.matched && <Icon n="check" s={14} className="flag" />}</div>}
        {cu.handles.x && <div><Chan c="x" s={16} /><span>{cu.handles.x}</span></div>}
        {cu.handles.linkedin && <div><Chan c="linkedin" s={16} /><span>{cu.handles.linkedin}</span><Icon n="check" s={14} className="flag" /></div>}
        {!cu.mobile && !cu.email && !cu.handles.facebook && !cu.handles.x && !cu.handles.linkedin && <span className="muted">No contact details on file.</span>}
      </div>

      {cu.matched ? (
        <>
          <div className="stats">
            <div className="stat"><b>{open.length}</b><span>Open cases</span></div>
            <div className={`stat ${overdue.length ? "hot" : ""}`}><b>{overdue.length}</b><span>Overdue</span></div>
            <div className="stat"><b>{contacts30}</b><span>Contacts, 30 days</span></div>
            <div className="stat"><b>{repeat}</b><span>Repeat contacts</span></div>
            <div className="stat"><b>{cu.tone}</b><span>Tone now</span></div>
            <div className="stat"><b>{cu.avgResolveH ? `${cu.avgResolveH} h` : "None"}</b><span>Average to resolve</span></div>
          </div>
          <dl className="kv" style={{ gridTemplateColumns: "92px minmax(0, 1fr)" }}>
            <dt>Customer ID</dt><dd className="mono">{cu.cif}</dd><dt>Branch</dt><dd>{cu.branch}</dd><dt>Language</dt><dd>{cu.language}</dd><dt>Prefers</dt><dd>{CHANNEL_LABEL[cu.preferred]}</dd>
          </dl>
          <div className="sync" style={{ marginTop: -4 }}><Icon n="refresh" s={14} />Bank data synced {sync}<button className="link" onClick={() => s.toast("Bank data refreshed")}>Refresh</button></div>
        </>
      ) : (
        <LinkBox s={s} cu={cu} />
      )}
    </div>
  );

  const mid = (
    <section className="panel cust-mid" aria-label="Customer activity">
      <div className="aistrip">
        <header><Icon n="spark" s={16} />AI summary<button className="btn g sm sp" style={{ height: 28 }} onClick={() => s.toast("Summary refreshed")}><Icon n="refresh" s={14} />Refresh</button></header>
        {summaryFor(cu, cases, open)}
      </div>
      <div className="ctabs" role="tablist" aria-label="Customer sections">
        {tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}{t === "Cases" && <span className="n">{cases.length}</span>}</button>)}
      </div>
      <div className="tabbody">
        {tab === "Timeline" && <TimelineView s={s} events={events} cases={cases} from={from} cu={cu} />}
        {tab === "Cases" && <CasesTable s={s} cases={cases} />}
        {tab === "Details" && <DetailsView s={s} cu={cu} />}
        {tab === "Documents" && (
          <div style={{ paddingTop: 8 }}>
            {cases.flatMap((c) => c.attachments.map((a) => ({ a, c }))).map(({ a, c }) => (
              <div key={c.id + a.name} className="line-item"><Icon n="clip" s={16} /><div className="grow"><b style={{ fontWeight: 500 }}>{a.name}</b><div className="muted" style={{ fontSize: 12 }}>{a.size}, from case {c.id}</div></div><button className="btn sm" onClick={() => s.toast("Download is not part of the prototype")}>Download</button></div>
            ))}
            {cases.every((c) => c.attachments.length === 0) && <Empty title="No documents">Files from this customer's cases appear here.</Empty>}
          </div>
        )}
        {tab === "Audit trail" && (
          <ul className="tl" style={{ paddingTop: 14 }}>
            {[...logAudit.map((l) => ({ at: l.at, text: l.text })), { at: NOW - 120000, text: "Bank data refreshed from the CRM" }, { at: NOW - 600000, text: `Profile opened by ${staffName("ana")}` }].sort((a, b) => b.at - a.at)
              .map((l, i) => <li key={i}><Icon n="clock" s={16} /><div>{l.text}<small>{fmtTime(l.at)}, {agoLong(l.at)}</small></div></li>)}
          </ul>
        )}
        {tab === "Notes" && <NotesPanel s={s} cu={cu} cases={cases} />}
      </div>
    </section>
  );

  if (single) {
    return <div className="cust"><section className="panel">{left}</section>{mid}</div>;
  }
  return (
    <div className="cust">
      <aside className="panel" aria-label="Profile">{left}</aside>
      {mid}
      {wide && <aside className="panel notes-panel" aria-label="Notes"><NotesPanel s={s} cu={cu} cases={cases} /></aside>}
    </div>
  );
}

function summaryFor(cu: Customer, cases: CaseT[], open: CaseT[]) {
  if (!cu.matched) return <p>{cu.name} is not a customer on file. {cases[0] ? `Posted publicly on ${CHANNEL_LABEL[cases[0].channel]}: ${cases[0].summary.issue}` : "No posts yet."} Tone is {cu.tone.toLowerCase()}. Link the profile after a private message confirms who they are.</p>;
  if (open.length === 0) return <p>{cu.name} has no open case. Last contact was about {cases[0]?.subject.toLowerCase() ?? "an earlier question"}. Tone is {cu.tone.toLowerCase()}.</p>;
  return <p>{cu.name} has {open.length} open case{open.length > 1 ? "s" : ""}, mainly about {open[0].subject.toLowerCase()}. {open[0].summary.next} Tone is {cu.tone.toLowerCase()}.</p>;
}

function LinkBox({ s, cu }: { s: Store; cu: Customer }) {
  const [q, setQ] = useState("");
  const matches = CUSTOMERS.filter((c) => c.matched && c.name.toLowerCase().includes(q.toLowerCase()) && q.length > 0);
  const invited = s.cases.some((c) => c.customerId === cu.id && c.draft);
  return (
    <div id="linkbox" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <dl className="kv" style={{ gridTemplateColumns: "92px minmax(0, 1fr)" }}><dt>Private message</dt><dd>{invited ? "Invite drafted, waiting for approval" : "Not invited yet"}</dd><dt>Source</dt><dd>Public posts</dd></dl>
      <div className="field" style={{ marginBottom: 0 }}><label htmlFor="lk">Link to a customer</label><input id="lk" className="input" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {matches.map((m) => (
        <div key={m.id} className="line-item" style={{ padding: "6px 0" }}><Avatar name={m.name} size={28} /><div className="grow">{m.name}<div className="muted" style={{ fontSize: 12 }}>{m.cif}, {m.branch}</div></div>
          <button className="btn sm p" onClick={() => s.linkContact(cu.id, m.id)}>Link</button></div>
      ))}
      <div className="muted" style={{ fontSize: 12 }}>After linking, this history joins the customer's timeline.</div>
    </div>
  );
}

// ---------------------------------------------------------------- timeline
function TimelineView({ s, events, cases, from, cu }: { s: Store; events: TimelineEvent[]; cases: CaseT[]; from: string | null; cu: Customer }) {
  const [chs, setChs] = useState<string[]>([]);
  const [type, setType] = useState<"all" | EvType>("all");
  const [caseF, setCaseF] = useState("all");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState(false);
  const list = useMemo(() => events.filter((e) =>
    (chs.length === 0 || (e.channel && CHANNEL_GROUPS.some((g) => chs.includes(g.key) && g.channels.includes(e.channel!)))) &&
    (type === "all" || e.type === type) && (caseF === "all" || e.caseId === caseF) &&
    (!q || (e.title + (e.snippet ?? "")).toLowerCase().includes(q.toLowerCase()))), [events, chs, type, caseF, q]);
  const types = Array.from(new Set(events.map((e) => e.type)));

  const days: { key: string; ts: number; items: TimelineEvent[] }[] = [];
  for (const e of list) {
    const k = dayKey(e.at);
    let g = days.find((x) => x.key === k);
    if (!g) { g = { key: k, ts: e.at, items: [] }; days.push(g); }
    g.items.push(e);
  }
  days.forEach((g) => g.items.sort((a, b) => Number(!!b.pending) - Number(!!a.pending) || b.at - a.at));

  const byCase = Array.from(new Set(list.filter((e) => e.caseId).map((e) => e.caseId!)));

  return (
    <div>
      <div className="tlf">
        <input className="input" aria-label="Search the timeline" placeholder="Search the timeline" value={q} onChange={(e) => setQ(e.target.value)} />
        {CHANNEL_GROUPS.map((g) => {
          const on = chs.includes(g.key);
          return <button key={g.key} className="chip-f" aria-pressed={on} aria-label={g.label} title={g.label} style={{ paddingRight: 6 }} onClick={() => setChs(on ? chs.filter((k) => k !== g.key) : [...chs, g.key])}><Chan c={g.channels[0]} s={16} /></button>;
        })}
        <select className="select" aria-label="Event type" value={type} onChange={(e) => setType(e.target.value as "all" | EvType)}><option value="all">All events</option>{types.map((t) => <option key={t} value={t}>{EV_LABEL[t]}</option>)}</select>
        <select className="select" aria-label="Case" value={caseF} onChange={(e) => setCaseF(e.target.value)}><option value="all">All cases</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}</select>
        <label className="check"><input type="checkbox" checked={group} onChange={(e) => setGroup(e.target.checked)} />Group by case</label>
      </div>
      {list.length === 0 && <Empty title="No events">Nothing matches these filters.</Empty>}
      {!group && days.map((g) => (
        <div key={g.key} className="day">
          <h4>{dayHeader(g.ts)}</h4>
          <ol className="tl2">{g.items.map((e) => <EventRow key={e.id} s={s} e={e} cur={from === e.caseId} />)}</ol>
        </div>
      ))}
      {group && byCase.map((cid) => {
        const c = cases.find((x) => x.id === cid);
        const items = list.filter((e) => e.caseId === cid);
        return (
          <div key={cid} className="day">
            <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}><button className="link" onClick={() => s.go(`/inbox/${cid}`)}>{cid}</button>{c && <>{c.subject}<StatusPill status={c.status} /></>}</h4>
            <ol className="tl2">{items.map((e) => <EventRow key={e.id} s={s} e={e} cur={from === e.caseId} />)}</ol>
          </div>
        );
      })}
      {list.length > 0 && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Showing history for {cu.name}. Older events load on request.</div>}
    </div>
  );
}

function EventRow({ s, e, cur }: { s: Store; e: TimelineEvent; cur: boolean }) {
  const [more, setMore] = useState(false);
  const long = e.type !== "call" && e.title.length > 150;
  const c = e.caseId ? s.cases.find((x) => x.id === e.caseId) : undefined;
  const cls = e.byKind === "ai" ? "ai" : e.type === "note" ? "note" : e.byKind === "system" ? "sys" : "";
  return (
    <li>
      <span className={`node ${cls}`}><Icon n={NODE_ICON[e.type]} s={15} /></span>
      <div className={`evc ${e.pending ? "pend" : ""} ${cur ? "cur" : ""}`}>
        <div className="t1">
          <div>
            <div className="ttl">{e.type === "note" && <Pill tone="warn">Private note</Pill>} {long && !more ? e.title.slice(0, 150) + "..." : e.title}</div>
            {e.snippet && e.type !== "call" && <div className="sn">{e.snippet.length > 160 && !more ? e.snippet.slice(0, 160) + "..." : e.snippet}</div>}
            {e.call && <CallBox call={e.call} />}
            {(long || (e.snippet && e.snippet.length > 160)) && <button className="toggle" onClick={() => setMore(!more)}>{more ? "Show less" : "Show full message"}</button>}
          </div>
          {e.channel && <Chan c={e.channel} s={22} />}
        </div>
        <div className="mt">
          <span>{e.byKind === "ai" ? <Pill tone="ai" icon="spark">{e.by}</Pill> : e.byKind === "customer" ? e.by : e.byKind === "system" ? "System" : e.by}</span>
          <span>{fmtClock(e.at)}, {agoLong(e.at)}</span>
          {e.pending && <Pill tone="pri">Draft awaiting approval</Pill>}
          {e.delivery && <Pill tone={e.delivery === "Failed" ? "neg" : e.delivery === "Read" ? "pos" : ""}>{e.delivery}</Pill>}
          {c && <button className="link" style={{ fontSize: 12 }} onClick={() => s.go(`/inbox/${c.id}`)}>{c.id}</button>}
          {c && <StatusPill status={c.status} />}
          {c && e.due && c.status !== "Resolved" && <span className={dueLabel(e.due).tone === "ok" ? "" : "due hot"}>{dueLabel(e.due).text}</span>}
          {e.caseStatus === "Resolved" && !c && <Pill tone="pos">Resolved</Pill>}
          {e.caseId && <button className="link" style={{ fontSize: 12 }} onClick={() => s.go(`/inbox/${e.caseId}`)}>Open case</button>}
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- cases tab
function CasesTable({ s, cases }: { s: Store; cases: CaseT[] }) {
  if (cases.length === 0) return <Empty title="No cases">Cases for this customer appear here.</Empty>;
  return (
    <div className="tbl-wrap" style={{ paddingTop: 8 }}>
      <table className="tbl">
        <thead><tr><th>Reference</th><th>Subject</th><th>Channel</th><th>Category</th><th>Status</th><th>Due</th><th>Owner</th><th>Linked</th></tr></thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id} className="click" onClick={() => s.go(`/inbox/${c.id}`)}>
              <td className="mono">{c.id}</td>
              <td><button className="rowlink" onClick={(e) => { e.stopPropagation(); s.go(`/inbox/${c.id}`); }}>{c.subject}</button>{(c.repeat || c.dupOf) && <> <Pill tone="warn">Repeat</Pill></>}</td>
              <td><Chan c={c.channel} s={18} /></td>
              <td>{c.category}</td><td><StatusPill status={c.status} /></td><td><Due c={c} /></td>
              <td>{staffName(c.assignee)}</td><td>{c.dupOf ?? "None"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------- details tab
function DetailsView({ s, cu }: { s: Store; cu: Customer }) {
  const [shown, setShown] = useState<Record<string, boolean>>({});
  if (!cu.matched) return <Empty title="Not matched">Details appear after the contact is linked to a customer.</Empty>;
  const group = (title: string, rows: [string, string][]) => (
    <div className="card" style={{ marginTop: 14 }}><header><h2>{title}</h2></header><div className="body"><dl className="kv" style={{ gridTemplateColumns: "170px minmax(0, 1fr)" }}>{rows.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl></div></div>
  );
  return (
    <div>
      <div className="acts" style={{ paddingTop: 12, alignItems: "center" }}>
        <span className="muted" style={{ fontSize: 13 }}>Read only from the bank's CRM. Synced 2 min ago.</span>
        <button className="btn sm" onClick={() => s.toast("Opens the bank's core banking system in the real product")}><Icon n="external" s={14} />Open in core banking</button>
      </div>
      {group("Identity", [["Customer ID", cu.cif], ["Name", cu.name], ["Mobile", cu.mobile], ["Email", cu.email], ["City and branch", `${cu.city}, ${cu.branch}`], ["Age band", cu.ageBand], ["Language", cu.language], ["Preferred channel", CHANNEL_LABEL[cu.preferred]]])}
      {cu.kyc && group("Identity", [["ID type on file", cu.kyc.idType], ["ID last updated", cu.kyc.updated], ["Identity checked in the latest contact", cu.verifiedNow ? `Yes, ${cu.verifiedNow.how}, ${fmtTime(cu.verifiedNow.when)}` : "No"]])}
      {group("Relationship", [["Segment", cu.segment], ["Home branch", cu.branch], ["Servicing unit", cu.unit || "Customer care"], ["Customer since", String(cu.since)], ["Linked people", cu.linked.length ? cu.linked.map((l) => `${l.name} (${l.relation})`).join(", ") : "None"]])}
      <div className="card" style={{ marginTop: 14 }}>
        <header><h2>Products</h2></header>
        <div className="body"><div className="prods">
          {cu.products.map((p) => (
            <div key={p.label}>
              <div className="grow">{p.label} {p.mask && <span className="mono">{shown[p.label] ? p.mask.replace("••", "0000 4821 ") : p.mask}</span>}<small>{p.detail ?? ""}</small></div>
              <Pill tone={p.status === "Active" ? "pos" : p.status === "Blocked" || p.status === "Locked" ? "neg" : "warn"}>{p.status}</Pill>
              {p.mask && <button className="link" style={{ fontSize: 12 }} onClick={() => { setShown({ ...shown, [p.label]: !shown[p.label] }); if (!shown[p.label]) s.logCustomer(cu.id, `${staffName("ana")} revealed the full number of ${p.label}`); }}>{shown[p.label] ? "Hide" : "Reveal"}</button>}
            </div>
          ))}
        </div></div>
      </div>
      {group("Consent to contact", [["Email", cu.consent.email ? "Allowed" : "Not allowed"], ["SMS", cu.consent.sms ? "Allowed" : "Not allowed"], ["Calls", cu.consent.call ? "Allowed" : "Not allowed"], ["Social media", cu.consent.social ? "Allowed" : "Not allowed"]])}
      {group("Service history", [["Complaints, 12 months", String(cu.complaints12m)], ["Escalated to the regulator before", cu.escalatedBefore ? "Yes" : "No"], ["Average time to resolve", cu.avgResolveH ? `${cu.avgResolveH} hours` : "None"], ["Satisfaction score", "Later release"]])}
    </div>
  );
}

// ---------------------------------------------------------------- notes
export function NotesPanel({ s, cu, cases }: { s: Store; cu: Customer; cases: CaseT[] }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [caseId, setCaseId] = useState("");
  const [pin, setPin] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [etext, setEtext] = useState("");
  const notes = s.notes.filter((n) => n.customerId === cu.id).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at - a.at);
  const canAdd = cu.matched || cases.length > 0;
  return (
    <div className="notes">
      <div className="nh"><h2>Notes</h2><span className="muted" style={{ fontSize: 12 }}>Sorted by created on</span>
        <button className="btn sm p sp" onClick={() => { setAdding(!adding); window.setTimeout(() => (document.getElementById("newnote") as HTMLTextAreaElement | null)?.focus(), 30); }} disabled={!canAdd}><Icon n="plus" s={14} />Add</button></div>
      {adding && (
        <div className="nform">
          <div className="field"><label htmlFor="newnote">Note</label><textarea id="newnote" className="textarea" placeholder="Write a note for your team. The customer never sees it." value={text} onChange={(e) => setText(e.target.value)} /></div>
          <div className="field"><label htmlFor="nc">Link to a case</label><select id="nc" className="select" value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">No case</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.id}, {c.subject.slice(0, 32)}</option>)}</select></div>
          <label className="check" style={{ marginBottom: 12 }}><input type="checkbox" checked={pin} onChange={(e) => setPin(e.target.checked)} />Pin to the top</label>
          <div className="acts"><button className="btn sm p" disabled={!text.trim()} onClick={() => { s.addNote(cu.id, text.trim(), pin, caseId || undefined); setText(""); setCaseId(""); setPin(false); setAdding(false); }}>Save note</button><button className="btn sm" onClick={() => setAdding(false)}>Cancel</button></div>
        </div>
      )}
      {notes.length === 0 && !adding && <Empty title="No notes yet">Notes are visible to every staff member who can open this customer.</Empty>}
      {notes.map((n) => (
        <div key={n.id} className={`note-item ${n.pinned ? "pinned" : ""}`}>
          {editing === n.id ? (
            <>
              <textarea className="textarea" aria-label="Edit note" value={etext} onChange={(e) => setEtext(e.target.value)} />
              <div className="acts" style={{ marginTop: 8 }}><button className="btn sm p" disabled={!etext.trim()} onClick={() => { s.editNote(n.id, etext.trim()); setEditing(null); }}>Save</button><button className="btn sm" onClick={() => setEditing(null)}>Cancel</button></div>
            </>
          ) : <div style={{ whiteSpace: "pre-wrap" }}>{n.text}</div>}
          <div className="by">
            {n.pinned && <Icon n="pin" s={12} />}<span>{staffName(n.by)}, {fmtTime(n.at)}</span>
            {n.caseId && <button className="link" style={{ fontSize: 12 }} onClick={() => s.go(`/inbox/${n.caseId}`)}>{n.caseId}</button>}
            <span className="sp">
              <button aria-label={n.pinned ? "Unpin note" : "Pin note"} onClick={() => s.pinNote(n.id)}><Icon n="pin" s={14} /></button>
              <button aria-label="Edit note" onClick={() => { setEditing(n.id); setEtext(n.text); }}><Icon n="edit" s={14} /></button>
              <button aria-label="Delete note" onClick={() => s.deleteNote(n.id)}><Icon n="trash" s={14} /></button>
            </span>
          </div>
        </div>
      ))}
      <div className="muted" style={{ fontSize: 12, padding: "12px 16px" }}>Edits and deletes are logged in the audit trail.</div>
    </div>
  );
}
void ago; void STAFF;
