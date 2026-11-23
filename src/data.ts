// Sample data for the PineDesk prototype. All names and figures are made up.
// "Now" is fixed so deadlines read the same on every visit.

export const NOW = new Date("2026-11-23T10:42:00+08:00").getTime();
const t = (s: string) => new Date(s + ":00+08:00").getTime();

export type Channel = "email" | "chat" | "social" | "voice" | "hotline";
export type Status = "New" | "Open" | "Waiting on customer" | "Waiting on unit" | "Resolved";
export type Priority = "normal" | "high" | "urgent";

export const CHANNEL_LABEL: Record<Channel, string> = {
  email: "Email", chat: "Chat", social: "Social media", voice: "Voice", hotline: "Hotline",
};

export interface Staff { id: string; name: string; role: string; unit: string; capacity: number; }
export const STAFF: Staff[] = [
  { id: "ana", name: "Ana Villanueva", role: "Support executive", unit: "Customer care", capacity: 12 },
  { id: "carlo", name: "Carlo Mendoza", role: "Support executive", unit: "Customer care", capacity: 12 },
  { id: "liza", name: "Liza Ramos", role: "Unit support executive", unit: "Deposits", capacity: 10 },
  { id: "paolo", name: "Paolo Cruz", role: "Unit support executive", unit: "Deposits", capacity: 10 },
  { id: "nina", name: "Nina Salonga", role: "Unit support executive", unit: "Loans", capacity: 10 },
];
export const ME = STAFF[0];
export const staffName = (id: string | null) => STAFF.find((s) => s.id === id)?.name ?? "Unassigned";

export interface Customer {
  id: string; name: string; since: number; segment: string; branch: string; products: string[]; preferred: Channel;
}
export const CUSTOMERS: Customer[] = [
  { id: "c1", name: "Maria Santos", since: 2014, segment: "Retail", branch: "Tarlac City", products: ["Savings", "Debit card"], preferred: "email" },
  { id: "c2", name: "Jose Reyes", since: 2009, segment: "Agri loan", branch: "Cabanatuan", products: ["Crop loan", "Savings"], preferred: "voice" },
  { id: "c3", name: "Elena Dela Cruz", since: 2018, segment: "Retail", branch: "Angeles", products: ["Savings", "Debit card"], preferred: "chat" },
  { id: "c4", name: "Ramon Bautista", since: 2021, segment: "Retail", branch: "Manila", products: ["Savings", "Remittance"], preferred: "chat" },
  { id: "c5", name: "Teresita Navarro", since: 2003, segment: "Retail", branch: "San Fernando", products: ["Time deposit"], preferred: "email" },
  { id: "c6", name: "Antonio Garcia", since: 2022, segment: "Digital", branch: "Quezon City", products: ["Savings", "Mobile app"], preferred: "chat" },
  { id: "c7", name: "Cristina Lim", since: 2016, segment: "Business", branch: "Makati", products: ["Business account", "Time deposit"], preferred: "email" },
  { id: "c8", name: "Rowena Aquino", since: 0, segment: "Public post", branch: "Not a customer on file", products: [], preferred: "social" },
];
export const customer = (id: string) => CUSTOMERS.find((c) => c.id === id)!;

export interface Message { from: "customer" | "agent" | "staff"; who: string; channel: Channel; at: number; text: string; }
export interface Draft { agent: string; confidence: number; text: string; }
export interface CaseT {
  id: string; subject: string; customerId: string; channel: Channel; category: string; unit: string;
  priority: Priority; status: Status; assignee: string | null; opened: number; due: number; unread: boolean;
  summary: string; messages: Message[]; draft?: Draft; checks: string[];
}

export const CASES: CaseT[] = [
  {
    id: "LB-2611-0421", subject: "Debit card kept by the ATM", customerId: "c3", channel: "chat", category: "ATM and cards", unit: "Cards",
    priority: "urgent", status: "New", assignee: "ana", opened: t("2026-11-23T09:58"), due: t("2026-11-23T17:58"), unread: true,
    summary: "Card kept by a Tarlac ATM at 09:40. Customer verified by one-time code. Card is already blocked. Needs a replacement card and cash access today.",
    checks: ["Customer verified by one-time code", "Card blocked by the chatbot at 10:01", "No earlier case for this issue"],
    messages: [
      { from: "customer", who: "Elena Dela Cruz", channel: "chat", at: t("2026-11-23T09:58"), text: "The ATM at the Tarlac branch kept my card this morning. I need cash for tuition today." },
      { from: "agent", who: "Chat agent", channel: "chat", at: t("2026-11-23T10:01"), text: "I am sorry about that, Elena. I have blocked the card so nobody can use it. I am handing you to a colleague who can arrange a replacement and cash access today." },
      { from: "customer", who: "Elena Dela Cruz", channel: "chat", at: t("2026-11-23T10:19"), text: "Thank you. Is there a way to withdraw over the counter? I have my ID with me." },
    ],
    draft: { agent: "Chat agent", confidence: 0.92, text: "Hi Elena, yes. Please visit the Angeles branch with your ID. A teller can release up to ₱20,000 over the counter, and we will have a replacement card ready for pickup in 3 working days or sent to you. I have opened case LB-2611-0421 so every colleague sees this." },
  },
  {
    id: "LB-2611-0409", subject: "Transaction of ₱12,400 I did not make", customerId: "c1", channel: "social", category: "Fraud", unit: "Cards",
    priority: "urgent", status: "Waiting on unit", assignee: "ana", opened: t("2026-11-21T16:20"), due: t("2026-11-23T12:30"), unread: true,
    summary: "Facebook message about a ₱12,400 online purchase. Card blocked on 21 Nov. Dispute raised with Cards, waiting for their findings. Customer moved to private message.",
    checks: ["Details collected in private message, not in public", "Card blocked 21 Nov 16:34", "Fraud lane applied"],
    messages: [
      { from: "customer", who: "Maria Santos", channel: "social", at: t("2026-11-21T16:20"), text: "There is a charge of 12,400 on my card from an online shop I never used. Please help." },
      { from: "agent", who: "Social agent", channel: "social", at: t("2026-11-21T16:24"), text: "We are sorry to hear this, Maria. To protect your details, we have moved this to a private message. Your card is now blocked." },
      { from: "staff", who: "Ana Villanueva", channel: "social", at: t("2026-11-21T17:05"), text: "I have sent the dispute to our Cards team. They will confirm the merchant details within 2 working days." },
      { from: "customer", who: "Maria Santos", channel: "social", at: t("2026-11-23T08:40"), text: "Any update? I need to know before I travel tomorrow." },
    ],
    draft: { agent: "Social agent", confidence: 0.78, text: "Hi Maria, thank you for waiting. The Cards team is still checking the merchant. Your card stays blocked, and we will message you here before 12:30 today with the result or a firm time." },
  },
  {
    id: "LB-2611-0418", subject: "Loan restructuring after typhoon damage", customerId: "c2", channel: "email", category: "Loans", unit: "Loans",
    priority: "high", status: "Open", assignee: "ana", opened: t("2026-11-22T14:10"), due: t("2026-11-25T14:10"), unread: true,
    summary: "Farmer asks to restructure a crop loan after typhoon damage. Attached photos of the fields and a barangay certificate. Called again this morning about the same issue.",
    checks: ["2 attachments read: photos and a certificate", "Matched to existing crop loan LN-48812", "Duplicate contact by voice added to this case"],
    messages: [
      { from: "customer", who: "Jose Reyes", channel: "email", at: t("2026-11-22T14:10"), text: "Good afternoon. My rice field in Cabanatuan was flooded last week. I cannot pay the next amortisation on time. I would like to ask about restructuring my crop loan. I attach photos and a certificate from the barangay." },
      { from: "agent", who: "Email agent", channel: "email", at: t("2026-11-22T14:12"), text: "Thank you, Mr Reyes. We received your email and opened case LB-2611-0418. A loan officer will review your request and reply within 3 working days." },
    ],
    draft: { agent: "Email agent", confidence: 0.86, text: "Dear Mr Reyes, we are sorry about the damage to your field. Your request is with our Loans unit. Under the calamity relief policy you may qualify for a payment holiday of up to 90 days. Please prepare your loan number LN-48812 and a valid ID. We will call you on Tuesday to confirm the next step." },
  },
  {
    id: "LB-2611-0399", subject: "Wrong interest posted on time deposit", customerId: "c7", channel: "email", category: "Deposits", unit: "Deposits",
    priority: "high", status: "Open", assignee: "paolo", opened: t("2026-11-18T11:00"), due: t("2026-11-23T08:00"), unread: false,
    summary: "Interest on a 6-month time deposit was posted at 3.0% instead of 3.5%. Difference of ₱2,150. Deadline passed at 08:00 today. Extension requested.",
    checks: ["Rate sheet confirms 3.5%", "Difference calculated: ₱2,150", "Extension request sent to the team manager"],
    messages: [
      { from: "customer", who: "Cristina Lim", channel: "email", at: t("2026-11-18T11:00"), text: "The interest on my 6-month time deposit shows 3.0%. The rate at placement was 3.5%. Please correct and credit the difference." },
      { from: "staff", who: "Paolo Cruz", channel: "email", at: t("2026-11-19T09:30"), text: "We are checking the rate sheet with our Deposits team and will confirm shortly." },
    ],
  },
  {
    id: "LB-2611-0424", subject: "Callback about my loan balance", customerId: "c2", channel: "voice", category: "Loans", unit: "Loans",
    priority: "high", status: "Open", assignee: "ana", opened: t("2026-11-23T08:52"), due: t("2026-11-25T14:10"), unread: false,
    summary: "Added to case LB-2611-0418 instead of opening a second ticket. Same customer, same issue, raised again by phone.",
    checks: ["Matched to open case LB-2611-0418", "Call recorded and logged"],
    messages: [
      { from: "customer", who: "Jose Reyes", channel: "voice", at: t("2026-11-23T08:52"), text: "Call, 3 min 12 s. Customer asked for a callback about the loan balance and the restructuring request he emailed on Sunday." },
    ],
  },
  {
    id: "LB-2611-0420", subject: "Mobile app login locked after update", customerId: "c6", channel: "chat", category: "Digital banking", unit: "Digital Banking",
    priority: "normal", status: "Open", assignee: "ana", opened: t("2026-11-23T09:12"), due: t("2026-11-24T17:00"), unread: true,
    summary: "Login locked after app version 4.2 update. Customer tried the reset link twice. Account itself is active.",
    checks: ["Identity verified", "Known issue: version 4.2 reset link", "Account active"],
    messages: [
      { from: "customer", who: "Antonio Garcia", channel: "chat", at: t("2026-11-23T09:12"), text: "I updated the app this morning and now it says my account is locked. The reset link does not work." },
      { from: "agent", who: "Chat agent", channel: "chat", at: t("2026-11-23T09:14"), text: "Sorry about that, Antonio. This is a known issue with version 4.2. I am passing you to a colleague to unlock your login." },
    ],
    draft: { agent: "Chat agent", confidence: 0.94, text: "Hi Antonio, your login has been unlocked. Please close the app, reopen it and sign in with your username. If the reset link is still needed, use the one we have just sent to your registered email." },
  },
  {
    id: "LB-2611-0415", subject: "Remittance from Dubai not received", customerId: "c4", channel: "chat", category: "Remittance", unit: "Remittance",
    priority: "high", status: "Waiting on customer", assignee: "carlo", opened: t("2026-11-22T20:30"), due: t("2026-11-24T20:30"), unread: false,
    summary: "Customer expects a transfer sent 20 Nov. We asked for the reference number and a copy of the receipt.",
    checks: ["Reference number requested", "No match found on partner list"],
    messages: [
      { from: "customer", who: "Ramon Bautista", channel: "chat", at: t("2026-11-22T20:30"), text: "My brother sent money from Dubai on 20 Nov. It has not arrived in my account." },
      { from: "staff", who: "Carlo Mendoza", channel: "chat", at: t("2026-11-23T08:05"), text: "Good morning Ramon. Please send the reference number and a photo of the receipt so we can trace the transfer." },
    ],
  },
  {
    id: "LB-2611-0402", subject: "Closing a dormant savings account", customerId: "c5", channel: "email", category: "Deposits", unit: "Deposits",
    priority: "normal", status: "Open", assignee: "liza", opened: t("2026-11-19T10:00"), due: t("2026-11-26T17:00"), unread: false,
    summary: "Customer wants to close a savings account that has been dormant since 2021. Balance ₱1,820. Needs a signed request and ID.",
    checks: ["Balance confirmed", "Signed request form sent"],
    messages: [
      { from: "customer", who: "Teresita Navarro", channel: "email", at: t("2026-11-19T10:00"), text: "I would like to close my old savings account. I have not used it for years." },
      { from: "staff", who: "Liza Ramos", channel: "email", at: t("2026-11-20T14:20"), text: "Please sign the attached request form and send it with a copy of your ID." },
    ],
  },
  {
    id: "LB-2611-0423", subject: "Public comment: ATM out of cash in Tarlac", customerId: "c8", channel: "social", category: "ATM and cards", unit: "Cards",
    priority: "normal", status: "New", assignee: null, opened: t("2026-11-23T10:15"), due: t("2026-11-24T10:15"), unread: true,
    summary: "Public Facebook comment under the branch post. No personal details in the comment. A reply for the public thread is ready.",
    checks: ["Public comment, no personal data", "Branch ATM status: refill due 11:30"],
    messages: [
      { from: "customer", who: "Rowena Aquino", channel: "social", at: t("2026-11-23T10:15"), text: "The ATM at Tarlac branch has been out of cash since last night. Third time this month!" },
    ],
    draft: { agent: "Social agent", confidence: 0.81, text: "Hi Rowena, we are sorry for the trouble. The ATM is scheduled for a refill at 11:30 today. If you want us to look into the earlier outages, please send us a private message and we will follow up." },
  },
  {
    id: "LB-2611-0411", subject: "Statement for 2025 for a tax filing", customerId: "c7", channel: "email", category: "Deposits", unit: "Deposits",
    priority: "normal", status: "Resolved", assignee: "carlo", opened: t("2026-11-20T09:00"), due: t("2026-11-23T09:00"), unread: false,
    summary: "Annual statement sent by email on 21 Nov. Customer confirmed receipt.",
    checks: ["Statement sent", "Customer confirmed"],
    messages: [
      { from: "customer", who: "Cristina Lim", channel: "email", at: t("2026-11-20T09:00"), text: "Please send my 2025 account statement for tax filing." },
      { from: "staff", who: "Carlo Mendoza", channel: "email", at: t("2026-11-21T10:10"), text: "Attached is your statement for 2025. Please tell us if you need anything else." },
      { from: "customer", who: "Cristina Lim", channel: "email", at: t("2026-11-21T11:00"), text: "Received, thank you." },
    ],
  },
];

export const caseById = (id: string) => CASES.find((c) => c.id === id)!;
export const REPLIES_SENT: Record<string, boolean> = {};

// --- Timeline events for the customer screen -------------------------------
export interface TimelineEvent { at: number; channel: Channel; text: string; caseId?: string; note?: string; }
export function timelineFor(customerId: string): TimelineEvent[] {
  const ev: TimelineEvent[] = [];
  for (const c of CASES.filter((x) => x.customerId === customerId)) {
    ev.push({ at: c.opened, channel: c.channel, text: c.subject, caseId: c.id, note: c.status });
  }
  const extra: Record<string, TimelineEvent[]> = {
    c2: [
      { at: t("2026-11-23T08:52"), channel: "voice", text: "Called about the same loan request. Added to case LB-2611-0418, no second ticket opened.", caseId: "LB-2611-0418", note: "Duplicate stopped" },
      { at: t("2026-09-04T11:20"), channel: "hotline", text: "Asked for the current balance of the crop loan.", note: "Resolved" },
    ],
    c1: [{ at: t("2026-06-15T15:00"), channel: "chat", text: "Asked how to raise the daily transfer limit.", note: "Resolved" }],
    c3: [{ at: t("2026-08-02T09:40"), channel: "chat", text: "Asked about the passbook replacement fee.", note: "Resolved" }],
  };
  return [...ev, ...(extra[customerId] ?? [])].sort((a, b) => b.at - a.at);
}

// --- Approvals ------------------------------------------------------------
export interface Extension { id: string; caseId: string; by: string; reason: string; asked: number; oldDue: number; newDue: number; }
export const EXTENSIONS: Extension[] = [
  { id: "x1", caseId: "LB-2611-0399", by: "paolo", reason: "Rate sheet needs sign-off from the Treasury unit before we can credit the difference.", asked: t("2026-11-23T07:55"), oldDue: t("2026-11-23T08:00"), newDue: t("2026-11-25T17:00") },
  { id: "x2", caseId: "LB-2611-0409", by: "ana", reason: "Cards is still checking the merchant. We need until end of day to give a firm answer.", asked: t("2026-11-23T10:20"), oldDue: t("2026-11-23T12:30"), newDue: t("2026-11-23T17:00") },
];

// --- AI agents ------------------------------------------------------------
export interface Agent { id: string; name: string; channel: Channel; status: "Active" | "Paused"; runs: number; solved: number; handed: number; failed: number; costPerRun: number; approved: number; edited: number; rejected: number; }
export const AGENTS: Agent[] = [
  { id: "a1", name: "Email agent", channel: "email", status: "Active", runs: 412, solved: 188, handed: 211, failed: 13, costPerRun: 3.4, approved: 301, edited: 74, rejected: 18 },
  { id: "a2", name: "Chat agent", channel: "chat", status: "Active", runs: 688, solved: 431, handed: 241, failed: 16, costPerRun: 1.9, approved: 112, edited: 31, rejected: 9 },
  { id: "a3", name: "Social media agent", channel: "social", status: "Active", runs: 191, solved: 64, handed: 118, failed: 9, costPerRun: 2.6, approved: 129, edited: 44, rejected: 21 },
  { id: "a4", name: "Voice agent", channel: "voice", status: "Active", runs: 154, solved: 69, handed: 79, failed: 6, costPerRun: 7.8, approved: 0, edited: 0, rejected: 0 },
];
AGENTS.forEach((a) => console.assert(a.solved + a.handed + a.failed === a.runs, "agent runs must add up", a.name));

// --- Reports (last 30 days) -----------------------------------------------
export const VOLUME = AGENTS.map((a) => ({ label: CHANNEL_LABEL[a.channel], value: a.runs }))
  .concat([{ label: "Hotline", value: 97 }]);
export const TOTAL_VOLUME = VOLUME.reduce((s, v) => s + v.value, 0);
export const UNIT_SLA = [
  { unit: "Deposits", within: 94, cases: 396 }, { unit: "Loans", within: 91, cases: 310 },
  { unit: "Remittance", within: 90, cases: 188 }, { unit: "Digital Banking", within: 88, cases: 402 },
  { unit: "Cards", within: 83, cases: 246 },
];
console.assert(UNIT_SLA.reduce((s, u) => s + u.cases, 0) === TOTAL_VOLUME, "unit cases must equal volume");
// Daily opened cases for 30 days, scaled so the sum equals the volume above.
const raw = [38,52,61,57,49,22,18,44,55,63,59,51,24,19,47,58,66,61,54,26,21,49,60,67,62,55,25,20,48,57];
const rawSum = raw.reduce((a, b) => a + b, 0);
export const DAILY = raw.map((v) => Math.round((v * TOTAL_VOLUME) / rawSum));
DAILY[DAILY.length - 1] += TOTAL_VOLUME - DAILY.reduce((a, b) => a + b, 0);
console.assert(DAILY.reduce((a, b) => a + b, 0) === TOTAL_VOLUME, "daily must equal volume");

// --- Time helpers ---------------------------------------------------------
export function ago(ts: number): string {
  const m = Math.round((NOW - ts) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} d`;
}
export function dueLabel(due: number): { text: string; tone: "ok" | "risk" | "breach" } {
  const m = Math.round((due - NOW) / 60000);
  const abs = Math.abs(m);
  const txt = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.floor(abs / 60)} h ${abs % 60 ? (abs % 60) + " min" : ""}`.trim() : `${Math.round(abs / 1440)} d`;
  if (m < 0) return { text: `Overdue ${txt}`, tone: "breach" };
  return { text: `Due in ${txt}`, tone: m <= 4 * 60 ? "risk" : "ok" };
}
export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Manila" });
export const fmtDay = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Manila" });
