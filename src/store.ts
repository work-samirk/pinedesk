import type { CaseT, Extension, Note, Status, TimeEntry } from "./data";

export interface CallState { caseId: string; phase: "dialing" | "live" | "wrap"; seconds: number; }
export interface Store {
  cases: CaseT[]; notes: Note[]; entries: TimeEntry[]; extensions: Extension[]; query: string;
  activity: Record<string, { at: number; text: string }[]>;
  timers: Record<string, { running: boolean; seconds: number }>;
  linked: Record<string, string>; merged: Record<string, string>; dupDecided: Record<string, "joined" | "kept">;
  call: CallState | null; tenant: "default" | "landbank";
  go: (path: string) => void; toast: (t: string) => void;
  send: (id: string, text: string, fromDraft: boolean) => void;
  discard: (id: string) => void; regenerate: (id: string) => void;
  setStatus: (id: string, s: Status) => void; assign: (id: string, who: string | null) => void;
  endorse: (id: string, unit: string) => void; resolve: (id: string, note: string, root: string, notified: boolean) => void;
  reopen: (id: string) => void; refreshCrm: (id: string) => void; decideDup: (id: string, join: boolean) => void;
  addNote: (customerId: string, text: string, pinned: boolean, caseId?: string) => void;
  editNote: (id: string, text: string) => void; deleteNote: (id: string) => void; pinNote: (id: string) => void;
  addTime: (caseId: string, minutes: number, note: string) => void; setTimer: (caseId: string, running: boolean) => void; tick: (caseId: string) => void;
  startCall: (caseId: string) => void; advanceCall: (phase: CallState["phase"], seconds?: number) => void; logCustomer: (customerId: string, text: string) => void; finishCall: (outcome: "Reached" | "No answer" | "Call back later" | "Wrong number", note: string) => void; cancelCall: () => void;
  linkContact: (fromId: string, toId: string) => void; mergeProfile: (keepId: string, dupId: string) => void;
  decide: (id: string, ok: boolean) => void; setTenant: (t: "default" | "landbank") => void;
}
export const isOpen = (c: CaseT) => c.status !== "Resolved";
