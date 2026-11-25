import { AGENTS, DAILY, EXCEPTIONS, EXC_REASONS, ME, NOW, UNIT_SLA, VOLUME, TOTAL_VOLUME, dueLabel, fmtTime, firstName, type AgentKind } from "./data";
import { HBars, Legend, PairedBars, SplitBar, StackedBars } from "./charts";
import { PLATFORMS, SPIKE } from "./social-data";
import { isOpen, type Store } from "./store";
import { Chan, Icon } from "./ui";

export const CH_COLORS = { Email: "var(--c-email)", Chat: "var(--c-chat)", "Social media": "var(--c-social)", Voice: "var(--c-voice)", Hotline: "var(--c-hotline)" } as Record<string, string>;
const KIND_CH: Record<AgentKind, "email" | "chat" | "facebook" | "voice"> = { email: "email", chat: "chat", social: "facebook", voice: "voice" };

/** Last n days of volume split by channel share. Shared with Reports. */
export function dailyByChannel(n: number) {
  const days = DAILY.slice(-n);
  const labels = Array.from({ length: n }, (_, i) => new Date(NOW - (n - 1 - i) * 86400000).toLocaleDateString("en-GB", { weekday: n <= 7 ? "short" : undefined, day: "numeric", month: n <= 7 ? undefined : "short", timeZone: "Asia/Manila" }));
  const series = VOLUME.map((v) => ({ key: v.label, label: v.label, color: CH_COLORS[v.label], values: days.map((d) => Math.round((d * v.value) / TOTAL_VOLUME)) }));
  return { labels, series };
}

export function Overview({ s }: { s: Store }) {
  const open = s.cases.filter(isOpen);
  const mine = open.filter((c) => c.assignee === ME.id);
  const drafts = open.filter((c) => c.draft && c.assignee === ME.id).length;
  const risk = open.filter((c) => dueLabel(c.due).tone !== "ok");
  const overdue = open.filter((c) => dueLabel(c.due).tone === "breach").length;
  const unassigned = open.filter((c) => !c.assignee).length;
  const week = dailyByChannel(7);
  const weekDays = DAILY.slice(-14);
  const pairs = week.labels.map((l, i) => ({ label: l.split(" ")[0], a: weekDays[7 + i], b: weekDays[i] }));
  const fb = PLATFORMS[0];
  const hour = Number(new Date(NOW).toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Manila" }));
  const today = new Date(NOW).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Manila" });

  const tiles: { label: string; value: number; note: string; to: string; tone?: string }[] = [
    { label: "Drafts to approve", value: drafts, note: "AI replies waiting for you", to: "/inbox/~approve" },
    { label: "Close to the deadline", value: risk.length, note: `${overdue} already overdue`, to: "/inbox/~risk", tone: overdue ? "neg" : "warn" },
    { label: "My open cases", value: mine.length, note: "Assigned to you", to: "/inbox/~mine" },
    { label: "Nobody has these yet", value: unassigned, note: "Waiting for an owner", to: "/inbox/~unassigned" },
  ];

  return (
    <div className="view"><div className="page dash">
      <div className="hello" data-enter>
        <div>
          <h1 className="display">{hour < 12 ? "Good morning" : "Good afternoon"}, {firstName(ME.name)}</h1>
          <p className="muted">{today} · Customer care · Land Bank of the Philippines</p>
        </div>
        <button className="btn" onClick={() => s.go("/reports")}><Icon n="chart" s={16} />All reports</button>
      </div>

      <section className="now" aria-label="Needs you now" data-enter>
        {tiles.map((t) => (
          <button key={t.label} className={`nowt ${t.tone ?? ""}`} onClick={() => s.go(t.to)}>
            <span className="v">{t.value}</span><span className="l">{t.label}</span><span className="n">{t.note}</span><Icon n="right" s={16} className="go" />
          </button>
        ))}
      </section>

      <div className="grid-2-1">
        <section className="card" data-enter>
          <header><h2>Cases opened this week</h2><span className="muted">By channel, last 7 days</span></header>
          <div className="body">
            <StackedBars series={week.series} labels={week.labels} label="Cases opened per day by channel, last 7 days" />
            <Legend items={week.series.map((x) => ({ label: x.label, color: x.color, value: String(x.values.reduce((a, b) => a + b, 0)) }))} />
          </div>
        </section>
        <section className="card" data-enter>
          <header><h2>AI agents</h2><button className="link" onClick={() => s.go("/agents")}>Manage</button></header>
          <ul className="agents">
            {AGENTS.map((a) => (
              <li key={a.id}>
                <Chan c={KIND_CH[a.kind]} s={30} />
                <div className="grow"><b>{a.name}</b><small>{Math.round(a.runs / 30)} contacts a day · {Math.round((a.solved / a.runs) * 100)}% solved without a person</small></div>
                <span className="state on"><i />Live</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid-3">
        <section className="card" data-enter>
          <header><h2>Review activity</h2><span className="muted">What people did with AI drafts</span></header>
          <div className="body stack">
            {AGENTS.filter((a) => a.approved + a.edited + a.rejected > 0).map((a) => (
              <div key={a.id} className="mini">
                <span className="ml">{a.name}</span>
                <SplitBar label={a.name} parts={[{ label: "Approved", value: a.approved, color: "var(--pos)" }, { label: "Edited", value: a.edited, color: "var(--warn-mid)" }, { label: "Rejected", value: a.rejected, color: "var(--neg)" }]} />
              </div>
            ))}
          </div>
        </section>
        <section className="card" data-enter>
          <header><h2>Exceptions</h2><span className="muted">Cases the agents parked, 30 days</span></header>
          <div className="body">
            <HBars compact rows={EXC_REASONS.map((r) => ({ label: r.label, value: r.value }))} color="var(--warn-mid)" />
            <ul className="mini-list">
              {EXCEPTIONS.slice(0, 3).map((e) => <li key={e.id}><span className="mono">{e.id}</span><span className="grow">{e.reason}</span><span className="muted">{fmtTime(e.at)}</span></li>)}
            </ul>
          </div>
        </section>
        <section className="card social-pulse" data-enter>
          <header><h2>Social pulse</h2><button className="link" onClick={() => s.go("/social")}>Open</button></header>
          <div className="body">
            <div className="spike"><Icon n="zap" s={16} /><span><b>{SPIKE.theme}</b> comments are 3× the usual level today.</span></div>
            <SplitBar label="Facebook page sentiment" parts={[{ label: "Negative", value: fb.neg, color: "var(--neg)" }, { label: "Neutral", value: fb.neu, color: "var(--neu)" }, { label: "Positive", value: fb.pos, color: "var(--pos)" }]} />
            <p className="muted small">Facebook page and Messenger pilot, last 7 days.</p>
          </div>
        </section>
      </div>

      <div className="grid-1-1">
        <section className="card" data-enter>
          <header><h2>This week against last week</h2><span className="muted">Cases opened per day</span></header>
          <div className="body">
            <PairedBars rows={pairs} a={{ label: "This week", color: "var(--primary)" }} b={{ label: "Last week", color: "var(--line-strong)" }} label="Cases opened per day, this week against last week" />
            <Legend items={[{ label: "This week", color: "var(--primary)", value: String(pairs.reduce((x, p) => x + p.a, 0)) }, { label: "Last week", color: "var(--line-strong)", value: String(pairs.reduce((x, p) => x + p.b, 0)) }]} />
          </div>
        </section>
        <section className="card" data-enter>
          <header><h2>Within deadline, by unit</h2><span className="muted">The mark is the 90% target</span></header>
          <div className="body"><HBars rows={UNIT_SLA.map((u) => ({ label: u.unit, value: u.within, tone: u.within < 90 ? "risk" : undefined, note: `${u.cases} cases` }))} max={100} target={90} fmt={(v) => `${v}%`} color="var(--primary)" /></div>
        </section>
      </div>
    </div></div>
  );
}
