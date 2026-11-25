import { useEffect, useState } from "react";
import type { Channel } from "./data";
import { Sheet } from "./sheet";
import type { Store } from "./store";
import { Chan, Icon } from "./ui";

const OPTIONS: { id: string; name: string; detail: string; ch: Channel; agent: string; pick: string; choices: string[] }[] = [
  { id: "outlook", name: "Microsoft Outlook mailbox", detail: "Shared customer service mailbox", ch: "email", agent: "Email agent", pick: "Mailbox", choices: ["customercare@landbank.example", "cardservices@landbank.example", "loans@landbank.example"] },
  { id: "chat", name: "Website and online banking chat", detail: "Before and after login", ch: "chat", agent: "Chat agent", pick: "Where the chat shows", choices: ["Public website", "Online banking, after login", "Mobile app"] },
  { id: "fb", name: "Facebook page and Messenger", detail: "Comments and private messages", ch: "facebook", agent: "Social media agent", pick: "Page", choices: ["Land Bank of the Philippines (official page)"] },
  { id: "x", name: "X", detail: "Mentions and replies", ch: "x", agent: "Social media agent", pick: "Account", choices: ["@LBP_Official"] },
  { id: "li", name: "LinkedIn", detail: "Comments on company posts", ch: "linkedin", agent: "Social media agent", pick: "Page", choices: ["Land Bank of the Philippines (Official)"] },
  { id: "tel", name: "Telephony provider", detail: "Hotline, inbound and outbound calls", ch: "voice", agent: "Voice agent", pick: "Number", choices: ["Customer care hotline", "Card services line"] },
];
export const ALREADY = ["outlook", "chat", "fb", "tel"];
const STEPS = ["Sign in with the provider and grant access", "Check the permissions the agent needs", "Read 5 recent items as a test", "Turn on the agent for this channel"];

export function ConnectSheet({ s, onClose }: { s: Store; onClose: () => void }) {
  const [opt, setOpt] = useState<(typeof OPTIONS)[number] | null>(null);
  const [choice, setChoice] = useState("");
  const [review, setReview] = useState(true);
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (step < 0 || step >= STEPS.length) return;
    const h = window.setTimeout(() => setStep((x) => x + 1), 850);
    return () => window.clearTimeout(h);
  }, [step]);
  const done = step >= STEPS.length;

  return (
    <Sheet title="Connect a channel" sub="The agent reads and replies only on what you connect here. Access can be revoked at any time from Settings > Agent keys." onClose={onClose}
      footer={!opt ? undefined : done
        ? <><span className="sp" /><button className="btn p" onClick={() => { s.connect(opt.id); s.toast(`${opt.name} connected to the ${opt.agent.toLowerCase()}`); onClose(); }}>Done</button></>
        : <><button className="btn g" onClick={() => { setOpt(null); setStep(-1); }} disabled={step >= 0}>Back</button><span className="sp" /><button className="btn p" disabled={!choice || step >= 0} onClick={() => setStep(0)}><Icon n="plug" s={16} />Connect</button></>}>
      {!opt && (
        <div className="connect-list">
          {OPTIONS.map((o) => (
            <button key={o.id} onClick={() => { setOpt(o); setChoice(o.choices[0]); }}>
              <Chan c={o.ch} s={30} /><span className="grow"><b>{o.name}</b><small>{o.detail} · {o.agent}</small></span>
              {(s.connected[o.id] || ALREADY.includes(o.id)) && <span className="state on"><i />On</span>}
            </button>
          ))}
        </div>
      )}
      {opt && (
        <div className="form">
          <div className="picked"><Chan c={opt.ch} s={32} /><span className="grow"><b>{opt.name}</b><small>Handled by the {opt.agent.toLowerCase()}</small></span></div>
          <div className="field"><label htmlFor="cn-c">{opt.pick}</label>
            <select id="cn-c" className="select" value={choice} onChange={(e) => setChoice(e.target.value)} disabled={step >= 0}>{opt.choices.map((c) => <option key={c}>{c}</option>)}</select></div>
          <label className="check"><input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} disabled={step >= 0} />A person approves every reply before it goes out</label>
          {step >= 0 && (
            <ol className="steps-v" aria-live="polite">
              {STEPS.map((t, i) => <li key={t} className={i < step ? "done" : i === step ? "now" : ""}><i>{i < step && <Icon n="check" s={12} />}</i>{t}</li>)}
            </ol>
          )}
          {done && <p className="hint"><Icon n="check" s={14} />Connected. New items appear in Cases within a minute{opt.ch === "facebook" ? ", and on Social sentiment" : ""}.</p>}
        </div>
      )}
    </Sheet>
  );
}
