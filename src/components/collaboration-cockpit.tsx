"use client";

import { useEffect, useMemo, useState } from "react";

type Energy = "deep" | "light" | "stuck";
type Status = "active" | "watch" | "blocked" | "done";
type UpdateType = "from-david" | "from-albert" | "decision" | "risk";

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
};

type Update = {
  id: string;
  title: string;
  type: UpdateType;
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

type AppState = {
  workstreams: Workstream[];
  updates: Update[];
  decisions: Decision[];
};

const STORAGE_KEY = "collab-cockpit-v1";

const initialState: AppState = {
  workstreams: [
    {
      id: cryptoId(),
      name: "Weekly alignment with Albert",
      owner: "Shared",
      status: "active",
      energy: "light",
      impact: 7,
      urgency: 8,
      confidence: 8,
      lastTouched: isoDaysAgo(0),
      nextStep: "Use the handoff brief to agree on top 3 priorities for the week.",
      blocker: "",
      notes: "Keep this brutally short. The app should make alignment faster, not heavier.",
    },
    {
      id: cryptoId(),
      name: "AskCody Central product pressure points",
      owner: "David",
      status: "watch",
      energy: "deep",
      impact: 9,
      urgency: 7,
      confidence: 6,
      lastTouched: isoDaysAgo(2),
      nextStep: "Clarify the riskiest assumption before adding more scope.",
      blocker: "Tradeoffs are scattered across chats and docs.",
      notes: "This is exactly the kind of work that benefits from cleaner async handoffs.",
    },
    {
      id: cryptoId(),
      name: "Micro-SaaS opportunity pipeline",
      owner: "Albert",
      status: "blocked",
      energy: "deep",
      impact: 8,
      urgency: 6,
      confidence: 5,
      lastTouched: isoDaysAgo(5),
      nextStep: "Pressure-test one idea with evidence instead of collecting 12 shallow ones.",
      blocker: "Needs better decision hygiene and clearer kill criteria.",
      notes: "Good ideas die from fuzziness more often than lack of effort.",
    },
  ],
  updates: [
    {
      id: cryptoId(),
      title: "Need sharper async context",
      type: "from-david",
      detail: "Status updates should answer: what changed, what matters, what is blocked, and what happens next.",
      createdAt: isoDaysAgo(0),
      relatedWorkstream: "Weekly alignment with Albert",
    },
    {
      id: cryptoId(),
      title: "Decision drift detected",
      type: "risk",
      detail: "Two important workstreams have not been touched in more than 48 hours and still have ambiguous next actions.",
      createdAt: isoDaysAgo(0),
      relatedWorkstream: "Micro-SaaS opportunity pipeline",
    },
  ],
  decisions: [
    {
      id: cryptoId(),
      topic: "How should David and Albert collaborate asynchronously?",
      options: "1) long chat threads  2) scattered notes  3) single collaboration cockpit",
      recommendation: "Use one lightweight cockpit with smart prioritization, handoff briefs, and explicit blockers.",
      confidence: 8,
      deadline: isoDaysAgo(-2),
      impactArea: "Execution quality",
    },
  ],
};

const statusTone: Record<Status, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  watch: "bg-amber-50 text-amber-700 border-amber-200",
  blocked: "bg-rose-50 text-rose-700 border-rose-200",
  done: "bg-slate-100 text-slate-600 border-slate-200",
};

const typeTone: Record<UpdateType, string> = {
  "from-david": "bg-blue-50 text-blue-700 border-blue-200",
  "from-albert": "bg-violet-50 text-violet-700 border-violet-200",
  decision: "bg-emerald-50 text-emerald-700 border-emerald-200",
  risk: "bg-rose-50 text-rose-700 border-rose-200",
};

export function CollaborationCockpit() {
  const bootState = getBootState();
  const [state, setState] = useState<AppState>(bootState);
  const [selectedId, setSelectedId] = useState<string>(bootState.workstreams[0]?.id ?? "");
  const [newUpdate, setNewUpdate] = useState({ title: "", detail: "", relatedWorkstream: bootState.workstreams[0]?.name ?? "", type: "from-albert" as UpdateType });
  const [newDecision, setNewDecision] = useState({ topic: "", options: "", recommendation: "", confidence: 7, deadline: todayIso(), impactArea: "" });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const scoredWorkstreams = useMemo(() => {
    return [...state.workstreams]
      .map((item) => ({
        ...item,
        score: priorityScore(item),
        ageDays: daysSince(item.lastTouched),
      }))
      .sort((a, b) => b.score - a.score);
  }, [state.workstreams]);

  const focusNow = scoredWorkstreams[0];
  const selected = state.workstreams.find((item) => item.id === selectedId) ?? focusNow;
  const blockedCount = state.workstreams.filter((item) => item.status === "blocked").length;
  const staleCount = scoredWorkstreams.filter((item) => item.ageDays >= 3).length;
  const avgConfidence = Math.round(
    state.workstreams.reduce((sum, item) => sum + item.confidence, 0) / Math.max(state.workstreams.length, 1)
  );

  const handoffBrief = useMemo(() => {
    const topThree = scoredWorkstreams.slice(0, 3);
    const decisionsSoon = state.decisions
      .slice()
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 2);

    const lines = [
      `Top focus: ${focusNow?.name ?? "Nothing selected yet"}`,
      focusNow ? `Why now: ${whyNow(focusNow)}` : "Why now: Add a workstream to start.",
      "",
      "Priority stack:",
      ...topThree.map((item, index) => `${index + 1}. ${item.name} — ${item.nextStep}`),
      "",
      "Open blockers:",
      ...state.workstreams
        .filter((item) => item.blocker.trim())
        .map((item) => `- ${item.name}: ${item.blocker}`),
      state.workstreams.some((item) => item.blocker.trim()) ? "" : "- None right now. Suspicious, but nice if true.",
      "Decisions that need attention:",
      ...decisionsSoon.map((item) => `- ${item.topic} by ${prettyDate(item.deadline)} → ${item.recommendation}`),
    ];

    return lines.join("\n");
  }, [focusNow, scoredWorkstreams, state.decisions, state.workstreams]);

  function updateWorkstream(id: string, patch: Partial<Workstream>) {
    setState((current) => ({
      ...current,
      workstreams: current.workstreams.map((item) =>
        item.id === id ? { ...item, ...patch, lastTouched: patch.lastTouched ?? todayIso() } : item
      ),
    }));
  }

  function addUpdate() {
    if (!newUpdate.title.trim() || !newUpdate.detail.trim()) return;
    setState((current) => ({
      ...current,
      updates: [
        {
          id: cryptoId(),
          title: newUpdate.title.trim(),
          detail: newUpdate.detail.trim(),
          createdAt: todayIso(),
          relatedWorkstream: newUpdate.relatedWorkstream,
          type: newUpdate.type,
        },
        ...current.updates,
      ],
    }));
    setNewUpdate({ title: "", detail: "", relatedWorkstream: state.workstreams[0]?.name ?? "", type: "from-albert" });
  }

  function addDecision() {
    if (!newDecision.topic.trim() || !newDecision.recommendation.trim()) return;
    setState((current) => ({
      ...current,
      decisions: [
        {
          id: cryptoId(),
          topic: newDecision.topic.trim(),
          options: newDecision.options.trim(),
          recommendation: newDecision.recommendation.trim(),
          confidence: newDecision.confidence,
          deadline: newDecision.deadline,
          impactArea: newDecision.impactArea.trim() || "General",
        },
        ...current.decisions,
      ],
    }));
    setNewDecision({ topic: "", options: "", recommendation: "", confidence: 7, deadline: todayIso(), impactArea: "" });
  }

  function seedDemo() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    setSelectedId(initialState.workstreams[0]?.id ?? "");
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Collab Cockpit
              </span>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                A calmer place for David and Albert to stay aligned.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                This tool turns messy async work into a clear focus stack: what matters, what is blocked, what needs a decision, and what the exact next move is.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <MetricCard label="Focus score leader" value={focusNow ? String(focusNow.score) : "—"} note={focusNow?.name ?? "No workstreams yet"} />
              <MetricCard label="Blocked items" value={String(blockedCount)} note={blockedCount ? "Needs unblocking" : "Clean board"} />
              <MetricCard label="Confidence" value={`${avgConfidence}%`} note={staleCount ? `${staleCount} stale item(s)` : "Fresh enough"} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Panel title="Priority stack" subtitle="Smart scoring favors high-impact, urgent, low-confidence, stale, and blocked work.">
              <div className="grid gap-3">
                {scoredWorkstreams.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`rounded-2xl border p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 ${selected?.id === item.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{index + 1}</span>
                          <h3 className="text-base font-semibold">{item.name}</h3>
                        </div>
                        <p className="text-sm text-slate-600">{item.nextStep}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:max-w-[240px] sm:justify-end">
                        <Badge>{item.score} pts</Badge>
                        <Badge tone={statusTone[item.status]}>{item.status}</Badge>
                        <Badge>{item.owner}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-4">
                      <MiniStat label="Impact" value={String(item.impact)} />
                      <MiniStat label="Urgency" value={String(item.urgency)} />
                      <MiniStat label="Confidence" value={String(item.confidence)} />
                      <MiniStat label="Age" value={`${item.ageDays}d`} />
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Workstream editor" subtitle="Keep the exact next step painfully obvious.">
              {selected ? (
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Workstream name">
                      <input className={inputClass} value={selected.name} onChange={(e) => updateWorkstream(selected.id, { name: e.target.value })} />
                    </Field>
                    <Field label="Owner">
                      <input className={inputClass} value={selected.owner} onChange={(e) => updateWorkstream(selected.id, { owner: e.target.value })} />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Status">
                      <select className={inputClass} value={selected.status} onChange={(e) => updateWorkstream(selected.id, { status: e.target.value as Status })}>
                        <option value="active">active</option>
                        <option value="watch">watch</option>
                        <option value="blocked">blocked</option>
                        <option value="done">done</option>
                      </select>
                    </Field>
                    <Field label="Energy needed">
                      <select className={inputClass} value={selected.energy} onChange={(e) => updateWorkstream(selected.id, { energy: e.target.value as Energy })}>
                        <option value="deep">deep</option>
                        <option value="light">light</option>
                        <option value="stuck">stuck</option>
                      </select>
                    </Field>
                    <Field label="Last touched">
                      <input type="date" className={inputClass} value={selected.lastTouched} onChange={(e) => updateWorkstream(selected.id, { lastTouched: e.target.value })} />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Slider label={`Impact · ${selected.impact}`} value={selected.impact} onChange={(value) => updateWorkstream(selected.id, { impact: value })} />
                    <Slider label={`Urgency · ${selected.urgency}`} value={selected.urgency} onChange={(value) => updateWorkstream(selected.id, { urgency: value })} />
                    <Slider label={`Confidence · ${selected.confidence}`} value={selected.confidence} onChange={(value) => updateWorkstream(selected.id, { confidence: value })} />
                  </div>
                  <Field label="Exact next step">
                    <textarea className={`${inputClass} min-h-24`} value={selected.nextStep} onChange={(e) => updateWorkstream(selected.id, { nextStep: e.target.value })} />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Blocker">
                      <textarea className={`${inputClass} min-h-24`} value={selected.blocker} onChange={(e) => updateWorkstream(selected.id, { blocker: e.target.value })} />
                    </Field>
                    <Field label="Notes">
                      <textarea className={`${inputClass} min-h-24`} value={selected.notes} onChange={(e) => updateWorkstream(selected.id, { notes: e.target.value })} />
                    </Field>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nothing selected yet.</p>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Async handoff brief" subtitle="Copy this into chat, notes, or your own brain.">
              <textarea readOnly className={`${inputClass} min-h-[280px] font-mono text-sm`} value={handoffBrief} />
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(handoffBrief)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Copy brief
                </button>
                <button
                  type="button"
                  onClick={seedDemo}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Reset demo data
                </button>
              </div>
            </Panel>

            <Panel title="Add async update" subtitle="Capture what changed without writing a novel.">
              <div className="grid gap-3">
                <Field label="Title">
                  <input className={inputClass} value={newUpdate.title} onChange={(e) => setNewUpdate((current) => ({ ...current, title: e.target.value }))} placeholder="Shipped dashboard cleanup" />
                </Field>
                <Field label="Type">
                  <select className={inputClass} value={newUpdate.type} onChange={(e) => setNewUpdate((current) => ({ ...current, type: e.target.value as UpdateType }))}>
                    <option value="from-albert">from Albert</option>
                    <option value="from-david">from David</option>
                    <option value="decision">decision</option>
                    <option value="risk">risk</option>
                  </select>
                </Field>
                <Field label="Related workstream">
                  <input className={inputClass} value={newUpdate.relatedWorkstream} onChange={(e) => setNewUpdate((current) => ({ ...current, relatedWorkstream: e.target.value }))} />
                </Field>
                <Field label="Detail">
                  <textarea className={`${inputClass} min-h-24`} value={newUpdate.detail} onChange={(e) => setNewUpdate((current) => ({ ...current, detail: e.target.value }))} placeholder="What changed, what matters, what needs attention next." />
                </Field>
                <button type="button" onClick={addUpdate} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Save update
                </button>
              </div>
            </Panel>

            <Panel title="Decision log" subtitle="Because fuzzy thinking is expensive.">
              <div className="space-y-3">
                {state.decisions.map((decision) => (
                  <div key={decision.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{decision.topic}</h3>
                        <p className="mt-1 text-sm text-slate-600">{decision.recommendation}</p>
                      </div>
                      <Badge>{decision.confidence}/10</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <div>Deadline: {prettyDate(decision.deadline)}</div>
                      <div>Impact: {decision.impactArea}</div>
                      <div className="sm:col-span-2">Options: {decision.options || "Not written down yet."}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
                <Field label="Topic">
                  <input className={inputClass} value={newDecision.topic} onChange={(e) => setNewDecision((current) => ({ ...current, topic: e.target.value }))} />
                </Field>
                <Field label="Options">
                  <textarea className={`${inputClass} min-h-20`} value={newDecision.options} onChange={(e) => setNewDecision((current) => ({ ...current, options: e.target.value }))} />
                </Field>
                <Field label="Recommendation">
                  <textarea className={`${inputClass} min-h-24`} value={newDecision.recommendation} onChange={(e) => setNewDecision((current) => ({ ...current, recommendation: e.target.value }))} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Confidence">
                    <input type="number" min={1} max={10} className={inputClass} value={newDecision.confidence} onChange={(e) => setNewDecision((current) => ({ ...current, confidence: Number(e.target.value) }))} />
                  </Field>
                  <Field label="Deadline">
                    <input type="date" className={inputClass} value={newDecision.deadline} onChange={(e) => setNewDecision((current) => ({ ...current, deadline: e.target.value }))} />
                  </Field>
                  <Field label="Impact area">
                    <input className={inputClass} value={newDecision.impactArea} onChange={(e) => setNewDecision((current) => ({ ...current, impactArea: e.target.value }))} />
                  </Field>
                </div>
                <button type="button" onClick={addDecision} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Save decision
                </button>
              </div>
            </Panel>

            <Panel title="Recent updates" subtitle="Short, crisp, useful.">
              <div className="space-y-3">
                {state.updates.map((update) => (
                  <div key={update.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{update.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{update.detail}</p>
                      </div>
                      <Badge tone={typeTone[update.type]}>{update.type.replace("-", " ")}</Badge>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      {prettyDate(update.createdAt)} · {update.relatedWorkstream}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div>{label}</div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>{children}</span>;
}

function priorityScore(item: Workstream) {
  const age = Math.min(daysSince(item.lastTouched), 7);
  const blockedBonus = item.status === "blocked" ? 10 : item.status === "watch" ? 4 : 0;
  const confidencePenalty = 10 - item.confidence;
  const energyModifier = item.energy === "stuck" ? 5 : item.energy === "deep" ? 2 : 0;
  return item.impact * 3 + item.urgency * 2 + confidencePenalty + age * 2 + blockedBonus + energyModifier;
}

function whyNow(item: Workstream & { score?: number; ageDays?: number }) {
  const reasons = [];
  if (item.status === "blocked") reasons.push("it is actively blocked");
  if (item.urgency >= 8) reasons.push("urgency is high");
  if (item.confidence <= 6) reasons.push("confidence is still shaky");
  if ((item.ageDays ?? daysSince(item.lastTouched)) >= 3) reasons.push("it has gone stale");
  if (!reasons.length) reasons.push("it has the best combined impact-to-chaos ratio");
  return `${item.name} is on top because ${reasons.join(", ")}.`;
}

function daysSince(date: string) {
  const oneDay = 1000 * 60 * 60 * 24;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / oneDay));
}

function prettyDate(date: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function cryptoId() {
  return Math.random().toString(36).slice(2, 10);
}

function getBootState() {
  if (typeof window === "undefined") return initialState;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialState;

  try {
    return JSON.parse(stored) as AppState;
  } catch {
    return initialState;
  }
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";
