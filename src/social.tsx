import { useState } from "react";
import { HBars, Legend, Lines, SplitBar, StackedBars } from "./charts";
import { DAILY_BY_TYPE, DAYS, LANGS, PLATFORMS, outcomes, POSTS, POST_TYPES, RESEARCH, SPIKE, THEMES, THEME_WEEK, TYPE_COLOR, type SocialPost } from "./social-data";
import type { Store } from "./store";
import { Chan, Icon, Pill } from "./ui";

const ACTION: Record<SocialPost["action"], { label: string; tone: "ai" | "pri" | "neg" | "" | "pos" }> = {
  draft: { label: "Reply drafted", tone: "ai" }, dm: { label: "Moved to private message", tone: "pri" }, case: { label: "Case opened", tone: "pri" },
  fraud: { label: "Sent to the fraud team", tone: "neg" }, none: { label: "No reply needed", tone: "" },
};
const SENT_TONE = { Negative: "neg", Neutral: "", Positive: "pos" } as const;

export function Social({ s }: { s: Store }) {
  const [span, setSpan] = useState<7 | 14>(14);
  const [posts, setPosts] = useState(POSTS);
  const [filter, setFilter] = useState<"All" | (typeof POST_TYPES)[number]>("All");
  const [spikeDone, setSpikeDone] = useState(false);
  const from = DAYS.length - span;
  const labels = DAYS.slice(from);
  const series = POST_TYPES.map((t) => ({ key: t, label: t, color: TYPE_COLOR[t], values: DAILY_BY_TYPE[t].slice(from) }));
  const total = series.reduce((a, x) => a + x.values.reduce((p, q) => p + q, 0), 0);
  const negShare = labels.map((_, i) => {
    const day = POST_TYPES.reduce((a, t) => a + DAILY_BY_TYPE[t][from + i], 0);
    return Math.round(((DAILY_BY_TYPE.Grievance[from + i] + DAILY_BY_TYPE.Distress[from + i] + DAILY_BY_TYPE.Scam[from + i]) / day) * 100);
  });
  const posShare = labels.map((_, i) => Math.round((DAILY_BY_TYPE.Praise[from + i] / POST_TYPES.reduce((a, t) => a + DAILY_BY_TYPE[t][from + i], 0)) * 100));
  const shown = posts.filter((p) => filter === "All" || p.type === filter);
  const act = (id: string, action: SocialPost["action"], msg: string) => { setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, action, draft: undefined } : p))); s.toast(msg); };

  return (
    <div className="view"><div className="page dash">
      <div className="hello" data-enter>
        <div>
          <h1 className="display">Social sentiment</h1>
          <p className="muted">What customers say about the bank in public, sorted and answered by the social media agent. A person approves every public reply. Figures are sample data from a Facebook page pilot.</p>
        </div>
        <div className="seg-ctl" role="group" aria-label="Period"><button aria-pressed={span === 7} onClick={() => setSpan(7)}>7 days</button><button aria-pressed={span === 14} onClick={() => setSpan(14)}>14 days</button></div>
      </div>

      <section className="platforms" aria-label="Connected channels" data-enter>
        {PLATFORMS.map((p0) => s.connected[p0.id] ? { ...p0, state: "Connected" as const, note: "Connected today, no comments yet" } : p0).map((p) => (
          <div key={p.id} className={`plat ${p.state === "Pilot" || p.state === "Connected" ? "on" : p.state === "Waiting for access" ? "wait" : "off"}`}>
            {p.channel ? <Chan c={p.channel} s={24} /> : <span className="plat-ic"><Icon n="globe" s={14} /></span>}
            <span className="grow"><b>{p.label}</b><small>{p.state === "Pilot" ? `Pilot · ${p.volume} in 14 days` : p.note}</small></span>
            <span className="state"><i />{p.state === "Pilot" || p.state === "Connected" ? "Live" : p.state === "Waiting for access" ? "Waiting" : "Off"}</span>
          </div>
        ))}
        <button className="plat add" onClick={() => s.go("/agents")}><span className="plat-ic"><Icon n="plus" s={14} /></span><span className="grow"><b>Connect a channel</b><small>From AI agents</small></span></button>
      </section>

      {!spikeDone && (
        <section className="alertbar" role="status" data-enter>
          <Icon n="zap" s={18} />
          <div className="grow"><b>Spike: {SPIKE.theme}</b><span>{SPIKE.text} {SPIKE.today} comments today against about {SPIKE.usual} on a usual day. A known-issue reply is ready for approval.</span></div>
          <button className="btn sm" onClick={() => s.go("/inbox/LB-2611-0427")}>See an example</button>
          <button className="btn p sm" onClick={() => { setSpikeDone(true); s.toast("Known-issue reply approved for app and code comments"); }}>Approve the reply</button>
        </section>
      )}

      <div className="grid-2-1">
        <section className="card" data-enter>
          <header><h2>Comments and messages per day</h2><span className="muted">{total.toLocaleString("en-US")} in {span} days, by type</span></header>
          <div className="body">
            <StackedBars series={series} labels={labels} label={`Comments per day by type, last ${span} days`} />
            <Legend items={series.map((x) => ({ label: x.label, color: x.color, value: String(x.values.reduce((a, b) => a + b, 0)) }))} />
          </div>
        </section>
        <section className="card" data-enter>
          <header><h2>Sentiment by channel</h2></header>
          <div className="body stack">
            {PLATFORMS.filter((p) => p.volume > 0).map((p) => (
              <div key={p.id} className="mini"><span className="ml"><Chan c={p.channel!} s={18} />{p.label}</span>
                <SplitBar label={`${p.label} sentiment`} parts={[{ label: "Negative", value: p.neg, color: "var(--neg)" }, { label: "Neutral", value: p.neu, color: "var(--neu)" }, { label: "Positive", value: p.pos, color: "var(--pos)" }]} /></div>
            ))}
            <div className="mini"><span className="ml">Language</span>
              <SplitBar label="Language" parts={LANGS.map((l, i) => ({ label: l.label, value: l.value, color: ["var(--c-email)", "var(--c-social)", "var(--c-voice)"][i] }))} /></div>
          </div>
        </section>
      </div>

      <div className="grid-1-1">
        <section className="card" data-enter>
          <header><h2>Top issues this week</h2><span className="muted">Change against last week</span></header>
          <div className="body"><HBars rows={THEME_WEEK.map((t) => ({ label: t.theme, value: t.now, prev: t.prev, color: t.theme === "Praise" ? "var(--pos)" : t.theme === SPIKE.theme ? "var(--neg)" : "var(--primary)" }))} /></div>
        </section>
        <section className="card" data-enter>
          <header><h2>Negative and positive share</h2><span className="muted">Share of each day's comments</span></header>
          <div className="body">
            <Lines labels={labels} max={100} suffix="%" label="Negative and positive share per day" series={[{ key: "neg", label: "Negative", color: "var(--neg)", values: negShare }, { key: "pos", label: "Positive", color: "var(--pos)", values: posShare }]} />
            <Legend items={[{ label: "Negative: grievance, distress and scam", color: "var(--neg)" }, { label: "Positive: praise", color: "var(--pos)" }]} />
          </div>
        </section>
      </div>

      <div className="grid-2-1">
        <section className="card" data-enter>
          <header><h2>Latest comments</h2>
            <div className="seg-ctl small" role="group" aria-label="Type">{(["All", ...POST_TYPES] as const).map((t) => <button key={t} aria-pressed={filter === t} onClick={() => setFilter(t)}>{t}</button>)}</div>
          </header>
          <ul className="feed">
            {shown.map((p) => (
              <li key={p.id}>
                <Chan c={p.platform} s={28} />
                <div className="grow">
                  <div className="fh"><b>{p.handle}</b><span className="muted">{p.at} · {p.lang}</span></div>
                  <p>{p.text}</p>
                  <div className="tags">
                    <Pill tone={p.type === "Scam" || p.type === "Distress" ? "neg" : p.type === "Praise" ? "pos" : ""}>{p.type}</Pill>
                    <Pill tone={SENT_TONE[p.sentiment]}>{p.sentiment}</Pill>
                    <span className="muted small">{p.theme}</span>
                  </div>
                  {p.draft && <div className="fdraft"><Pill tone="ai" icon="spark">Public reply drafted</Pill><p>{p.draft}</p>
                    <div className="acts"><button className="btn p sm" onClick={() => act(p.id, "none", "Reply approved and posted")}><Icon n="check" s={14} />Approve and post</button><button className="btn sm" onClick={() => act(p.id, "dm", "Moved to a private message")}>Move to private message</button></div></div>}
                </div>
                <div className="fa">
                  <Pill tone={ACTION[p.action].tone}>{ACTION[p.action].label}</Pill>
                  {p.caseId && <button className="link small" onClick={() => s.go(`/inbox/${p.caseId}`)}>{p.caseId}</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <div className="col">
          <section className="card" data-enter>
            <header><h2>Where they went</h2><span className="muted">{span} days</span></header>
            <div className="body"><HBars compact rows={outcomes(span).map((o) => ({ label: o.label, value: o.value }))} color="var(--primary)" /></div>
          </section>
          <section className="card research" data-enter>
            <header><h2>Research baseline</h2></header>
            <div className="body">
              <p className="small">{RESEARCH.title}. Real public reviews, not workspace data.</p>
              <HBars compact rows={THEMES.map((t, i) => ({ label: t, value: RESEARCH.themes[i], color: t === "Praise" ? "var(--pos)" : "var(--ink-3)" }))} />
              <SplitBar label="Review sentiment" parts={[{ label: "Negative", value: RESEARCH.sentiment.negative, color: "var(--neg)" }, { label: "Neutral", value: RESEARCH.sentiment.neutral, color: "var(--neu)" }, { label: "Positive", value: RESEARCH.sentiment.positive, color: "var(--pos)" }]} />
              <p className="muted small">{RESEARCH.source}.</p>
            </div>
          </section>
        </div>
      </div>
    </div></div>
  );
}
