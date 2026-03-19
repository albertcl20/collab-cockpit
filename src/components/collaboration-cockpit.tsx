"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Energy = "deep" | "light" | "stuck";
type Status = "active" | "watch" | "blocked" | "done";
type UpdateType = "from-david" | "from-albert" | "decision" | "risk";
type BriefMode = "async-update" | "weekly-review" | "unblock-plan" | "alignment-agenda";
type CoachMode = "quick-sync" | "deep-work" | "async-handoff";

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

type Snapshot = {
  id: string;
  createdAt: string;
  note: string;
  health: number;
  blockedCount: number;
  staleCount: number;
  topFocus: string;
};

type AppState = {
  workstreams: Workstream[];
  updates: Update[];
  decisions: Decision[];
  snapshots: Snapshot[];
};

type ScoredWorkstream = Workstream & {
  score: number;
  ageDays: number;
  readiness: number;
  drag: number;
};

type Insight = {
  title: string;
  detail: string;
  tone: "rose" | "amber" | "blue" | "emerald";
};

type CoachCard = {
  title: string;
  detail: string;
  tone: "rose" | "amber" | "blue" | "emerald";
};

type CoachPlan = {
  mode: CoachMode;
  headline: string;
  cards: CoachCard[];
  davidMessage: string;
  albertPlan: string;
};

const STORAGE_KEY = "collab-cockpit-v4";
const LEGACY_KEYS = ["collab-cockpit-v3", "collab-cockpit-v2", "collab-cockpit-v1"];

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
      nextStep: "Use the alignment agenda to lock the top 3 priorities for the next seven days.",
      blocker: "",
      notes: "Keep this brutally short. Good collaboration should remove drag, not become another ritual.",
      waitingOn: "Nobody right now",
      desiredOutcome: "One clear focus order and one explicit unblock path.",
      decisionNeeded: "Which item deserves real attention first?",
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
      nextStep: "Name the riskiest assumption, the evidence needed, and the decision owner.",
      blocker: "Tradeoffs are scattered across chats and docs.",
      notes: "Needs sharper decision hygiene, not more opinions.",
      waitingOn: "Product context from David",
      desiredOutcome: "A decision-ready framing instead of ambient ambiguity.",
      decisionNeeded: "What evidence would actually change the plan?",
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
      nextStep: "Pressure-test one idea with real evidence and explicit kill criteria.",
      blocker: "Kill criteria are fuzzy, so weak ideas live too long.",
      notes: "Good ideas often die from ambiguity before they die from competition.",
      waitingOn: "A go/no-go bar David would respect",
      desiredOutcome: "A tighter opportunity funnel with fewer zombie ideas.",
      decisionNeeded: "Which opportunity is worth actual time this month?",
    },
  ],
  updates: [
    {
      id: cryptoId(),
      title: "Need sharper async context",
      type: "from-david",
      detail: "Updates should answer what changed, why it matters, what is blocked, and the exact next move.",
      createdAt: isoDaysAgo(0),
      relatedWorkstream: "Weekly alignment with Albert",
    },
    {
      id: cryptoId(),
      title: "Decision drift detected",
      type: "risk",
      detail: "Important workstreams are getting stale while the next actions stay too fuzzy.",
      createdAt: isoDaysAgo(0),
      relatedWorkstream: "Micro-SaaS opportunity pipeline",
    },
  ],
  decisions: [
    {
      id: cryptoId(),
      topic: "How should David and Albert collaborate asynchronously?",
      options: "1) long chat threads  2) scattered notes  3) one cockpit with scoring, agendas, and crisp handoffs",
      recommendation: "Use one lightweight cockpit with explicit blockers, explicit asks, and copy-ready outputs.",
      confidence: 8,
      deadline: isoDaysAgo(-2),
      impactArea: "Execution quality",
    },
  ],
  snapshots: [],
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

const insightTone: Record<Insight["tone"], string> = {
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function CollaborationCockpit() {
  const bootState = getBootState();
  const [state, setState] = useState<AppState>(bootState);
  const [selectedId, setSelectedId] = useState<string>(bootState.workstreams[0]?.id ?? "");
  const [briefMode, setBriefMode] = useState<BriefMode>("alignment-agenda");
  const [coachMode, setCoachMode] = useState<CoachMode>("quick-sync");
  const [snapshotNote, setSnapshotNote] = useState("");
  const [copyState, setCopyState] = useState<string>("");
  const [newUpdate, setNewUpdate] = useState({
    title: "",
    detail: "",
    relatedWorkstream: bootState.workstreams[0]?.name ?? "",
    type: "from-albert" as UpdateType,
  });
  const [newDecision, setNewDecision] = useState({
    topic: "",
    options: "",
    recommendation: "",
    confidence: 7,
    deadline: todayIso(),
    impactArea: "",
  });
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!copyState) return;
    const timer = window.setTimeout(() => setCopyState(""), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const scoredWorkstreams = useMemo<ScoredWorkstream[]>(() => {
    return [...state.workstreams]
      .map((item) => ({
        ...item,
        score: priorityScore(item),
        ageDays: daysSince(item.lastTouched),
        readiness: readinessScore(item),
        drag: collaborationDrag(item),
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
  const overdueDecisions = state.decisions.filter((item) => isPast(item.deadline)).length;
  const collaborationHealth = collaborationHealthScore(scoredWorkstreams, state.decisions);
  const agenda = buildAgenda(scoredWorkstreams, state.decisions);
  const sevenDayPlan = buildSevenDayPlan(scoredWorkstreams, state.decisions);
  const insights = useMemo(() => buildInsights(scoredWorkstreams, state.decisions), [scoredWorkstreams, state.decisions]);
  const coachPlan = useMemo(
    () => buildCoachPlan({ mode: coachMode, focusNow, selected, decisions: state.decisions, updates: state.updates }),
    [coachMode, focusNow, selected, state.decisions, state.updates]
  );
  const handoffBrief = useMemo(
    () =>
      buildBrief({
        mode: briefMode,
        focusNow,
        workstreams: scoredWorkstreams,
        decisions: state.decisions,
        updates: state.updates,
        agenda,
        sevenDayPlan,
      }),
    [briefMode, focusNow, scoredWorkstreams, state.decisions, state.updates, agenda, sevenDayPlan]
  );
  const latestSnapshot = state.snapshots[0];
  const healthDelta = latestSnapshot ? collaborationHealth - latestSnapshot.health : 0;

  function updateWorkstream(id: string, patch: Partial<Workstream>) {
    setState((current) => ({
      ...current,
      workstreams: current.workstreams.map((item) =>
        item.id === id ? { ...item, ...patch, lastTouched: patch.lastTouched ?? todayIso() } : item
      ),
    }));
  }

  function addWorkstream() {
    const item: Workstream = {
      id: cryptoId(),
      name: "New workstream",
      owner: "Shared",
      status: "watch",
      energy: "light",
      impact: 6,
      urgency: 5,
      confidence: 6,
      lastTouched: todayIso(),
      nextStep: "Write the next concrete action.",
      blocker: "",
      notes: "",
      waitingOn: "",
      desiredOutcome: "",
      decisionNeeded: "",
    };

    setState((current) => ({ ...current, workstreams: [item, ...current.workstreams] }));
    setSelectedId(item.id);
  }

  function deleteWorkstream(id: string) {
    setState((current) => ({
      ...current,
      workstreams: current.workstreams.filter((item) => item.id !== id),
      updates: current.updates.filter((item) => item.relatedWorkstream !== selected?.name),
    }));

    const fallback = state.workstreams.find((item) => item.id !== id);
    setSelectedId(fallback?.id ?? "");
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
          relatedWorkstream: newUpdate.relatedWorkstream.trim() || "General",
          type: newUpdate.type,
        },
        ...current.updates,
      ],
    }));
    setNewUpdate({
      title: "",
      detail: "",
      relatedWorkstream: state.workstreams[0]?.name ?? "",
      type: "from-albert",
    });
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
          confidence: clamp(newDecision.confidence, 1, 10),
          deadline: newDecision.deadline,
          impactArea: newDecision.impactArea.trim() || "General",
        },
        ...current.decisions,
      ],
    }));
    setNewDecision({ topic: "", options: "", recommendation: "", confidence: 7, deadline: todayIso(), impactArea: "" });
  }

  function saveSnapshot() {
    const snapshot: Snapshot = {
      id: cryptoId(),
      createdAt: new Date().toISOString(),
      note: snapshotNote.trim() || "Manual checkpoint",
      health: collaborationHealth,
      blockedCount,
      staleCount,
      topFocus: focusNow?.name ?? "No focus",
    };

    setState((current) => ({
      ...current,
      snapshots: [snapshot, ...current.snapshots].slice(0, 12),
    }));
    setSnapshotNote("");
  }

  function seedDemo() {
    window.localStorage.removeItem(STORAGE_KEY);
    LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
    setState(initialState);
    setSelectedId(initialState.workstreams[0]?.id ?? "");
    setBriefMode("alignment-agenda");
    setCoachMode("quick-sync");
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopyState(label);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collab-cockpit-${todayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    importRef.current?.click();
  }

  function importJson(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<AppState>;
        if (!Array.isArray(parsed.workstreams) || !Array.isArray(parsed.updates) || !Array.isArray(parsed.decisions)) {
          throw new Error("bad shape");
        }
        const nextState: AppState = {
          workstreams: parsed.workstreams.map(normalizeWorkstream),
          updates: parsed.updates,
          decisions: parsed.decisions,
          snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
        };
        setState(nextState);
        setSelectedId(nextState.workstreams[0]?.id ?? "");
      } catch {
        window.alert("That file is not valid Collab Cockpit JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
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
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">A lighter way for David and Albert to stay aligned.</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Prioritize work, expose collaboration drag, prep a useful agenda, and generate copy-ready handoffs without turning planning into theater.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:min-w-[560px]">
              <MetricCard label="Collab health" value={`${collaborationHealth}%`} note={healthDelta ? `${healthDelta > 0 ? "+" : ""}${healthDelta} vs last snapshot` : "No prior snapshot yet"} />
              <MetricCard label="Top focus" value={focusNow ? String(focusNow.score) : "—"} note={focusNow?.name ?? "No workstreams yet"} />
              <MetricCard label="Blocked items" value={String(blockedCount)} note={blockedCount ? "Needs a real unblock path" : "Board is clear"} />
              <MetricCard label="Decision pressure" value={String(overdueDecisions)} note={overdueDecisions ? `Overdue decisions · confidence ${avgConfidence}%` : `Nothing overdue · confidence ${avgConfidence}%`} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Panel title="Friction radar" subtitle="The app calls out coordination mess before it quietly becomes expensive.">
              <div className="grid gap-3 md:grid-cols-2">
                {insights.map((insight) => (
                  <div key={insight.title} className={`rounded-2xl border p-4 ${insightTone[insight.tone]}`}>
                    <div className="text-sm font-semibold">{insight.title}</div>
                    <p className="mt-1 text-sm leading-6 opacity-90">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Collaboration coach" subtitle="This is the smart bit. It turns board state into direct asks, better async messages, and an execution plan for Albert.">
              <div className="mb-4 flex flex-wrap gap-2">
                <ModePill active={coachMode === "quick-sync"} onClick={() => setCoachMode("quick-sync")}>Quick sync</ModePill>
                <ModePill active={coachMode === "deep-work"} onClick={() => setCoachMode("deep-work")}>Deep work</ModePill>
                <ModePill active={coachMode === "async-handoff"} onClick={() => setCoachMode("async-handoff")}>Async handoff</ModePill>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-base font-semibold text-slate-900">{coachPlan.headline}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Focused on <span className="font-medium text-slate-900">{selected?.name ?? focusNow?.name ?? "the top workstream"}</span>. The coach changes tone depending on whether the next move is a quick sync, real thinking time, or an async handoff.
                </p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {coachPlan.cards.map((card) => (
                  <div key={card.title} className={`rounded-2xl border p-4 ${insightTone[card.tone]}`}>
                    <div className="text-sm font-semibold">{card.title}</div>
                    <p className="mt-1 text-sm leading-6 opacity-90">{card.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Field label="Message David can send or react to now">
                  <textarea readOnly className={`${inputClass} min-h-44 font-mono text-sm`} value={coachPlan.davidMessage} />
                </Field>
                <Field label="Albert execution plan">
                  <textarea readOnly className={`${inputClass} min-h-44 font-mono text-sm`} value={coachPlan.albertPlan} />
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => copyText(coachPlan.davidMessage, "David note")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Copy David note
                </button>
                <button type="button" onClick={() => copyText(coachPlan.albertPlan, "Albert plan")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Copy Albert plan
                </button>
                {copyState ? <span className="self-center text-sm text-emerald-700">Copied {copyState}.</span> : null}
              </div>
            </Panel>

            <Panel title="Smart agenda" subtitle="This is the meeting prep bit. It turns the board into an actual conversation plan.">
              <div className="grid gap-3 md:grid-cols-2">
                <AgendaCard title="Open with" items={agenda.openWith} />
                <AgendaCard title="Resolve today" items={agenda.resolveToday} />
                <AgendaCard title="Clarify next" items={agenda.clarifyNext} />
                <AgendaCard title="Park for later" items={agenda.parkForLater} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => copyText(handoffBrief, "brief")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Copy selected output
                </button>
                <button type="button" onClick={() => setBriefMode("alignment-agenda")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Use agenda mode
                </button>
              </div>
            </Panel>

            <Panel title="Priority stack" subtitle="Scoring favors impact, urgency, collaboration drag, stale work, and fuzzy next steps.">
              <div className="mb-4 flex flex-wrap gap-3">
                <button type="button" onClick={addWorkstream} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Add workstream
                </button>
                <button type="button" onClick={exportJson} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Export JSON
                </button>
                <button type="button" onClick={() => copyText(JSON.stringify(state, null, 2), "JSON")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Copy JSON
                </button>
                <button type="button" onClick={triggerImport} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Import JSON
                </button>
                <input ref={importRef} type="file" accept="application/json" onChange={importJson} className="hidden" />
              </div>

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
                        <p className="text-xs text-slate-500">{readinessLabel(item.readiness)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:max-w-[300px] sm:justify-end">
                        <Badge>{item.score} pts</Badge>
                        <Badge>{item.readiness}% ready</Badge>
                        <Badge>{item.drag}% drag</Badge>
                        <Badge tone={statusTone[item.status]}>{item.status}</Badge>
                        <Badge>{item.owner}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-6">
                      <MiniStat label="Impact" value={String(item.impact)} />
                      <MiniStat label="Urgency" value={String(item.urgency)} />
                      <MiniStat label="Confidence" value={String(item.confidence)} />
                      <MiniStat label="Age" value={`${item.ageDays}d`} />
                      <MiniStat label="Energy" value={item.energy} />
                      <MiniStat label="Waiting" value={item.waitingOn.trim() ? "yes" : "no"} />
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Workstream editor" subtitle="Keep the ask clear, the blocker honest, and the desired outcome visible.">
              {selected ? (
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div>
                      Focus score <span className="font-semibold text-slate-900">{priorityScore(selected)}</span> · readiness <span className="font-semibold text-slate-900">{readinessScore(selected)}%</span> · drag <span className="font-semibold text-slate-900">{collaborationDrag(selected)}%</span>
                    </div>
                    <button type="button" onClick={() => deleteWorkstream(selected.id)} className="rounded-xl border border-rose-200 px-3 py-2 font-medium text-rose-700 transition hover:bg-rose-50">
                      Delete workstream
                    </button>
                  </div>
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
                    <Field label="Waiting on">
                      <textarea className={`${inputClass} min-h-24`} value={selected.waitingOn} onChange={(e) => updateWorkstream(selected.id, { waitingOn: e.target.value })} />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Desired outcome">
                      <textarea className={`${inputClass} min-h-24`} value={selected.desiredOutcome} onChange={(e) => updateWorkstream(selected.id, { desiredOutcome: e.target.value })} />
                    </Field>
                    <Field label="Decision needed">
                      <textarea className={`${inputClass} min-h-24`} value={selected.decisionNeeded} onChange={(e) => updateWorkstream(selected.id, { decisionNeeded: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Notes">
                    <textarea className={`${inputClass} min-h-24`} value={selected.notes} onChange={(e) => updateWorkstream(selected.id, { notes: e.target.value })} />
                  </Field>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nothing selected yet.</p>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Output studio" subtitle="Useful formats only. No fluffy status novels.">
              <div className="mb-4 flex flex-wrap gap-2">
                <ModePill active={briefMode === "alignment-agenda"} onClick={() => setBriefMode("alignment-agenda")}>Alignment agenda</ModePill>
                <ModePill active={briefMode === "async-update"} onClick={() => setBriefMode("async-update")}>Async update</ModePill>
                <ModePill active={briefMode === "weekly-review"} onClick={() => setBriefMode("weekly-review")}>Weekly review</ModePill>
                <ModePill active={briefMode === "unblock-plan"} onClick={() => setBriefMode("unblock-plan")}>Unblock plan</ModePill>
              </div>
              <textarea readOnly className={`${inputClass} min-h-[320px] font-mono text-sm`} value={handoffBrief} />
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={() => copyText(handoffBrief, "brief")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Copy output
                </button>
                <button type="button" onClick={seedDemo} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Reset demo data
                </button>
              </div>
            </Panel>

            <Panel title="7-day collaboration plan" subtitle="The app turns board state into a concrete near-term plan.">
              <div className="space-y-3">
                {sevenDayPlan.map((item, index) => (
                  <div key={`${item.day}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{item.day}</h3>
                      <Badge>{item.kind}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{item.action}</p>
                    <p className="mt-2 text-xs text-slate-500">Why: {item.why}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Snapshot trend" subtitle="Save checkpoints, then see if the collaboration system is actually getting less annoying.">
              <div className="grid gap-3">
                <Field label="Snapshot note">
                  <input className={inputClass} value={snapshotNote} onChange={(e) => setSnapshotNote(e.target.value)} placeholder="After weekly sync" />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={saveSnapshot} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                    Save snapshot
                  </button>
                  <div className="self-center text-sm text-slate-500">Latest delta: {latestSnapshot ? `${healthDelta > 0 ? "+" : ""}${healthDelta} health points` : "No baseline yet"}</div>
                </div>
                <TrendChart snapshots={state.snapshots} currentHealth={collaborationHealth} />
                <div className="space-y-3">
                  {state.snapshots.length ? (
                    state.snapshots.map((snapshot) => (
                      <div key={snapshot.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{snapshot.note}</h3>
                            <p className="text-xs text-slate-500">{prettyDateTime(snapshot.createdAt)}</p>
                          </div>
                          <Badge>{snapshot.health}% health</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                          <div>Top focus: {snapshot.topFocus}</div>
                          <div>Blocked: {snapshot.blockedCount}</div>
                          <div>Stale: {snapshot.staleCount}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No snapshots yet. Save one after a real sync and future-you can compare drift instead of guessing.</p>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Decision log" subtitle="Because vague thinking gets expensive fast.">
              <div className="space-y-3">
                {state.decisions.map((decision) => {
                  const overdue = isPast(decision.deadline);
                  return (
                    <div key={decision.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{decision.topic}</h3>
                          <p className="mt-1 text-sm text-slate-600">{decision.recommendation}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge>{decision.confidence}/10</Badge>
                          {overdue ? <Badge tone="border-rose-200 bg-rose-50 text-rose-700">overdue</Badge> : null}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        <div>Deadline: {prettyDate(decision.deadline)}</div>
                        <div>Impact: {decision.impactArea}</div>
                        <div className="sm:col-span-2">Options: {decision.options || "Not written down yet."}</div>
                      </div>
                    </div>
                  );
                })}
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

            <Panel title="Add async update" subtitle="Capture what changed without writing a novella.">
              <div className="grid gap-3">
                <Field label="Title">
                  <input className={inputClass} value={newUpdate.title} onChange={(e) => setNewUpdate((current) => ({ ...current, title: e.target.value }))} placeholder="Shipped workflow cleanup" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
                <Field label="Detail">
                  <textarea className={`${inputClass} min-h-24`} value={newUpdate.detail} onChange={(e) => setNewUpdate((current) => ({ ...current, detail: e.target.value }))} placeholder="What changed, why it matters, blocker if any, and exact next step." />
                </Field>
                <button type="button" onClick={addUpdate} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Save update
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

function AgendaCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {items.length ? items.map((item) => <li key={item}>• {item}</li>) : <li>• Nothing here right now.</li>}
      </ul>
    </div>
  );
}

function ModePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm font-medium transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
    >
      {children}
    </button>
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

function TrendChart({ snapshots, currentHealth }: { snapshots: Snapshot[]; currentHealth: number }) {
  const points = [...snapshots].slice(0, 6).reverse();
  const values = [...points.map((item) => item.health), currentHealth];
  const labels = [...points.map((item) => item.note), "Now"];

  if (values.length < 2) {
    return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Save a couple of snapshots and the trend will show up here.</p>;
  }

  const width = 320;
  const height = 120;
  const min = Math.max(0, Math.min(...values) - 8);
  const max = Math.min(100, Math.max(...values) + 8);
  const span = Math.max(1, max - min);
  const path = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-600">
        <span>Collaboration health trend</span>
        <span className="font-medium text-slate-900">{values[0]}% → {currentHealth}%</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full overflow-visible">
        <path d={path} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = (index / Math.max(values.length - 1, 1)) * width;
          const y = height - ((value - min) / span) * height;
          return <circle key={`${labels[index]}-${value}`} cx={x} cy={y} r="4" fill="#0f172a" />;
        })}
      </svg>
      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
        {labels.map((label, index) => (
          <div key={`${label}-${index}`} className="truncate">{label}: {values[index]}%</div>
        ))}
      </div>
    </div>
  );
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

function collaborationHealthScore(workstreams: ScoredWorkstream[], decisions: Decision[]) {
  if (!workstreams.length) return 100;
  const readinessAvg = Math.round(workstreams.reduce((sum, item) => sum + item.readiness, 0) / workstreams.length);
  const dragAvg = Math.round(workstreams.reduce((sum, item) => sum + item.drag, 0) / workstreams.length);
  const overduePenalty = Math.min(20, decisions.filter((item) => isPast(item.deadline)).length * 5);
  return clamp(readinessAvg - Math.round(dragAvg * 0.35) - overduePenalty, 18, 100);
}

function readinessLabel(readiness: number) {
  if (readiness >= 80) return "Ready to move. Low coordination drag.";
  if (readiness >= 60) return "Usable, but cleanup would make the handoff sharper.";
  if (readiness >= 40) return "Friction is building. Clarify next step, owner, or blocker.";
  return "Messy. This will waste time unless cleaned up first.";
}

function buildInsights(workstreams: ScoredWorkstream[], decisions: Decision[]): Insight[] {
  const staleCritical = workstreams.find((item) => item.ageDays >= 3 && item.impact >= 8);
  const draggy = workstreams.find((item) => item.drag >= 45);
  const unclearNextStep = workstreams.find((item) => item.nextStep.trim().length < 24);
  const overdueDecision = decisions.slice().sort((a, b) => a.deadline.localeCompare(b.deadline)).find((item) => isPast(item.deadline));

  return [
    staleCritical
      ? {
          title: "Stale high-impact work",
          detail: `${staleCritical.name} has gone ${staleCritical.ageDays} days without touch. That's how important work quietly rots.`,
          tone: "rose",
        }
      : {
          title: "Fresh enough",
          detail: "No high-impact workstreams are quietly decaying right now. Rare and nice.",
          tone: "emerald",
        },
    draggy
      ? {
          title: "Coordination drag",
          detail: `${draggy.name} is carrying ${draggy.drag}% collaboration drag. It probably needs a sharper owner, ask, or unblock path.`,
          tone: "amber",
        }
      : {
          title: "Low coordination tax",
          detail: "No workstream is screaming with collaboration drag right now.",
          tone: "blue",
        },
    unclearNextStep
      ? {
          title: "Ambiguous next action",
          detail: `${unclearNextStep.name} still lacks a sharp next step. Ambiguity is collaboration debt with better branding.`,
          tone: "amber",
        }
      : {
          title: "Next steps are explicit",
          detail: "Every workstream has a concrete-enough next step. Already better than most teams manage.",
          tone: "emerald",
        },
    overdueDecision
      ? {
          title: "Decision drift",
          detail: `${overdueDecision.topic} is overdue since ${prettyDate(overdueDecision.deadline)}. The cost is usually hidden until it isn't.`,
          tone: "rose",
        }
      : {
          title: "Decision hygiene ok",
          detail: "No logged decisions are overdue. Future-you says thanks.",
          tone: "blue",
        },
  ];
}

function buildAgenda(workstreams: ScoredWorkstream[], decisions: Decision[]) {
  const top = workstreams.slice(0, 2).map((item) => `${item.name} — ${whyNow(item)}`);
  const resolveToday = [
    ...workstreams.filter((item) => item.status === "blocked").slice(0, 2).map((item) => `${item.name} → unblock: ${item.blocker || "write the blocker clearly"}`),
    ...decisions.filter((item) => isPast(item.deadline)).slice(0, 2).map((item) => `${item.topic} → decide by reopening owner + due date`),
  ];
  const clarifyNext = workstreams
    .filter((item) => item.nextStep.trim().length < 40 || !item.desiredOutcome.trim() || item.waitingOn.trim())
    .slice(0, 3)
    .map((item) => `${item.name} → next: ${item.nextStep || "missing"} · waiting: ${item.waitingOn || "nobody"}`);
  const parkForLater = workstreams.filter((item) => item.status === "done" || item.urgency <= 4).slice(0, 3).map((item) => `${item.name} can wait unless context changes.`);

  return {
    openWith: top.length ? top : ["No obvious top workstream yet."],
    resolveToday: resolveToday.length ? resolveToday : ["No hard blockers or overdue decisions right now."],
    clarifyNext: clarifyNext.length ? clarifyNext : ["Nothing obviously fuzzy. Suspicious but pleasant."],
    parkForLater: parkForLater.length ? parkForLater : ["Everything on the board wants attention. That's the actual problem."],
  };
}

function buildSevenDayPlan(workstreams: ScoredWorkstream[], decisions: Decision[]) {
  const top = workstreams[0];
  const blocked = workstreams.find((item) => item.status === "blocked");
  const fuzzy = workstreams.find((item) => item.nextStep.trim().length < 40 || !item.desiredOutcome.trim());
  const overdue = decisions.find((item) => isPast(item.deadline));

  return [
    {
      day: "Day 1",
      kind: "focus",
      action: top ? `Lock the week around ${top.name} and make sure the next step survives contact with reality.` : "Add one real workstream worth focusing on.",
      why: top ? whyNow(top) : "Without a ranked board, everything is fake urgency.",
    },
    {
      day: "Day 2",
      kind: "unblock",
      action: blocked ? `Resolve ${blocked.name} by naming owner, unblock move, and fallback path.` : "Audit the board for hidden blockers that are currently pretending to be normal work.",
      why: blocked ? blocked.blocker || "The blocker is not written clearly enough yet." : "Hidden blockers are just delayed surprises.",
    },
    {
      day: "Day 3",
      kind: "clarify",
      action: fuzzy ? `Sharpen ${fuzzy.name}: define a better next step and the desired outcome.` : "Review the top two workstreams and pressure-test whether the next step is truly concrete.",
      why: fuzzy ? "Fuzzy work creates handoff waste." : "Precision now is cheaper than confusion later.",
    },
    {
      day: "Day 4",
      kind: "decision",
      action: overdue ? `Resolve overdue decision: ${overdue.topic}.` : "Review the decision log and kill or confirm anything drifting.",
      why: overdue ? `It has been overdue since ${prettyDate(overdue.deadline)}.` : "Decision drift quietly taxes execution.",
    },
  ];
}

function buildCoachPlan({
  mode,
  focusNow,
  selected,
  decisions,
  updates,
}: {
  mode: CoachMode;
  focusNow?: ScoredWorkstream;
  selected?: Workstream;
  decisions: Decision[];
  updates: Update[];
}): CoachPlan {
  const subject = selected ? { ...selected, score: priorityScore(selected), ageDays: daysSince(selected.lastTouched), readiness: readinessScore(selected), drag: collaborationDrag(selected) } : focusNow;
  const fallback = focusNow;
  const overdueDecision = decisions.find((item) => isPast(item.deadline));
  const recent = updates[0];

  if (!subject) {
    return {
      mode,
      headline: "Add one workstream first",
      cards: [{ title: "Nothing to coach yet", detail: "The board is empty. Add a real workstream and the coach will stop freeloading.", tone: "amber" }],
      davidMessage: "No workstream selected yet.",
      albertPlan: "Create one real workstream with an owner, next step, and desired outcome.",
    };
  }

  const missing = missingPieces(subject);
  const cards: CoachCard[] = [
    {
      title: subject.status === "blocked" ? "Unblock first" : "Best next move",
      detail: subject.status === "blocked"
        ? `${subject.name} is blocked. Remove the blocker or switch to a fallback instead of pretending progress is happening.`
        : `${subject.name} should move next because ${whyNow(subject)}`,
      tone: subject.status === "blocked" ? "rose" : "blue",
    },
    {
      title: "What David should answer",
      detail: subject.waitingOn.trim()
        ? `Answer the waiting dependency directly: ${subject.waitingOn}.`
        : subject.decisionNeeded.trim()
          ? `Make the decision explicit: ${subject.decisionNeeded}`
          : `Pressure-test whether this next step is still the right one for ${subject.desiredOutcome || subject.name}.`,
      tone: subject.waitingOn.trim() || subject.decisionNeeded.trim() ? "amber" : "emerald",
    },
    {
      title: "Missing info",
      detail: missing.length ? missing.join(" · ") : "The workstream is reasonably specified. Miracles do happen.",
      tone: missing.length ? "amber" : "emerald",
    },
    {
      title: "Fallback path",
      detail: fallback && fallback.id !== subject.id ? `If ${subject.name} stalls, switch to ${fallback.name}.` : "No better fallback exists yet. Clean this one up instead.",
      tone: "blue",
    },
  ];

  if (mode === "deep-work") {
    return {
      mode,
      headline: `Deep-work plan for ${subject.name}`,
      cards,
      davidMessage: [
        `DEEP WORK CHECK-IN`,
        "",
        `Focus: ${subject.name}`,
        `Desired outcome: ${subject.desiredOutcome || "Needs to be written down."}`,
        `Decision needed: ${subject.decisionNeeded || "No explicit decision logged yet."}`,
        `What I need from David: ${subject.waitingOn || subject.decisionNeeded || "A quick sanity check on whether the current approach is still right."}`,
        `Why this matters: impact ${subject.impact}/10, urgency ${subject.urgency}/10, readiness ${subject.readiness}%.`,
      ].join("\n"),
      albertPlan: [
        `ALBERT EXECUTION PLAN`,
        "",
        `1. Work only on ${subject.name}.`,
        `2. Produce something decision-ready, not just exploratory.` ,
        `3. Close these gaps first: ${missing.length ? missing.join(", ") : "none obvious"}.`,
        `4. If blocked, ask exactly one crisp question: ${subject.waitingOn || subject.decisionNeeded || "What would change the plan?"}`,
        `5. End with a concrete artifact and the next irreversible move.`,
      ].join("\n"),
    };
  }

  if (mode === "async-handoff") {
    return {
      mode,
      headline: `Async handoff for ${subject.name}`,
      cards,
      davidMessage: [
        `ASYNC HANDOFF`,
        "",
        `What changed: ${recent?.title || subject.name}`,
        `Why it matters: ${recent?.detail || subject.nextStep}`,
        `Blocked by: ${subject.blocker || "No blocker currently logged."}`,
        `Need from David: ${subject.waitingOn || subject.decisionNeeded || "Confirm the current priority order."}`,
        `Exact next move: ${subject.nextStep}`,
      ].join("\n"),
      albertPlan: [
        `ASYNC EXECUTION NOTE`,
        "",
        `Workstream: ${subject.name}`,
        `Message should stay short and answer changed / matters / blocked / next.`,
        `Do not send a long essay.`,
        `If David replies, convert it into either a clearer next step or a logged decision immediately.`,
      ].join("\n"),
    };
  }

  return {
    mode,
    headline: `Quick sync prep for ${subject.name}`,
    cards,
    davidMessage: [
      `QUICK SYNC`,
      "",
      `Top item: ${subject.name}`,
      `What needs agreement: ${subject.decisionNeeded || subject.waitingOn || "Whether the current next step is still the right one."}`,
      `Current blocker: ${subject.blocker || "No blocker logged."}`,
      `Next step if we agree: ${subject.nextStep}`,
      overdueDecision ? `Also overdue: ${overdueDecision.topic}` : "No overdue decision is yelling right now.",
    ].join("\n"),
    albertPlan: [
      `SYNC FACILITATION PLAN`,
      "",
      `Start with ${subject.name}.`,
      `Ask for one decision, not five.`,
      `Capture the answer as either waitingOn cleared, decision logged, or nextStep rewritten.`,
      `If the answer stays fuzzy, narrow it to the smallest useful choice.`,
    ].join("\n"),
  };
}

function missingPieces(item: Workstream | ScoredWorkstream) {
  const gaps: string[] = [];
  if (!item.desiredOutcome.trim()) gaps.push("desired outcome missing");
  if (!item.nextStep.trim() || item.nextStep.trim().length < 24) gaps.push("next step too vague");
  if (item.status === "blocked" && !item.waitingOn.trim()) gaps.push("blocked but nobody is named");
  if (item.blocker.trim() && item.blocker.trim().length < 16) gaps.push("blocker is under-specified");
  if (item.confidence <= 4) gaps.push("confidence is weak");
  if (daysSince(item.lastTouched) >= 3) gaps.push("stale context");
  return gaps;
}

function buildBrief({
  mode,
  focusNow,
  workstreams,
  decisions,
  updates,
  agenda,
  sevenDayPlan,
}: {
  mode: BriefMode;
  focusNow?: ScoredWorkstream;
  workstreams: ScoredWorkstream[];
  decisions: Decision[];
  updates: Update[];
  agenda: ReturnType<typeof buildAgenda>;
  sevenDayPlan: ReturnType<typeof buildSevenDayPlan>;
}) {
  const topThree = workstreams.slice(0, 3);
  const blockers = workstreams.filter((item) => item.blocker.trim());
  const overdueDecisions = decisions.filter((item) => isPast(item.deadline));
  const recentUpdates = updates.slice(0, 3);

  if (mode === "alignment-agenda") {
    return [
      "ALIGNMENT AGENDA",
      "",
      `Open with: ${focusNow?.name ?? "No top focus yet"}`,
      focusNow ? `Why this first: ${whyNow(focusNow)}` : "Why this first: add one real workstream.",
      "",
      "Resolve today:",
      ...agenda.resolveToday.map((item) => `- ${item}`),
      "",
      "Clarify next:",
      ...agenda.clarifyNext.map((item) => `- ${item}`),
      "",
      "7-day plan:",
      ...sevenDayPlan.map((item) => `- ${item.day}: ${item.action}`),
    ].join("\n");
  }

  if (mode === "weekly-review") {
    return [
      "WEEKLY REVIEW",
      "",
      `Top focus next: ${focusNow?.name ?? "Nothing selected yet"}`,
      focusNow ? `Why this is first: ${whyNow(focusNow)}` : "Why this is first: add a workstream.",
      "",
      "What moved:",
      ...recentUpdates.map((item) => `- ${item.title}: ${item.detail}`),
      recentUpdates.length ? "" : "- No recent updates logged. Suspicious.",
      "Priority stack:",
      ...topThree.map((item, index) => `${index + 1}. ${item.name} — next ${item.nextStep}`),
      "",
      "Blockers to resolve:",
      ...blockers.map((item) => `- ${item.name}: ${item.blocker}`),
      blockers.length ? "" : "- None logged.",
      "Decisions to make:",
      ...decisions.slice(0, 3).map((item) => `- ${item.topic} by ${prettyDate(item.deadline)} → ${item.recommendation}`),
    ].join("\n");
  }

  if (mode === "unblock-plan") {
    const blocked = workstreams.filter((item) => item.status === "blocked");
    return [
      "UNBLOCK PLAN",
      "",
      blocked.length ? `Blocked workstreams: ${blocked.length}` : "Blocked workstreams: 0",
      ...blocked.map((item, index) => `${index + 1}. ${item.name}\n   blocker: ${item.blocker || "Not written clearly enough yet."}\n   waiting on: ${item.waitingOn || "Nobody named yet."}\n   next move: ${item.nextStep}\n   owner: ${item.owner}`),
      blocked.length ? "" : "No blocked workstreams. Either nice, or the board is lying.",
      "Support decisions:",
      ...overdueDecisions.map((item) => `- ${item.topic} is overdue since ${prettyDate(item.deadline)}`),
      overdueDecisions.length ? "" : "- No overdue decisions.",
      focusNow ? `Fallback focus if blockers wait: ${focusNow.name}` : "Fallback focus if blockers wait: none selected",
    ].join("\n");
  }

  return [
    "ASYNC UPDATE",
    "",
    `Top focus: ${focusNow?.name ?? "Nothing selected yet"}`,
    focusNow ? `Why now: ${whyNow(focusNow)}` : "Why now: add a workstream to start.",
    "",
    "What matters now:",
    ...topThree.map((item, index) => `${index + 1}. ${item.name} — ${item.nextStep}`),
    "",
    "Open blockers:",
    ...blockers.map((item) => `- ${item.name}: ${item.blocker}`),
    blockers.length ? "" : "- None right now.",
    "Recent movement:",
    ...recentUpdates.map((item) => `- ${item.title}: ${item.detail}`),
    recentUpdates.length ? "" : "- No recent updates logged.",
    "Decisions needing attention:",
    ...decisions.slice(0, 2).map((item) => `- ${item.topic} by ${prettyDate(item.deadline)} → ${item.recommendation}`),
  ].join("\n");
}

function whyNow(item: Pick<ScoredWorkstream, "name" | "status" | "urgency" | "confidence" | "ageDays" | "nextStep">) {
  const reasons = [];
  if (item.status === "blocked") reasons.push("it is actively blocked");
  if (item.urgency >= 8) reasons.push("urgency is high");
  if (item.confidence <= 6) reasons.push("confidence is still shaky");
  if (item.ageDays >= 3) reasons.push("it has gone stale");
  if (item.nextStep.trim().length < 24) reasons.push("the next step is still too fuzzy");
  if (!reasons.length) reasons.push("it has the best impact-to-chaos ratio on the board");
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

function prettyDateTime(date: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isPast(date: string) {
  return new Date(date).getTime() < Date.now();
}

function normalizeWorkstream(workstream: Partial<Workstream>) {
  return {
    id: workstream.id ?? cryptoId(),
    name: workstream.name ?? "Untitled workstream",
    owner: workstream.owner ?? "Shared",
    status: workstream.status ?? "watch",
    energy: workstream.energy ?? "light",
    impact: clamp(workstream.impact ?? 5, 1, 10),
    urgency: clamp(workstream.urgency ?? 5, 1, 10),
    confidence: clamp(workstream.confidence ?? 5, 1, 10),
    lastTouched: workstream.lastTouched ?? todayIso(),
    nextStep: workstream.nextStep ?? "",
    blocker: workstream.blocker ?? "",
    notes: workstream.notes ?? "",
    waitingOn: workstream.waitingOn ?? "",
    desiredOutcome: workstream.desiredOutcome ?? "",
    decisionNeeded: workstream.decisionNeeded ?? "",
  } satisfies Workstream;
}

function getBootState() {
  if (typeof window === "undefined") return initialState;

  const stored = window.localStorage.getItem(STORAGE_KEY) ?? LEGACY_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
  if (!stored) return initialState;

  try {
    const parsed = JSON.parse(stored) as Partial<AppState>;
    return {
      workstreams: Array.isArray(parsed.workstreams) ? parsed.workstreams.map(normalizeWorkstream) : initialState.workstreams,
      updates: Array.isArray(parsed.updates) ? parsed.updates : initialState.updates,
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : initialState.decisions,
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
    } satisfies AppState;
  } catch {
    return initialState;
  }
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";
