import { useMemo, useState } from "react";
import { CUSTOMERS, ME, type Channel, type Priority } from "./data";
import { Sheet } from "./sheet";
import type { Store } from "./store";
import { Avatar, Icon } from "./ui";

// Category to unit and deadline, as the bank admin sets them in Settings > Routing rules.
export const CATEGORIES: { name: string; unit: string; hours: number; fraud?: boolean }[] = [
  { name: "Transfers and payments", unit: "Digital Banking", hours: 48 },
  { name: "OTP, login and device", unit: "Digital Banking", hours: 24 },
  { name: "App availability", unit: "Digital Banking", hours: 24 },
  { name: "Account opening", unit: "Digital Banking", hours: 72 },
  { name: "ATM and cards", unit: "Cards", hours: 24 },
  { name: "Fraud and scams", unit: "Fraud", hours: 4, fraud: true },
  { name: "Loans", unit: "Loans", hours: 72 },
  { name: "Deposits", unit: "Deposits", hours: 72 },
  { name: "Branch service", unit: "Customer care", hours: 48 },
  { name: "General inquiry", unit: "Customer care", hours: 48 },
];
const SOURCES: { label: string; channel: Channel }[] = [
  { label: "Walk-in at a branch", channel: "hotline" }, { label: "Hotline call", channel: "hotline" }, { label: "Email", channel: "email" },
  { label: "Website form", channel: "chat" }, { label: "Social media", channel: "facebook" },
];

export function NewCase({ s, onClose }: { s: Store; onClose: () => void }) {
  const [who, setWho] = useState<string>("");
  const [q, setQ] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [src, setSrc] = useState(SOURCES[0].label);
  const [cat, setCat] = useState(CATEGORIES[0].name);
  const [prio, setPrio] = useState<Priority>("normal");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [ack, setAck] = useState(true);
  const [tried, setTried] = useState(false);
  const rule = CATEGORIES.find((c) => c.name === cat)!;
  const effPrio: Priority = rule.fraud ? "urgent" : prio;
  const matches = useMemo(() => q.trim().length < 2 ? [] : CUSTOMERS.filter((c) => c.matched && (c.name + c.cif + c.mobile).toLowerCase().includes(q.toLowerCase())).slice(0, 5), [q]);
  const picked = CUSTOMERS.find((c) => c.id === who);
  const customerOk = picked || (isNew && name.trim());
  const ok = customerOk && subject.trim() && detail.trim();
  const close = () => onClose();

  const submit = () => {
    setTried(true);
    if (!ok) return;
    const id = s.createCase({
      customerId: picked?.id, newName: isNew ? name.trim() : undefined, newContact: contact.trim(),
      channel: SOURCES.find((x) => x.label === src)!.channel, source: src, category: cat, unit: rule.unit, priority: effPrio,
      fraud: !!rule.fraud, hours: rule.hours, subject: subject.trim(), detail: detail.trim(), ack,
    });
    onClose();
    s.go(`/inbox/${id}`);
  };

  return (
    <Sheet title="New case" sub="For walk-ins, hotline calls and contacts that no agent captured. The case gets a reference number and follows the same rules." onClose={close}
      footer={<><span className="muted" style={{ fontSize: 12.5 }}>Routed to <b>{rule.unit}</b>, due in {rule.hours < 24 ? `${rule.hours} hours` : `${rule.hours / 24} banking days`}</span><span className="sp" /><button className="btn" onClick={close}>Cancel</button><button className="btn p" onClick={submit}><Icon n="plus" s={16} />Create case</button></>}>
      <div className="form">
        <fieldset>
          <legend>Customer</legend>
          {!isNew && !picked && <>
            <label className="sr" htmlFor="nc-q">Find the customer</label>
            <div className="search in-form"><Icon n="search" s={16} /><input id="nc-q" type="search" autoComplete="off" placeholder="Name, customer ID or mobile…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {matches.length > 0 && <div className="pick">{matches.map((c) => (
              <button key={c.id} onClick={() => { setWho(c.id); setQ(""); }}><Avatar name={c.name} size={30} /><span><b>{c.name}</b><small>{c.cif} · {c.branch}</small></span></button>
            ))}</div>}
            {q.trim().length >= 2 && matches.length === 0 && <p className="hint">No customer found in the bank's records.</p>}
            <button className="link" onClick={() => { setIsNew(true); setName(q); }}>Not in the records? Add the contact details instead</button>
          </>}
          {picked && <div className="picked"><Avatar name={picked.name} size={36} /><span className="grow"><b>{picked.name}</b><small>{picked.cif} · {picked.branch} · {picked.mobile}</small></span><button className="btn g sm" onClick={() => setWho("")}>Change</button></div>}
          {isNew && <>
            <div className="row2">
              <div className="field"><label htmlFor="nc-n">Full name</label><input id="nc-n" name="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={tried && !name.trim()} /></div>
              <div className="field"><label htmlFor="nc-c">Mobile or email</label><input id="nc-c" name="contact" className="input" autoComplete="off" spellCheck={false} value={contact} onChange={(e) => setContact(e.target.value)} /></div>
            </div>
            <button className="link" onClick={() => setIsNew(false)}>Search the bank's records instead</button>
          </>}
          {tried && !customerOk && <p className="err" role="alert">Choose a customer or add the contact details.</p>}
        </fieldset>

        <fieldset>
          <legend>Concern</legend>
          <div className="row2">
            <div className="field"><label htmlFor="nc-s">Received through</label><select id="nc-s" className="select" value={src} onChange={(e) => setSrc(e.target.value)}>{SOURCES.map((x) => <option key={x.label}>{x.label}</option>)}</select></div>
            <div className="field"><label htmlFor="nc-cat">Category</label><select id="nc-cat" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>{CATEGORIES.map((x) => <option key={x.name}>{x.name}</option>)}</select></div>
          </div>
          <div className="field">
            <span className="flabel" id="nc-p">Priority</span>
            <div className="seg-ctl" role="radiogroup" aria-labelledby="nc-p">
              {(["normal", "high", "urgent"] as Priority[]).map((p) => <button key={p} role="radio" aria-checked={effPrio === p} disabled={!!rule.fraud && p !== "urgent"} onClick={() => setPrio(p)}>{p === "normal" ? "Normal" : p === "high" ? "High" : "Urgent"}</button>)}
            </div>
            {rule.fraud && <p className="hint"><Icon n="shield" s={14} />Fraud goes to the priority lane and is always urgent.</p>}
          </div>
          <div className="field"><label htmlFor="nc-sub">Subject</label><input id="nc-sub" name="subject" className="input" placeholder="For example: Transfer to GCash debited but not received…" value={subject} onChange={(e) => setSubject(e.target.value)} aria-invalid={tried && !subject.trim()} /></div>
          <div className="field"><label htmlFor="nc-d">What the customer said</label><textarea id="nc-d" name="detail" className="textarea" rows={4} placeholder="Amounts, dates and references. Never write down a PIN or one-time code…" value={detail} onChange={(e) => setDetail(e.target.value)} aria-invalid={tried && !detail.trim()} /></div>
          {tried && (!subject.trim() || !detail.trim()) && <p className="err" role="alert">Add a subject and what the customer said.</p>}
        </fieldset>

        <label className="check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />Send the customer the reference number by SMS or email</label>
        <p className="hint">Logged by {ME.name}. The case is assigned to you until you hand it over.</p>
      </div>
    </Sheet>
  );
}
