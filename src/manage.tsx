import { useState } from "react";
import {
  AGENTS, CHANNEL_LABEL, DAILY, EXCEPTIONS, EXC_REASONS, FIELD_EDITS, HEALTH, NOW, PEAK, PIPE, OUTER, STAFF, STEP_LATENCY, TOTAL_VOLUME, UNIT_SLA, VOLUME,
  customer, dueLabel, fmtDay, fmtTime, staffName, type AgentKind,
} from "./data";
import { HBars, Legend, PairedBars, SplitBar, StackedBars } from "./charts";
import { CH_COLORS, dailyByChannel } from "./overview";
import { Titlebar } from "./parts";
import { ConnectSheet } from "./connect";
import { isOpen, type Store } from "./store";
import { Avatar, BarList, Chan, Empty, Heat, Icon, MenuItem, Pill, Popover, Switch } from "./ui";

const KIND_CH: Record<AgentKind, "email" | "chat" | "facebook" | "voice"> = { email: "email", chat: "chat", social: "facebook", voice: "voice" };

// ---------------------------------------------------------------- approvals
export function Approvals({ s }: { s: Store }) {
  const [tab, setTab] = useState<"AI replies" | "Deadline extensions">("AI replies");
  const drafts = s.cases.filter((c) => c.draft && isOpen(c));
  const high = drafts.filter((c) => c.draft!.confidence >= 0.9);
  return (
    <div className="view"><div className="page" style={{ maxWidth: 920 }}>
      <Titlebar title="Approvals" sub="What the AI proposes and what people ask for, waiting for a decision">
        {tab === "AI replies" && high.length > 0 && <button className="btn p" onClick={() => high.forEach((c) => s.send(c.id, c.draft!.text, true))}><Icon n="check" s={16} />Approve {high.length} above 90%</button>}
      </Titlebar>
      <div className="tabs" role="tablist" style={{ marginTop: 0 }}>
        {(["AI replies", "Deadline extensions"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}<span className="n">{t === "AI replies" ? drafts.length : s.extensions.length}</span></button>
        ))}
      </div>
      {tab === "AI replies" ? (
        drafts.length === 0 ? <div className="card"><Empty title="All caught up">No AI replies are waiting.</Empty></div> :
        <ul className="list-rows card">
          {drafts.map((c) => (
            <li key={c.id}>
              <div className="item-top">
                <Chan c={c.channel} s={22} />
                <div className="grow"><button className="rowlink" onClick={() => s.go(`/inbox/${c.id}`)}>{c.subject}</button>
                  <div className="muted" style={{ fontSize: 12 }}><button className="link" style={{ fontSize: 12 }} onClick={() => s.go(`/customers/${c.customerId}`)}>{customer(c.customerId).name}</button>, {c.draft!.agent}, {Math.round(c.draft!.confidence * 100)}% confident</div></div>
                {c.draft!.confidence < 0.85 && <Pill tone="warn">Needs a careful read</Pill>}
              </div>
              <p className="quote">{c.draft!.text}</p>
              <div className="acts">
                <button className="btn sm p" onClick={() => s.send(c.id, c.draft!.text, true)}><Icon n="check" s={16} />Approve and send</button>
                <button className="btn sm" onClick={() => s.go(`/inbox/${c.id}`)}>Edit in case</button>
                <button className="btn sm d" onClick={() => s.discard(c.id)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      ) : s.extensions.length === 0 ? <div className="card"><Empty title="All caught up">No extension requests are waiting.</Empty></div> : (
        <ul className="list-rows card">
          {s.extensions.map((x) => {
            const c = s.cases.find((k) => k.id === x.caseId)!;
            return (
              <li key={x.id}>
                <div><button className="rowlink" onClick={() => s.go(`/inbox/${c.id}`)}>{c.subject}</button><div className="muted" style={{ fontSize: 12 }}>{c.id}, asked by {staffName(x.by)} at {fmtTime(x.asked)}</div></div>
                <p className="quote">{x.reason}</p>
                <div className="muted" style={{ fontSize: 13 }}>Deadline moves from <b>{fmtTime(x.oldDue)}</b> to <b>{fmtTime(x.newDue)}</b></div>
                <div className="acts"><button className="btn sm p" onClick={() => s.decide(x.id, true)}>Approve extension</button><button className="btn sm d" onClick={() => s.decide(x.id, false)}>Reject</button></div>
              </li>
            );
          })}
        </ul>
      )}
    </div></div>
  );
}

// ---------------------------------------------------------------- team and deadlines
export function Team({ s }: { s: Store }) {
  const [status, setStatus] = useState<Record<string, "Online" | "Away" | "Offline">>(() => Object.fromEntries(STAFF.map((p) => [p.id, p.status])));
  const openCases = s.cases.filter(isOpen);
  const risk = openCases.filter((c) => dueLabel(c.due).tone !== "ok").sort((a, b) => a.due - b.due);
  const overdue = openCases.filter((c) => dueLabel(c.due).tone === "breach");
  const today = openCases.filter((c) => new Date(c.due).toDateString() === new Date(NOW).toDateString());
  const unassigned = openCases.filter((c) => !c.assignee).length;
  const reshuffle = (id: string) => {
    const online = STAFF.filter((p) => status[p.id] === "Online" && p.id !== id);
    const mine = openCases.filter((c) => c.assignee === id);
    mine.forEach((c, i) => s.assign(c.id, online[i % online.length].id));
    s.toast(`${mine.length} case${mine.length === 1 ? "" : "s"} reshuffled to people who are online`);
  };
  return (
    <div className="view"><div className="page">
      <Titlebar title="Team and deadlines" sub="Who has what, who is available and which cases are close to a deadline" />
      <div className="health" aria-label="System health">
        {HEALTH.map((h) => (
          <div key={h.name}><b><i className={`dot ${h.state === "Healthy" ? "" : "away"}`} />{h.name}</b><span className="muted">{h.state}, {h.note}</span></div>
        ))}
      </div>
      <div className="kpis">
        <div className="kpi"><div className="l">Open cases</div><div className="v">{openCases.length}</div><div className="d">{unassigned} not assigned</div></div>
        <div className="kpi"><div className="l">Due today</div><div className="v">{today.length}</div><div className="d">{today.length ? `last one at ${new Date(Math.max(...today.map((c) => c.due))).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}` : "Nothing due"}</div></div>
        <div className="kpi"><div className="l">At risk</div><div className="v">{risk.length - overdue.length}</div><div className="d">under 4 hours left</div></div>
        <div className="kpi"><div className="l">Overdue</div><div className="v" style={{ color: overdue.length ? "var(--neg)" : undefined }}>{overdue.length}</div><div className={`d ${overdue.length ? "neg" : ""}`}>{overdue.length ? (overdue.every((c) => s.extensions.some((x) => x.caseId === c.id)) ? "Extension asked, not decided" : "Needs action now") : "None"}</div></div>
      </div>
      <div className="card tbl-wrap">
        <header><h2>Team status</h2><span className="muted">Open cases against capacity, and who can take more</span></header>
        <table className="tbl" style={{ marginTop: 8 }}>
          <thead><tr><th>Person</th><th>Status</th><th className="num">Open cases</th><th className="num">Done today</th><th className="num">Average handling</th><th /></tr></thead>
          <tbody>
            {STAFF.map((p) => {
              const n = openCases.filter((c) => c.assignee === p.id).length;
              const st = status[p.id];
              return (
                <tr key={p.id}>
                  <td><span className="item-top"><Avatar name={p.name} size={32} /><span><b style={{ fontWeight: 600 }}>{p.name}</b><div className="muted" style={{ fontSize: 12 }}>{p.role}, {p.unit}</div></span></span></td>
                  <td><span className="item-top"><i className={`dot ${st === "Away" ? "away" : st === "Offline" ? "off" : ""}`} />{st}</span></td>
                  <td className="num" style={{ color: n > p.capacity * 0.8 ? "var(--neg)" : undefined }}>{n} of {p.capacity}</td>
                  <td className="num">{p.doneToday}</td><td className="num">{p.handleMin} min</td>
                  <td className="num">
                    <span className="acts" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                      {st !== "Online" && n > 0 && <button className="btn sm" onClick={() => reshuffle(p.id)}><Icon n="refresh" s={14} />Reshuffle</button>}
                      <Popover width={180} align="end" button={({ toggle, ref }) => <button ref={ref} className="btn sm" onClick={toggle}>Set status<Icon n="down" s={14} /></button>}>
                        {(close) => <>{(["Online", "Away", "Offline"] as const).map((x) => <MenuItem key={x} active={st === x} onClick={() => { setStatus({ ...status, [p.id]: x }); close(); }}>{x}</MenuItem>)}</>}
                      </Popover>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card">
        <header><h2>Cases that need action</h2><span className="muted">Closest deadline first</span></header>
        <div className="body" style={{ paddingTop: 4 }}>
          {risk.length === 0 && <div className="muted">No case is close to a deadline.</div>}
          {risk.map((c) => {
            const d = dueLabel(c.due);
            return (
              <div key={c.id} className="line-item" style={{ flexWrap: "wrap" }}>
                <Chan c={c.channel} s={20} />
                <div className="grow" style={{ minWidth: 200 }}>
                  <button className="rowlink" onClick={() => s.go(`/inbox/${c.id}`)}>{c.subject}</button>
                  <div style={{ fontSize: 12, color: d.tone === "breach" ? "var(--neg)" : "var(--warn)", fontWeight: 500 }}>{d.text} <span className="muted" style={{ fontWeight: 400 }}>{c.id}, {c.unit}</span></div>
                </div>
                <Popover width={230} align="end" button={({ toggle, ref }) => <button ref={ref} className="menu" onClick={toggle}>{staffName(c.assignee)}<Icon n="down" s={14} /></button>}>
                  {(close) => <><MenuItem active={!c.assignee} onClick={() => { s.assign(c.id, null); close(); }}>Unassigned</MenuItem>{STAFF.map((p) => <MenuItem key={p.id} active={c.assignee === p.id} onClick={() => { s.assign(c.id, p.id); s.toast(`Reassigned to ${p.name}`); close(); }}>{p.name}</MenuItem>)}</>}
                </Popover>
              </div>
            );
          })}
        </div>
      </div>
    </div></div>
  );
}

// ---------------------------------------------------------------- reports
type RTab = "Overview" | "Channels" | "AI agents" | "Review activity" | "Exceptions" | "Daily and weekly";
export function Reports() {
  const [tab, setTab] = useState<RTab>("Overview");
  const [period, setPeriod] = useState<7 | 30>(30);
  const [chan, setChan] = useState<"all" | AgentKind>("all");
  const ratio = period === 30 ? 1 : DAILY.slice(-7).reduce((a, b) => a + b, 0) / TOTAL_VOLUME;
  const sc = (n: number) => Math.round(n * ratio);
  const agents = AGENTS.filter((a) => chan === "all" || a.kind === chan);
  const runs = agents.reduce((a, g) => a + g.runs, 0);
  const solved = agents.reduce((a, g) => a + g.solved, 0);
  const handed = agents.reduce((a, g) => a + g.handed, 0);
  const acc = agents.reduce((a, g) => a + g.accuracy * g.runs, 0) / runs;
  const within = Math.round(UNIT_SLA.reduce((a, u) => a + u.within * u.cases, 0) / TOTAL_VOLUME);
  const volume = chan === "all" ? TOTAL_VOLUME : runs;
  const labels = Array.from({ length: 30 }, (_, i) => new Date(NOW - (29 - i) * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Manila" }));
  const daily = DAILY.map((v) => (chan === "all" ? v : Math.round((v * runs) / TOTAL_VOLUME)));
  const tot = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const days = Array.from({ length: 14 }, (_, i) => 29 - i).map((i) => ({ label: labels[i], v: daily[i] }));
  const weeks = [3, 2, 1, 0].map((w) => ({ label: `${labels[29 - (w + 1) * 7 + 1]} to ${labels[29 - w * 7]}`, v: tot(daily.slice(29 - (w + 1) * 7 + 1, 29 - w * 7 + 1)) }));
  const fp = (n: number) => `${n.toFixed(1)}%`;
  return (
    <div className="view"><div className="page">
      <Titlebar title="Reports" sub={`${period === 30 ? "Last 30 days, 24 Oct to 22 Nov 2026" : "Last 7 days, 16 to 22 Nov 2026"}, ${chan === "all" ? "all channels" : CHANNEL_LABEL[KIND_CH[chan]]}`}>
        <div className="seg-ctl" role="group" aria-label="Period"><button aria-pressed={period === 7} onClick={() => setPeriod(7)}>7 days</button><button aria-pressed={period === 30} onClick={() => setPeriod(30)}>30 days</button></div>
        <select className="select" style={{ width: 160 }} aria-label="Channel" value={chan} onChange={(e) => setChan(e.target.value as "all" | AgentKind)}>
          <option value="all">All channels</option><option value="email">Email</option><option value="chat">Chat</option><option value="social">Social media</option><option value="voice">Voice</option>
        </select>
        <button className="btn" onClick={() => alert("Export is not part of the prototype")}>Export CSV</button>
      </Titlebar>
      <div className="tabs" role="tablist" style={{ marginTop: 0 }}>
        {(["Overview", "Channels", "AI agents", "Review activity", "Exceptions", "Daily and weekly"] as RTab[]).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Overview" && <>
        <div className="kpis five">
          <div className="kpi"><div className="l">Cases opened</div><div className="v">{sc(volume).toLocaleString("en-US")}</div><div className="d">{chan === "all" ? "across 5 channels" : "on this channel"}</div></div>
          <div className="kpi"><div className="l">Containment</div><div className="v">{Math.round((solved / runs) * 100)}<small>%</small></div><div className="d">solved by AI alone</div></div>
          <div className="kpi"><div className="l">Escalation rate</div><div className="v">{Math.round((handed / runs) * 100)}<small>%</small></div><div className="d">handed to people</div></div>
          <div className="kpi"><div className="l">Case accuracy</div><div className="v">{fp(acc)}</div><div className="d">tagged correctly</div></div>
          <div className="kpi"><div className="l">Within deadline</div><div className="v">{within}<small>%</small></div><div className="d">target 90%</div></div>
        </div>
        <div className="charts">
          <div className="card"><header><h2>Cases opened per day</h2><span className="muted">By channel. Weekends are quieter.</span></header><div className="body">
            {(() => { const d = dailyByChannel(period); const ser = chan === "all" ? d.series : d.series.filter((x) => x.label.toLowerCase().startsWith(chan === "social" ? "social" : chan)); return <><StackedBars series={ser} labels={d.labels} label={`Cases opened per day by channel, last ${period} days`} /><Legend items={ser.map((x) => ({ label: x.label, color: x.color, value: String(x.values.reduce((a, b) => a + b, 0)) }))} /></>; })()}
          </div></div>
          <div className="card"><header><h2>Cases by channel</h2></header><div className="body"><HBars rows={VOLUME.map((v) => ({ label: v.label, value: sc(v.value), color: CH_COLORS[v.label] }))} fmt={(v) => v.toLocaleString("en-US")} />
            <dl className="kv" style={{ gridTemplateColumns: "120px 1fr", marginTop: 18 }}><dt>Busiest day</dt><dd>{labels[daily.indexOf(Math.max(...daily))]}, {Math.max(...daily)} cases</dd><dt>Quietest day</dt><dd>{labels[daily.indexOf(Math.min(...daily))]}, {Math.min(...daily)} cases</dd><dt>Daily average</dt><dd>{Math.round(tot(daily) / 30)} cases</dd></dl></div></div>
        </div>
        <div className="cols">
          <div className="card"><header><h2>Peak hours</h2><span className="muted">Cases per hour, 07:00 to 22:00. Busiest at 12:00.</span></header>
            <div className="body"><Heat values={PEAK} labels={PEAK.map((_, i) => String(7 + i))} />
              <dl className="kv" style={{ gridTemplateColumns: "140px 1fr", marginTop: 18 }}><dt>Busiest hour</dt><dd>12:00, {Math.max(...PEAK)} cases</dd><dt>Quietest hour</dt><dd>07:00, {Math.min(...PEAK)} cases</dd><dt>Staffing tip</dt><dd>Keep most people online from 10:00 to 15:00</dd></dl></div></div>
          <div className="card"><header><h2>Deadline compliance by unit</h2><span className="muted">Dashed line is the 90% target</span></header>
            <div className="body"><HBars max={100} target={90} rows={UNIT_SLA.map((u) => ({ label: u.unit, value: u.within, tone: u.within < 90 ? "risk" as const : undefined }))} fmt={(v) => `${v}%`} /></div></div>
        </div>
      </>}

      {tab === "Channels" && <>
        <div className="card tbl-wrap">
          <header><h2>Agents by channel</h2></header>
          <table className="tbl" style={{ marginTop: 8 }}>
            <thead><tr><th>Agent</th><th className="num">Runs</th><th className="num">Solved</th><th className="num">Handed over</th><th className="num">Failed</th><th className="num">Containment</th><th className="num">Accuracy</th><th className="num">Handling</th><th className="num">P95</th></tr></thead>
            <tbody>{agents.map((a) => (
              <tr key={a.id}><td><span className="item-top"><Chan c={KIND_CH[a.kind]} s={20} /><b style={{ fontWeight: 600 }}>{a.name}</b></span></td>
                <td className="num">{sc(a.runs)}</td><td className="num">{sc(a.solved)}</td><td className="num">{sc(a.handed)}</td><td className="num">{sc(a.failed)}</td>
                <td className="num">{Math.round((a.solved / a.runs) * 100)}%</td><td className="num">{fp(a.accuracy)}</td><td className="num">{a.handleSec} s</td><td className="num">{a.p95} s</td></tr>))}</tbody>
          </table>
        </div>
        <div className="cols">
          {(chan === "all" || chan === "email") && <div className="card"><header><h2>Email: time per step</h2><span className="muted">Average seconds</span></header><div className="body"><BarList max={8} rows={STEP_LATENCY.email.map((x) => ({ label: x.name, value: x.avg }))} fmt={(v) => `${v.toFixed(1)} s`} /></div></div>}
          {(chan === "all" || chan === "social") && <div className="card"><header><h2>Social: post sentiment</h2><span className="muted">{sc(191)} posts classified</span></header><div className="body"><SplitBar label="Social post sentiment" parts={[{ label: "Negative", value: 55, color: "var(--neg)" }, { label: "Neutral", value: 34, color: "var(--neu)" }, { label: "Positive", value: 11, color: "var(--pos)" }]} /><a className="link small" href="#/social" style={{ display: "inline-block", marginTop: 12 }}>Open Social sentiment</a></div></div>}
          {(chan === "all" || chan === "voice") && <div className="card"><header><h2>Voice: calls</h2></header><div className="body"><dl className="kv" style={{ gridTemplateColumns: "190px 1fr" }}><dt>Average call length</dt><dd>1:52</dd><dt>Calls</dt><dd>{sc(154)}</dd><dt>Verification failures</dt><dd>{sc(6)} ({fp((6 / 154) * 100)})</dd><dt>Transferred to a person</dt><dd>{sc(79)}</dd></dl></div></div>}
          {(chan === "all" || chan === "chat") && <div className="card"><header><h2>Chat: hand-offs</h2></header><div className="body"><dl className="kv" style={{ gridTemplateColumns: "190px 1fr" }}><dt>Chats</dt><dd>{sc(688)}</dd><dt>Answered by the bot</dt><dd>{sc(431)}</dd><dt>Warm hand-offs</dt><dd>{sc(241)}</dd><dt>Average answer time</dt><dd>3.1 s</dd></dl></div></div>}
        </div>
      </>}

      {tab === "AI agents" && <>
        <div className="cols">
          <div className="card"><header><h2>Solved without a person</h2><span className="muted">Share of each agent's contacts</span></header>
            <div className="body"><HBars max={100} rows={agents.map((a) => ({ label: a.name, value: Math.round((a.solved / a.runs) * 100), color: CH_COLORS[a.kind === "social" ? "Social media" : a.kind[0].toUpperCase() + a.kind.slice(1)], note: `${sc(a.solved)} of ${sc(a.runs)}` }))} fmt={(v) => `${v}%`} /></div></div>
          <div className="card"><header><h2>What happened to each contact</h2></header>
            <div className="body stack">{agents.map((a) => <div className="mini" key={a.id}><span className="ml"><Chan c={KIND_CH[a.kind]} s={18} />{a.name}</span>
              <SplitBar label={a.name} parts={[{ label: "Solved", value: a.solved, color: "var(--pos)" }, { label: "Handed to a person", value: a.handed, color: "var(--ai)" }, { label: "Failed", value: a.failed, color: "var(--neg)" }]} /></div>)}</div></div>
        </div>
        <div className="cols">
          <div className="card"><header><h2>Tagged correctly</h2><span className="muted">Category and priority, checked by reviewers</span></header>
            <div className="body"><HBars max={100} target={90} rows={agents.map((a) => ({ label: a.name, value: a.accuracy, tone: a.accuracy < 90 ? "risk" as const : undefined }))} fmt={(v) => `${v.toFixed(1)}%`} color="var(--primary)" /></div></div>
          <div className="card"><header><h2>Slowest 5% of replies</h2><span className="muted">Seconds from contact to answer or draft</span></header>
            <div className="body"><HBars rows={agents.map((a) => ({ label: a.name, value: a.p95 }))} fmt={(v) => `${v} s`} color="var(--ai)" /></div></div>
        </div>
      </>}

      {tab === "Review activity" && <>
        <div className="kpis three">
          <div className="kpi"><div className="l">Approved as drafted</div><div className="v">{sc(agents.reduce((a, g) => a + g.approved, 0))}</div><div className="d">sent without changes</div></div>
          <div className="kpi"><div className="l">Edited then sent</div><div className="v">{sc(agents.reduce((a, g) => a + g.edited, 0))}</div><div className="d">people changed the draft</div></div>
          <div className="kpi"><div className="l">Rejected or parked</div><div className="v">{sc(agents.reduce((a, g) => a + g.rejected, 0))}</div><div className="d">did not go out</div></div>
        </div>
        <div className="cols">
          <div className="card"><header><h2>Drafts by agent</h2><span className="muted">Approved, edited or rejected by people</span></header>
            <div className="body stack">{agents.filter((a) => a.approved + a.edited + a.rejected > 0).map((a) => <div className="mini" key={a.id}><span className="ml"><Chan c={KIND_CH[a.kind]} s={18} />{a.name}</span>
              <SplitBar label={a.name} parts={[{ label: "Approved", value: a.approved, color: "var(--pos)" }, { label: "Edited", value: a.edited, color: "var(--warn-mid)" }, { label: "Rejected", value: a.rejected, color: "var(--neg)" }]} /></div>)}</div></div>
          <div className="card"><header><h2>Fields people changed</h2><span className="muted">Sent to the people who keep the knowledge base</span></header>
            <div className="body"><HBars rows={FIELD_EDITS.map((f) => ({ label: f.label, value: sc(f.value) }))} color="var(--warn-mid)" /></div></div>
        </div>
      </>}

      {tab === "Exceptions" && (<>
        <div className="card"><header><h2>Why the agents parked cases</h2><span className="muted">Last 30 days</span></header>
          <div className="body"><HBars rows={EXC_REASONS.map((r) => ({ label: r.label, value: sc(r.value) }))} color="var(--warn-mid)" /></div></div>
        <div className="card tbl-wrap"><header><h2>Cases the agents could not finish</h2><span className="muted">Parked with a reason</span></header>
          <table className="tbl" style={{ marginTop: 8 }}><thead><tr><th>Case</th><th>Park reason</th><th>Unit</th><th>When</th></tr></thead>
            <tbody>{EXCEPTIONS.map((e) => <tr key={e.id}><td className="mono">{e.id}</td><td><Pill tone="warn">{e.reason}</Pill></td><td>{e.unit}</td><td>{fmtTime(e.at)}</td></tr>)}</tbody></table></div>
      </>)}

      {tab === "Daily and weekly" && (<>
        <div className="cols">
          <div className="card"><header><h2>Daily, last 14 days</h2><span className="muted">Solved by AI and handed to people</span></header><div className="body">
            <StackedBars labels={days.slice().reverse().map((d) => d.label)} label="Cases per day, solved by AI and handed to people" series={[
              { key: "ai", label: "Solved by AI", color: "var(--pos)", values: days.slice().reverse().map((d) => Math.round(d.v * (solved / runs))) },
              { key: "pp", label: "Handed to people", color: "var(--ai)", values: days.slice().reverse().map((d) => d.v - Math.round(d.v * (solved / runs))) }]} />
            <Legend items={[{ label: "Solved by AI", color: "var(--pos)" }, { label: "Handed to people", color: "var(--ai)" }]} /></div></div>
          <div className="card"><header><h2>Weekly, last 4 weeks</h2><span className="muted">Cases opened and solved by AI</span></header><div className="body">
            <PairedBars rows={weeks.map((w, i) => ({ label: `Week ${i + 1}`, a: Math.round(w.v * (solved / runs)), b: w.v }))} a={{ label: "Solved by AI", color: "var(--pos)" }} b={{ label: "Cases opened", color: "var(--line-strong)" }} label="Cases per week" />
            <Legend items={[{ label: "Cases opened", color: "var(--line-strong)" }, { label: "Solved by AI", color: "var(--pos)" }]} /></div></div>
        </div>
        <div className="cols">
          <div className="card tbl-wrap"><header><h2>Daily</h2><span className="muted">Last 14 days</span></header>
            <table className="tbl" style={{ marginTop: 8 }}><thead><tr><th>Date</th><th className="num">Cases opened</th><th className="num">Solved by AI</th><th className="num">Handed to people</th></tr></thead>
              <tbody>{days.map((d) => <tr key={d.label}><td>{d.label}</td><td className="num">{d.v}</td><td className="num">{Math.round(d.v * (solved / runs))}</td><td className="num">{d.v - Math.round(d.v * (solved / runs))}</td></tr>)}</tbody></table></div>
          <div className="card tbl-wrap"><header><h2>Weekly</h2><span className="muted">Last 4 weeks</span></header>
            <table className="tbl" style={{ marginTop: 8 }}><thead><tr><th>Week</th><th className="num">Cases opened</th><th className="num">Solved by AI</th></tr></thead>
              <tbody>{weeks.map((w) => <tr key={w.label}><td>{w.label}</td><td className="num">{w.v}</td><td className="num">{Math.round(w.v * (solved / runs))}</td></tr>)}</tbody></table></div>
        </div>
      </>)}
    </div></div>
  );
}

// ---------------------------------------------------------------- AI agents
export function Agents({ s }: { s: Store }) {
  const [paused, setPaused] = useState<Record<string, boolean>>({});
  const [kind, setKind] = useState<AgentKind>("email");
  const [connect, setConnect] = useState(false);
  const money = (n: number) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const total = AGENTS.reduce((a, g) => a + g.runs * g.costPerRun, 0);
  const steps = PIPE[kind];
  return (
    <div className="view"><div className="page">
      <Titlebar title="AI agents" sub="Which agents work for the bank, the channels they listen to, what they did and what they cost. Last 30 days.">
        <button className="btn p" onClick={() => setConnect(true)}><Icon n="plug" s={16} />Connect a channel</button>
      </Titlebar>
      <div className="card"><header><h2>Connected channels</h2><span className="muted">Each agent reads and replies only on the channels connected here</span></header>
        <div className="body"><div className="conn-grid">
          {CONNECTED.map((c0) => { const c = c0.id && s.connected[c0.id] ? { ...c0, state: "on" as const, detail: c0.detail.replace(/(Developer|Page admin) access requested/, "Connected today · Social media agent") } : c0; return <div key={c.name} className={`conn ${c.state}`}><Chan c={c.ch} s={26} /><div className="grow"><b>{c.name}</b><small>{c.detail}</small></div><span className="state"><i />{c.state === "on" ? "Connected" : c.state === "wait" ? "Waiting" : "Not connected"}</span></div>; })}
        </div></div></div>
      {connect && <ConnectSheet s={s} onClose={() => setConnect(false)} />}
      <div className="kpis three">
        <div className="kpi"><div className="l">Runs</div><div className="v">{AGENTS.reduce((a, g) => a + g.runs, 0).toLocaleString("en-US")}</div><div className="d">{AGENTS.length} agents</div></div>
        <div className="kpi"><div className="l">Cost</div><div className="v">{money(total)}</div><div className="d">supplied by AgenticOrg</div></div>
        <div className="kpi"><div className="l">Cost per run</div><div className="v">{money(total / AGENTS.reduce((a, g) => a + g.runs, 0))}</div><div className="d">average across agents</div></div>
      </div>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Agent</th><th>Status</th><th className="num">Runs</th><th className="num">Solved</th><th className="num">Handed over</th><th className="num">Failed</th><th className="num">Cost per run</th><th className="num">Approved / edited / rejected</th><th /></tr></thead>
          <tbody>
            {AGENTS.map((a) => (
              <tr key={a.id}>
                <td><span className="item-top"><Chan c={KIND_CH[a.kind]} s={20} /><b style={{ fontWeight: 600 }}>{a.name}</b></span></td>
                <td>{paused[a.id] ? <Pill>Paused</Pill> : <Pill tone="pos">Active</Pill>}</td>
                <td className="num">{a.runs}</td><td className="num">{a.solved}</td><td className="num">{a.handed}</td><td className="num">{a.failed}</td><td className="num">{money(a.costPerRun)}</td>
                <td className="num">{a.approved + a.edited + a.rejected === 0 ? "None" : `${a.approved} / ${a.edited} / ${a.rejected}`}</td>
                <td className="num"><button className="btn sm" onClick={() => { setPaused({ ...paused, [a.id]: !paused[a.id] }); s.toast(`${a.name} ${paused[a.id] ? "resumed" : "paused"}`); }}>{paused[a.id] ? "Resume" : "Pause"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <header><h2>Pipeline each agent supplies</h2><span className="muted">Every case shows these stages. Only the first ones differ by channel.</span>
          <span className="seg-ctl sp" role="group" aria-label="Agent">{AGENTS.map((a) => <button key={a.id} aria-pressed={kind === a.kind} onClick={() => setKind(a.kind)}>{a.name.replace(" agent", "")}</button>)}</span></header>
        <div className="body">
          <div className="cols" style={{ alignItems: "start" }}>
            <div>
              {OUTER.map((o, i) => {
                const st = steps.filter((x) => x.outer === i);
                return (
                  <div key={o} className="line-item" style={{ alignItems: "flex-start" }}>
                    <Pill tone={st.length ? "pri" : ""}>{o}</Pill>
                    <div className="grow" style={{ fontSize: 13 }}>{st.length ? st.map((x) => x.name).join(", ") : <span className="muted">Handled by people in PineDesk</span>}</div>
                  </div>
                );
              })}
            </div>
            <div><div className="lbl" style={{ marginBottom: 10 }}>Average time per step, seconds</div>
              <BarList max={Math.max(...STEP_LATENCY[kind].map((x) => x.p95))} rows={STEP_LATENCY[kind].map((x) => ({ label: x.name, value: x.avg }))} fmt={(v) => `${v.toFixed(1)} s`} />
              <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>Slowest 5% take up to {Math.max(...STEP_LATENCY[kind].map((x) => x.p95)).toFixed(1)} s on one step.</div></div>
          </div>
        </div>
      </div>
      <div className="muted" style={{ fontSize: 13 }}>Edited and rejected replies go to the subject matter experts, who use them to improve the knowledge base.</div>
    </div></div>
  );
}

const CONNECTED: { id?: string; name: string; detail: string; ch: "email" | "chat" | "facebook" | "messenger" | "x" | "linkedin" | "voice"; state: "on" | "wait" | "off" }[] = [
  { name: "Customer care mailbox", detail: "Microsoft Outlook shared mailbox · Email agent", ch: "email", state: "on" },
  { name: "Website chat", detail: "Website and online banking · Chat agent", ch: "chat", state: "on" },
  { name: "Facebook page", detail: "Comments on bank posts · Social media agent", ch: "facebook", state: "on" },
  { name: "Messenger", detail: "Private messages · Social media agent", ch: "messenger", state: "on" },
  { id: "x", name: "X", detail: "Developer access requested", ch: "x", state: "wait" },
  { id: "li", name: "LinkedIn", detail: "Page admin access requested", ch: "linkedin", state: "wait" },
  { name: "Hotline", detail: "Telephony provider · Voice agent", ch: "voice", state: "on" },
];

// ---------------------------------------------------------------- settings
export function Settings({ s }: { s: Store }) {
  const [tab, setTab] = useState("Brand");
  const [notify, setNotify] = useState({ Email: true, SMS: true, "In-app": true });
  const [hooks, setHooks] = useState({ "case.created": true, "deadline.near": true, "case.closed": true, "approval.decided": false });
  const [keys, setKeys] = useState([
    { id: "k1", name: "Email agent", scope: "cases:write, customers:read", last: "2 min ago", tail: "8f3a", revoked: false },
    { id: "k2", name: "Chat agent", scope: "cases:write, customers:read", last: "just now", tail: "c71e", revoked: false },
    { id: "k3", name: "Social media agent", scope: "cases:write", last: "14 min ago", tail: "2b90", revoked: false },
    { id: "k4", name: "Voice agent", scope: "cases:write, customers:read", last: "3 h ago", tail: "d04c", revoked: false },
  ]);
  const tabs = ["Brand", "Routing and deadlines", "Notifications", "Agent keys and webhooks"];
  const sw = (hex: string, name: string) => <span className="swatch" key={name}><i style={{ background: hex }} />{name} {hex.toUpperCase()}</span>;
  const green = s.tenant === "landbank";
  return (
    <div className="view"><div className="page" style={{ maxWidth: 1040 }}>
      <Titlebar title="Settings" sub="Land Bank workspace. Set up by the bank admin, without an engineer." />
      <div className="tabs" role="tablist" style={{ marginTop: 0 }}>{tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "Brand" && (
        <div>
          <div className="srow"><div><h2>Workspace colours</h2><p>Four values re-colour the whole product. Customers and staff see the bank's brand.</p></div>
            <div className="card"><div className="body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="seg-ctl" role="group" aria-label="Colour set" style={{ alignSelf: "flex-start" }}>
                <button aria-pressed={!green} onClick={() => s.setTenant("default")}>Blue (default)</button><button aria-pressed={green} onClick={() => s.setTenant("landbank")}>Land Bank green</button>
              </div>
              <div className="swatches">{green ? [sw("#103a28", "Sidebar"), sw("#1b7a45", "Primary"), sw("#12602f", "Hover"), sw("#e4f3ea", "Selected tint")] : [sw("#0b1f4b", "Sidebar"), sw("#2b5ff2", "Primary"), sw("#1e48c8", "Hover"), sw("#eaf0fe", "Selected tint")]}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>The system checks that the primary colour has 4.5:1 contrast with white text.</div>
            </div></div></div>
          <div className="srow"><div><h2>Logo and name</h2><p>Shown in the sidebar, the sign-in page and customer emails.</p></div>
            <div className="card"><div className="body item-top" style={{ gap: 16 }}><div className="mark" style={{ width: 48, height: 48, fontSize: 20, borderRadius: 12 }} aria-hidden="true">LB</div><div className="grow"><b style={{ fontWeight: 600 }}>Land Bank</b><div className="muted" style={{ fontSize: 12.5 }}>Square logo, at least 256 pixels</div></div><button className="btn sm" onClick={() => s.toast("Uploading a logo is not part of the prototype")}>Upload logo</button></div></div></div>
          <div className="srow"><div><h2>Replies and approval</h2><p>How the AI drafts sound and who approves them.</p></div>
            <div className="card"><div className="body"><dl className="kv" style={{ gridTemplateColumns: "160px 1fr" }}><dt>Tone</dt><dd>Formal</dd><dt>Reply languages</dt><dd>English, Filipino</dd><dt>Human review</dt><dd>Always, for every AI reply</dd><dt>Approver</dt><dd>Team manager, reminder after 24 hours</dd></dl></div></div></div>
          <div className="srow"><div><h2>Email signature</h2><p>Added to every email reply that PineDesk sends.</p></div>
            <div className="card"><div className="body quote" style={{ margin: 16, whiteSpace: "pre-line" }}>{"Best regards,\nLand Bank Customer Care\nOpen Monday to Friday, 08:00 to 17:00"}</div></div></div>
          <div className="srow"><div><h2>Domain and sender</h2><p>Where the desk lives and who customers hear from.</p></div>
            <div className="card"><div className="body"><dl className="kv" style={{ gridTemplateColumns: "140px 1fr" }}><dt>Desk address</dt><dd className="mono">support.landbank.example</dd><dt>Sender address</dt><dd className="mono">care@landbank.example</dd><dt>Reply-to name</dt><dd>Land Bank Customer Care</dd></dl></div></div></div>
        </div>
      )}
      {tab === "Routing and deadlines" && (
        <div>
          <div className="srow"><div><h2>Routing rules</h2><p>Where a new case goes, by category. Fraud goes to the priority lane.</p></div>
            <div className="card tbl-wrap"><table className="tbl"><thead><tr><th>Category</th><th>Unit</th><th className="num">Deadline</th><th>Lane</th></tr></thead><tbody>
              {[["Fraud and disputes", "Cards", "8 hours", "Priority"], ["ATM and cards", "Cards", "1 day", "Standard"], ["Loans", "Loans", "3 working days", "Standard"], ["Deposits", "Deposits", "3 working days", "Standard"], ["Digital banking", "Digital Banking", "2 working days", "Standard"], ["Remittance", "Remittance", "2 working days", "Standard"]].map((r) => (
                <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td className="num">{r[2]}</td><td>{r[3] === "Priority" ? <Pill tone="neg">Priority</Pill> : r[3]}</td></tr>))}
            </tbody></table></div></div>
          <div className="srow"><div><h2>Working calendar</h2><p>Deadlines count working days only.</p></div>
            <div className="card"><div className="body"><dl className="kv" style={{ gridTemplateColumns: "140px 1fr" }}><dt>Working days</dt><dd>Monday to Friday</dd><dt>Working hours</dt><dd>08:00 to 17:00, Asia/Manila</dd><dt>Holidays</dt><dd>2026 national holiday list, 18 days</dd></dl></div></div></div>
          <div className="srow"><div><h2>Calls</h2><p>Calls from the desk run on the telephony provider.</p></div>
            <div className="card"><div className="body"><dl className="kv" style={{ gridTemplateColumns: "180px 1fr" }}><dt>Provider</dt><dd>Exotel</dd><dt>Recording</dt><dd>On by default, with a notice at the start</dd><dt>Who can be called</dt><dd>Numbers on file in the bank's CRM</dd></dl></div></div></div>
        </div>
      )}
      {tab === "Notifications" && (
        <div className="srow"><div><h2>Channels for notices</h2><p>Customer and internal notices use approved, versioned templates.</p></div>
          <div className="card"><div className="body">
            {Object.entries(notify).map(([k, v]) => <div key={k} className="line-item"><div className="grow">{k}</div><Switch label={k} checked={v} onChange={(x) => setNotify({ ...notify, [k]: x })} /></div>)}
          </div></div></div>
      )}
      {tab === "Agent keys and webhooks" && (
        <div>
          <div className="srow"><div><h2>Agent keys</h2><p>Each AgenticOrg agent has its own key with limited scope, so the audit log shows which agent did what.</p></div>
            <div className="card"><div className="body">
              {keys.map((k) => (
                <div key={k.id} className="line-item" style={{ flexWrap: "wrap" }}>
                  <div className="grow" style={{ minWidth: 180 }}><b style={{ fontWeight: 600 }}>{k.name}</b><div className="muted" style={{ fontSize: 12 }}>{k.scope}, used {k.last}</div></div>
                  <span className="mono">pd_live_••••{k.tail}</span>
                  {k.revoked ? <Pill tone="neg">Revoked</Pill> : <>
                    <button className="btn sm" onClick={() => s.toast(`New secret created for ${k.name}`)}>Rotate</button>
                    <button className="btn sm d" onClick={() => setKeys(keys.map((x) => (x.id === k.id ? { ...x, revoked: true } : x)))}>Revoke</button></>}
                </div>))}
            </div></div></div>
          <div className="srow"><div><h2>Webhooks</h2><p>Signed events that tell AgenticOrg what happens next.</p></div>
            <div className="card"><div className="body">
              {Object.entries(hooks).map(([k, v]) => <div key={k} className="line-item"><div className="grow mono">{k}</div><Switch label={k} checked={v} onChange={(x) => setHooks({ ...hooks, [k]: x })} /></div>)}
            </div></div></div>
        </div>
      )}
    </div></div>
  );
}
void fmtDay;
