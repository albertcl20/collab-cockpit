"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Energy = "deep" | "light" | "stuck";
type Status = "active" | "watch" | "blocked" | "done";
type UpdateType = "from-david" | "from-albert" | "decision" | "risk";
type BriefMode = "async-update" | "weekly-review" | "unblock-plan";

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

type Insight = {
  title: string;
  detail: string;
  tone: "rose" | "amber" | "blue" | "emerald";
};

const STORAGE_KEY = "collab-cockpit-v2";

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
      nextStep: "Use the async brief to lock the top 3 priorities for the week.",
      blocker: "",
      notes: "Keep this brutally short. Alignment should remove drag, not create a new ritual tax.",
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
      nextStep: "Name the riskiest assumption and decide what evidence would change the plan.",
      blocker: "Tradeoffs are scattered across chats and docs.",
      notes: "Needs clear decision hygiene, not more opinions.",
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
      nextStep: "Pressure-test one idea with real evidence instead of collecting twelve vague maybes.",
      blocker: "Kill criteria are fuzzy, so weak ideas live too long.",
      notes: "Good ideas usually die from ambiguity before they die from competition.",
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
      detail: "Two important workstreams have gone stale and still have ambiguous next actions.",
      createdAt: isoDaysAgo(0),
      relatedWorkstream: "Micro-SaaS opportunity pipeline",
    },
  ],
  decisions: [
    {
      id: cryptoId(),
      topic: "How should David and Albert collaborate asynchronously?",
      options: "1) long chat threads  2) scattered notes  3) single cockpit with scoring and crisp handoffs",
      recommendation: "Use one lightweight cockpit with clear priorities, explicit blockers, and reusable briefs.",
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
  const [briefMode, setBriefMode] = useState<BriefMode>("async-update");
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

  const scoredWorkstreams = useMemo(() => {
    return [...state.workstreams]
      .map((item) => ({
        ...item,
        score: priorityScore(item),
        ageDays: daysSince(item.lastTouched),
        readiness: readinessScore(item),
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
  const overdueDecisions = state.decisions.filter((item) => new Date(item.deadline).getTime() < Date.now()).length;

  const insights = useMemo<Insight[]>(() => buildInsights(scoredWorkstreams, state.decisions), [scoredWorkstreams, state.decisions]);

  const handoffBrief = useMemo(() => {
    return buildBrief({
      mode: briefMode,
      focusNow,
      workstreams: scoredWorkstreams,
      decisions: state.decisions,
      updates: state.updates,
    });
  }, [briefMode, focusNow, scoredWorkstreams, state.decisions, state.updates]);

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
    };

    setState((current) => ({ ...current, workstreams: [item, ...current.workstreams] }));
    setSelectedId(item.id);
  }

  function deleteWorkstream(id: string) {
    setState((current) => {
      const nextWorkstreams = current.workstreams.filter((item) => item.id !== id);
      return { ...current, workstreams: nextWorkstreams };
    });

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

  function seedDemo() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    setSelectedId(initialState.workstreams[0]?.id ?? "");
  }

  async function copyBrief() {
    await navigator.clipboard.writeText(handoffBrief);
  }

  async function copyExport() {
    await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
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
        const parsed = JSON.parse(String(reader.result)) as AppState;
        if (!Array.isArray(parsed.workstreams) || !Array.isArray(parsed.updates) || !Array.isArray(parsed.decisions)) {
          throw new Error("bad shape");
        }
        setState(parsed);
        setSelectedId(parsed.workstreams[0]?.id ?? "");
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
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                A calmer place for David and Albert to stay aligned.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Track workstreams, spot hidden collaboration drag, and generate crisp handoff briefs without turning the process into a second job.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:min-w-[520px]">
              <MetricCard label="Top focus" value={focusNow ? String(focusNow.score) : "—"} note={focusNow?.name ?? "No workstreams yet"} />
              <MetricCard label="Blocked items" value={String(blockedCount)} note={blockedCount ? "Needs unblocking" : "Clean board"} />
              <MetricCard label="Confidence" value={`${avgConfidence}%`} note={staleCount ? `${staleCount} stale item(s)` : "Fresh enough"} />
              <MetricCard label="Decision pressure" value={String(overdueDecisions)} note={overdueDecisions ? "Overdue decisions" : "Under control"} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Panel title="Friction radar" subtitle="The app calls out collaboration mess before it compounds.">
              <div className="grid gap-3 md:grid-cols-2">
                {insights.map((insight) => (
                  <div key={insight.title} className={`rounded-2xl border p-4 ${insightTone[insight.tone]}`}>
                    <div className="text-sm font-semibold">{insight.title}</div>
                    <p className="mt-1 text-sm leading-6 opacity-90">{insight.detail}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Priority stack" subtitle="Scoring favors high-impact, urgent, stale, blocked, and low-confidence work.">
              <div className="mb-4 flex flex-wrap gap-3">
                <button type="button" onClick={addWorkstream} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Add workstream
                </button>
                <button type="button" onClick={exportJson} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Export JSON
                </button>
                <button type="button" onClick={copyExport} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
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
                      <div className="flex flex-wrap gap-2 sm:max-w-[280px] sm:justify-end">
                        <Badge>{item.score} pts</Badge>
                        <Badge>{item.readiness}% ready</Badge>
                        <Badge tone={statusTone[item.status]}>{item.status}</Badge>
                        <Badge>{item.owner}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-5">
                      <MiniStat label="Impact" value={String(item.impact)} />
                      <MiniStat label="Urgency" value={String(item.urgency)} />
                      <MiniStat label="Confidence" value={String(item.confidence)} />
                      <MiniStat label="Age" value={`${item.ageDays}d`} />
                      <MiniStat label="Energy" value={item.energy} />
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Workstream editor" subtitle="Keep the next step obvious and the blocker honest.">
              {selected ? (
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div>
                      Focus score <span className="font-semibold text-slate-900">{priorityScore(selected)}</span> · readiness <span className="font-semibold text-slate-900">{readinessScore(selected)}%</span>
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
            <Panel title="Brief composer" subtitle="Three useful formats. No fluffy status novels.">
              <div className="mb-4 flex flex-wrap gap-2">
                <ModePill active={briefMode === "async-update"} onClick={() => setBriefMode("async-update")}>Async update</ModePill>
                <ModePill active={briefMode === "weekly-review"} onClick={() => setBriefMode("weekly-review")}>Weekly review</ModePill>
                <ModePill active={briefMode === "unblock-plan"} onClick={() => setBriefMode("unblock-plan")}>Unblock plan</ModePill>
              </div>
              <textarea readOnly className={`${inputClass} min-h-[320px] font-mono text-sm`} value={handoffBrief} />
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={copyBrief} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                  Copy brief
                </button>
                <button type="button" onClick={seedDemo} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Reset demo data
                </button>
              </div>
            </Panel>

            <Panel title="Decision log" subtitle="Because vague thinking gets expensive fast.">
              <div className="space-y-3">
                {state.decisions.map((decision) => {
                  const overdue = new Date(decision.deadline).getTime() < Date.now();
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

            <Panel title="Add async update" subtitle="Capture what changed without writing a novel.">
              <div className="grid gap-3">
                <Field label="Title">
                  <input className={inputClass} value={newUpdate.title} onChange={(e) => setNewUpdate((current) => ({ ...current, title: e.target.value }))} placeholder="Shipped dashboard cleanup" />
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

function priorityScore(item: Workstream) {
  const age = Math.min(daysSince(item.lastTouched), 7);
  const blockedBonus = item.status === "blocked" ? 10 : item.status === "watch" ? 4 : 0;
  const confidencePenalty = 10 - item.confidence;
  const energyModifier = item.energy === "stuck" ? 5 : item.energy === "deep" ? 2 : 0;
  const nextStepPenalty = item.nextStep.trim().length < 24 ? 4 : 0;
  return item.impact * 3 + item.urgency * 2 + confidencePenalty + age * 2 + blockedBonus + energyModifier + nextStepPenalty;
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
  return clamp(score, 12, 100);
}

function readinessLabel(readiness: number) {
  if (readiness >= 80) return "Ready to move. Low coordination drag.";
  if (readiness >= 60) return "Usable, but cleanup would make the handoff sharper.";
  if (readiness >= 40) return "Friction is building. Clarify next step or blocker.";
  return "Messy. This will waste time unless cleaned up first.";
}

function buildInsights(
  workstreams: Array<Workstream & { score: number; ageDays: number; readiness: number }>,
  decisions: Decision[]
): Insight[] {
  const staleCritical = workstreams.find((item) => item.ageDays >= 3 && item.impact >= 8);
  const unclearNextStep = workstreams.find((item) => item.nextStep.trim().length < 24);
  const blocked = workstreams.find((item) => item.status === "blocked");
  const overdueDecision = decisions
    .slice()
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .find((item) => new Date(item.deadline).getTime() < Date.now());

  return [
    staleCritical
      ? {
          title: "Stale high-impact work",
          detail: `${staleCritical.name} has gone ${staleCritical.ageDays} days without touch. That's how important work quietly rots.`,
          tone: "rose",
        }
      : {
          title: "Fresh enough",
          detail: "No high-impact workstreams are quietly decaying right now. Nice rare event.",
          tone: "emerald",
        },
    blocked
      ? {
          title: "Blocked focus",
          detail: `${blocked.name} is blocked. If the blocker is real, plan the unblock. If not, the status is lying.`,
          tone: "amber",
        }
      : {
          title: "No hard blockers",
          detail: "Nothing is officially blocked. Either the board is healthy or somebody is being optimistic.",
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
          detail: "Every workstream has a concrete-enough next step. That's already better than most teams manage.",
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

function buildBrief({
  mode,
  focusNow,
  workstreams,
  decisions,
  updates,
}: {
  mode: BriefMode;
  focusNow?: (Workstream & { score: number; ageDays: number; readiness: number }) | undefined;
  workstreams: Array<Workstream & { score: number; ageDays: number; readiness: number }>;
  decisions: Decision[];
  updates: Update[];
}) {
  const topThree = workstreams.slice(0, 3);
  const blockers = workstreams.filter((item) => item.blocker.trim());
  const overdueDecisions = decisions.filter((item) => new Date(item.deadline).getTime() < Date.now());
  const recentUpdates = updates.slice(0, 3);

  if (mode === "weekly-review") {
    return [
      "WEEKLY REVIEW",
      "",
      `Top focus next: ${focusNow?.name ?? "Nothing selected yet"}`,
      focusNow ? `Why this is first: ${whyNow(focusNow)}` : "Why this is first: Add a workstream.",
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
      ...blocked.map((item, index) => `${index + 1}. ${item.name}\n   blocker: ${item.blocker || "Not written clearly enough yet."}\n   next move: ${item.nextStep}\n   owner: ${item.owner}`),
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
    focusNow ? `Why now: ${whyNow(focusNow)}` : "Why now: Add a workstream to start.",
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

function whyNow(item: Workstream & { score?: number; ageDays?: number }) {
  const reasons = [];
  if (item.status === "blocked") reasons.push("it is actively blocked");
  if (item.urgency >= 8) reasons.push("urgency is high");
  if (item.confidence <= 6) reasons.push("confidence is still shaky");
  if ((item.ageDays ?? daysSince(item.lastTouched)) >= 3) reasons.push("it has gone stale");
  if (item.nextStep.trim().length < 24) reasons.push("the next step is still too fuzzy");
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getBootState() {
  if (typeof window === "undefined") return initialState;

  const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("collab-cockpit-v1");
  if (!stored) return initialState;

  try {
    return JSON.parse(stored) as AppState;
  } catch {
    return initialState;
  }
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";
