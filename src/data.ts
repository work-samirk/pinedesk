// Sample data for the PineDesk prototype. All names, numbers and figures are made up.
// "Now" is fixed so deadlines read the same on every visit.

export const NOW = new Date("2026-11-23T10:42:00+08:00").getTime();
const t = (s: string) => new Date(s + ":00+08:00").getTime();

// ------------------------------------------------------------------ channels
export type Channel = "email" | "chat" | "facebook" | "messenger" | "x" | "linkedin" | "voice" | "hotline";
export const CHANNEL_LABEL: Record<Channel, string> = {
  email: "Email", chat: "Website chat", facebook: "Facebook", messenger: "Facebook Messenger",
  x: "X", linkedin: "LinkedIn", voice: "Voice", hotline: "Hotline",
};
export interface ChannelGroup { key: string; label: string; channels: Channel[]; }
export const CHANNEL_GROUPS: ChannelGroup[] = [
  { key: "email", label: "Email", channels: ["email"] },
  { key: "chat", label: "Chat", channels: ["chat"] },
  { key: "facebook", label: "Facebook", channels: ["facebook", "messenger"] },
  { key: "x", label: "X", channels: ["x"] },
  { key: "linkedin", label: "LinkedIn", channels: ["linkedin"] },
  { key: "voice", label: "Voice", channels: ["voice", "hotline"] },
];
export type AgentKind = "email" | "chat" | "social" | "voice";
export const agentKind = (c: Channel): AgentKind =>
  c === "email" ? "email" : c === "chat" ? "chat" : c === "voice" || c === "hotline" ? "voice" : "social";

export type Status = "New" | "Open" | "Waiting on customer" | "Waiting on unit" | "Resolved";
export type Priority = "normal" | "high" | "urgent";
export type Tone = "Calm" | "Worried" | "Frustrated" | "Angry" | "Grateful";

// ------------------------------------------------------------------ people
export interface Staff { id: string; name: string; role: string; unit: string; capacity: number; status: "Online" | "Away" | "Offline"; doneToday: number; handleMin: number; }
export const STAFF: Staff[] = [
  { id: "ana", name: "Ana Villanueva", role: "Support executive", unit: "Customer care", capacity: 12, status: "Online", doneToday: 6, handleMin: 11 },
  { id: "carlo", name: "Carlo Mendoza", role: "Support executive", unit: "Customer care", capacity: 12, status: "Online", doneToday: 4, handleMin: 14 },
  { id: "liza", name: "Liza Ramos", role: "Unit support executive", unit: "Deposits", capacity: 10, status: "Away", doneToday: 3, handleMin: 17 },
  { id: "paolo", name: "Paolo Cruz", role: "Unit support executive", unit: "Deposits", capacity: 10, status: "Online", doneToday: 5, handleMin: 13 },
  { id: "nina", name: "Nina Salonga", role: "Unit support executive", unit: "Loans", capacity: 10, status: "Offline", doneToday: 0, handleMin: 19 },
];
export const ME = STAFF[0];
export const staffName = (id: string | null) => STAFF.find((s) => s.id === id)?.name ?? "Unassigned";

export interface Product { kind: string; label: string; mask?: string; status: string; detail?: string; }
export interface Customer {
  id: string; cif: string; name: string; mobile: string; email: string; city: string; branch: string; ageBand: string;
  language: string; preferred: Channel; handles: { facebook?: string; x?: string; linkedin?: string };
  kyc: { status: "Verified" | "Expired" | "Pending" | "Incomplete"; updated: string; idType: string } | null;
  segment: string; since: number; unit: string; linked: { name: string; relation: string }[];
  products: Product[]; alerts: string[]; consent: { email: boolean; sms: boolean; call: boolean; social: boolean };
  matched: boolean; tone: Tone; complaints12m: number; escalatedBefore: boolean; avgResolveH: number; dupOf?: string;
  verifiedNow?: { how: string; when: number };
}
export const CUSTOMERS: Customer[] = [
  { id: "c1", cif: "00418273", name: "Maria Santos", mobile: "+63 917 ••• 0142", email: "m.santos@mail.example", city: "Tarlac City", branch: "Tarlac City", ageBand: "35 to 44", language: "English, Filipino", preferred: "email",
    handles: { facebook: "maria.santos.tarlac" }, kyc: { status: "Verified", updated: "14 Mar 2025", idType: "National ID" }, segment: "Retail", since: 2014, unit: "Customer care", linked: [],
    products: [{ kind: "Savings", label: "Savings account", mask: "••4821", status: "Active" }, { kind: "Debit card", label: "Debit card", mask: "••7730", status: "Blocked", detail: "Blocked 21 Nov, 16:34" }],
    alerts: ["Fraud lane applied. Debit card ending 7730 is blocked."], consent: { email: true, sms: true, call: true, social: true }, matched: true, tone: "Worried", complaints12m: 1, escalatedBefore: false, avgResolveH: 31,
    verifiedNow: { how: "Two approved questions in private message", when: t("2026-11-21T16:28") } },
  { id: "c2", cif: "00229104", name: "Jose Reyes", mobile: "+63 920 ••• 0198", email: "j.reyes@mail.example", city: "Cabanatuan", branch: "Cabanatuan", ageBand: "55 to 64", language: "Filipino, English", preferred: "voice",
    handles: {}, kyc: { status: "Verified", updated: "02 Sep 2024", idType: "Postal ID" }, segment: "Agri loan", since: 2009, unit: "Loans", linked: [{ name: "Luz Reyes", relation: "Joint holder" }],
    products: [{ kind: "Savings", label: "Savings account", mask: "••2290", status: "Active" }, { kind: "Loan", label: "Crop loan LN-48812", mask: "••8812", status: "Active", detail: "Next due 30 Nov, 0 days past due" }],
    alerts: [], consent: { email: true, sms: true, call: true, social: false }, matched: true, tone: "Worried", complaints12m: 0, escalatedBefore: false, avgResolveH: 52, dupOf: "c11",
    verifiedNow: { how: "Registered mobile and date of birth, by phone", when: t("2026-11-23T09:31") } },
  { id: "c3", cif: "00512660", name: "Elena Dela Cruz", mobile: "+63 918 ••• 7721", email: "e.delacruz@mail.example", city: "Angeles", branch: "Angeles", ageBand: "25 to 34", language: "English", preferred: "chat",
    handles: {}, kyc: { status: "Verified", updated: "21 Jun 2025", idType: "Driver's licence" }, segment: "Retail", since: 2018, unit: "Customer care", linked: [],
    products: [{ kind: "Savings", label: "Savings account", mask: "••6054", status: "Active" }, { kind: "Debit card", label: "Debit card", mask: "••1190", status: "Blocked", detail: "Blocked 23 Nov, 10:01" }],
    alerts: [], consent: { email: true, sms: true, call: true, social: false }, matched: true, tone: "Frustrated", complaints12m: 0, escalatedBefore: false, avgResolveH: 22,
    verifiedNow: { how: "One-time code to registered mobile", when: t("2026-11-23T10:00") } },
  { id: "c4", cif: "00704417", name: "Ramon Bautista", mobile: "+63 927 ••• 5530", email: "r.bautista@mail.example", city: "Manila", branch: "Manila", ageBand: "25 to 34", language: "English", preferred: "chat",
    handles: {}, kyc: { status: "Pending", updated: "08 Nov 2026", idType: "Passport" }, segment: "Retail", since: 2021, unit: "Digital Banking", linked: [],
    products: [{ kind: "Savings", label: "Savings account", mask: "••3318", status: "Active" }, { kind: "Transfers", label: "InstaPay transfers", status: "Active", detail: "1 transfer pending since 22 Nov" }],
    alerts: [], consent: { email: true, sms: true, call: false, social: false }, matched: true, tone: "Worried", complaints12m: 0, escalatedBefore: false, avgResolveH: 40 },
  { id: "c5", cif: "00093351", name: "Teresita Navarro", mobile: "+63 915 ••• 2260", email: "t.navarro@mail.example", city: "San Fernando", branch: "San Fernando", ageBand: "65 and over", language: "Filipino", preferred: "email",
    handles: {}, kyc: { status: "Expired", updated: "11 Feb 2022", idType: "Senior citizen ID" }, segment: "Retail", since: 2003, unit: "Deposits", linked: [],
    products: [{ kind: "Time deposit", label: "Time deposit", mask: "••7741", status: "Active", detail: "Matures 12 Mar 2027" }, { kind: "Savings", label: "Savings account", mask: "••0507", status: "Dormant", detail: "No activity since 2021" }],
    alerts: ["The ID on file has expired. Ask for an updated ID before any account change."], consent: { email: true, sms: false, call: true, social: false }, matched: true, tone: "Calm", complaints12m: 0, escalatedBefore: false, avgResolveH: 60 },
  { id: "c6", cif: "00880736", name: "Antonio Garcia", mobile: "+63 936 ••• 9014", email: "a.garcia@mail.example", city: "Quezon City", branch: "Quezon City", ageBand: "25 to 34", language: "English", preferred: "chat",
    handles: {}, kyc: { status: "Verified", updated: "30 Jan 2026", idType: "National ID" }, segment: "Digital", since: 2022, unit: "Digital Banking", linked: [],
    products: [{ kind: "Savings", label: "Savings account", mask: "••8842", status: "Active" }, { kind: "Mobile app", label: "Mobile banking", status: "Locked", detail: "Locked after 3 expired one-time codes" }],
    alerts: [], consent: { email: true, sms: true, call: false, social: false }, matched: true, tone: "Calm", complaints12m: 0, escalatedBefore: false, avgResolveH: 18,
    verifiedNow: { how: "Registered email and date of birth", when: t("2026-11-23T09:13") } },
  { id: "c7", cif: "00347829", name: "Cristina Lim", mobile: "+63 922 ••• 3375", email: "c.lim@mail.example", city: "Makati", branch: "Makati", ageBand: "45 to 54", language: "English", preferred: "email",
    handles: {}, kyc: { status: "Verified", updated: "05 Dec 2025", idType: "Passport" }, segment: "Business", since: 2016, unit: "Deposits", linked: [{ name: "Lim Trading Corp", relation: "Business owner" }],
    products: [{ kind: "Current", label: "Business account", mask: "••5532", status: "Active" }, { kind: "Time deposit", label: "6-month time deposit", mask: "••9013", status: "Active", detail: "Matures 15 Feb 2027" }],
    alerts: [], consent: { email: true, sms: true, call: true, social: false }, matched: true, tone: "Frustrated", complaints12m: 1, escalatedBefore: false, avgResolveH: 47 },
  { id: "c8", cif: "", name: "Rowena Aquino", mobile: "", email: "", city: "", branch: "Not a customer on file", ageBand: "", language: "English", preferred: "facebook",
    handles: { facebook: "rowena.aquino.21" }, kyc: null, segment: "Public post", since: 0, unit: "", linked: [], products: [], alerts: [], consent: { email: false, sms: false, call: false, social: true },
    matched: false, tone: "Frustrated", complaints12m: 0, escalatedBefore: false, avgResolveH: 0 },
  { id: "c9", cif: "", name: "Marlon Dizon", mobile: "", email: "", city: "", branch: "Not a customer on file", ageBand: "", language: "English", preferred: "x",
    handles: { x: "@marlon_dz" }, kyc: null, segment: "Public post", since: 0, unit: "", linked: [], products: [], alerts: [], consent: { email: false, sms: false, call: false, social: true },
    matched: false, tone: "Frustrated", complaints12m: 0, escalatedBefore: false, avgResolveH: 0 },
  { id: "c10", cif: "00612088", name: "Patricia Gomez", mobile: "+63 917 ••• 6603", email: "p.gomez@gomezfoods.example", city: "Baguio", branch: "Baguio", ageBand: "35 to 44", language: "English", preferred: "linkedin",
    handles: { linkedin: "patricia-gomez-ph" }, kyc: { status: "Verified", updated: "19 Apr 2025", idType: "Passport" }, segment: "Business", since: 2019, unit: "Customer care", linked: [{ name: "Gomez Foods Inc", relation: "Business owner" }],
    products: [{ kind: "Current", label: "Business account", mask: "••7020", status: "Active" }], alerts: [], consent: { email: true, sms: true, call: true, social: true },
    matched: true, tone: "Calm", complaints12m: 0, escalatedBefore: false, avgResolveH: 26 },
  { id: "c11", cif: "00229188", name: "Jose M. Reyes", mobile: "+63 920 ••• 0198", email: "jm.reyes@mail.example", city: "Cabanatuan", branch: "Cabanatuan", ageBand: "55 to 64", language: "Filipino", preferred: "voice",
    handles: {}, kyc: { status: "Incomplete", updated: "09 Jan 2018", idType: "None on file" }, segment: "Retail", since: 2018, unit: "Customer care", linked: [],
    products: [{ kind: "Savings", label: "Savings account", mask: "••9931", status: "Inactive" }], alerts: [], consent: { email: false, sms: true, call: true, social: false },
    matched: true, tone: "Calm", complaints12m: 0, escalatedBefore: false, avgResolveH: 0, dupOf: "c2" },
];
CUSTOMERS.push(
  { id: "c12", cif: "", name: "Jenny Castillo", mobile: "", email: "", city: "", branch: "Not a customer on file", ageBand: "", language: "Taglish", preferred: "facebook",
    handles: { facebook: "jenny.castillo.ph" }, kyc: null, segment: "Public post", since: 0, unit: "", linked: [], products: [], alerts: [], consent: { email: false, sms: false, call: false, social: true },
    matched: false, tone: "Frustrated", complaints12m: 0, escalatedBefore: false, avgResolveH: 0 },
  { id: "c13", cif: "00561203", name: "Ricardo Manalo", mobile: "+63 919 ••• 4417", email: "r.manalo@mail.example", city: "Batangas City", branch: "Batangas", ageBand: "45 to 54", language: "Filipino, English", preferred: "messenger",
    handles: { facebook: "ricardo.manalo.bts" }, kyc: { status: "Verified", updated: "07 Jul 2025", idType: "National ID" }, segment: "Retail", since: 2012, unit: "Fraud", linked: [],
    products: [{ kind: "Savings", label: "Savings account", mask: "••3006", status: "Active" }], alerts: ["Reported a phishing message. No code or password was shared."], consent: { email: true, sms: true, call: true, social: true },
    matched: true, tone: "Worried", complaints12m: 0, escalatedBefore: false, avgResolveH: 0, verifiedNow: { how: "Matched on Facebook profile and registered mobile", when: t("2026-11-23T10:08") } },
  { id: "c14", cif: "00930418", name: "Grace Villareal", mobile: "+63 926 ••• 8150", email: "g.villareal@mail.example", city: "Iloilo City", branch: "Iloilo", ageBand: "18 to 24", language: "English", preferred: "email",
    handles: {}, kyc: { status: "Pending", updated: "04 Nov 2026", idType: "National ID" }, segment: "Digital", since: 2026, unit: "Digital Banking", linked: [],
    products: [{ kind: "Savings", label: "Digital savings account", status: "Pending", detail: "Application sent 4 Nov" }], alerts: [], consent: { email: true, sms: true, call: false, social: false },
    matched: true, tone: "Frustrated", complaints12m: 0, escalatedBefore: false, avgResolveH: 0 },
);
export const customer = (id: string) => CUSTOMERS.find((c) => c.id === id)!;
export const firstName = (n: string) => n.split(" ")[0];

// ------------------------------------------------------------------ cases
export interface CallT {
  duration: number; outcome: "Reached" | "No answer" | "Call back later" | "Wrong number"; recorded: boolean;
  transcript: { who: "Executive" | "Customer"; t: string; text: string }[]; summary: string;
}
export interface Message {
  id: string; from: "customer" | "agent" | "staff"; who: string; channel: Channel; at: number; text: string;
  delivery?: "Sent" | "Delivered" | "Read" | "Failed"; call?: CallT;
}
export interface Draft { agent: string; confidence: number; text: string; article: string; }
export interface Attachment { name: string; size: string; }
export interface CaseT {
  id: string; subject: string; customerId: string; channel: Channel; category: string; unit: string;
  priority: Priority; status: Status; assignee: string | null; opened: number; due: number; unread: boolean;
  stage: number; aiWorking?: boolean; handledByAI?: boolean; manual?: boolean; repeat?: boolean; fraud?: boolean; callbackAt?: string;
  tone: Tone; language: string; crmSyncMin: number; attachments: Attachment[]; dupOf?: string; verified?: string;
  summary: { issue: string; steps: string; next: string }; messages: Message[]; draft?: Draft; checks: string[];
  resolution?: { note: string; root: string; notified: boolean; at: number };
}
let mid = 0;
const m = (from: Message["from"], who: string, channel: Channel, at: string, text: string, extra: Partial<Message> = {}): Message =>
  ({ id: `m${++mid}`, from, who, channel, at: t(at), text, ...extra });

export const CASES: CaseT[] = [
  {
    id: "LB-2611-0409", subject: "Transaction of ₱12,400 I did not make", customerId: "c1", channel: "messenger", category: "Fraud and disputes", unit: "Cards",
    priority: "urgent", status: "Waiting on unit", assignee: "ana", opened: t("2026-11-21T16:20"), due: t("2026-11-23T12:30"), unread: true, stage: 5, fraud: true,
    tone: "Worried", language: "English", crmSyncMin: 2, attachments: [], verified: "Two approved questions in private message",
    summary: { issue: "Maria reports a ₱12,400 card charge from an online shop she did not make. She travels tomorrow and wants an answer first.",
      steps: "Moved to private message, verified identity with two questions, blocked the card at 16:34, applied the fraud lane and sent the dispute to Cards.",
      next: "Ask Cards for the merchant details, then tell Maria the card stays blocked and give her a time." },
    checks: ["Details collected in private message, not in public", "Card blocked 21 Nov 16:34", "Fraud lane applied"],
    messages: [
      m("customer", "Maria Santos", "facebook", "2026-11-21T16:20", "There is a charge of ₱12,400 on my card from an online shop I never used. Please help."),
      m("agent", "Social agent", "messenger", "2026-11-21T16:24", "We are sorry to hear this, Maria. To protect your details, we have moved this to a private message. Your card is now blocked.", { delivery: "Read" }),
      m("staff", "Ana Villanueva", "messenger", "2026-11-21T17:05", "I have sent the dispute to our Cards team. They will confirm the merchant details within 2 working days.", { delivery: "Read" }),
      m("customer", "Maria Santos", "messenger", "2026-11-23T08:40", "Any update? I need to know before I travel tomorrow."),
    ],
    draft: { agent: "Social agent", confidence: 0.78, article: "Disputed card transaction, steps and timelines (v3)", text: "Hi Maria, thank you for waiting. The Cards team is still checking the merchant. Your card stays blocked, and we will message you here before 12:30 today with the result or a firm time." },
  },
  {
    id: "LB-2611-0421", subject: "Debit card kept by the ATM", customerId: "c3", channel: "chat", category: "ATM and cards", unit: "Cards",
    priority: "urgent", status: "New", assignee: "ana", opened: t("2026-11-23T09:58"), due: t("2026-11-23T17:58"), unread: true, stage: 5,
    tone: "Frustrated", language: "English", crmSyncMin: 1, attachments: [], verified: "One-time code to registered mobile",
    summary: { issue: "Card kept by a Tarlac ATM at 09:40. Elena needs cash for tuition today.",
      steps: "Verified by one-time code, blocked the card at 10:01, found no earlier case and handed over with a summary.",
      next: "Offer over-the-counter cash today and arrange a replacement card." },
    checks: ["Customer verified by one-time code", "Card blocked by the chatbot at 10:01", "No earlier case for this issue"],
    messages: [
      m("customer", "Elena Dela Cruz", "chat", "2026-11-23T09:58", "The ATM at the Tarlac branch kept my card this morning. I need cash for tuition today."),
      m("agent", "Chat agent", "chat", "2026-11-23T10:01", "I am sorry about that, Elena. I have blocked the card so nobody can use it. I am handing you to a colleague who can arrange a replacement and cash access today.", { delivery: "Read" }),
      m("customer", "Elena Dela Cruz", "chat", "2026-11-23T10:19", "Thank you. Is there a way to withdraw over the counter? I have my ID with me."),
    ],
    draft: { agent: "Chat agent", confidence: 0.92, article: "Card retained by ATM, same-day cash and replacement (v5)", text: "Hi Elena, yes. Please visit the Angeles branch with your ID. A teller can release up to ₱20,000 over the counter, and we will have a replacement card ready for pickup in 3 working days or sent to you. I have opened case LB-2611-0421 so every colleague sees this." },
  },
  {
    id: "LB-2611-0420", subject: "One-time code expires before it arrives after a phone change", customerId: "c6", channel: "chat", category: "OTP, login and device", unit: "Digital Banking",
    priority: "normal", status: "Open", assignee: "ana", opened: t("2026-11-23T09:12"), due: t("2026-11-24T17:00"), unread: true, stage: 5, aiWorking: true,
    tone: "Frustrated", language: "Taglish", crmSyncMin: 3, attachments: [], verified: "Registered email and date of birth",
    summary: { issue: "Antonio moved to a new phone. Each one-time code expires before it arrives, and the app locked him out after three tries.",
      steps: "Checked identity with the registered email and date of birth, matched the known device re-registration steps and prepared an unlock request.",
      next: "Unlock the login and send the device re-registration steps from the approved article." },
    checks: ["Identity checked without asking for the code", "Known issue: codes to an old number after a phone change", "Account active"],
    messages: [
      m("customer", "Antonio Garcia", "chat", "2026-11-23T09:12", "Nagpalit ako ng phone. Every OTP I get is already expired pag dumating, and now the app says my account is locked."),
      m("agent", "Chat agent", "chat", "2026-11-23T09:14", "Sorry about that, Antonio. Please do not share any code with anyone, including us. I am passing you to a colleague who can unlock your login and help you register the new phone.", { delivery: "Read" }),
    ],
    draft: { agent: "Chat agent", confidence: 0.91, article: "New phone and expired one-time codes, re-registration steps (v3)", text: "Hi Antonio, your login is unlocked. Open the app on your new phone, choose Forgot password and follow the steps to register this device. The new code will come to your registered mobile number. Never share it with anyone, including Land Bank staff." },
  },
  {
    id: "LB-2611-0418", subject: "Loan restructuring after typhoon damage", customerId: "c2", channel: "email", category: "Loans", unit: "Loans",
    priority: "high", status: "Waiting on unit", assignee: "ana", opened: t("2026-11-22T14:10"), due: t("2026-11-25T14:10"), unread: false, stage: 6, repeat: true,
    tone: "Worried", language: "Filipino, English", crmSyncMin: 190, verified: "Registered mobile and date of birth, by phone",
    attachments: [{ name: "field-photo-1.jpg", size: "2.1 MB" }, { name: "field-photo-2.jpg", size: "1.9 MB" }, { name: "barangay-certificate.pdf", size: "310 KB" }],
    summary: { issue: "Farmer asks to restructure a crop loan after typhoon damage. He attached photos and a barangay certificate and called again this morning.",
      steps: "Read 2 attachments, matched crop loan LN-48812, added the phone call to this case instead of opening a second ticket.",
      next: "Loans unit to confirm calamity relief eligibility, then call Mr Reyes after 15:00." },
    checks: ["2 attachments read: photos and a certificate", "Matched to existing crop loan LN-48812", "Duplicate contact by voice added to this case"],
    messages: [
      m("customer", "Jose Reyes", "email", "2026-11-22T14:10", "Good afternoon. My rice field in Cabanatuan was flooded last week. I cannot pay the next amortisation on time. I would like to ask about restructuring my crop loan. I attach photos and a certificate from the barangay."),
      m("agent", "Email agent", "email", "2026-11-22T14:12", "Thank you, Mr Reyes. We received your email and opened case LB-2611-0418. A loan officer will review your request and reply within 3 working days.", { delivery: "Delivered" }),
      m("staff", "Ana Villanueva", "voice", "2026-11-23T09:30", "Outbound call to Jose Reyes", {
        call: { duration: 198, outcome: "Reached", recorded: true,
          transcript: [
            { who: "Executive", t: "0:04", text: "Good morning Mr Reyes, this is Ana from Land Bank. This call is recorded. Is this a good time?" },
            { who: "Customer", t: "0:11", text: "Yes, yes. I am waiting for the answer about my loan." },
            { who: "Executive", t: "0:19", text: "We received your email and photos. The Loans unit is checking the calamity relief policy for your crop loan." },
            { who: "Customer", t: "0:42", text: "Can I skip the payment on the 30th?" },
            { who: "Executive", t: "0:50", text: "Possibly a 90 day payment holiday. Please prepare your loan number and a valid ID. We will confirm on Tuesday." },
            { who: "Customer", t: "1:20", text: "Thank you, I will wait for your call." },
          ],
          summary: "Mr Reyes asked to skip the 30 Nov payment. Ana explained a possible 90 day holiday and asked him to prepare his loan number and ID. Follow-up call on Tuesday." } }),
    ],
    draft: { agent: "Email agent", confidence: 0.86, article: "Calamity relief for crop loans, payment holiday (v4)", text: "Dear Mr Reyes, we are sorry about the damage to your field. Your request is with our Loans unit. Under the calamity relief policy you may qualify for a payment holiday of up to 90 days. Please prepare your loan number LN-48812 and a valid ID. We will call you on Tuesday to confirm the next step." },
  },
  {
    id: "LB-2611-0424", subject: "Callback about my loan balance", customerId: "c2", channel: "voice", category: "Loans", unit: "Loans",
    priority: "high", status: "Open", assignee: "ana", opened: t("2026-11-23T08:52"), due: t("2026-11-25T14:10"), unread: false, stage: 6, callbackAt: "15:00", dupOf: "LB-2611-0418",
    tone: "Worried", language: "Filipino", crmSyncMin: 4, attachments: [], verified: "Registered mobile",
    summary: { issue: "Jose called again about the loan balance and the restructuring request he emailed on Sunday.",
      steps: "Recorded and transcribed the call, matched the caller to his profile and found the open case LB-2611-0418.",
      next: "Join this call to case LB-2611-0418 and call him back at 15:00." },
    checks: ["Matched to open case LB-2611-0418", "Call recorded and logged"],
    messages: [
      m("customer", "Jose Reyes", "voice", "2026-11-23T08:52", "Inbound call, 3 min 12 s. Asked for a callback about the loan balance and the restructuring request he emailed on Sunday.", {
        call: { duration: 192, outcome: "Reached", recorded: true,
          transcript: [
            { who: "Customer", t: "0:03", text: "Hello, I emailed about my crop loan. Has anyone seen it?" },
            { who: "Executive", t: "0:10", text: "Good morning. Let me check. I see your email and the case. Someone from Loans will call you back this afternoon." },
            { who: "Customer", t: "0:35", text: "Please call after three, I am in the field until then." },
          ],
          summary: "Mr Reyes asked about the status of his restructuring request and asked for a callback after 15:00." } }),
    ],
  },
  {
    id: "LB-2611-0399", subject: "Wrong interest posted on time deposit", customerId: "c7", channel: "email", category: "Deposits", unit: "Deposits",
    priority: "high", status: "Open", assignee: "paolo", opened: t("2026-11-18T11:00"), due: t("2026-11-23T08:00"), unread: false, stage: 6,
    tone: "Frustrated", language: "English", crmSyncMin: 12, attachments: [{ name: "time-deposit-certificate.pdf", size: "180 KB" }], verified: "Matched on email and account number",
    summary: { issue: "Interest on a 6-month time deposit was posted at 3.0% instead of 3.5%. The difference is ₱2,150.",
      steps: "Read the certificate, checked the rate sheet, calculated the difference and asked the manager for an extension.",
      next: "Get Treasury sign-off, credit the difference and tell Ms Lim." },
    checks: ["Rate sheet confirms 3.5%", "Difference calculated: ₱2,150", "Extension request sent to the team manager"],
    messages: [
      m("customer", "Cristina Lim", "email", "2026-11-18T11:00", "The interest on my 6-month time deposit shows 3.0%. The rate at placement was 3.5%. Please correct and credit the difference."),
      m("staff", "Paolo Cruz", "email", "2026-11-19T09:30", "We are checking the rate sheet with our Deposits team and will confirm shortly.", { delivery: "Read" }),
      m("staff", "Paolo Cruz", "voice", "2026-11-23T09:05", "Outbound call to Cristina Lim", {
        call: { duration: 25, outcome: "No answer", recorded: true, transcript: [], summary: "No answer. No voicemail left. Try again after 14:00." } }),
    ],
  },
  {
    id: "LB-2611-0415", subject: "InstaPay transfer to GCash debited but not received", customerId: "c4", channel: "email", category: "Transfers and payments", unit: "Digital Banking",
    priority: "high", status: "Waiting on customer", assignee: "carlo", opened: t("2026-11-22T20:30"), due: t("2026-11-24T20:30"), unread: false, stage: 6,
    tone: "Worried", language: "English", crmSyncMin: 5, attachments: [], verified: "Registered mobile and date of birth",
    summary: { issue: "Ramon sent ₱5,000 by InstaPay to a GCash wallet on 22 Nov. The amount left his account but has not reached the wallet.",
      steps: "Confirmed the debit on the account. Asked for the transaction reference number and a screenshot of the confirmation.",
      next: "Trace the transfer with the reference, then credit it back or confirm delivery." },
    checks: ["Debit of ₱5,000 confirmed on 22 Nov", "Reference number requested", "Not yet traced with the receiving wallet"],
    messages: [
      m("customer", "Ramon Bautista", "email", "2026-11-22T20:30", "Good evening. I sent ₱5,000 to my sister's GCash wallet through InstaPay on the mobile app this afternoon. The amount was deducted from my savings account but she has not received it. Please help."),
      m("agent", "Email agent", "email", "2026-11-22T20:32", "Thank you, Mr Bautista. We received your email and opened case LB-2611-0415. We will update you within 2 banking days.", { delivery: "Delivered" }),
      m("staff", "Carlo Mendoza", "email", "2026-11-23T08:05", "Good morning Mr Bautista. Please reply with the transaction reference number and a screenshot of the confirmation so we can trace the transfer.", { delivery: "Delivered" }),
    ],
  },
  {
    id: "LB-2611-0402", subject: "Closing a dormant savings account", customerId: "c5", channel: "email", category: "Deposits", unit: "Deposits",
    priority: "normal", status: "Open", assignee: "ana", opened: t("2026-11-19T10:00"), due: t("2026-11-26T17:00"), unread: false, stage: 6,
    tone: "Calm", language: "Filipino", crmSyncMin: 7, attachments: [], verified: "Matched on email address",
    summary: { issue: "Teresita wants to close a savings account dormant since 2021. Balance ₱1,820.",
      steps: "Confirmed the balance and sent the closing form. The ID on file has expired.",
      next: "Receive the signed form and a valid ID, then close the account." },
    checks: ["Balance confirmed", "Signed request form sent", "ID on file expired, new ID required"],
    messages: [
      m("customer", "Teresita Navarro", "email", "2026-11-19T10:00", "I would like to close my old savings account. I have not used it for years."),
      m("staff", "Liza Ramos", "email", "2026-11-20T14:20", "Please sign the attached request form and send it with a copy of your ID.", { delivery: "Read" }),
    ],
  },
  {
    id: "LB-2611-0423", subject: "ATM out of cash in Tarlac", customerId: "c8", channel: "facebook", category: "ATM and cards", unit: "Cards",
    priority: "normal", status: "New", assignee: null, opened: t("2026-11-23T10:15"), due: t("2026-11-24T10:15"), unread: true, stage: 5,
    tone: "Frustrated", language: "English", crmSyncMin: 0, attachments: [],
    summary: { issue: "Public comment under the branch post: the Tarlac ATM has been out of cash since last night.",
      steps: "Classified the post as a grievance with no personal data. Checked the branch ATM status: refill due 11:30.",
      next: "Post the public reply and invite a private message about the earlier outages." },
    checks: ["Public comment, no personal data", "Branch ATM status: refill due 11:30"],
    messages: [
      m("customer", "Rowena Aquino", "facebook", "2026-11-23T10:15", "The ATM at Tarlac branch has been out of cash since last night. Third time this month!"),
    ],
    draft: { agent: "Social agent", confidence: 0.81, article: "Public replies, ATM outages (v2)", text: "Hi Rowena, we are sorry for the trouble. The ATM is scheduled for a refill at 11:30 today. If you want us to look into the earlier outages, please send us a private message and we will follow up." },
  },
  {
    id: "LB-2611-0425", subject: "Two hours in the queue at Cabanatuan", customerId: "c9", channel: "x", category: "Branch service", unit: "Customer care",
    priority: "normal", status: "New", assignee: "ana", opened: t("2026-11-23T10:31"), due: t("2026-11-24T10:31"), unread: true, stage: 2, aiWorking: true,
    tone: "Angry", language: "English", crmSyncMin: 0, attachments: [],
    summary: { issue: "Public post: waited two hours for a passbook update at the Cabanatuan branch.",
      steps: "Captured the post and classified it as a grievance. Still looking for a matching customer.",
      next: "Wait for the agent to finish, then review the public reply." },
    checks: ["Post captured from X", "Classified as grievance, not fraud"],
    messages: [
      m("customer", "Marlon Dizon", "x", "2026-11-23T10:31", "Two hours in line at @LandBank Cabanatuan just to update a passbook. This is not okay."),
    ],
  },
  {
    id: "LB-2611-0426", subject: "Payroll account for 40 staff", customerId: "c10", channel: "linkedin", category: "Business accounts", unit: "Customer care",
    priority: "normal", status: "Open", assignee: "carlo", opened: t("2026-11-23T09:44"), due: t("2026-11-26T17:00"), unread: false, stage: 6,
    tone: "Calm", language: "English", crmSyncMin: 6, attachments: [], verified: "Matched on LinkedIn profile and business account",
    summary: { issue: "Patricia asks how to set up a payroll account for 40 staff.",
      steps: "Matched her to the business account, classified as a sales enquiry and routed to Customer care.",
      next: "Send the payroll account requirements and offer a branch appointment." },
    checks: ["Matched to business account ••7020", "Classified as business enquiry"],
    messages: [
      m("customer", "Patricia Gomez", "linkedin", "2026-11-23T09:44", "Hello, we want to set up a payroll account for about 40 staff. What do you need from us?"),
    ],
  },
  {
    id: "LB-2611-0427", subject: "App down since this morning, cannot pay bills", customerId: "c12", channel: "facebook", category: "App availability", unit: "Digital Banking",
    priority: "high", status: "New", assignee: null, opened: t("2026-11-23T10:24"), due: t("2026-11-24T10:24"), unread: true, stage: 5,
    tone: "Frustrated", language: "Taglish", crmSyncMin: 0, attachments: [],
    summary: { issue: "Public comment: the mobile app shows an error since the morning and bills are due today. One of 41 similar comments in 24 hours.",
      steps: "Classified as a grievance with no personal data. Linked to the open spike alert on app access. Found the bank's service advisory for today.",
      next: "Post the approved known-issue reply and invite a private message if a payment failed." },
    checks: ["Public comment, no personal data", "Part of the app access spike", "Service advisory found, approved for replies"],
    messages: [
      m("customer", "Jenny Castillo", "facebook", "2026-11-23T10:24", "Hindi ako maka-login since this morning, error lang lagi. Due today pa naman bills ko. Ano na LANDBANK?"),
    ],
    draft: { agent: "Social agent", confidence: 0.89, article: "Known issue reply: app access, 23 Nov advisory (v1)", text: "Hi Jenny, we are sorry for the trouble. Some customers cannot sign in to the mobile app this morning and our team is fixing it. You can still use iAccess on the web. If a payment did not go through, please send us a private message and we will check it for you." },
  },
  {
    id: "LB-2611-0428", subject: "Text message asks for my OTP to stop an account block", customerId: "c13", channel: "messenger", category: "Fraud and scams", unit: "Fraud",
    priority: "urgent", status: "Open", assignee: "ana", opened: t("2026-11-23T10:05"), due: t("2026-11-23T14:05"), unread: true, stage: 5, fraud: true,
    tone: "Worried", language: "Filipino, English", crmSyncMin: 1, attachments: [{ name: "sms-screenshot.jpg", size: "640 KB" }], verified: "Matched on Facebook profile and registered mobile",
    summary: { issue: "Ricardo received a text saying his account will be blocked unless he opens a link and enters his one-time code. He did not open it.",
      steps: "Flagged as a phishing report, read the screenshot, confirmed no code was shared and sent the fraud team the sender number and link.",
      next: "Thank Ricardo, confirm the bank never asks for codes, and share the official reporting steps." },
    checks: ["Phishing pattern: asks for a one-time code", "Customer confirms no code was shared", "Sender and link sent to the fraud team"],
    messages: [
      m("customer", "Ricardo Manalo", "messenger", "2026-11-23T10:05", "May text ako na ma-block daw account ko kung hindi ko i-enter ang OTP sa link. Is this really from LANDBANK? I did not click it."),
      m("agent", "Social agent", "messenger", "2026-11-23T10:07", "Thank you for checking with us, Ricardo. Please do not open the link or share any code. Can you send a screenshot of the message so our fraud team can act on it?", { delivery: "Read" }),
      m("customer", "Ricardo Manalo", "messenger", "2026-11-23T10:11", "Here it is.", { delivery: "Read" }),
    ],
    draft: { agent: "Social agent", confidence: 0.93, article: "Phishing reports, reply and reporting steps (v4)", text: "Thank you, Ricardo. This message is not from Land Bank. We never ask for your one-time code, PIN or password by text, email or social media. Our fraud team has the sender details. Please delete the message, and if you ever share a code by mistake, call our hotline right away." },
  },
  {
    id: "LB-2611-0429", subject: "Online account opening still pending after three weeks", customerId: "c14", channel: "email", category: "Account opening", unit: "Digital Banking",
    priority: "normal", status: "Open", assignee: "ana", opened: t("2026-11-22T18:40"), due: t("2026-11-25T18:40"), unread: false, stage: 6,
    tone: "Frustrated", language: "English", crmSyncMin: 9, attachments: [{ name: "application-confirmation.png", size: "210 KB" }], verified: "Matched on email and application number",
    summary: { issue: "Grace applied for a digital savings account on 4 Nov. The status still shows pending and the branch asked her to come back twice.",
      steps: "Read the confirmation screenshot, matched the application and found it waiting for an ID review.",
      next: "Ask Digital Banking to finish the ID review, then tell Grace the outcome and the date." },
    checks: ["Application found, sent 4 Nov", "Waiting for an ID review", "Branch visits noted twice"],
    messages: [
      m("customer", "Grace Villareal", "email", "2026-11-22T18:40", "I applied for an account online on 4 November and it still says pending. I already went to the branch twice. Please tell me what is missing."),
      m("agent", "Email agent", "email", "2026-11-22T18:42", "Thank you, Grace. We received your email and opened case LB-2611-0429. We will update you within 3 banking days.", { delivery: "Delivered" }),
    ],
  },
  {
    id: "LB-2611-0411", subject: "Statement for 2025 for a tax filing", customerId: "c7", channel: "email", category: "Deposits", unit: "Deposits",
    priority: "normal", status: "Resolved", assignee: "carlo", opened: t("2026-11-20T09:00"), due: t("2026-11-23T09:00"), unread: false, stage: 9,
    tone: "Grateful", language: "English", crmSyncMin: 20, attachments: [{ name: "statement-2025.pdf", size: "420 KB" }],
    summary: { issue: "Cristina asked for her 2025 statement for a tax filing.", steps: "Sent the statement by email and she confirmed receipt.", next: "None. Case closed." },
    checks: ["Statement sent", "Customer confirmed"],
    messages: [
      m("customer", "Cristina Lim", "email", "2026-11-20T09:00", "Please send my 2025 account statement for tax filing."),
      m("staff", "Carlo Mendoza", "email", "2026-11-21T10:10", "Attached is your statement for 2025. Please tell us if you need anything else.", { delivery: "Read" }),
      m("customer", "Cristina Lim", "email", "2026-11-21T11:00", "Received, thank you."),
    ],
    resolution: { note: "Statement sent and receipt confirmed.", root: "Customer query", notified: true, at: t("2026-11-21T11:05") },
  },
  {
    id: "LB-2611-0395", subject: "Saturday branch hours in Angeles", customerId: "c3", channel: "chat", category: "Branch information", unit: "Customer care",
    priority: "normal", status: "Resolved", assignee: null, opened: t("2026-11-22T10:05"), due: t("2026-11-23T10:05"), unread: false, stage: 9, handledByAI: true,
    tone: "Calm", language: "English", crmSyncMin: 0, attachments: [],
    summary: { issue: "Elena asked if the Angeles branch opens on Saturday.", steps: "Answered from the approved branch hours article.", next: "None. Closed by the chat agent." },
    checks: ["Answered from approved knowledge"],
    messages: [
      m("customer", "Elena Dela Cruz", "chat", "2026-11-22T10:05", "Is the Angeles branch open on Saturday?"),
      m("agent", "Chat agent", "chat", "2026-11-22T10:05", "Yes. The Angeles branch is open on Saturday from 09:00 to 12:00.", { delivery: "Read" }),
    ],
    resolution: { note: "Answered by the chat agent.", root: "Customer query", notified: true, at: t("2026-11-22T10:06") },
  },
  {
    id: "LB-2611-0396", subject: "Where to download the mobile app", customerId: "c6", channel: "email", category: "Digital banking", unit: "Digital Banking",
    priority: "normal", status: "Resolved", assignee: null, opened: t("2026-11-21T15:20"), due: t("2026-11-22T15:20"), unread: false, stage: 9, handledByAI: true,
    tone: "Calm", language: "English", crmSyncMin: 0, attachments: [],
    summary: { issue: "Antonio asked where to download the mobile app.", steps: "Replied with the store links from approved knowledge.", next: "None. Closed by the email agent." },
    checks: ["Answered from approved knowledge"],
    messages: [
      m("customer", "Antonio Garcia", "email", "2026-11-21T15:20", "Where can I download your mobile app?"),
      m("agent", "Email agent", "email", "2026-11-21T15:21", "You can download the Land Bank app from the App Store and Google Play. Search for the Land Bank app and look for the green logo.", { delivery: "Read" }),
    ],
    resolution: { note: "Answered by the email agent.", root: "Customer query", notified: true, at: t("2026-11-21T15:22") },
  },
  {
    id: "LB-2611-0397", subject: "Interest rate on a 12-month time deposit", customerId: "c5", channel: "voice", category: "Deposits", unit: "Deposits",
    priority: "normal", status: "Resolved", assignee: null, opened: t("2026-11-20T11:40"), due: t("2026-11-21T11:40"), unread: false, stage: 9, handledByAI: true,
    tone: "Calm", language: "Filipino", crmSyncMin: 0, attachments: [],
    summary: { issue: "Teresita asked for the current 12-month time deposit rate.", steps: "The voice agent answered from the rate sheet and saved the call.", next: "None. Closed by the voice agent." },
    checks: ["Answered from approved knowledge", "Call recorded"],
    messages: [
      m("customer", "Teresita Navarro", "voice", "2026-11-20T11:40", "Inbound call, 1 min 05 s. Asked for the 12-month time deposit rate.", {
        call: { duration: 65, outcome: "Reached", recorded: true, transcript: [
          { who: "Customer", t: "0:05", text: "Magandang umaga. Magkano ang interest ng 12 buwang time deposit?" },
          { who: "Executive", t: "0:12", text: "The current rate is 3.75 percent a year for 12 months, paid at maturity." },
        ], summary: "Asked for the 12-month rate. The agent gave 3.75 percent." } }),
    ],
    resolution: { note: "Answered by the voice agent.", root: "Customer query", notified: true, at: t("2026-11-20T11:42") },
  },
];
export const caseById = (id: string) => CASES.find((c) => c.id === id)!;

// ------------------------------------------------------------------ whose turn
export type TurnTone = "pri" | "ai" | "warn" | "pos" | "";
export function turnOf(c: CaseT): { label: string; tone: TurnTone } {
  if (c.status === "Resolved") return c.handledByAI ? { label: "Closed by AI", tone: "ai" } : { label: "Resolved", tone: "pos" };
  if (c.aiWorking) return { label: "AI is working", tone: "ai" };
  if (c.callbackAt && c.assignee === "ana") return { label: `Call back ${c.callbackAt}`, tone: "warn" };
  if (c.draft && c.assignee === "ana") return { label: "Approve draft", tone: "pri" };
  if (c.status === "Waiting on customer") return { label: "Waiting on customer", tone: "" };
  if (c.status === "Waiting on unit") return { label: `With ${c.unit} unit`, tone: "" };
  if (!c.assignee) return { label: "Needs an owner", tone: "warn" };
  if (c.assignee === "ana") return { label: "With you", tone: "" };
  return { label: `With ${firstName(staffName(c.assignee))}`, tone: "" };
}

// ------------------------------------------------------------------ pipeline per channel
export const OUTER = ["Capture", "Understand", "Identify", "Decide", "Route", "Respond", "Work", "Close", "Learn"] as const;
export interface Step { id: string; outer: number; name: string; ms: number; }
const WORK_CLOSE: Step[] = [
  { id: "work", outer: 6, name: "Unit works the case", ms: 0 }, { id: "close", outer: 7, name: "Resolve and tell the customer", ms: 0 },
  { id: "learn", outer: 8, name: "Learn from edits and outcome", ms: 0 },
];
export const PIPE: Record<AgentKind, Step[]> = {
  email: [
    { id: "fetch", outer: 0, name: "Fetch the email", ms: 820 }, { id: "gates", outer: 0, name: "Skip auto-replies and spam", ms: 40 }, { id: "ocr", outer: 0, name: "Read attachments", ms: 3100 },
    { id: "extract", outer: 1, name: "Extract details", ms: 4100 }, { id: "classify", outer: 1, name: "Classify category and urgency", ms: 2800 },
    { id: "lookup", outer: 2, name: "Find the customer", ms: 1300 }, { id: "open", outer: 3, name: "Check for an open case", ms: 900 },
    { id: "route", outer: 4, name: "Route to a unit", ms: 400 }, { id: "draft", outer: 5, name: "Draft the reply", ms: 6900 }, { id: "approve", outer: 5, name: "Approval by a person", ms: 0 },
    ...WORK_CLOSE,
  ],
  social: [
    { id: "capture", outer: 0, name: "Capture the post or message", ms: 600 }, { id: "classify", outer: 1, name: "Classify the post", ms: 2100 }, { id: "fraud", outer: 1, name: "Check for fraud and distress", ms: 900 },
    { id: "match", outer: 2, name: "Match the customer", ms: 1500 }, { id: "open", outer: 3, name: "Check for an open case", ms: 700 }, { id: "route", outer: 4, name: "Route to a unit", ms: 350 },
    { id: "draft", outer: 5, name: "Draft the public reply", ms: 5200 }, { id: "move", outer: 5, name: "Invite or move to private message", ms: 400 }, { id: "approve", outer: 5, name: "Approval by a person", ms: 0 },
    ...WORK_CLOSE,
  ],
  voice: [
    { id: "call", outer: 0, name: "Call received", ms: 300 }, { id: "stt", outer: 0, name: "Speech to text", ms: 1200 }, { id: "intent", outer: 1, name: "Intent and tone", ms: 1800 },
    { id: "verify", outer: 2, name: "Verify the caller", ms: 9000 }, { id: "open", outer: 3, name: "Check for an open case", ms: 800 }, { id: "route", outer: 4, name: "Route or transfer", ms: 500 },
    { id: "answer", outer: 5, name: "Answer or transfer", ms: 4000 }, { id: "save", outer: 5, name: "Save recording and transcript", ms: 700 },
    ...WORK_CLOSE,
  ],
  chat: [
    { id: "msg", outer: 0, name: "Live message", ms: 200 }, { id: "intent", outer: 1, name: "Intent and tone", ms: 1100 }, { id: "ident", outer: 2, name: "Minimum identity check", ms: 4200 },
    { id: "open", outer: 3, name: "Open or join a case", ms: 600 }, { id: "route", outer: 4, name: "Route to a unit", ms: 300 }, { id: "answer", outer: 5, name: "Answer or hand off with summary", ms: 3100 },
    { id: "approve", outer: 5, name: "Approval by a person", ms: 0 }, ...WORK_CLOSE,
  ],
};
export type StepState = "done" | "now" | "ai" | "todo";
export function stepState(c: CaseT, s: Step): StepState {
  if (s.outer < c.stage) return "done";
  if (s.outer === c.stage) return c.aiWorking ? "ai" : "now";
  return "todo";
}
export function evidence(c: CaseT, s: Step): { input: string; output: string; confidence?: number } {
  const cu = customer(c.customerId);
  const first = c.messages[0]?.text ?? "";
  switch (s.id) {
    case "fetch": case "capture": case "msg": case "call":
      return { input: `Source: ${CHANNEL_LABEL[c.channel]}, ${fmtTime(c.opened)}`, output: `One message captured, ${first.length} characters.` };
    case "gates": return { input: "Subject, sender and body", output: "Not an auto-reply, out-of-office or spam. Continue." };
    case "ocr": return { input: c.attachments.length ? `${c.attachments.length} attachment(s)` : "No attachments", output: c.attachments.length ? c.attachments.map((a) => a.name).join(", ") + " read." : "Skipped, no attachment." };
    case "extract": return { input: "Email body and attachment text", output: `Subject, amounts, dates and references found. Language: ${c.language}.`, confidence: 0.91 };
    case "classify": case "intent": return { input: "Message text", output: `Category: ${c.category}. Priority: ${c.priority}. Tone: ${c.tone}.`, confidence: 0.9 };
    case "stt": return { input: "Call audio", output: "Transcript saved with time marks.", confidence: 0.94 };
    case "fraud": return { input: "Words and context", output: c.fraud ? "Fraud wording found. Fraud lane applied, priority raised." : "No fraud or distress wording found.", confidence: 0.96 };
    case "lookup": case "match": case "ident": case "verify":
      return { input: cu.matched ? `Sender details and ${cu.email || "handle"}` : "Handle only", output: cu.matched ? `Matched to ${cu.name}, CIF ${cu.cif}. ${c.verified ?? ""}`.trim() : "No match on the bank's data yet. Invite to private message.", confidence: cu.matched ? 0.97 : 0.4 };
    case "open": return { input: `Customer, category ${c.category}`, output: c.dupOf ? `Open case ${c.dupOf} found for the same issue. Suggest to join.` : "No open case for the same issue. A new case was opened." };
    case "route": return { input: `Category ${c.category}`, output: `Routed to the ${c.unit} unit by rule. Deadline set to ${fmtTime(c.due)}.` };
    case "draft": case "answer": case "move": return { input: "Case summary and approved articles", output: c.draft ? `Draft prepared from "${c.draft.article}".` : "Answer sent from approved knowledge.", confidence: c.draft?.confidence };
    case "approve": return { input: "AI draft", output: c.draft ? "Waiting for a person to approve, edit or reject." : "Approved and sent." };
    case "save": return { input: "Call audio and transcript", output: "Recording and transcript attached to the case." };
    case "work": return { input: "Case and summary", output: c.status === "Resolved" ? "Worked and closed." : `With ${c.assignee ? staffName(c.assignee) : "no owner yet"} in ${c.unit}.` };
    case "close": return { input: "Resolution note and root cause", output: c.resolution ? `Resolved: ${c.resolution.note}` : "Not closed yet." };
    default: return { input: "Edited replies, category and routing changes", output: "Used to improve the knowledge base and routing rules." };
  }
}
export function stepTime(c: CaseT, idx: number): number { return c.opened + idx * 4000; }

// ------------------------------------------------------------------ notes, time, extensions
export interface Note { id: string; customerId: string; caseId?: string; text: string; pinned: boolean; by: string; at: number; }
export const NOTES: Note[] = [
  { id: "n1", customerId: "c1", caseId: "LB-2611-0409", text: "Dispute sent to Cards with the screenshot. Merchant name still missing. Customer flies tomorrow, so aim to answer before 12:30.", pinned: false, by: "ana", at: t("2026-11-21T17:08") },
  { id: "n2", customerId: "c2", text: "Prefers calls after 15:00, he is in the field until then. Calamity relief policy applies to this barangay.", pinned: true, by: "nina", at: t("2026-11-20T10:15") },
  { id: "n3", customerId: "c7", caseId: "LB-2611-0399", text: "Rate sheet confirms 3.5%. Waiting for Treasury sign-off before crediting ₱2,150.", pinned: false, by: "paolo", at: t("2026-11-22T16:40") },
];
export interface TimeEntry { id: string; caseId: string; by: string; at: number; minutes: number; note: string; }
export const TIME_ENTRIES: TimeEntry[] = [
  { id: "te1", caseId: "LB-2611-0409", by: "ana", at: t("2026-11-21T17:10"), minutes: 18, note: "Dispute raised with Cards" },
  { id: "te2", caseId: "LB-2611-0409", by: "ana", at: t("2026-11-23T09:20"), minutes: 6, note: "Checked merchant status" },
  { id: "te3", caseId: "LB-2611-0418", by: "ana", at: t("2026-11-23T09:34"), minutes: 4, note: "Call with Mr Reyes" },
];
export interface Extension { id: string; caseId: string; by: string; reason: string; asked: number; oldDue: number; newDue: number; }
export const EXTENSIONS: Extension[] = [
  { id: "x1", caseId: "LB-2611-0399", by: "paolo", reason: "Rate sheet needs sign-off from the Treasury unit before we can credit the difference.", asked: t("2026-11-23T07:55"), oldDue: t("2026-11-23T08:00"), newDue: t("2026-11-25T17:00") },
  { id: "x2", caseId: "LB-2611-0409", by: "ana", reason: "Cards is still checking the merchant. We need until end of day to give a firm answer.", asked: t("2026-11-23T10:20"), oldDue: t("2026-11-23T12:30"), newDue: t("2026-11-23T17:00") },
];

// ------------------------------------------------------------------ customer timeline
export type EvType = "message_in" | "message_out" | "ai_draft" | "call" | "case_opened" | "case_status" | "assignment" | "note" | "identity" | "linked";
export const EV_LABEL: Record<EvType, string> = {
  message_in: "Message in", message_out: "Message out", ai_draft: "AI draft", call: "Call", case_opened: "Case opened",
  case_status: "Status change", assignment: "Assignment", note: "Note", identity: "Identity verified", linked: "Profile linked",
};
export interface TimelineEvent {
  id: string; at: number; type: EvType; channel?: Channel; title: string; snippet?: string; by: string;
  byKind: "customer" | "ai" | "staff" | "system"; caseId?: string; caseStatus?: Status; delivery?: Message["delivery"];
  call?: CallT; due?: number; pending?: boolean;
}
const OLD: Record<string, TimelineEvent[]> = {
  c1: [{ id: "o1", at: t("2026-06-15T15:00"), type: "message_in", channel: "chat", title: "Asked how to raise the daily transfer limit", by: "Maria Santos", byKind: "customer", caseId: "LB-2606-0188", caseStatus: "Resolved" },
       { id: "o2", at: t("2026-03-03T09:10"), type: "message_in", channel: "email", title: "Request for an account statement", by: "Maria Santos", byKind: "customer", caseId: "LB-2603-0054", caseStatus: "Resolved" }],
  c2: [{ id: "o3", at: t("2026-09-04T11:20"), type: "call", channel: "hotline", title: "Asked for the current balance of the crop loan", by: "Jose Reyes", byKind: "customer", caseId: "LB-2609-0112", caseStatus: "Resolved" }],
  c3: [{ id: "o4", at: t("2026-08-02T09:40"), type: "message_in", channel: "chat", title: "Asked about the passbook replacement fee", by: "Elena Dela Cruz", byKind: "customer", caseId: "LB-2608-0071", caseStatus: "Resolved" }],
  c7: [{ id: "o5", at: t("2026-04-12T14:00"), type: "message_in", channel: "email", title: "Asked to update the business address", by: "Cristina Lim", byKind: "customer", caseId: "LB-2604-0120", caseStatus: "Resolved" }],
};
export function eventsFor(customerId: string, cases: CaseT[], notes: Note[]): TimelineEvent[] {
  const ev: TimelineEvent[] = [];
  for (const c of cases.filter((x) => x.customerId === customerId)) {
    ev.push({ id: `${c.id}-open`, at: c.opened - 1000, type: "case_opened", channel: c.channel, title: `Case ${c.id} opened`, snippet: c.subject, by: "PineDesk", byKind: "system", caseId: c.id, caseStatus: c.status, due: c.status === "Resolved" ? undefined : c.due });
    if (c.verified) ev.push({ id: `${c.id}-id`, at: c.opened + 90000, type: "identity", channel: c.channel, title: "Identity verified", snippet: c.verified, by: agentOf(c), byKind: "ai", caseId: c.id });
    for (const x of c.messages) {
      const isCall = !!x.call;
      ev.push({
        id: x.id, at: x.at, type: isCall ? "call" : x.from === "customer" ? "message_in" : "message_out", channel: x.channel,
        title: isCall ? `${x.from === "customer" ? "Inbound" : "Outbound"} call, ${fmtDur(x.call!.duration)}, ${x.call!.outcome.toLowerCase()}` : x.text,
        snippet: isCall ? x.call!.summary : undefined, by: x.who, byKind: x.from === "customer" ? "customer" : x.from === "agent" ? "ai" : "staff",
        caseId: c.id, caseStatus: c.status, delivery: x.delivery, call: x.call,
      });
    }
    if (c.draft) ev.push({ id: `${c.id}-draft`, at: c.messages[c.messages.length - 1].at + 60000, type: "ai_draft", channel: c.channel, title: "Draft reply waiting for approval", snippet: c.draft.text, by: c.draft.agent, byKind: "ai", caseId: c.id, caseStatus: c.status, pending: true, due: c.due });
    if (c.assignee) ev.push({ id: `${c.id}-as`, at: c.opened + 300000, type: "assignment", title: `Assigned to ${staffName(c.assignee)}`, by: "PineDesk", byKind: "system", caseId: c.id });
    if (c.status === "Resolved" && c.resolution) ev.push({ id: `${c.id}-res`, at: c.resolution.at, type: "case_status", title: `Case ${c.id} resolved`, snippet: c.resolution.note, by: c.handledByAI ? agentOf(c) : staffName(c.assignee), byKind: c.handledByAI ? "ai" : "staff", caseId: c.id, caseStatus: "Resolved" });
  }
  for (const n of notes.filter((x) => x.customerId === customerId)) {
    ev.push({ id: n.id, at: n.at, type: "note", title: n.text, by: staffName(n.by), byKind: "staff", caseId: n.caseId });
  }
  return [...ev, ...(OLD[customerId] ?? [])].sort((a, b) => b.at - a.at);
}
export function agentOf(c: CaseT): string {
  const k = agentKind(c.channel);
  return k === "email" ? "Email agent" : k === "chat" ? "Chat agent" : k === "voice" ? "Voice agent" : "Social agent";
}

// ------------------------------------------------------------------ AI agents and reports
export interface Agent {
  id: string; name: string; kind: AgentKind; status: "Active" | "Paused"; runs: number; solved: number; handed: number; failed: number;
  costPerRun: number; approved: number; edited: number; rejected: number; p95: number; handleSec: number; accuracy: number;
}
export const AGENTS: Agent[] = [
  { id: "a1", name: "Email agent", kind: "email", status: "Active", runs: 412, solved: 188, handed: 211, failed: 13, costPerRun: 3.4, approved: 301, edited: 74, rejected: 18, p95: 85, handleSec: 41, accuracy: 90.4 },
  { id: "a2", name: "Chat agent", kind: "chat", status: "Active", runs: 688, solved: 431, handed: 241, failed: 16, costPerRun: 1.9, approved: 112, edited: 31, rejected: 9, p95: 6, handleSec: 38, accuracy: 93.1 },
  { id: "a3", name: "Social media agent", kind: "social", status: "Active", runs: 191, solved: 64, handed: 118, failed: 9, costPerRun: 2.6, approved: 129, edited: 44, rejected: 21, p95: 52, handleSec: 29, accuracy: 87.6 },
  { id: "a4", name: "Voice agent", kind: "voice", status: "Active", runs: 154, solved: 69, handed: 79, failed: 6, costPerRun: 7.8, approved: 0, edited: 0, rejected: 0, p95: 4, handleSec: 112, accuracy: 89.2 },
];
AGENTS.forEach((a) => console.assert(a.solved + a.handed + a.failed === a.runs, "agent runs must add up", a.name));
export const HOTLINE_VOLUME = 97;
export const VOLUME = [
  ...AGENTS.map((a) => ({ label: a.kind === "social" ? "Social media" : a.kind[0].toUpperCase() + a.kind.slice(1), value: a.runs })),
  { label: "Hotline", value: HOTLINE_VOLUME },
];
export const TOTAL_VOLUME = VOLUME.reduce((s, v) => s + v.value, 0);
export const UNIT_SLA = [
  { unit: "Deposits", within: 94, cases: 396 }, { unit: "Loans", within: 91, cases: 310 },
  { unit: "Remittance", within: 90, cases: 188 }, { unit: "Digital Banking", within: 88, cases: 402 },
  { unit: "Cards", within: 83, cases: 246 },
];
console.assert(UNIT_SLA.reduce((s, u) => s + u.cases, 0) === TOTAL_VOLUME, "unit cases must equal volume");
const raw = [38,52,61,57,49,22,18,44,55,63,59,51,24,19,47,58,66,61,54,26,21,49,60,67,62,55,25,20,48,57];
const rawSum = raw.reduce((a, b) => a + b, 0);
export const DAILY = raw.map((v) => Math.round((v * TOTAL_VOLUME) / rawSum));
DAILY[DAILY.length - 1] += TOTAL_VOLUME - DAILY.reduce((a, b) => a + b, 0);
console.assert(DAILY.reduce((a, b) => a + b, 0) === TOTAL_VOLUME, "daily must equal volume");
export const PEAK = [2, 4, 9, 22, 41, 58, 63, 52, 47, 51, 55, 49, 33, 20, 11, 6]; // cases per hour, 07:00 to 22:00
export const FIELD_EDITS = [{ label: "Reply text", value: 149 }, { label: "Category", value: 41 }, { label: "Routing unit", value: 23 }, { label: "Priority", value: 12 }];
export const EXCEPTIONS = [
  { id: "LB-2611-0388", reason: "Customer not matched", unit: "Customer care", at: t("2026-11-22T16:12") },
  { id: "LB-2611-0391", reason: "Attachment unreadable", unit: "Loans", at: t("2026-11-22T11:03") },
  { id: "LB-2611-0377", reason: "Core banking timeout", unit: "Deposits", at: t("2026-11-21T14:48") },
  { id: "LB-2611-0369", reason: "Needs unit sign-off", unit: "Cards", at: t("2026-11-21T09:30") },
  { id: "LB-2611-0362", reason: "Customer not matched", unit: "Customer care", at: t("2026-11-20T15:20") },
];
export const EXC_REASONS = [
  { label: "Customer not matched", value: 14 }, { label: "Low confidence", value: 11 }, { label: "Needs unit sign-off", value: 9 },
  { label: "Attachment unreadable", value: 6 }, { label: "Core banking timeout", value: 4 },
];
export const STEP_LATENCY: Record<AgentKind, { name: string; avg: number; p95: number }[]> = {
  email: [{ name: "Fetch and read", avg: 3.9, p95: 7.1 }, { name: "Extract details", avg: 4.1, p95: 9.4 }, { name: "Classify", avg: 2.8, p95: 6.0 }, { name: "Find customer", avg: 1.3, p95: 2.3 }, { name: "Open case check", avg: 0.9, p95: 1.6 }, { name: "Route", avg: 0.4, p95: 0.9 }, { name: "Draft reply", avg: 6.9, p95: 14.2 }],
  chat: [{ name: "Intent and tone", avg: 1.1, p95: 2.0 }, { name: "Identity check", avg: 4.2, p95: 8.0 }, { name: "Case check", avg: 0.6, p95: 1.1 }, { name: "Route", avg: 0.3, p95: 0.6 }, { name: "Answer", avg: 3.1, p95: 5.2 }],
  social: [{ name: "Capture", avg: 0.6, p95: 1.1 }, { name: "Classify post", avg: 2.1, p95: 4.0 }, { name: "Fraud check", avg: 0.9, p95: 1.7 }, { name: "Match customer", avg: 1.5, p95: 3.1 }, { name: "Draft reply", avg: 5.2, p95: 10.8 }],
  voice: [{ name: "Speech to text", avg: 1.2, p95: 2.2 }, { name: "Intent and tone", avg: 1.8, p95: 3.3 }, { name: "Verify caller", avg: 9.0, p95: 18.0 }, { name: "Case check", avg: 0.8, p95: 1.4 }, { name: "Answer", avg: 4.0, p95: 7.6 }],
};
export const HEALTH = [
  { name: "Bank CRM", state: "Healthy", note: "Responds in 0.9 s" }, { name: "AI service", state: "Healthy", note: "Responds in 2.1 s" },
  { name: "Telephony (Exotel)", state: "Healthy", note: "No dropped calls today" }, { name: "Social connectors", state: "Slow", note: "LinkedIn delayed by 4 min" },
];

// ------------------------------------------------------------------ time helpers
export function ago(ts: number): string {
  const mn = Math.round((NOW - ts) / 60000);
  if (mn < 1) return "now";
  if (mn < 60) return `${mn} min`;
  const h = Math.round(mn / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} d`;
}
export function agoLong(ts: number): string {
  const mn = Math.round((NOW - ts) / 60000);
  if (mn < 1) return "just now";
  if (mn < 60) return `${mn} mins ago`;
  const h = Math.round(mn / 60);
  if (h < 24) return `${h} hours ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
export function dueLabel(due: number): { text: string; tone: "ok" | "risk" | "breach" } {
  const mn = Math.round((due - NOW) / 60000);
  const abs = Math.abs(mn);
  const txt = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.floor(abs / 60)} h ${abs % 60 ? (abs % 60) + " min" : ""}`.trim() : `${Math.round(abs / 1440)} d`;
  if (mn < 0) return { text: `Overdue ${txt}`, tone: "breach" };
  return { text: `Due in ${txt}`, tone: mn <= 4 * 60 ? "risk" : "ok" };
}
export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Manila" });
export const fmtDay = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Manila" });
export const fmtClock = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Manila" });
export function dayHeader(ts: number): string {
  const d = new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const today = new Date(NOW).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const yest = new Date(NOW - 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const label = new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Manila" });
  return d === today ? `Today, ${label}` : d === yest ? `Yesterday, ${label}` : label;
}
export const dayKey = (ts: number) => new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
export const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
