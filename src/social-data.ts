// Sample data for the Social sentiment page (social media agent).
// The workspace numbers are made up. RESEARCH holds the public-review baseline from the
// LANDBANK research of 24 Nov 2026 (52 recent Philippine App Store reviews), kept apart.

import type { Channel } from "./data";

export type PostType = "Grievance" | "Inquiry" | "Distress" | "Scam" | "Praise";
export const POST_TYPES: PostType[] = ["Grievance", "Inquiry", "Distress", "Scam", "Praise"];
export const TYPE_COLOR: Record<PostType, string> = {
  Grievance: "var(--s-griev)", Inquiry: "var(--s-inq)", Distress: "var(--s-dist)", Scam: "var(--s-scam)", Praise: "var(--s-praise)",
};

// The six issue themes, worded exactly as in the LANDBANK research.
export const THEMES = [
  "Availability, errors and maintenance",
  "Transfers, payments, balances and history",
  "OTP, login and device access",
  "Onboarding, branch/support and security friction",
  "Interface, features and updates",
  "Praise",
] as const;
export type Theme = (typeof THEMES)[number];

export const RESEARCH = {
  title: "52 recent App Store reviews, 24 Aug to 18 Nov 2026",
  source: "LANDBANK social presence research, 24 Nov 2026",
  themes: [17, 12, 11, 6, 4, 2],
  sentiment: { negative: 46, neutral: 4, positive: 2 },
};

// 14 days to 23 Nov. Comments per day by type, Facebook page and Messenger (pilot).
export const DAYS = ["10 Nov", "11 Nov", "12 Nov", "13 Nov", "14 Nov", "15 Nov", "16 Nov", "17 Nov", "18 Nov", "19 Nov", "20 Nov", "21 Nov", "22 Nov", "23 Nov"];
export const DAILY_BY_TYPE: Record<PostType, number[]> = {
  Grievance: [22, 25, 24, 41, 38, 19, 17, 26, 28, 24, 23, 27, 21, 49],
  Inquiry:   [31, 34, 29, 36, 33, 21, 18, 35, 37, 33, 31, 34, 24, 38],
  Distress:  [3, 2, 4, 6, 5, 2, 1, 3, 4, 3, 2, 4, 2, 7],
  Scam:      [2, 3, 2, 4, 3, 1, 2, 5, 3, 2, 4, 3, 2, 6],
  Praise:    [9, 8, 11, 6, 7, 10, 12, 9, 10, 11, 9, 8, 10, 5],
};

const dayTotal = (i: number) => (Object.values(DAILY_BY_TYPE) as number[][]).reduce((a, v) => a + v[i], 0);
export const totalFor = (span: number) => Array.from({ length: span }, (_, k) => dayTotal(DAYS.length - span + k)).reduce((a, b) => a + b, 0);
const WEEK_NOW = totalFor(7);
const WEEK_PREV = Array.from({ length: 7 }, (_, k) => dayTotal(k)).reduce((a, b) => a + b, 0);
/** Split a total by weights so the parts always add up to the total. */
export function split(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest-- > 0) out[i] += 1; });
  return out;
}
// Every comment gets one theme. This week (17 to 23 Nov) against the week before; parts add up to each week's comments.
const W_NOW = [24, 17, 22, 10, 6, 21], W_PREV = [14, 19, 8, 12, 7, 23];
const TN = split(WEEK_NOW, W_NOW), TP = split(WEEK_PREV, W_PREV);
export const THEME_WEEK: { theme: Theme; now: number; prev: number }[] = THEMES.map((theme, i) => ({ theme, now: TN[i], prev: TP[i] }));

export const PLATFORMS: { id: string; label: string; channel: Channel | null; state: "Connected" | "Pilot" | "Waiting for access" | "Not connected"; note: string; neg: number; neu: number; pos: number; volume: number }[] = [
  { id: "fb", label: "Facebook page", channel: "facebook", state: "Pilot", note: "Comments on bank posts", neg: 58, neu: 30, pos: 12, volume: split(totalFor(14), [68, 32])[0] },
  { id: "ms", label: "Messenger", channel: "messenger", state: "Pilot", note: "Private messages", neg: 47, neu: 44, pos: 9, volume: split(totalFor(14), [68, 32])[1] },
  { id: "x", label: "X", channel: "x", state: "Waiting for access", note: "Developer access requested", neg: 0, neu: 0, pos: 0, volume: 0 },
  { id: "li", label: "LinkedIn", channel: "linkedin", state: "Waiting for access", note: "Page admin access requested", neg: 0, neu: 0, pos: 0, volume: 0 },
  { id: "ig", label: "Instagram", channel: null, state: "Not connected", note: "Needs the bank's page access", neg: 0, neu: 0, pos: 0, volume: 0 },
  { id: "tt", label: "TikTok", channel: null, state: "Not connected", note: "Needs the bank's page access", neg: 0, neu: 0, pos: 0, volume: 0 },
];

const OUT_LABELS = ["Answered in public, approved by a person", "Moved to a private message", "Case opened on PineDesk", "Sent to the fraud team", "No reply needed"];
/** Where the comments went over a period; adds up to the comments in that period. */
export const outcomes = (span: number) => split(totalFor(span), [30, 19, 14, 4, 33]).map((value, i) => ({ label: OUT_LABELS[i], value }));

export const LANGS = [{ label: "English", value: 46 }, { label: "Taglish", value: 39 }, { label: "Filipino", value: 15 }];

export interface SocialPost {
  id: string; platform: Channel; handle: string; at: string; text: string; type: PostType; theme: Theme;
  sentiment: "Negative" | "Neutral" | "Positive"; lang: string; action: "draft" | "dm" | "case" | "fraud" | "none"; caseId?: string; draft?: string;
}
export const POSTS: SocialPost[] = [
  { id: "p1", platform: "facebook", handle: "jenny.castillo.ph", at: "10:24", text: "Hindi ako maka-login since this morning, error lang lagi. Due today pa naman bills ko.", type: "Grievance", theme: "Availability, errors and maintenance", sentiment: "Negative", lang: "Taglish", action: "case", caseId: "LB-2611-0427" },
  { id: "p2", platform: "facebook", handle: "mark.d.reyes", at: "10:19", text: "OTP expired na agad pagdating. Third time today.", type: "Grievance", theme: "OTP, login and device access", sentiment: "Negative", lang: "Taglish", action: "draft",
    draft: "Hi Mark, sorry for the trouble. Some codes are arriving late this morning and our team is on it. Please never share a code with anyone. Send us a private message if you still cannot sign in." },
  { id: "p3", platform: "messenger", handle: "Ricardo Manalo", at: "10:05", text: "May text ako na ma-block daw account ko kung hindi ko i-enter ang OTP sa link.", type: "Scam", theme: "OTP, login and device access", sentiment: "Negative", lang: "Taglish", action: "fraud", caseId: "LB-2611-0428" },
  { id: "p4", platform: "facebook", handle: "liza.m.santos", at: "09:52", text: "Paano mag-transfer from LANDBANK to GCash? May fee ba?", type: "Inquiry", theme: "Transfers, payments, balances and history", sentiment: "Neutral", lang: "Taglish", action: "draft",
    draft: "Hi Liza, you can send money to GCash with InstaPay in the mobile app or iAccess. Retail InstaPay and PESONet transfers through the app and iAccess have no fee." },
  { id: "p5", platform: "facebook", handle: "jun.villanueva", at: "09:40", text: "Pending pa rin ang account opening ko since early November. Twice na ako bumalik sa branch.", type: "Grievance", theme: "Onboarding, branch/support and security friction", sentiment: "Negative", lang: "Taglish", action: "dm" },
  { id: "p6", platform: "facebook", handle: "ana.p.cruz", at: "09:31", text: "Salamat LANDBANK, mabilis ang transfer ko kanina. Convenient talaga.", type: "Praise", theme: "Praise", sentiment: "Positive", lang: "Taglish", action: "none" },
  { id: "p7", platform: "facebook", handle: "fake.landbank.help", at: "09:12", text: "Need help? DM us your account number and OTP to fix your account fast.", type: "Scam", theme: "OTP, login and device access", sentiment: "Negative", lang: "English", action: "fraud" },
];

export const SPIKE = {
  theme: "OTP, login and device access" as Theme,
  today: 41, usual: 13,
  text: "Comments about one-time codes and signing in are 3 times the usual level since 08:00.",
};
