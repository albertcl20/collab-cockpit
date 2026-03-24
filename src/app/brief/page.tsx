"use client";

import { Suspense, useMemo } from "react";
import { decompressFromEncodedURIComponent } from "lz-string";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function BriefPage() {
  return (
    <Suspense fallback={<BriefLoading />}>
      <BriefPageClient />
    </Suspense>
  );
}

type Status = "active" | "watch" | "blocked" | "done";
type Energy = "deep" | "light" | "stuck";

type Workstream = {
  id: string;
  name: string;
  owner: string;
  status: Status;
  energy: Energy;
  impact: number;
  urgency: number;
  confidence: number;
  lastTouched: string;
  nextStep: string;
  blocker: string;
  notes: string;
  waitingOn: string;
  desiredOutcome: string;
  decisionNeeded: string;
};

type Update = {
  id: string;
  title: string;
  type: string;
  detail: string;
  createdAt: string;
  relatedWorkstream: string;
};

type Decision = {
  id: string;
  topic: string;
  options: string;
  recommendation: string;
  confidence: number;
  deadline: string;
  impactArea: string;
};

type CollaboratorProfile = {
  id?: string;
  name: string;
  role?: string;
  preferredStyle?: string;
  appreciation?: string;
  frictionWatchout?: string;
  nextAsk?: string;
  lastSync?: string;
  notes?: string;
};

type AppState = {
  workstreams: Workstream[];
  updates: Update[];
  decisions: Decision[];
  snapshots?: unknown[];
  collaboratorProfiles?: CollaboratorProfile[];
};

type PortfolioBoard = {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  state: AppState;
};

type PortfolioState = {
  activeBoardId: string;
  boards: PortfolioBoard[];
};

const STORAGE_KEY = "collab-cockpit-v6";
const LEGACY_KEYS = ["collab-cockpit-v5", "collab-cockpit-v4", "collab-cockpit-v3", "collab-cockpit-v2", "collab-cockpit-v1"];

function BriefPageClient() {
  const searchParams = useSearchParams();
  const payload = useMemo(() => loadBriefState(searchParams.get("state")), [searchParams]);
  const { boardName, boardDescription, updatedAt, state, source } = payload;

  const scored = [...state.workstreams]
    .map((item) => ({ ...item, score: priorityScore(item), ageDays: daysSince(item.lastTouched), drag: collaborationDrag(item), readiness: readinessScore(item) }))
    .sort((a, b) => b.score - a.score);

  const topFocus = scored[0];
  const blocked = scored.filter((item) => item.status === "blocked");
  const stale = scored.filter((item) => item.ageDays >= 3);
  const overdueDecisions = [...state.decisions].filter((item) => isPast(item.deadline));
  const health = collaborationHealthScore(scored, state.decisions);
  const collaboratorAsk = buildCollaboratorAsk(state.collaboratorProfiles ?? [], scored);
  const markdown = buildMarkdownBrief({ boardName, boardDescription, updatedAt, health, topFocus, scored, blocked, stale, overdueDecisions, collaboratorAsk, updates: state.updates });

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-900 print:bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Brief view
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{boardName}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{boardDescription || "A compact meeting brief pulled from Collab Cockpit."}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <Pill>source: {source}</Pill>
                <Pill>updated {prettyDateTime(updatedAt)}</Pill>
                <Pill>{state.workstreams.length} workstreams</Pill>
                <Pill>{state.decisions.length} decisions</Pill>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 print:hidden">
              <button onClick={() => window.print()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">Print / save PDF</button>
              <button onClick={() => navigator.clipboard.writeText(markdown)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Copy markdown brief</button>
              <Link href="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Back to cockpit</Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4 print:grid-cols-4">
          <Metric label="Collab health" value={`${health}%`} note={health >= 70 ? "Usable without drama" : "Needs cleanup before syncs multiply"} />
          <Metric label="Top focus" value={topFocus ? `${topFocus.score}` : "—"} note={topFocus?.name ?? "No workstreams yet"} />
          <Metric label="Blocked" value={`${blocked.length}`} note={blocked[0]?.name ?? "No active blockers"} />
          <Metric label="Overdue decisions" value={`${overdueDecisions.length}`} note={overdueDecisions[0]?.topic ?? "Nothing overdue"} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] print:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card title="What David should care about first" subtitle="Short enough to read before a sync. Sharp enough to actually help.">
              {topFocus ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="border-white/80 bg-white/80 text-slate-700">{topFocus.owner}</Pill>
                      <Pill tone="border-white/80 bg-white/80 text-slate-700">{topFocus.status}</Pill>
                      <Pill tone="border-white/80 bg-white/80 text-slate-700">{topFocus.readiness}% ready</Pill>
                      <Pill tone="border-white/80 bg-white/80 text-slate-700">{topFocus.drag}% drag</Pill>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">{topFocus.name}</h2>
                    <p className="mt-3 text-sm leading-6 opacity-90"><span className="font-semibold">Next step:</span> {topFocus.nextStep}</p>
                    <p className="mt-2 text-sm leading-6 opacity-90"><span className="font-semibold">Desired outcome:</span> {topFocus.desiredOutcome || "Not written down yet."}</p>
                    <p className="mt-2 text-sm leading-6 opacity-90"><span className="font-semibold">Decision needed:</span> {topFocus.decisionNeeded || "No explicit decision logged."}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <NoteBlock title="Blocker" body={topFocus.blocker || "No hard blocker logged."} />
                    <NoteBlock title="Waiting on" body={topFocus.waitingOn || "Nobody named."} />
                  </div>
                </div>
              ) : (
                <Empty>No workstreams yet.</Empty>
              )}
            </Card>

            <Card title="Priority stack" subtitle="The three items most likely to matter next.">
              <div className="space-y-3">
                {scored.slice(0, 3).map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{index + 1}</span>
                          <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{item.nextStep}</p>
                        <p className="mt-2 text-xs text-slate-500">Owner: {item.owner} · last touched {item.ageDays}d ago · {item.energy} energy</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Pill>{item.score} pts</Pill>
                        <Pill>{item.status}</Pill>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Exact asks and risk points" subtitle="The stuff most likely to save time if named directly.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-700">Blockers to clear</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6">
                    {blocked.length ? blocked.slice(0, 4).map((item) => <li key={item.id}>• <span className="font-medium">{item.name}:</span> {item.blocker || item.waitingOn || "Blocked, but the board still owes an honest reason."}</li>) : <li>• No blocked workstreams right now.</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Stale work worth touching</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6">
                    {stale.length ? stale.slice(0, 4).map((item) => <li key={item.id}>• <span className="font-medium">{item.name}:</span> {item.ageDays} days stale. {item.nextStep}</li>) : <li>• Nothing important looks stale yet.</li>}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Decision pressure" subtitle="What needs a real call, not ambient thinking.">
              <div className="space-y-3">
                {state.decisions.length ? [...state.decisions].sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{item.topic}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{item.recommendation}</p>
                      </div>
                      <Pill tone={isPast(item.deadline) ? "border-rose-200 bg-rose-50 text-rose-700" : undefined}>{prettyDate(item.deadline)}</Pill>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Confidence {item.confidence}/10 · {item.impactArea || "General"}</p>
                  </div>
                )) : <Empty>No decisions logged yet.</Empty>}
              </div>
            </Card>

            <Card title="Best next ask" subtitle="A compact collaborator prompt pulled from profile + board pressure.">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <p className="text-sm font-semibold">{collaboratorAsk.target}</p>
                <p className="mt-3 text-sm leading-6">{collaboratorAsk.message}</p>
              </div>
            </Card>

            <Card title="Recent movement" subtitle="Latest updates, trimmed for attention span.">
              <div className="space-y-3">
                {state.updates.length ? state.updates.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
                    <p className="mt-2 text-xs text-slate-500">{prettyDate(item.createdAt)} · {item.relatedWorkstream}</p>
                  </div>
                )) : <Empty>No recent updates logged.</Empty>}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function BriefLoading() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Loading brief…</p>
      </div>
    </main>
  );
}

function loadBriefState(encodedState: string | null) {
  const shared = parseEncodedState(encodedState);
  if (shared) {
    return {
      boardName: "Shared brief",
      boardDescription: "Opened from a copyable brief link.",
      updatedAt: new Date().toISOString(),
      state: shared,
      source: "shared link",
    };
  }

  if (typeof window !== "undefined") {
    const stored = getStoredPortfolio();
    const active = stored.boards.find((board) => board.id === stored.activeBoardId) ?? stored.boards[0];
    if (active) {
      return {
        boardName: active.name,
        boardDescription: active.description,
        updatedAt: active.updatedAt,
        state: active.state,
        source: "local board",
      };
    }
  }

  return {
    boardName: "Collab Cockpit brief",
    boardDescription: "Compact summary view.",
    updatedAt: new Date().toISOString(),
    state: { workstreams: [], updates: [], decisions: [], collaboratorProfiles: [] },
    source: "empty",
  };
}

function parseEncodedState(encodedState: string | null) {
  if (!encodedState) return null;
  try {
    const decompressed = decompressFromEncodedURIComponent(encodedState);
    if (!decompressed) return null;
    const parsed = JSON.parse(decompressed) as Partial<AppState>;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

function getStoredPortfolio(): PortfolioState {
  const stored = window.localStorage.getItem(STORAGE_KEY) ?? LEGACY_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
  if (!stored) return { activeBoardId: "default", boards: [] };
  try {
    const parsed = JSON.parse(stored) as Partial<PortfolioState & AppState>;
    if (Array.isArray((parsed as PortfolioState).boards)) {
      const portfolio = parsed as PortfolioState;
      return {
        activeBoardId: portfolio.activeBoardId,
        boards: portfolio.boards.map((board) => ({ ...board, state: normalizeState(board.state) })),
      };
    }

    return {
      activeBoardId: "default",
      boards: [
        {
          id: "default",
          name: "David + Albert",
          description: "Main collaboration board",
          updatedAt: new Date().toISOString(),
          state: normalizeState(parsed),
        },
      ],
    };
  } catch {
    return { activeBoardId: "default", boards: [] };
  }
}

function normalizeState(state: Partial<AppState> | null | undefined): AppState {
  return {
    workstreams: Array.isArray(state?.workstreams) ? state!.workstreams as Workstream[] : [],
    updates: Array.isArray(state?.updates) ? state!.updates as Update[] : [],
    decisions: Array.isArray(state?.decisions) ? state!.decisions as Decision[] : [],
    collaboratorProfiles: Array.isArray(state?.collaboratorProfiles) ? state!.collaboratorProfiles as CollaboratorProfile[] : [],
  };
}

function buildCollaboratorAsk(profiles: CollaboratorProfile[], workstreams: Array<Workstream & { score: number }>) {
  const david = profiles.find((item) => item.name.toLowerCase() === "david");
  const top = workstreams[0];
  return {
    target: david?.name ?? top?.owner ?? "David",
    message: david?.nextAsk?.trim()
      || top?.decisionNeeded?.trim()
      || top?.waitingOn?.trim()
      || top?.nextStep
      || "Pick the one workstream worth pushing today and name the exact next move.",
  };
}

function buildMarkdownBrief({ boardName, boardDescription, updatedAt, health, topFocus, scored, blocked, stale, overdueDecisions, collaboratorAsk, updates }: any) {
  return [
    `# ${boardName}`,
    "",
    boardDescription,
    "",
    `Updated: ${prettyDateTime(updatedAt)}`,
    `Collab health: ${health}%`,
    "",
    "## Top focus",
    topFocus ? `- ${topFocus.name}` : "- None",
    topFocus ? `- Next step: ${topFocus.nextStep}` : "",
    topFocus ? `- Blocker: ${topFocus.blocker || "None"}` : "",
    topFocus ? `- Decision needed: ${topFocus.decisionNeeded || "None"}` : "",
    "",
    "## Priority stack",
    ...scored.slice(0, 3).map((item: any, index: number) => `${index + 1}. ${item.name} — ${item.nextStep}`),
    "",
    "## Blockers",
    ...(blocked.length ? blocked.slice(0, 4).map((item: any) => `- ${item.name}: ${item.blocker || item.waitingOn || "Blocked without a clear reason"}`) : ["- No active blockers"]),
    "",
    "## Stale work",
    ...(stale.length ? stale.slice(0, 4).map((item: any) => `- ${item.name}: ${item.ageDays} days stale`) : ["- Nothing stale"]),
    "",
    "## Overdue decisions",
    ...(overdueDecisions.length ? overdueDecisions.map((item: any) => `- ${item.topic} (${prettyDate(item.deadline)})`) : ["- None"]),
    "",
    "## Best next ask",
    `- ${collaboratorAsk.target}: ${collaboratorAsk.message}`,
    "",
    "## Recent movement",
    ...(updates.length ? updates.slice(0, 4).map((item: any) => `- ${item.title}: ${item.detail}`) : ["- No recent updates"]),
  ].filter(Boolean).join("\n");
}

function priorityScore(item: Workstream) {
  const age = Math.min(daysSince(item.lastTouched), 7);
  const blockedBonus = item.status === "blocked" ? 12 : item.status === "watch" ? 5 : 0;
  const confidencePenalty = 10 - item.confidence;
  const energyModifier = item.energy === "stuck" ? 6 : item.energy === "deep" ? 2 : 0;
  const nextStepPenalty = item.nextStep.trim().length < 24 ? 5 : 0;
  const waitingPenalty = item.waitingOn.trim() ? 4 : 0;
  const decisionPenalty = item.decisionNeeded.trim() ? 3 : 0;
  return item.impact * 3 + item.urgency * 2 + confidencePenalty + age * 2 + blockedBonus + energyModifier + nextStepPenalty + waitingPenalty + decisionPenalty;
}

function readinessScore(item: Workstream) {
  let score = 100;
  if (!item.nextStep.trim()) score -= 30;
  else if (item.nextStep.trim().length < 24) score -= 15;
  if (item.status === "blocked") score -= 25;
  if (item.blocker.trim() && item.status !== "blocked") score -= 8;
  if (daysSince(item.lastTouched) >= 3) score -= 15;
  if (item.confidence <= 4) score -= 15;
  if (item.energy === "stuck") score -= 12;
  if (!item.desiredOutcome.trim()) score -= 10;
  if (!item.waitingOn.trim() && item.status === "blocked") score -= 8;
  return clamp(score, 12, 100);
}

function collaborationDrag(item: Workstream) {
  let drag = 12;
  if (item.status === "blocked") drag += 28;
  if (item.blocker.trim()) drag += 10;
  if (item.waitingOn.trim()) drag += 12;
  if (item.decisionNeeded.trim()) drag += 10;
  if (item.nextStep.trim().length < 24) drag += 14;
  if (daysSince(item.lastTouched) >= 3) drag += 12;
  if (!item.desiredOutcome.trim()) drag += 8;
  return clamp(drag, 0, 100);
}

function collaborationHealthScore(workstreams: Array<Workstream & { readiness: number; drag: number }>, decisions: Decision[]) {
  if (!workstreams.length) return 100;
  const readinessAvg = Math.round(workstreams.reduce((sum, item) => sum + item.readiness, 0) / workstreams.length);
  const dragAvg = Math.round(workstreams.reduce((sum, item) => sum + item.drag, 0) / workstreams.length);
  const overduePenalty = Math.min(20, decisions.filter((item) => isPast(item.deadline)).length * 5);
  return clamp(readinessAvg - Math.round(dragAvg * 0.35) - overduePenalty, 18, 100);
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm print:break-inside-avoid">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>{children}</span>;
}

function NoteBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">{children}</p>;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function daysSince(isoDate: string) {
  const start = new Date(isoDate);
  if (Number.isNaN(start.getTime())) return 0;
  const diff = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function isPast(date: string) {
  if (!date) return false;
  const target = new Date(`${date}T23:59:59`);
  return target.getTime() < Date.now();
}

function prettyDate(date: string) {
  if (!date) return "No date";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(value);
}

function prettyDateTime(date: string) {
  if (!date) return "Unknown";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}
