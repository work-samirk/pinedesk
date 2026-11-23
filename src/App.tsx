import { useCallback, useEffect, useState } from "react";
import { CASES, EXTENSIONS, ME, NOW, dueLabel, type CaseT, type Extension, type Status } from "./data";
import { Agents, Approvals, Customers, Inbox, Reports, Settings, Team, type Store } from "./screens";
import { Avatar, Icon, Mark, Toast, useMedia } from "./ui";

const NAV = [
  { group: "Work", items: [["inbox", "Inbox", Icon.inbox], ["customers", "Customers", Icon.users]] },
  { group: "Manage", items: [["approvals", "Approvals", Icon.check], ["team", "Team and deadlines", Icon.clock], ["reports", "Reports", Icon.chart], ["agents", "AI agents", Icon.bot], ["settings", "Settings", Icon.gear]] },
] as const;
const TITLES: Record<string, string> = { inbox: "Inbox", customers: "Customers", approvals: "Approvals", team: "Team and deadlines", reports: "Reports", agents: "AI agents", settings: "Settings" };

function parse(): { screen: string; id: string | null } {
  const [, screen, id] = window.location.hash.replace(/^#/, "").split("/");
  return { screen: TITLES[screen] ? screen : "inbox", id: id ?? null };
}

export default function App() {
  const compact = useMedia("(max-width: 900px)");
  const [route, setRoute] = useState(parse());
  const [cases, setCases] = useState<CaseT[]>(() => CASES.map((c) => ({ ...c, messages: [...c.messages] })));
  const [extensions, setExtensions] = useState<Extension[]>(EXTENSIONS);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [more, setMore] = useState(false);

  useEffect(() => { const f = () => setRoute(parse()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const toast = useCallback((t: string) => { setNote(t); window.setTimeout(() => setNote(null), 2400); }, []);
  const go = useCallback((p: string) => { window.location.hash = p; setMore(false); }, []);
  const patch = (id: string, f: (c: CaseT) => CaseT) => setCases((cs) => cs.map((c) => (c.id === id ? f(c) : c)));

  const store: Store = {
    cases, extensions, query, go, toast,
    send: (id, text, fromDraft) => {
      patch(id, (c) => ({
        ...c, draft: undefined, unread: false, status: c.status === "New" ? "Open" : c.status,
        messages: [...c.messages, { from: "staff", who: ME.name, channel: c.channel, at: NOW + 60000, text }],
      }));
      toast(fromDraft ? "Draft approved and sent" : "Reply sent");
    },
    discard: (id) => { patch(id, (c) => ({ ...c, draft: undefined })); toast("Draft discarded"); },
    setStatus: (id, s: Status) => patch(id, (c) => ({ ...c, status: s, unread: false })),
    assign: (id, who) => patch(id, (c) => ({ ...c, assignee: who, unread: false })),
    endorse: (id, unit) => { patch(id, (c) => ({ ...c, unit, status: "Waiting on unit" })); toast(`Endorsed to ${unit}`); },
    decide: (id, ok) => {
      const x = extensions.find((e) => e.id === id)!;
      if (ok) patch(x.caseId, (c) => ({ ...c, due: x.newDue }));
      setExtensions((xs) => xs.filter((e) => e.id !== id));
      toast(ok ? "Extension approved" : "Extension rejected");
    },
  };

  const open = cases.filter((c) => c.status !== "Resolved");
  const counts: Record<string, number> = {
    inbox: open.filter((c) => c.assignee === "ana").length,
    approvals: open.filter((c) => c.draft).length + extensions.length,
  };
  void dueLabel;

  const body = (() => {
    switch (route.screen) {
      case "customers": return <Customers s={store} selected={route.id} />;
      case "approvals": return <Approvals s={store} />;
      case "team": return <Team s={store} />;
      case "reports": return <Reports />;
      case "agents": return <Agents s={store} />;
      case "settings": return <Settings s={store} />;
      default: return <Inbox s={store} selected={route.id} />;
    }
  })();

  const search = (
    <div className="search">
      {Icon.search({})}
      <input aria-label="Search cases and customers" placeholder="Search cases and customers" value={query}
        onChange={(e) => { setQuery(e.target.value); if (route.screen !== "inbox") go("/inbox"); }} />
      <kbd>/</kbd>
    </div>
  );

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><Mark /><div><b>PineDesk</b><span>Land Bank</span></div></div>
        <nav className="nav" aria-label="Main">
          {NAV.map((g) => (
            <div key={g.group} style={{ display: "contents" }}>
              <h6>{g.group}</h6>
              {g.items.map(([k, label, ic]) => (
                <button key={k} aria-current={route.screen === k ? "page" : undefined} onClick={() => go(`/${k}`)}>
                  {ic({})}<span>{label}</span>{counts[k] ? <span className="count">{counts[k]}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot"><Avatar name={ME.name} /><div className="who">{ME.name}<span>{ME.role}</span></div></div>
      </aside>
      <header className="top">{search}<span className="proto-tag">Prototype · sample data</span></header>

      <header className="mtop"><Mark size={24} /><div className="mtitle">{TITLES[route.screen]}</div><span className="proto-tag">Sample data</span></header>
      <main className="sheet">{body}</main>
      {compact && (
        <>
          <nav className="mtabs" aria-label="Main">
            {([["inbox", "Inbox", Icon.inbox], ["approvals", "Approvals", Icon.check], ["team", "Team", Icon.clock], ["customers", "Customers", Icon.users]] as const).map(([k, l, ic]) => (
              <button key={k} aria-current={route.screen === k ? "page" : undefined} onClick={() => go(`/${k}`)}>
                {ic({ size: 20 })}<span>{l}</span>{counts[k] ? <span className="badge">{counts[k]}</span> : null}
              </button>
            ))}
            <button aria-current={["reports", "agents", "settings"].includes(route.screen) ? "page" : undefined} onClick={() => setMore(true)}>{Icon.more({ size: 20 })}<span>More</span></button>
          </nav>
          {more && (
            <div className="sheet-more" onClick={() => setMore(false)}>
              <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="More">
                {([["reports", "Reports", Icon.chart], ["agents", "AI agents", Icon.bot], ["settings", "Settings", Icon.gear]] as const).map(([k, l, ic]) => (
                  <button key={k} onClick={() => go(`/${k}`)}>{ic({ size: 20 })}{l}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <Toast text={note} />
    </div>
  );
}
