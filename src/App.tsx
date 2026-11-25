import { useCallback, useEffect, useRef, useState } from "react";
import { CASES, CUSTOMERS, EXTENSIONS, ME, NOTES, TIME_ENTRIES, customer, type CaseT, type Extension, type Note, type Status, type TimeEntry } from "./data";
import { Customers } from "./customer";
import { Inbox } from "./inbox";
import { Agents, Approvals, Reports, Settings, Team } from "./manage";
import { animateRail, usePageEnter } from "./motion";
import { NewCase } from "./newcase";
import { Overview } from "./overview";
import { LOGOS } from "./sheet";
import { Social } from "./social";
import { isOpen, type CallState, type Store } from "./store";
import { Avatar, Icon, Toast } from "./ui";

const NAV = [
  { group: "Work", items: [["overview", "Overview", "home"], ["inbox", "Cases", "inbox"], ["social", "Social sentiment", "pulse"], ["customers", "Customers", "users"], ["approvals", "Approvals", "approve"]] },
  { group: "Manage", items: [["team", "Team and deadlines", "clock"], ["reports", "Reports", "chart"], ["agents", "AI agents", "bot"], ["settings", "Settings", "sliders"]] },
] as const;
const TITLES: Record<string, string> = { overview: "Overview", inbox: "Cases", social: "Social sentiment", customers: "Customers", approvals: "Approvals", team: "Team and deadlines", reports: "Reports", agents: "AI agents", settings: "Settings" };

function parse(): { screen: string; id: string | null; extra: string | null } {
  const [, screen, id, extra] = window.location.hash.replace(/^#/, "").split("/");
  return { screen: TITLES[screen] ? screen : "overview", id: id ?? null, extra: extra ?? null };
}

export default function App() {
  const compact = useMedia900();
  const [route, setRoute] = useState(parse());
  const [cases, setCases] = useState<CaseT[]>(() => CASES.map((c) => ({ ...c, messages: [...c.messages] })));
  const [notes, setNotes] = useState<Note[]>(NOTES);
  const [entries, setEntries] = useState<TimeEntry[]>(TIME_ENTRIES);
  const [extensions, setExtensions] = useState<Extension[]>(EXTENSIONS);
  const [activity, setActivity] = useState<Store["activity"]>({});
  const [timers, setTimers] = useState<Store["timers"]>({});
  const [linked, setLinked] = useState<Record<string, string>>({});
  const [merged, setMerged] = useState<Record<string, string>>({});
  const [dupDecided, setDupDecided] = useState<Store["dupDecided"]>({});
  const [call, setCall] = useState<CallState | null>(null);
  const [tenant, setTenantState] = useState<"default" | "landbank">("landbank");
  const [newCase, setNewCase] = useState(false);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("pd-rail") === "1");
  const railRef = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const seq = useRef(429);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const clock = useRef(0);
  const stamp = () => new Date("2026-11-23T10:42:00+08:00").getTime() + (clock.current += 60000);

  useEffect(() => { const f = () => setRoute(parse()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  useEffect(() => { if (tenant === "default") delete document.documentElement.dataset.tenant; else document.documentElement.dataset.tenant = tenant; }, [tenant]);
  const toast = useCallback((t: string) => { setNote(t); window.setTimeout(() => setNote(null), 2600); }, []);
  const go = useCallback((p: string) => { window.location.hash = p; setMore(false); window.scrollTo(0, 0); }, []);
  const patch = (id: string, f: (c: CaseT) => CaseT) => setCases((cs) => cs.map((c) => (c.id === id ? f(c) : c)));
  const log = (key: string, text: string) => setActivity((a) => ({ ...a, [key]: [...(a[key] ?? []), { at: stamp(), text }] }));
  const nidRef = useRef(100);
  const nextId = () => ++nidRef.current;

  const store: Store = {
    cases, notes, entries, extensions, query, activity, timers, linked, merged, dupDecided, call, tenant, go, toast,
    send: (id, text, fromDraft) => {
      const c = cases.find((x) => x.id === id)!;
      patch(id, (k) => ({
        ...k, draft: undefined, unread: false, status: k.status === "New" ? "Open" : k.status, stage: k.stage === 5 ? 6 : k.stage, aiWorking: false,
        messages: [...k.messages, { id: `m${nextId()}`, from: "staff", who: ME.name, channel: k.channel, at: stamp(), text, delivery: "Sent" }],
      }));
      log(id, fromDraft ? "AI draft approved and sent" : "Reply sent");
      toast(fromDraft ? "Draft approved and sent" : `Reply sent on ${c.channel === "facebook" ? "Facebook" : "the same channel"}`);
    },
    discard: (id) => { patch(id, (c) => ({ ...c, draft: undefined })); log(id, "AI draft discarded"); toast("Draft discarded"); },
    regenerate: (id) => { patch(id, (c) => (c.draft ? { ...c, draft: { ...c.draft, confidence: Math.min(0.97, c.draft.confidence + 0.04) } } : c)); log(id, "AI draft regenerated"); toast("New draft ready"); },
    setStatus: (id, st: Status) => { patch(id, (c) => ({ ...c, status: st, unread: false })); log(id, `Status changed to ${st}`); },
    assign: (id, who) => { patch(id, (c) => ({ ...c, assignee: who, unread: false })); log(id, who ? `Assigned to ${STAFFN(who)}` : "Unassigned"); },
    endorse: (id, unit) => { patch(id, (c) => ({ ...c, unit, status: "Waiting on unit", stage: 6 })); log(id, `Endorsed to the ${unit} unit`); toast(`Endorsed to ${unit}`); },
    resolve: (id, n, root, notified) => {
      patch(id, (c) => ({ ...c, status: "Resolved", stage: 9, draft: undefined, resolution: { note: n, root, notified, at: stamp() } }));
      log(id, `Resolved. Root cause: ${root}`); toast("Case resolved");
    },
    reopen: (id) => { patch(id, (c) => ({ ...c, status: "Open", stage: 6, resolution: undefined, handledByAI: false })); log(id, "Case reopened"); toast("Case reopened"); },
    refreshCrm: (id) => { patch(id, (c) => ({ ...c, crmSyncMin: 0 })); log(id, "Bank data refreshed"); toast("Bank data refreshed"); },
    decideDup: (id, join) => {
      setDupDecided((d) => ({ ...d, [id]: join ? "joined" : "kept" }));
      log(id, join ? "Joined to the open case on the same issue" : "Kept separate from the open case");
      toast(join ? "Joined to the open case" : "Kept as a separate case");
    },
    addNote: (customerId, text, pinned, caseId) => {
      setNotes((ns) => [...ns, { id: `n${nextId()}`, customerId, caseId, text, pinned, by: ME.id, at: stamp() }]);
      if (caseId) log(caseId, "Private note added");
      log(`cust:${customerId}`, `${ME.name} added a note`);
      toast("Note saved");
    },
    editNote: (id, text) => { const n = notes.find((x) => x.id === id); setNotes((ns) => ns.map((x) => (x.id === id ? { ...x, text } : x))); if (n) log(`cust:${n.customerId}`, `${ME.name} edited a note`); toast("Note updated"); },
    deleteNote: (id) => { const n = notes.find((x) => x.id === id); setNotes((ns) => ns.filter((x) => x.id !== id)); if (n) log(`cust:${n.customerId}`, `${ME.name} deleted a note`); toast("Note deleted"); },
    pinNote: (id) => setNotes((ns) => ns.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x))),
    addTime: (caseId, minutes, n) => { setEntries((es) => [...es, { id: `te${nextId()}`, caseId, by: ME.id, at: stamp(), minutes, note: n }]); log(caseId, `${minutes} min logged`); toast("Time logged"); },
    setTimer: (caseId, running) => setTimers((t) => ({ ...t, [caseId]: { seconds: t[caseId]?.seconds ?? 0, running } })),
    tick: (caseId) => setTimers((t) => (t[caseId]?.running ? { ...t, [caseId]: { ...t[caseId], seconds: t[caseId].seconds + 1 } } : t)),
    startCall: (caseId) => { if (call) { toast("Finish the current call first"); return; } setCall({ caseId, phase: "dialing", seconds: 0 }); },
    advanceCall: (phase, seconds) => setCall((c) => (c ? { ...c, phase, seconds: seconds ?? c.seconds } : c)),
    logCustomer: (customerId, text) => log(`cust:${customerId}`, text),
    finishCall: (outcome, n) => {
      if (!call) return;
      const c = cases.find((x) => x.id === call.caseId)!;
      const cu = customer(c.customerId);
      const secs = outcome === "Reached" ? Math.max(call.seconds, 20) : Math.min(call.seconds, 25);
      const transcript = outcome === "Reached" ? [
        { who: "Executive" as const, t: "0:04", text: `Good day ${cu.name.split(" ")[0]}, this is Ana from Land Bank. This call is recorded. Is this a good time?` },
        { who: "Customer" as const, t: "0:11", text: "Yes, go ahead." },
        { who: "Executive" as const, t: "0:18", text: n || "I am calling about your open case and what we found so far." },
      ] : [];
      patch(c.id, (k) => ({
        ...k, callbackAt: outcome === "Call back later" ? "16:00" : k.callbackAt, status: k.status === "New" ? "Open" : k.status,
        messages: [...k.messages, { id: `m${nextId()}`, from: "staff", who: ME.name, channel: "voice", at: stamp(), text: `Outbound call to ${cu.name}`,
          call: { duration: secs, outcome, recorded: true, transcript, summary: n || (outcome === "Reached" ? "Spoke with the customer about the open case." : `${outcome}. No voicemail left.`) } }],
      }));
      setEntries((es) => [...es, { id: `te${nextId()}`, caseId: c.id, by: ME.id, at: stamp(), minutes: Math.max(1, Math.round(secs / 60)), note: "Call" }]);
      log(c.id, `Outbound call, ${outcome.toLowerCase()}, recorded`);
      setCall(null); toast("Call saved to the case and the customer history");
    },
    cancelCall: () => setCall(null),
    linkContact: (fromId, toId) => {
      setCases((cs) => cs.map((c) => (c.customerId === fromId ? { ...c, customerId: toId } : c)));
      setLinked((l) => ({ ...l, [fromId]: toId }));
      log(`cust:${toId}`, `${ME.name} linked ${customer(fromId).name} to this profile`);
      toast(`Linked to ${customer(toId).name}. History merged.`); go(`/customers/${toId}`);
    },
    mergeProfile: (keepId, dupId) => { setMerged((m) => ({ ...m, [dupId]: keepId })); log(`cust:${keepId}`, `${ME.name} merged a duplicate profile`); toast("Profiles merged"); },
    decide: (id, ok) => {
      const x = extensions.find((e) => e.id === id)!;
      if (ok) patch(x.caseId, (c) => ({ ...c, due: x.newDue }));
      setExtensions((xs) => xs.filter((e) => e.id !== id));
      toast(ok ? "Extension approved" : "Extension rejected");
    },
    setTenant: (t) => setTenantState(t),
    openNewCase: () => setNewCase(true),
    connected, connect: (id) => setConnected((c) => ({ ...c, [id]: true })),
    createCase: (x) => {
      const id = `LB-2611-0${++seq.current}`;
      let cid = x.customerId;
      if (!cid) {
        cid = `c${100 + seq.current}`;
        const email = x.newContact.includes("@") ? x.newContact : "";
        CUSTOMERS.push({ id: cid, cif: "", name: x.newName ?? "New contact", mobile: email ? "" : x.newContact, email, city: "", branch: "Not a customer on file", ageBand: "", language: "English", preferred: x.channel,
          handles: {}, kyc: null, segment: "New contact", since: 0, unit: "", linked: [], products: [], alerts: [], consent: { email: !!email, sms: !email && !!x.newContact, call: !!x.newContact, social: false },
          matched: false, tone: "Calm", complaints12m: 0, escalatedBefore: false, avgResolveH: 0 });
      }
      const at = stamp();
      const c: CaseT = {
        id, subject: x.subject, customerId: cid, channel: x.channel, category: x.category, unit: x.unit, priority: x.priority, status: "New", assignee: ME.id,
        opened: at, due: at + x.hours * 3600000, unread: false, stage: 4, fraud: x.fraud, manual: true, tone: "Calm", language: "English", crmSyncMin: 0, attachments: [],
        summary: { issue: x.detail, steps: `Logged by hand by ${ME.name} from ${x.source.toLowerCase()}. Routed to ${x.unit} by the category rule.`, next: x.fraud ? "Fraud lane: confirm the customer is safe, then work the case." : "Check the details and reply to the customer." },
        checks: [`Source: ${x.source}`, `Routed to ${x.unit}`, ...(x.ack ? ["Reference sent to the customer"] : [])],
        messages: [{ id: `m${nextId()}`, from: "staff", who: ME.name, channel: x.channel, at, text: `${x.source}: ${x.detail}` },
          ...(x.ack ? [{ id: `m${nextId()}`, from: "staff" as const, who: "PineDesk", channel: x.channel, at: at + 1000, text: `Acknowledgement sent with reference ${id}.`, delivery: "Sent" as const }] : [])],
      };
      setCases((cs) => [c, ...cs]);
      log(id, `Case created by hand from ${x.source.toLowerCase()}`);
      log(`cust:${cid}`, `${ME.name} opened case ${id}`);
      toast(`Case ${id} created and routed to ${x.unit}`);
      return id;
    },
  };

  const toggleRail = () => { const n = !collapsed; setCollapsed(n); localStorage.setItem("pd-rail", n ? "1" : "0"); animateRail(railRef.current, n); };
  useEffect(() => { if (railRef.current) railRef.current.style.width = collapsed ? "76px" : "236px"; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  usePageEnter(mainRef, `${route.screen}/${route.screen === "inbox" ? "" : route.id ?? ""}`);

  const open = cases.filter(isOpen);
  const counts: Record<string, number> = {
    inbox: open.filter((c) => c.assignee === "ana").length,
    approvals: open.filter((c) => c.draft).length + extensions.length,
  };

  const body = (() => {
    switch (route.screen) {
      case "customers": return <Customers s={store} selected={route.id} from={route.extra} />;
      case "approvals": return <Approvals s={store} />;
      case "team": return <Team s={store} />;
      case "reports": return <Reports />;
      case "agents": return <Agents s={store} />;
      case "settings": return <Settings s={store} />;
      case "inbox": return <Inbox s={store} selected={route.id} />;
      case "social": return <Social s={store} />;
      default: return <Overview s={store} />;
    }
  })();

  return (
    <div className={`app ${collapsed ? "railed" : ""}`}>
      <a className="skip" href="#main-content" onClick={(e) => { e.preventDefault(); document.getElementById("main-content")?.focus(); }}>Skip to content</a>
      <aside className="side" aria-label="Sidebar" ref={railRef}>
        <div className="brand">
          <img className="lb" src={LOGOS.lbLight} alt="LANDBANK" />
          <div className="pd" data-label><b>PineDesk</b><span>by <img src={LOGOS.plLight} alt="Pine Labs" /></span></div>
        </div>
        <nav aria-label="Main">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="grp" data-label>{g.group}</div>
              <div className="nav">
                {g.items.map(([k, label, ic]) => (
                  <button key={k} aria-current={route.screen === k ? "page" : undefined} onClick={() => go(`/${k}`)} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined}>
                    <Icon n={ic} s={18} /><span className="nl" data-label>{label}</span>{counts[k] ? <span className="n">{counts[k]}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button className="collapse" onClick={toggleRail} aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"} aria-expanded={!collapsed}>
          <Icon n={collapsed ? "right" : "left"} s={16} /><span data-label>{collapsed ? "" : "Collapse"}</span>
        </button>
        <div className="me"><Avatar name={ME.name} size={32} /><div data-label><b>{ME.name}</b><span className="st"><i className="dot" />Available</span></div></div>
      </aside>

      <header className="mtop"><img className="lb" src={LOGOS.lbLight} alt="LANDBANK" /><div className="mtitle">{TITLES[route.screen]}</div><button className="icb" aria-label="New case" onClick={() => setNewCase(true)}><Icon n="plus" s={18} /></button></header>

      <div className="main">
        <header className="top">
          <div className="ttl">{TITLES[route.screen]}</div>
          <label className="search"><Icon n="search" s={16} />
            <input type="search" aria-label="Search cases and customers" placeholder="Search cases, customers and reference numbers" value={query}
              onChange={(e) => { setQuery(e.target.value); if (route.screen !== "inbox") go("/inbox"); }} />
          </label>
          <div className="right">
            <span className="proto" title="All names, numbers and messages are sample data">Sample data</span>
            <button className="icb" aria-label="Notifications"><Icon n="bell" s={18} /><i className="pip" /></button>
            <button className="btn p" onClick={() => setNewCase(true)}><Icon n="plus" s={16} />New case</button>
          </div>
        </header>
        <div className="body" ref={mainRef} id="main-content" tabIndex={-1}>{body}</div>
      </div>

      {compact && (
        <>
          <nav className="mtabs" aria-label="Main">
            {([["overview", "Home", "home"], ["inbox", "Cases", "inbox"], ["social", "Social", "pulse"], ["approvals", "Approvals", "approve"]] as const).map(([k, l, ic]) => (
              <button key={k} aria-current={route.screen === k ? "page" : undefined} onClick={() => go(`/${k}`)}>
                <Icon n={ic} s={20} /><span>{l}</span>{counts[k] ? <span className="badge">{counts[k]}</span> : null}
              </button>
            ))}
            <button aria-current={["customers", "team", "reports", "agents", "settings"].includes(route.screen) ? "page" : undefined} onClick={() => setMore(true)}><Icon n="more" s={20} /><span>More</span></button>
          </nav>
          {more && (
            <div className="sheet-more" onClick={() => setMore(false)} onKeyDown={(e) => { if (e.key === "Escape") setMore(false); }}>
              <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="More">
                {([["customers", "Customers", "users"], ["team", "Team and deadlines", "clock"], ["reports", "Reports", "chart"], ["agents", "AI agents", "bot"], ["settings", "Settings", "sliders"]] as const).map(([k, l, ic]) => (
                  <button key={k} onClick={() => go(`/${k}`)}><Icon n={ic} s={20} />{l}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {newCase && <NewCase s={store} onClose={() => setNewCase(false)} />}
      <CallPanel s={store} />
      <Toast text={note} />
    </div>
  );
}

function useMedia900() {
  const [m, setM] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const f = () => setM(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return m;
}
const STAFFN = (id: string) => ({ ana: "Ana Villanueva", carlo: "Carlo Mendoza", liza: "Liza Ramos", paolo: "Paolo Cruz", nina: "Nina Salonga" } as Record<string, string>)[id] ?? id;

// ---------------------------------------------------------------- call panel (simulated, Exotel assumed)
function CallPanel({ s }: { s: Store }) {
  const call = s.call;
  const [sec, setSec] = useState(0);
  const [outcome, setOutcome] = useState<"Reached" | "No answer" | "Call back later" | "Wrong number">("Reached");
  const [n, setN] = useState("");
  const [muted, setMuted] = useState(false);
  const [hold, setHold] = useState(false);
  const adv = useRef(s.advanceCall);
  adv.current = s.advanceCall;
  const phase = call?.phase;
  useEffect(() => {
    if (phase === "dialing") { const h = window.setTimeout(() => adv.current("live"), 1800); return () => window.clearTimeout(h); }
    if (phase === "live") { setSec(0); const h = window.setInterval(() => setSec((x) => x + 1), 1000); return () => window.clearInterval(h); }
  }, [phase]);
  useEffect(() => { if (phase === "dialing") { setN(""); setOutcome("Reached"); setMuted(false); setHold(false); } }, [phase]);
  if (!call) return null;
  const c = s.cases.find((x) => x.id === call.caseId)!;
  const cu = customer(c.customerId);
  const clock = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  return (
    <div className="callp" role="dialog" aria-label="Call">
      <header>
        <Avatar name={cu.name} size={40} />
        <div className="grow"><b>{cu.name}</b><span className="s">{phase === "dialing" ? "Calling through Exotel" : phase === "live" ? "Connected" : "Call ended"}</span></div>
        <button className="icb" style={{ color: "#fff" }} aria-label="Close" onClick={() => (phase === "live" ? null : s.cancelCall())} disabled={phase === "live"}><Icon n="x" s={16} /></button>
      </header>
      <div className="cb">
        {phase === "dialing" && <>
          <div className="big">{cu.mobile}</div>
          <div className="muted" style={{ textAlign: "center" }}>Number on file in the bank's CRM. Case {c.id}.</div>
          {!c.verified && <div className="bannr warn" style={{ margin: 0 }}><Icon n="alert" s={16} />Customer not verified yet. Verify before you discuss account details.</div>}
          <div className="ctl"><button className="btn end" onClick={s.cancelCall}><Icon n="phoneOff" s={16} />Cancel</button></div>
        </>}
        {phase === "live" && <>
          <div className="big">{clock}</div>
          <div className="rec"><i />Recording. The customer heard a recording notice.</div>
          <textarea className="textarea" aria-label="Call notes" placeholder="Notes during the call" value={n} onChange={(e) => setN(e.target.value)} />
          <div className="ctl">
            <button className="btn sm" aria-pressed={muted} onClick={() => setMuted(!muted)}><Icon n="mic" s={16} />{muted ? "Unmute" : "Mute"}</button>
            <button className="btn sm" aria-pressed={hold} onClick={() => setHold(!hold)}><Icon n="pause" s={16} />{hold ? "Resume" : "Hold"}</button>
            <button className="btn sm end" onClick={() => s.advanceCall("wrap", sec)}><Icon n="phoneOff" s={16} />End call</button>
          </div>
        </>}
        {phase === "wrap" && <>
          <div className="field" style={{ marginBottom: 0 }}><label htmlFor="oc">Outcome</label>
            <select id="oc" className="select" value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)}>{["Reached", "No answer", "Call back later", "Wrong number"].map((o) => <option key={o}>{o}</option>)}</select></div>
          <div className="field" style={{ marginBottom: 0 }}><label htmlFor="cn">Note for the case</label><textarea id="cn" className="textarea" value={n} onChange={(e) => setN(e.target.value)} placeholder="What was said and agreed" /></div>
          <div className="muted" style={{ fontSize: 12.5 }}>The recording, transcript and {Math.max(1, Math.round(call.seconds / 60))} min of time are saved to the case and the customer history.</div>
          <button className="btn p" onClick={() => s.finishCall(outcome, n.trim())}><Icon n="check" s={16} />Save to the case</button>
        </>}
      </div>
    </div>
  );
}
