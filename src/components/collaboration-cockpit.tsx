"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Energy = "deep" | "light" | "stuck";
type Status = "active" | "watch" | "blocked" | "done";
type UpdateType = "from-david" | "from-albert" | "decision" | "risk";
type BriefMode = "async-update" | "weekly-review" | "unblock-plan" | "alignment-agenda";
type CoachMode = "quick-sync" | "deep-work" | "async-handoff";
type ProtocolMode = "async" | "quick-sync" | "deep-dive" | "decision-review" | "park";

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

type DecisionSprint = {
  id: string;
  topic: string;
  workstreamName: string;
  urgency: "high" | "medium" | "low";
  score: number;
  confidenceGap: number;
  daysLeft: number;
  owner: string;
  whyNow: string;
  evidenceNeeded: string;
  exactQuestion: string;
  preRead: string;
  recommendation: string;
  killCriteria: string;
  sprintPlan: string;
  memo: string;
};

type OverlapRadarItem = {
  id: string;
  leftName: string;
  rightName: string;
  score: number;
  severity: "high" | "medium" | "low";
  sharedSignals: string[];
  collisionRisk: string;
  consolidationMove: string;
  keepTogether: string;
  copyBlock: string;
};

type OverlapRadar = {
  items: OverlapRadarItem[];
  headline: string;
  hiddenWorkCount: number;
  copyBlock: string;
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

type Budget = {
  deepHours: number;
  lightHours: number;
  syncMinutes: number;
};

type BudgetAllocation = {
  workstreamName: string;
  lane: "deep" | "light" | "sync";
  hours: number;
  minutes: number;
  verdict: "commit" | "stretch" | "defer";
  reason: string;
  nextMove: string;
};

type BudgetPlan = {
  summary: string;
  overload: boolean;
  deepUsed: number;
  lightUsed: number;
  syncUsed: number;
  commit: BudgetAllocation[];
  stretch: BudgetAllocation[];
  defer: BudgetAllocation[];
  contract: string;
};

type RitualCadenceItem = {
  id: string;
  dayLabel: string;
  title: string;
  mode: "async" | "sync" | "focus";
  durationMinutes: number;
  trigger: string;
  purpose: string;
  output: string;
};

type RitualCadencePlan = {
  items: RitualCadenceItem[];
  syncMinutes: number;
  asyncCount: number;
  focusCount: number;
  headline: string;
  operatingSystem: string;
};

type CalendarExportItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  category: "commitment" | "decision" | "ritual";
  detail: string;
};

type CalendarExportPlan = {
  items: CalendarExportItem[];
  headline: string;
  ics: string;
};

type InterventionSimulation = {
  id: string;
  title: string;
  premise: string;
  deltaHealth: number;
  deltaBlocked: number;
  deltaDeep: number;
  deltaSync: number;
  nextFocus: string;
  summary: string;
  exactMove: string;
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

type ProtocolRecommendation = {
  id: string;
  workstreamName: string;
  mode: ProtocolMode;
  minutes: number;
  reason: string;
  prep: string;
  output: string;
  urgencyLabel: string;
};

type HandoffDoctor = {
  score: number;
  verdict: string;
  extracted: {
    changed: string;
    matters: string;
    blocked: string;
    next: string;
  };
  missing: string[];
  strengths: string[];
  rewrite: string;
};

type NudgeItem = {
  id: string;
  workstreamName: string;
  target: string;
  reason: string;
  urgency: "high" | "medium" | "low";
  timing: string;
  sendBy: string;
  message: string;
};

type CommitmentLane = "due-now" | "this-week" | "waiting" | "stable";

type CommitmentPulseItem = {
  id: string;
  source: "workstream" | "decision";
  title: string;
  owner: string;
  lane: CommitmentLane;
  dueDate: string;
  dueLabel: string;
  risk: number;
  reason: string;
  promise: string;
  followUp: string;
  escalation: string;
};

type CommitmentPulse = {
  items: CommitmentPulseItem[];
  dueNowCount: number;
  thisWeekCount: number;
  waitingCount: number;
  ownerLoad: string;
  headline: string;
  copyBlock: string;
};

type CollaboratorBrief = {
  name: string;
  score: number;
  ownedCount: number;
  waitingCount: number;
  blockedCount: number;
  staleCount: number;
  workstreams: string[];
  risk: string;
  ask: string;
  nextMove: string;
  message: string;
};

type CollaboratorMap = {
  briefs: CollaboratorBrief[];
  headline: string;
  copyBlock: string;
  overloadedCount: number;
  bottleneckCount: number;
};

type CollaboratorPrepPack = {
  collaborator: string;
  headline: string;
  temperature: "steady" | "warm" | "hot";
  workstreams: string[];
  openWith: string;
  appreciate: string;
  pressure: string;
  ask: string;
  agenda: string[];
  watchouts: string[];
  followThrough: string[];
  note: string;
  copyBlock: string;
};

type CollaborationRetroItem = {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  systemFix: string;
  experiment: string;
};

type CollaborationRetro = {
  score: number;
  headline: string;
  strongestSignal: string;
  items: CollaborationRetroItem[];
  working: string[];
  experimentPlan: string;
  copyBlock: string;
};

type InboxDistiller = {
  score: number;
  verdict: string;
  workstreamName: string;
  signals: string[];
  suggestedPatch: {
    status: Status;
    energy: Energy;
    impact: number;
    urgency: number;
    confidence: number;
    nextStep: string;
    blocker: string;
    waitingOn: string;
    desiredOutcome: string;
    decisionNeeded: string;
    notes: string;
  };
  updateTitle: string;
  updateDetail: string;
  decisionSuggestion: string;
  ask: string;
  cleanedBrief: string;
};

type TranscriptAction = {
  id: string;
  owner: string;
  task: string;
  due: string;
  urgency: "high" | "medium" | "low";
  workstreamName: string;
  why: string;
};

type TranscriptDecisionItem = {
  id: string;
  topic: string;
  owner: string;
  due: string;
  recommendation: string;
  impactArea: string;
};

type ConversationDigest = {
  score: number;
  summary: string;
  nextSync: string;
  actions: TranscriptAction[];
  decisions: TranscriptDecisionItem[];
  update: string;
  createdWorkstream: Omit<Workstream, "id">;
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

const protocolTone: Record<ProtocolMode, string> = {
  async: "border-blue-200 bg-blue-50 text-blue-800",
  "quick-sync": "border-violet-200 bg-violet-50 text-violet-800",
  "deep-dive": "border-amber-200 bg-amber-50 text-amber-800",
  "decision-review": "border-rose-200 bg-rose-50 text-rose-800",
  park: "border-slate-200 bg-slate-50 text-slate-700",
};

const insightTone: Record<Insight["tone"], string> = {
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const nudgeTone: Record<NudgeItem["urgency"], string> = {
  high: "border-rose-200 bg-rose-50 text-rose-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const commitmentTone: Record<CommitmentLane, string> = {
  "due-now": "border-rose-200 bg-rose-50 text-rose-900",
  "this-week": "border-amber-200 bg-amber-50 text-amber-900",
  waiting: "border-blue-200 bg-blue-50 text-blue-900",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

export function CollaborationCockpit() {
  const bootState = getBootState();
  const [state, setState] = useState<AppState>(bootState);
  const [selectedId, setSelectedId] = useState<string>(bootState.workstreams[0]?.id ?? "");
  const [briefMode, setBriefMode] = useState<BriefMode>("alignment-agenda");
  const [coachMode, setCoachMode] = useState<CoachMode>("quick-sync");
  const [selectedCollaborator, setSelectedCollaborator] = useState("David");
  const [snapshotNote, setSnapshotNote] = useState("");
  const [copyState, setCopyState] = useState<string>("");
  const [budget, setBudget] = useState<Budget>({ deepHours: 6, lightHours: 4, syncMinutes: 45 });
  const [inboxDraft, setInboxDraft] = useState(
    "David: Central onboarding is still fuzzy because the tenant-level auth edge cases keep spilling across docs. I need one decision on whether we optimize for the happy path first or spend the week on exception handling. No hard blocker, but I do need David to confirm the decision bar. Next I can turn that into a sharper recommendation and updated plan."
  );
  const [handoffDraft, setHandoffDraft] = useState(
    "Shipped a smarter collaboration coach in Collab Cockpit. It matters because the next sync can start from a sharper plan instead of improvising. No blocker right now. Next I'll test the live deployment and verify the login flow still behaves."
  );
  const [transcriptDraft, setTranscriptDraft] = useState(
    "David: Central onboarding is still muddy because auth exceptions keep leaking across docs. Albert: I can turn this into a tighter recommendation today, but I need David to confirm whether we optimize the happy path first. David: Yes, prioritize the happy path and write down the kill criteria for exception handling by Monday. Albert: Got it. I'll update the workstream, log the decision, and send a crisp async note after the draft is ready."
  );
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
  const protocolPlanner = useMemo(() => buildProtocolPlanner(scoredWorkstreams, state.decisions), [scoredWorkstreams, state.decisions]);
  const nudgeQueue = useMemo(() => buildNudgeQueue(scoredWorkstreams, state.decisions), [scoredWorkstreams, state.decisions]);
  const commitmentPulse = useMemo(() => buildCommitmentPulse(scoredWorkstreams, state.decisions), [scoredWorkstreams, state.decisions]);
  const collaboratorMap = useMemo(() => buildCollaboratorMap(scoredWorkstreams, state.decisions), [scoredWorkstreams, state.decisions]);
  const collaboratorPrepPack = useMemo(
    () => buildCollaboratorPrepPack({ briefs: collaboratorMap.briefs, workstreams: scoredWorkstreams, decisions: state.decisions, collaborator: selectedCollaborator }),
    [collaboratorMap.briefs, scoredWorkstreams, state.decisions, selectedCollaborator]
  );
  const collaborationRetro = useMemo(
    () => buildCollaborationRetro({ workstreams: scoredWorkstreams, decisions: state.decisions, snapshots: state.snapshots, collaboratorMap }),
    [scoredWorkstreams, state.decisions, state.snapshots, collaboratorMap]
  );
  const decisionSprint = useMemo(() => buildDecisionSprint(scoredWorkstreams, state.decisions), [scoredWorkstreams, state.decisions]);
  const overlapRadar = useMemo(() => buildOverlapRadar(scoredWorkstreams), [scoredWorkstreams]);
  const budgetPlan = useMemo(() => buildBudgetPlan(scoredWorkstreams, budget), [scoredWorkstreams, budget]);
  const ritualCadence = useMemo(
    () => buildRitualCadence({ workstreams: scoredWorkstreams, decisions: state.decisions, budget, blockedCount, staleCount }),
    [scoredWorkstreams, state.decisions, budget, blockedCount, staleCount]
  );
  const calendarPlan = useMemo(
    () => buildCalendarExportPlan({ workstreams: scoredWorkstreams, decisions: state.decisions, cadence: ritualCadence }),
    [scoredWorkstreams, state.decisions, ritualCadence]
  );
  const interventionSimulations = useMemo(
    () => buildInterventionSimulations({ workstreams: state.workstreams, decisions: state.decisions, budget }),
    [state.workstreams, state.decisions, budget]
  );
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
  const handoffDoctor = useMemo(
    () => analyzeHandoffDraft({ draft: handoffDraft, focusNow, selected }),
    [handoffDraft, focusNow, selected]
  );
  const inboxDistiller = useMemo(
    () => distillInboxDraft({ draft: inboxDraft, selected, focusNow }),
    [inboxDraft, selected, focusNow]
  );
  const conversationDigest = useMemo(
    () => analyzeConversationTranscript({ draft: transcriptDraft, selected, focusNow }),
    [transcriptDraft, selected, focusNow]
  );
  const latestSnapshot = state.snapshots[0];
  const healthDelta = latestSnapshot ? collaborationHealth - latestSnapshot.health : 0;

  useEffect(() => {
    if (!collaboratorMap.briefs.length) return;
    if (collaboratorMap.briefs.some((item) => item.name === selectedCollaborator)) return;
    setSelectedCollaborator(collaboratorMap.briefs[0]?.name ?? "David");
  }, [collaboratorMap.briefs, selectedCollaborator]);

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

  function applyConversationDigest() {
    const created = { ...conversationDigest.createdWorkstream, id: cryptoId() };
    setState((current) => ({
      ...current,
      workstreams: [created, ...current.workstreams],
      updates: [
        {
          id: cryptoId(),
          title: `Transcript digest · ${conversationDigest.createdWorkstream.name}`,
          detail: conversationDigest.update,
          createdAt: todayIso(),
          relatedWorkstream: conversationDigest.createdWorkstream.name,
          type: "from-albert",
        },
        ...current.updates,
      ],
      decisions: [
        ...conversationDigest.decisions.map((item) => ({
          id: cryptoId(),
          topic: item.topic,
          options: `Owner: ${item.owner}`,
          recommendation: item.recommendation,
          confidence: 7,
          deadline: item.due,
          impactArea: item.impactArea,
        })),
        ...current.decisions,
      ],
    }));
    setSelectedId(created.id);
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

  function downloadCalendar() {
    const blob = new Blob([calendarPlan.ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collab-cockpit-calendar-${todayIso()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
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

            <Panel title="Protocol planner" subtitle="Turns the board into a sane collaboration plan instead of defaulting everything into meetings.">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard label="Sync minutes" value={String(protocolPlanner.syncMinutes)} note={protocolPlanner.syncMinutes ? "Time that actually deserves live conversation" : "No live sync required right now"} />
                  <MetricCard label="Async-first items" value={String(protocolPlanner.asyncCount)} note={protocolPlanner.asyncCount ? "Cheaper to handle without a meeting" : "Nothing safely async"} />
                  <MetricCard label="Decision reviews" value={String(protocolPlanner.decisionCount)} note={protocolPlanner.decisionCount ? "Needs a real call or crisp decision pass" : "No decision reviews screaming"} />
                  <MetricCard label="Deep dives" value={String(protocolPlanner.deepDiveCount)} note={protocolPlanner.deepDiveCount ? "Protect thinking time for these" : "No heavy thinking blocks required"} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Recommended run of show</h3>
                      <p className="mt-1 text-sm text-slate-600">{protocolPlanner.headline}</p>
                    </div>
                    <button type="button" onClick={() => copyText(protocolPlanner.copyBlock, "protocol plan")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      Copy protocol plan
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {protocolPlanner.recommendations.map((item) => (
                      <div key={item.id} className={`rounded-2xl border p-4 ${protocolTone[item.mode]}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold">{item.workstreamName}</h4>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-80">{item.mode.replace('-', ' ')} · {item.minutes} min · {item.urgencyLabel}</p>
                          </div>
                          <Badge tone="border-white/70 bg-white/70 text-slate-700">{item.mode.replace('-', ' ')}</Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 opacity-90">{item.reason}</p>
                        <div className="mt-3 space-y-2 text-sm opacity-90">
                          <p><span className="font-medium">Prep:</span> {item.prep}</p>
                          <p><span className="font-medium">Expected output:</span> {item.output}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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

            <Panel title="Nudge queue" subtitle="Turns stale dependencies and fuzzy waiting states into concrete follow-ups instead of hopeful silence.">
              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <MetricCard label="Follow-ups queued" value={String(nudgeQueue.items.length)} note={nudgeQueue.items.length ? "Live pings worth sending" : "Nothing needs chasing right now"} />
                <MetricCard label="Send today" value={String(nudgeQueue.todayCount)} note={nudgeQueue.todayCount ? "Do these before they go stale" : "No same-day pressure"} />
                <MetricCard label="High urgency" value={String(nudgeQueue.highCount)} note={nudgeQueue.highCount ? "These are slowing real work" : "No screaming fires"} />
                <MetricCard label="Overdue decisions" value={String(nudgeQueue.decisionCount)} note={nudgeQueue.decisionCount ? "Some nudges are really decision nudges" : "No decision chasing needed"} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Suggested follow-up rhythm</h3>
                    <p className="mt-1 text-sm text-slate-600">{nudgeQueue.headline}</p>
                  </div>
                  <button type="button" onClick={() => copyText(nudgeQueue.copyBlock, "nudge queue")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                    Copy nudge queue
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {nudgeQueue.items.length ? nudgeQueue.items.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 ${nudgeTone[item.urgency]}`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{item.workstreamName}</h3>
                          <Badge tone="border-white/70 bg-white/70 text-slate-700">{item.urgency} urgency</Badge>
                          <Badge tone="border-white/70 bg-white/70 text-slate-700">send {item.timing}</Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 opacity-90">{item.reason}</p>
                        <div className="mt-3 grid gap-1 text-sm opacity-90">
                          <p><span className="font-medium">Target:</span> {item.target}</p>
                          <p><span className="font-medium">Send by:</span> {item.sendBy}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => copyText(item.message, `${item.workstreamName} nudge`)} className="rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
                        Copy message
                      </button>
                    </div>
                    <textarea readOnly className={`${inputClass} mt-4 min-h-28 bg-white/80 font-mono text-sm`} value={item.message} />
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">No active nudges. Either collaboration is unusually clean or the board is under-reporting pain.</p>}
              </div>
            </Panel>

            <Panel title="Commitment pulse" subtitle="Turns promises and decision debt into a visible short-horizon execution board, so nothing important quietly expires in chat. ">
              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <MetricCard label="Due now" value={String(commitmentPulse.dueNowCount)} note={commitmentPulse.dueNowCount ? "Needs same-day attention" : "No same-day commitments"} />
                <MetricCard label="This week" value={String(commitmentPulse.thisWeekCount)} note={commitmentPulse.thisWeekCount ? "Worth scheduling explicitly" : "No medium-horizon pressure"} />
                <MetricCard label="Waiting" value={String(commitmentPulse.waitingCount)} note={commitmentPulse.waitingCount ? "Blocked by replies or decisions" : "Not trapped in dependency limbo"} />
                <MetricCard label="Owner load" value={commitmentPulse.ownerLoad} note={commitmentPulse.headline} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">72-hour commitment readout</h3>
                    <p className="mt-1 text-sm text-slate-600">{commitmentPulse.headline}</p>
                  </div>
                  <button type="button" onClick={() => copyText(commitmentPulse.copyBlock, "commitment pulse")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                    Copy commitment pulse
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {commitmentPulse.items.length ? commitmentPulse.items.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 ${commitmentTone[item.lane]}`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{item.title}</h3>
                          <Badge tone="border-white/70 bg-white/70 text-slate-700">{item.source}</Badge>
                          <Badge tone="border-white/70 bg-white/70 text-slate-700">risk {item.risk}</Badge>
                          <Badge tone="border-white/70 bg-white/70 text-slate-700">{item.dueLabel}</Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 opacity-90">{item.reason}</p>
                        <div className="mt-3 grid gap-1 text-sm opacity-90">
                          <p><span className="font-medium">Owner:</span> {item.owner}</p>
                          <p><span className="font-medium">Promise:</span> {item.promise}</p>
                          <p><span className="font-medium">Escalation if no movement:</span> {item.escalation}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => copyText(item.followUp, `${item.title} follow-up`)} className="rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
                        Copy follow-up
                      </button>
                    </div>
                    <textarea readOnly className={`${inputClass} mt-4 min-h-28 bg-white/80 font-mono text-sm`} value={item.followUp} />
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">No commitments under stress right now. Either the board is clean or it is hiding the truth unusually well.</p>}
              </div>
            </Panel>

            <Panel title="Collaborator map" subtitle="Shows who is becoming a bottleneck, who is carrying too much, and what exact message would move the work.">
              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <MetricCard label="People tracked" value={String(collaboratorMap.briefs.length)} note={collaboratorMap.briefs.length ? "Owners and dependencies pulled from the board" : "Need named owners or waiting states first"} />
                <MetricCard label="Overloaded" value={String(collaboratorMap.overloadedCount)} note={collaboratorMap.overloadedCount ? "More than two active items or too much drag" : "No obvious load imbalance"} />
                <MetricCard label="Bottlenecks" value={String(collaboratorMap.bottleneckCount)} note={collaboratorMap.bottleneckCount ? "People currently blocking meaningful work" : "No single person is jamming the board"} />
                <MetricCard label="Top pressure" value={collaboratorMap.briefs[0] ? `${collaboratorMap.briefs[0].score}` : "—"} note={collaboratorMap.briefs[0] ? collaboratorMap.briefs[0].name : "No collaborator pressure yet"} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Relationship pressure summary</h3>
                    <p className="mt-1 text-sm text-slate-600">{collaboratorMap.headline}</p>
                  </div>
                  <button type="button" onClick={() => copyText(collaboratorMap.copyBlock, "collaborator map")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                    Copy collaborator map
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {collaboratorMap.briefs.length ? collaboratorMap.briefs.map((person) => (
                  <div key={person.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{person.name}</h3>
                          <Badge>{person.score} pressure</Badge>
                          <Badge>{person.ownedCount} owned</Badge>
                          <Badge>{person.waitingCount} dependencies</Badge>
                          <Badge>{person.blockedCount} blocked</Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{person.risk}</p>
                      </div>
                      <button type="button" onClick={() => copyText(person.message, `${person.name} collaborator brief`)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                        Copy message
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        <MiniStat label="Owns" value={String(person.ownedCount)} />
                        <MiniStat label="Waiting on" value={String(person.waitingCount)} />
                        <MiniStat label="Stale items" value={String(person.staleCount)} />
                      </div>
                      <div className="space-y-3 text-sm text-slate-700">
                        <p><span className="font-medium text-slate-900">Workstreams:</span> {person.workstreams.join(" · ")}</p>
                        <p><span className="font-medium text-slate-900">Ask now:</span> {person.ask}</p>
                        <p><span className="font-medium text-slate-900">Next move:</span> {person.nextMove}</p>
                      </div>
                    </div>
                    <textarea readOnly className={`${inputClass} mt-4 min-h-28 bg-white font-mono text-sm`} value={person.message} />
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Name owners or waiting dependencies and this panel will start acting less like a guess.</p>}
              </div>
            </Panel>

            <Panel title="1:1 prep pack" subtitle="Turns collaborator pressure into a calm, specific conversation plan so David can walk into a sync already knowing the opening, ask, and follow-through.">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr_1.1fr_1.1fr]">
                  <Field label="Collaborator">
                    <select className={inputClass} value={selectedCollaborator} onChange={(e) => setSelectedCollaborator(e.target.value)}>
                      {collaboratorMap.briefs.map((person) => (
                        <option key={person.name} value={person.name}>{person.name}</option>
                      ))}
                    </select>
                  </Field>
                  <MetricCard label="Temperature" value={collaboratorPrepPack.temperature} note={collaboratorPrepPack.headline} />
                  <MetricCard label="Workstreams" value={String(collaboratorPrepPack.workstreams.length)} note={collaboratorPrepPack.workstreams.join(" · ") || "No linked workstreams yet"} />
                  <MetricCard label="Watchouts" value={String(collaboratorPrepPack.watchouts.length)} note={collaboratorPrepPack.watchouts[0] ?? "No obvious watchout"} />
                </div>

                <div className={`rounded-2xl border p-4 ${collaboratorPrepPack.temperature === "hot" ? "border-rose-200 bg-rose-50 text-rose-900" : collaboratorPrepPack.temperature === "warm" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Opening move for {collaboratorPrepPack.collaborator}</p>
                      <p className="mt-2 text-sm leading-6 opacity-90">{collaboratorPrepPack.openWith}</p>
                    </div>
                    <button type="button" onClick={() => copyText(collaboratorPrepPack.copyBlock, `${collaboratorPrepPack.collaborator} prep pack`)} className="rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
                      Copy prep pack
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">What to say in the room</p>
                      <div className="mt-3 grid gap-3 text-sm text-slate-700">
                        <p><span className="font-medium text-slate-900">Appreciate:</span> {collaboratorPrepPack.appreciate}</p>
                        <p><span className="font-medium text-slate-900">Pressure to name:</span> {collaboratorPrepPack.pressure}</p>
                        <p><span className="font-medium text-slate-900">Ask directly:</span> {collaboratorPrepPack.ask}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Agenda</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {collaboratorPrepPack.agenda.map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Watchouts</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {collaboratorPrepPack.watchouts.map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Follow-through</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {collaboratorPrepPack.followThrough.map((item) => <li key={item}>• {item}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                <Field label="Copy-ready note">
                  <textarea readOnly className={`${inputClass} min-h-60 font-mono text-sm`} value={collaboratorPrepPack.note} />
                </Field>
              </div>
            </Panel>

            <Panel title="Attention budget" subtitle="Makes the weekly plan fit reality. Good collaboration dies when the board promises more than the calendar can carry.">
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label={`Deep work hours · ${budget.deepHours}`}>
                    <input type="range" min={0} max={20} value={budget.deepHours} onChange={(e) => setBudget((current) => ({ ...current, deepHours: Number(e.target.value) }))} />
                  </Field>
                  <Field label={`Light work hours · ${budget.lightHours}`}>
                    <input type="range" min={0} max={20} value={budget.lightHours} onChange={(e) => setBudget((current) => ({ ...current, lightHours: Number(e.target.value) }))} />
                  </Field>
                  <Field label={`Sync minutes · ${budget.syncMinutes}`}>
                    <input type="range" min={0} max={180} step={5} value={budget.syncMinutes} onChange={(e) => setBudget((current) => ({ ...current, syncMinutes: Number(e.target.value) }))} />
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard label="Deep used" value={`${budgetPlan.deepUsed}h`} note={`${budget.deepHours}h available`} />
                  <MetricCard label="Light used" value={`${budgetPlan.lightUsed}h`} note={`${budget.lightHours}h available`} />
                  <MetricCard label="Sync used" value={`${budgetPlan.syncUsed}m`} note={`${budget.syncMinutes}m available`} />
                  <MetricCard label="Plan status" value={budgetPlan.overload ? "Overloaded" : "Fits"} note={budgetPlan.summary} />
                </div>
                <div className={`rounded-2xl border p-4 ${budgetPlan.overload ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
                  <h3 className="text-base font-semibold">Capacity verdict</h3>
                  <p className="mt-2 text-sm leading-6 opacity-90">{budgetPlan.summary}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <BudgetColumn title="Commit" items={budgetPlan.commit} empty="No work made the commit lane yet." />
                  <BudgetColumn title="Stretch" items={budgetPlan.stretch} empty="Nothing sitting in stretch." />
                  <BudgetColumn title="Defer" items={budgetPlan.defer} empty="Nothing to defer. Either the scope is clean or the board is still lying." />
                </div>
                <Field label="Copy-ready collaboration contract">
                  <textarea readOnly className={`${inputClass} min-h-64 font-mono text-sm`} value={budgetPlan.contract} />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => copyText(budgetPlan.contract, "budget contract")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                    Copy budget contract
                  </button>
                </div>
              </div>
            </Panel>

            <Panel title="Operating cadence" subtitle="Builds a sane weekly collaboration rhythm from the board instead of defaulting to random pings and accidental meetings.">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard label="Rituals" value={String(ritualCadence.items.length)} note={ritualCadence.headline} />
                  <MetricCard label="Sync load" value={`${ritualCadence.syncMinutes}m`} note={`${budget.syncMinutes}m weekly sync budget`} />
                  <MetricCard label="Async blocks" value={String(ritualCadence.asyncCount)} note={ritualCadence.asyncCount ? "Default to async unless the board earns a meeting" : "Everything is trying to become a meeting"} />
                  <MetricCard label="Focus rituals" value={String(ritualCadence.focusCount)} note={ritualCadence.focusCount ? "Protected thinking still gets a seat at the table" : "No real focus ritual scheduled"} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Recommended operating system</h3>
                      <p className="mt-1 text-sm text-slate-600">{ritualCadence.headline}</p>
                    </div>
                    <button type="button" onClick={() => copyText(ritualCadence.operatingSystem, "operating cadence")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      Copy cadence
                    </button>
                  </div>
                  <textarea readOnly className={`${inputClass} mt-4 min-h-60 bg-white font-mono text-sm`} value={ritualCadence.operatingSystem} />
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {ritualCadence.items.map((item) => (
                    <div key={item.id} className={`rounded-2xl border p-4 ${item.mode === "sync" ? "border-violet-200 bg-violet-50 text-violet-900" : item.mode === "focus" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold">{item.dayLabel} · {item.title}</h3>
                          <p className="mt-1 text-sm opacity-90">{item.purpose}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="border-white/80 bg-white/80 text-slate-700">{item.mode}</Badge>
                          <Badge tone="border-white/80 bg-white/80 text-slate-700">{item.durationMinutes} min</Badge>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm opacity-95">
                        <p><span className="font-medium">Trigger:</span> {item.trigger}</p>
                        <p><span className="font-medium">Output:</span> {item.output}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Calendar export" subtitle="Turns the board into real calendar blocks and decision checkpoints, so the week stops living entirely in good intentions.">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard label="Calendar blocks" value={String(calendarPlan.items.length)} note={calendarPlan.headline} />
                  <MetricCard label="Commitments" value={String(calendarPlan.items.filter((item) => item.category === "commitment").length)} note="Execution blocks worth scheduling" />
                  <MetricCard label="Decisions" value={String(calendarPlan.items.filter((item) => item.category === "decision").length)} note="Short review moments that should not stay fuzzy" />
                  <MetricCard label="Rituals" value={String(calendarPlan.items.filter((item) => item.category === "ritual").length)} note="Weekly operating rhythm, translated into time" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Calendar-ready plan</h3>
                      <p className="mt-1 text-sm text-slate-600">{calendarPlan.headline}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={downloadCalendar} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                        Download .ics
                      </button>
                      <button type="button" onClick={() => copyText(calendarPlan.ics, "calendar file")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                        Copy .ics
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {calendarPlan.items.map((item) => (
                    <div key={item.id} className={`rounded-2xl border p-4 ${item.category === "commitment" ? "border-blue-200 bg-blue-50 text-blue-900" : item.category === "decision" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold">{item.title}</h3>
                          <p className="mt-1 text-sm opacity-90">{calendarWindowLabel(item.start, item.end)}</p>
                        </div>
                        <Badge tone="border-white/80 bg-white/80 text-slate-700">{item.category}</Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 opacity-90">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="What-if simulator" subtitle="Pressure-tests the next move before you spend real time on it. This is the anti-thrash panel.">
              <div className="grid gap-3 lg:grid-cols-2">
                {interventionSimulations.map((simulation) => (
                  <div key={simulation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900">{simulation.title}</h3>
                        <p className="text-sm text-slate-600">{simulation.premise}</p>
                      </div>
                      <Badge tone={simulation.deltaHealth > 0 ? "emerald" : simulation.deltaHealth < 0 ? "rose" : "blue"}>
                        {simulation.deltaHealth > 0 ? "+" : ""}
                        {simulation.deltaHealth} health
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                      <MiniStat label="Blocked delta" value={`${simulation.deltaBlocked > 0 ? "+" : ""}${simulation.deltaBlocked}`} />
                      <MiniStat label="Deep delta" value={`${simulation.deltaDeep > 0 ? "+" : ""}${simulation.deltaDeep}h`} />
                      <MiniStat label="Sync delta" value={`${simulation.deltaSync > 0 ? "+" : ""}${simulation.deltaSync}m`} />
                      <MiniStat label="Next focus" value={simulation.nextFocus} />
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{simulation.summary}</p>
                    <p className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">Exact move:</span> {simulation.exactMove}
                    </p>
                  </div>
                ))}
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

            <Panel title="Collaboration retro" subtitle="Finds the recurring pattern that keeps making collaboration more expensive, then suggests a fix worth testing instead of just admiring the mess.">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard label="Retro score" value={`${collaborationRetro.score}%`} note={collaborationRetro.headline} />
                  <MetricCard label="Patterns found" value={String(collaborationRetro.items.length)} note={collaborationRetro.strongestSignal} />
                  <MetricCard label="What's working" value={String(collaborationRetro.working.length)} note={collaborationRetro.working[0] ?? "Nothing strong yet"} />
                  <MetricCard label="Next experiment" value={collaborationRetro.items[0]?.severity ?? "steady"} note={collaborationRetro.items[0]?.title ?? "No big retro item"} />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Two-week experiment plan</h3>
                      <p className="mt-1 text-sm text-slate-600">{collaborationRetro.headline}</p>
                    </div>
                    <button type="button" onClick={() => copyText(collaborationRetro.copyBlock, "retro plan")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                      Copy retro plan
                    </button>
                  </div>
                  <textarea readOnly className={`${inputClass} mt-4 min-h-56 bg-white font-mono text-sm`} value={collaborationRetro.experimentPlan} />
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  {collaborationRetro.items.map((item) => (
                    <div key={item.id} className={`rounded-2xl border p-4 ${nudgeTone[item.severity === "high" ? "high" : item.severity === "medium" ? "medium" : "low"]}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <Badge tone="border-white/70 bg-white/70 text-slate-700">{item.severity} signal</Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 opacity-90"><span className="font-medium">Evidence:</span> {item.evidence}</p>
                      <p className="mt-3 text-sm leading-6 opacity-90"><span className="font-medium">System fix:</span> {item.systemFix}</p>
                      <p className="mt-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-3 text-sm opacity-95"><span className="font-medium">Experiment:</span> {item.experiment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Decision sprint" subtitle="Turns decision drift into one crisp call, memo, and next move instead of ambient ambiguity.">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard label="Sprint items" value={String(decisionSprint.items.length)} note={decisionSprint.items.length ? `${decisionSprint.headline}` : "No obvious decision debt right now"} />
                  <MetricCard label="High pressure" value={String(decisionSprint.highPressureCount)} note={decisionSprint.highPressureCount ? "Needs a real decision pass" : "Nothing urgent is screaming"} />
                  <MetricCard label="Lowest confidence" value={decisionSprint.items[0] ? `${decisionSprint.items[0].confidenceGap} gap` : "—"} note={decisionSprint.items[0]?.topic ?? "No decision memo yet"} />
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Sprint memo</p>
                      <p className="mt-1 text-sm leading-6 text-blue-900/85">{decisionSprint.headline}</p>
                    </div>
                    <button type="button" onClick={() => copyText(decisionSprint.copyBlock, "decision sprint")} className="rounded-xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-blue-900 transition hover:bg-white">
                      Copy sprint memo
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  {decisionSprint.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{item.topic}</h3>
                          <p className="mt-1 text-sm text-slate-600">{item.workstreamName}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={nudgeTone[item.urgency]}>{item.urgency} pressure</Badge>
                          <Badge>{item.score} score</Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600">
                        <div><span className="font-medium text-slate-900">Why now:</span> {item.whyNow}</div>
                        <div><span className="font-medium text-slate-900">Exact question:</span> {item.exactQuestion}</div>
                        <div><span className="font-medium text-slate-900">Evidence needed:</span> {item.evidenceNeeded}</div>
                        <div><span className="font-medium text-slate-900">Kill criteria:</span> {item.killCriteria}</div>
                        <div><span className="font-medium text-slate-900">Pre-read:</span> {item.preRead}</div>
                        <div><span className="font-medium text-slate-900">Recommendation:</span> {item.recommendation}</div>
                        <div><span className="font-medium text-slate-900">25-minute sprint:</span> {item.sprintPlan}</div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={() => copyText(item.memo, `${item.topic} memo`)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                          Copy memo
                        </button>
                        <div className="self-center text-xs text-slate-500">Owner: {item.owner} · {item.daysLeft >= 0 ? `${item.daysLeft} days left` : `${Math.abs(item.daysLeft)} days overdue`} · confidence gap {item.confidenceGap}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Overlap radar" subtitle="Catches duplicate threads, split ownership, and fake parallel progress before collaboration turns into two people doing the same thinking twice.">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard label="Collisions found" value={String(overlapRadar.items.length)} note={overlapRadar.headline} />
                  <MetricCard label="High risk" value={String(overlapRadar.items.filter((item) => item.severity === "high").length)} note={overlapRadar.items[0]?.collisionRisk ?? "No serious overlap detected"} />
                  <MetricCard label="Work hidden in overlap" value={String(overlapRadar.hiddenWorkCount)} note={overlapRadar.items[0]?.keepTogether ?? "Nothing is obviously fragmented"} />
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Consolidation memo</p>
                      <p className="mt-1 text-sm leading-6 text-amber-900/85">{overlapRadar.headline}</p>
                    </div>
                    <button type="button" onClick={() => copyText(overlapRadar.copyBlock, "overlap radar")} className="rounded-xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-white">
                      Copy memo
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  {overlapRadar.items.length ? overlapRadar.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{item.leftName} ↔ {item.rightName}</h3>
                          <p className="mt-1 text-sm text-slate-600">{item.collisionRisk}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={nudgeTone[item.severity]}>{item.severity} risk</Badge>
                          <Badge>{item.score} score</Badge>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <div>
                          <span className="font-medium text-slate-900">Shared signals:</span> {item.sharedSignals.join(" · ")}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">Keep together:</span> {item.keepTogether}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">Consolidation move:</span> {item.consolidationMove}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={() => copyText(item.copyBlock, `${item.leftName} overlap memo`)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                          Copy exact fix
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 xl:col-span-2">
                      No real overlap is showing right now. Either the board is clean or the naming is still too vague to spot collisions.
                    </div>
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

            <Panel title="Conversation translator" subtitle="Paste a rough back-and-forth and turn it into a usable plan, action list, and decision log instead of re-reading the whole thread.">
              <div className="grid gap-4">
                <Field label="Transcript or chat thread">
                  <textarea
                    className={`${inputClass} min-h-44`}
                    value={transcriptDraft}
                    onChange={(e) => setTranscriptDraft(e.target.value)}
                    placeholder="Paste a conversation between David, Albert, or anyone else."
                  />
                </Field>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Signal quality</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-3xl font-semibold tracking-tight text-slate-900">{conversationDigest.score}%</p>
                      <Badge tone={conversationDigest.score >= 80 ? statusTone.active : conversationDigest.score >= 60 ? statusTone.watch : statusTone.blocked}>{conversationDigest.score >= 80 ? "sharp" : conversationDigest.score >= 60 ? "usable" : "thin"}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{conversationDigest.summary}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:col-span-2">
                    <p className="text-sm font-semibold text-blue-900">Recommended next sync</p>
                    <p className="mt-2 text-sm leading-6 text-blue-900/90">{conversationDigest.nextSync}</p>
                    <textarea readOnly className={`${inputClass} mt-4 min-h-28 bg-white/80 font-mono text-sm`} value={conversationDigest.update} />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">Extracted actions</h3>
                      <Badge>{conversationDigest.actions.length}</Badge>
                    </div>
                    <div className="mt-3 space-y-3">
                      {conversationDigest.actions.length ? conversationDigest.actions.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={nudgeTone[item.urgency]}>{item.urgency}</Badge>
                            <Badge>{item.owner}</Badge>
                            <Badge>{prettyDate(item.due)}</Badge>
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-900">{item.task}</p>
                          <p className="mt-2 text-sm text-slate-600">{item.why}</p>
                          <p className="mt-2 text-xs text-slate-500">Workstream: {item.workstreamName}</p>
                        </div>
                      )) : <p className="text-sm text-slate-500">No actions detected yet. Either the transcript is thin or everyone was just vibing.</p>}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">Decision candidates</h3>
                      <Badge>{conversationDigest.decisions.length}</Badge>
                    </div>
                    <div className="mt-3 space-y-3">
                      {conversationDigest.decisions.length ? conversationDigest.decisions.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-sm font-semibold text-slate-900">{item.topic}</p>
                          <p className="mt-2 text-sm text-slate-600">{item.recommendation}</p>
                          <p className="mt-2 text-xs text-slate-500">Owner: {item.owner} · due {prettyDate(item.due)} · area {item.impactArea}</p>
                        </div>
                      )) : <p className="text-sm text-slate-500">No explicit decision surfaced. Nice if true, unlikely if the work is real.</p>}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Suggested workstream</p>
                  <p className="mt-2"><span className="font-medium">{conversationDigest.createdWorkstream.name}</span> · owner {conversationDigest.createdWorkstream.owner} · status {conversationDigest.createdWorkstream.status}</p>
                  <p className="mt-2">Next step: {conversationDigest.createdWorkstream.nextStep}</p>
                  <p className="mt-2">Decision needed: {conversationDigest.createdWorkstream.decisionNeeded || "No explicit decision captured."}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => copyText(conversationDigest.update, "transcript digest")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                    Copy digest
                  </button>
                  <button type="button" onClick={applyConversationDigest} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Create workstream + decision items
                  </button>
                </div>
              </div>
            </Panel>

            <Panel title="Inbox distiller" subtitle="Paste a messy note, chat chunk, or voice-transcript blob. The app pulls out the real update, ask, blocker, and workstream patch.">
              <div className="grid gap-4">
                <Field label="Raw note or pasted chat">
                  <textarea
                    className={`${inputClass} min-h-40`}
                    value={inboxDraft}
                    onChange={(e) => setInboxDraft(e.target.value)}
                    placeholder="Paste rough notes and let the app turn them into something usable."
                  />
                </Field>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Distill quality</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-3xl font-semibold tracking-tight text-slate-900">{inboxDistiller.score}%</p>
                      <Badge tone={inboxDistiller.score >= 80 ? statusTone.active : inboxDistiller.score >= 60 ? statusTone.watch : statusTone.blocked}>{inboxDistiller.verdict}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">Workstream target: <span className="font-medium text-slate-900">{inboxDistiller.workstreamName}</span></p>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:col-span-2">
                    <p className="text-sm font-semibold text-blue-900">What the distiller detected</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {inboxDistiller.signals.map((signal) => <Badge key={signal} tone="border-blue-200 bg-white/80 text-blue-800">{signal}</Badge>)}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-blue-900/90">{inboxDistiller.ask}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Copy-ready update">
                    <textarea readOnly className={`${inputClass} min-h-44 font-mono text-sm`} value={inboxDistiller.cleanedBrief} />
                  </Field>
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Suggested workstream patch</p>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600">
                        <div><span className="font-medium text-slate-900">Status:</span> {inboxDistiller.suggestedPatch.status}</div>
                        <div><span className="font-medium text-slate-900">Energy:</span> {inboxDistiller.suggestedPatch.energy}</div>
                        <div><span className="font-medium text-slate-900">Impact / urgency / confidence:</span> {inboxDistiller.suggestedPatch.impact} / {inboxDistiller.suggestedPatch.urgency} / {inboxDistiller.suggestedPatch.confidence}</div>
                        <div><span className="font-medium text-slate-900">Next step:</span> {inboxDistiller.suggestedPatch.nextStep}</div>
                        <div><span className="font-medium text-slate-900">Blocker:</span> {inboxDistiller.suggestedPatch.blocker || "None detected."}</div>
                        <div><span className="font-medium text-slate-900">Waiting on:</span> {inboxDistiller.suggestedPatch.waitingOn || "Nobody named."}</div>
                        <div><span className="font-medium text-slate-900">Decision needed:</span> {inboxDistiller.suggestedPatch.decisionNeeded || "No clear decision request detected."}</div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">Decision suggestion</p>
                      <p className="mt-2 text-sm leading-6 text-amber-900/90">{inboxDistiller.decisionSuggestion}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => copyText(inboxDistiller.cleanedBrief, "distilled update")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                    Copy distilled update
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWorkstream(selected?.id ?? focusNow?.id ?? "", inboxDistiller.suggestedPatch)}
                    disabled={!selected?.id && !focusNow?.id}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Apply patch to selected workstream
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUpdate({
                      title: inboxDistiller.updateTitle,
                      detail: inboxDistiller.updateDetail,
                      relatedWorkstream: inboxDistiller.workstreamName,
                      type: "from-albert",
                    })}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Send to update form
                  </button>
                </div>
              </div>
            </Panel>

            <Panel title="Handoff doctor" subtitle="Grades a draft against the async format David actually wants: changed, why it matters, blocker, exact next move.">
              <div className="grid gap-4">
                <Field label="Draft message">
                  <textarea
                    className={`${inputClass} min-h-36`}
                    value={handoffDraft}
                    onChange={(e) => setHandoffDraft(e.target.value)}
                    placeholder="Write a rough update and let the doctor clean it up."
                  />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Quality score</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{handoffDoctor.score}%</p>
                      </div>
                      <Badge tone={handoffDoctor.score >= 80 ? statusTone.active : handoffDoctor.score >= 60 ? statusTone.watch : statusTone.blocked}>{handoffDoctor.verdict}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">Short updates are fine. Missing context is not.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">What the doctor sees</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      <div><span className="font-medium text-slate-900">Changed:</span> {handoffDoctor.extracted.changed}</div>
                      <div><span className="font-medium text-slate-900">Why it matters:</span> {handoffDoctor.extracted.matters}</div>
                      <div><span className="font-medium text-slate-900">Blocked by:</span> {handoffDoctor.extracted.blocked}</div>
                      <div><span className="font-medium text-slate-900">Next move:</span> {handoffDoctor.extracted.next}</div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-900">What already works</p>
                    <ul className="mt-3 space-y-2 text-sm text-emerald-900/90">
                      {handoffDoctor.strengths.length ? handoffDoctor.strengths.map((item) => <li key={item}>• {item}</li>) : <li>• Nothing strong yet. The message is still vibes.</li>}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">What to fix</p>
                    <ul className="mt-3 space-y-2 text-sm text-amber-900/90">
                      {handoffDoctor.missing.length ? handoffDoctor.missing.map((item) => <li key={item}>• {item}</li>) : <li>• No obvious holes. A miracle.</li>}
                    </ul>
                  </div>
                </div>
                <Field label="Cleaner rewrite">
                  <textarea readOnly className={`${inputClass} min-h-44 font-mono text-sm`} value={handoffDoctor.rewrite} />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => copyText(handoffDoctor.rewrite, "doctor rewrite")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                    Copy rewrite
                  </button>
                  <button type="button" onClick={() => setHandoffDraft(handoffDoctor.rewrite)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Replace draft with rewrite
                  </button>
                </div>
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

function BudgetColumn({ title, items, empty }: { title: string; items: BudgetAllocation[]; empty: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.length ? items.map((item) => (
          <div key={`${title}-${item.workstreamName}`} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.workstreamName}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.lane} · {item.hours ? `${item.hours}h` : `${item.minutes}m`}</p>
              </div>
              <Badge>{item.verdict}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
            <p className="mt-2 text-xs text-slate-500">Next: {item.nextMove}</p>
          </div>
        )) : <p className="text-sm text-slate-500">{empty}</p>}
      </div>
    </div>
  );
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

function buildCollaboratorMap(workstreams: ScoredWorkstream[], decisions: Decision[]): CollaboratorMap {
  const map = new Map<string, CollaboratorBrief>();

  const ensurePerson = (rawName: string) => {
    const name = normalizePersonLabel(rawName);
    if (!name) return null;
    const existing = map.get(name);
    if (existing) return existing;

    const brief: CollaboratorBrief = {
      name,
      score: 0,
      ownedCount: 0,
      waitingCount: 0,
      blockedCount: 0,
      staleCount: 0,
      workstreams: [],
      risk: "No meaningful pressure detected yet.",
      ask: "No direct ask yet.",
      nextMove: "Keep the board honest and current.",
      message: "",
    };

    map.set(name, brief);
    return brief;
  };

  for (const item of workstreams) {
    const owner = ensurePerson(item.owner);
    if (owner) {
      owner.ownedCount += 1;
      owner.score += item.score;
      if (item.status === "blocked") owner.blockedCount += 1;
      if (item.ageDays >= 3) owner.staleCount += 1;
      if (!owner.workstreams.includes(item.name)) owner.workstreams.push(item.name);
    }

    for (const dependencyName of splitPeople(item.waitingOn)) {
      const dependency = ensurePerson(dependencyName);
      if (!dependency) continue;
      dependency.waitingCount += 1;
      dependency.score += Math.round(item.drag * 0.7) + (item.status === "blocked" ? 8 : 0);
      if (item.status === "blocked") dependency.blockedCount += 1;
      if (item.ageDays >= 3) dependency.staleCount += 1;
      if (!dependency.workstreams.includes(item.name)) dependency.workstreams.push(item.name);
    }
  }

  for (const decision of decisions) {
    const match = matchDecisionWorkstream(decision, workstreams);
    const owner = ensurePerson(match?.owner || inferOwner(decision));
    if (!owner) continue;
    const overdue = isPast(decision.deadline);
    owner.score += overdue ? 18 : 8;
    if (overdue) owner.blockedCount += 1;
    if (!owner.workstreams.includes(match?.name || decision.topic)) owner.workstreams.push(match?.name || decision.topic);
  }

  const briefs = [...map.values()]
    .map((person) => {
      const pressure = clamp(
        Math.round(person.score * 0.28 + person.ownedCount * 8 + person.waitingCount * 10 + person.blockedCount * 12 + person.staleCount * 6),
        12,
        100
      );
      const topWorkstream = person.workstreams[0] || "the board";
      const risk = person.blockedCount
        ? `${person.name} is part of ${person.blockedCount} blocked path${person.blockedCount === 1 ? "" : "s"}. ${topWorkstream} is already paying for that.`
        : person.waitingCount >= 2
          ? `${person.name} is holding multiple dependencies at once. That is where polite silence turns into schedule drift.`
          : person.ownedCount >= 3
            ? `${person.name} owns a lot of active surface area. Useful, but also how coordination load hides.`
            : `${person.name} is not on fire, but still shapes the tempo of ${topWorkstream}.`;
      const ask = person.waitingCount
        ? `Get a direct yes/no update on ${topWorkstream} and rewrite the dependency in concrete terms.`
        : person.ownedCount >= 3
          ? `Trim scope or decide what ${person.name} should stop carrying this week.`
          : `Confirm the next step and owner for ${topWorkstream} so the work stops floating.`;
      const nextMove = person.blockedCount
        ? `Send a tight unblock note today. If there is no answer, escalate the decision owner instead of waiting gracefully.`
        : person.staleCount
          ? `Refresh the state of ${topWorkstream} before it turns into fake progress.`
          : `Keep ${person.name} in async mode unless a real decision is needed.`;
      const message = [
        `${person.name} — quick collab check`,
        "",
        `You're currently tied to ${person.workstreams.slice(0, 3).join(", ") || "the current board"}.`,
        `Main risk: ${risk}`,
        `What would help now: ${ask}`,
        `Suggested next move: ${nextMove}`,
      ].join("\n");

      return {
        ...person,
        score: pressure,
        risk,
        ask,
        nextMove,
        workstreams: person.workstreams.slice(0, 4),
        message,
      } satisfies CollaboratorBrief;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const overloadedCount = briefs.filter((person) => person.ownedCount >= 3 || person.score >= 70).length;
  const bottleneckCount = briefs.filter((person) => person.waitingCount >= 2 || person.blockedCount >= 1).length;
  const headline = briefs.length
    ? `${briefs[0].name} is carrying the most collaboration pressure right now. ${briefs[0].ask}`
    : "No named collaborators yet. The board needs real owners and dependency names before this becomes useful.";
  const copyBlock = briefs.length
    ? [
        "COLLABORATOR MAP",
        "",
        headline,
        "",
        ...briefs.map((person, index) => `${index + 1}. ${person.name} — ${person.score} pressure — ${person.ask} — next: ${person.nextMove}`),
      ].join("\n")
    : headline;

  return {
    briefs,
    headline,
    copyBlock,
    overloadedCount,
    bottleneckCount,
  };
}

function buildCollaborationRetro({
  workstreams,
  decisions,
  snapshots,
  collaboratorMap,
}: {
  workstreams: ScoredWorkstream[];
  decisions: Decision[];
  snapshots: Snapshot[];
  collaboratorMap: CollaboratorMap;
}): CollaborationRetro {
  const items: CollaborationRetroItem[] = [];
  const blockedCount = workstreams.filter((item) => item.status === "blocked").length;
  const staleCount = workstreams.filter((item) => item.ageDays >= 3).length;
  const decisionDebt = decisions.filter((item) => isPast(item.deadline)).length;
  const overloadedPeople = collaboratorMap.briefs.filter((item) => item.score >= 70 || item.ownedCount >= 3);
  const healthSeries = [...snapshots].slice(0, 4).map((item) => item.health);
  const currentHealth = collaborationHealthScore(workstreams, decisions);
  const baselineHealth = healthSeries[0] ?? currentHealth;
  const trendDelta = currentHealth - baselineHealth;

  if (blockedCount) {
    items.push({
      id: "retro-blockers",
      title: "Blockers are surviving too long",
      severity: blockedCount >= 2 ? "high" : "medium",
      evidence: `${blockedCount} workstream${blockedCount === 1 ? " is" : "s are"} currently blocked, and the board still depends on polite waiting more than explicit unblock ownership.`,
      systemFix: "Add a 24-hour unblock rule: every blocked item needs one named owner, one escalation path, and one fallback focus.",
      experiment: "For the next 2 weeks, rewrite every blocked item into owner / decision / fallback within the same day it becomes blocked.",
    });
  }

  if (staleCount >= 2) {
    items.push({
      id: "retro-stale",
      title: "Important work is going stale",
      severity: staleCount >= 3 ? "high" : "medium",
      evidence: `${staleCount} active workstream${staleCount === 1 ? " has" : "s have"} gone stale. That usually means the handoff format is too vague or the review rhythm is too loose.`,
      systemFix: "Use a twice-weekly cleanup pass on the top stack so next step, owner, and desired outcome stay sharper than chat memory.",
      experiment: "On Tuesday and Friday, spend 10 minutes cleaning the top 3 workstreams before doing anything else.",
    });
  }

  if (decisionDebt) {
    items.push({
      id: "retro-decisions",
      title: "Decision drift is taxing execution",
      severity: decisionDebt >= 2 ? "high" : "medium",
      evidence: `${decisionDebt} decision${decisionDebt === 1 ? " is" : "s are"} overdue, which means the team is absorbing uncertainty as execution tax.`,
      systemFix: "Create one standing short decision review instead of letting important choices leak across threads.",
      experiment: "Run one 20-minute decision sprint each week until overdue decisions hit zero.",
    });
  }

  if (overloadedPeople.length) {
    const top = overloadedPeople[0];
    items.push({
      id: "retro-load",
      title: "Collaboration load is pooling around one person",
      severity: top.score >= 80 ? "high" : "medium",
      evidence: `${top.name} is carrying the heaviest pressure (${top.score}) across ${top.workstreams.slice(0, 3).join(", ") || "the board"}. That is how response latency turns into invisible drag.`,
      systemFix: "Reduce dependency fan-in: convert one live dependency into a direct decision, delegation, or explicit de-prioritization.",
      experiment: `During the next 2 weeks, remove at least one waiting dependency from ${top.name}'s queue every review cycle.`,
    });
  }

  if (trendDelta <= -4 && snapshots.length >= 2) {
    items.push({
      id: "retro-trend",
      title: "Collaboration quality is slipping over time",
      severity: "high",
      evidence: `Collaboration health is down ${Math.abs(trendDelta)} points versus the snapshot baseline. The current system is producing more drag than it removes.`,
      systemFix: "Stop adding new process. Tighten the existing rhythm around priorities, blockers, and decisions until the health trend reverses.",
      experiment: "For the next 2 weeks, treat new rituals as banned. Only improve the top-priority review, unblock rule, and decision sprint.",
    });
  }

  if (!items.length) {
    items.push({
      id: "retro-steady",
      title: "No major systemic drag signal",
      severity: "low",
      evidence: "The board is not showing strong recurring collaboration failure patterns right now.",
      systemFix: "Keep the current rhythm, but keep snapshots honest so the system does not quietly decay.",
      experiment: "Save two fresh snapshots next week and re-run the retro with real movement data.",
    });
  }

  const rankedItems = items
    .sort((a, b) => retroSeverityWeight(b.severity) - retroSeverityWeight(a.severity))
    .slice(0, 4);

  const working: string[] = [];
  if (!blockedCount) working.push("No blocked workstreams are currently screaming for attention.");
  if (!decisionDebt) working.push("Decision hygiene is holding. Nothing logged is overdue.");
  if (trendDelta >= 0 && snapshots.length) working.push(`Collaboration health is up ${trendDelta} points versus the baseline snapshot.`);
  if (collaboratorMap.overloadedCount === 0) working.push("Collaboration load looks reasonably spread out right now.");
  if (!working.length) working.push("There is some structure here already. The app is finding problems, which is better than guessing.");

  const strongestSignal = rankedItems[0]?.title || "No strong retro signal";
  const score = clamp(100 - rankedItems.reduce((sum, item) => sum + (item.severity === "high" ? 18 : item.severity === "medium" ? 10 : 4), 0), 28, 100);
  const headline = rankedItems[0]?.severity === "high"
    ? `${rankedItems[0].title} is the main system problem to fix next.`
    : `The collaboration system is mostly workable, but ${rankedItems[0]?.title.toLowerCase() || "there is still one pattern worth tightening"}.`;
  const experimentPlan = [
    `RETRO EXPERIMENT PLAN`,
    "",
    `Headline: ${headline}`,
    `Strongest signal: ${strongestSignal}`,
    "",
    "What to keep:",
    ...working.map((item) => `- ${item}`),
    "",
    "What to fix next:",
    ...rankedItems.map((item, index) => `${index + 1}. ${item.title} — ${item.systemFix}`),
    "",
    "2-week experiments:",
    ...rankedItems.map((item) => `- ${item.experiment}`),
  ].join("\n");

  return {
    score,
    headline,
    strongestSignal,
    items: rankedItems,
    working,
    experimentPlan,
    copyBlock: experimentPlan,
  };
}

function retroSeverityWeight(severity: CollaborationRetroItem["severity"]) {
  return severity === "high" ? 3 : severity === "medium" ? 2 : 1;
}

function buildCollaboratorPrepPack({
  briefs,
  workstreams,
  decisions,
  collaborator,
}: {
  briefs: CollaboratorBrief[];
  workstreams: ScoredWorkstream[];
  decisions: Decision[];
  collaborator: string;
}): CollaboratorPrepPack {
  const brief = briefs.find((item) => item.name === collaborator) ?? briefs[0];
  const fallbackName = collaborator || brief?.name || "David";
  const linkedWorkstreams = workstreams.filter(
    (item) => normalizePersonLabel(item.owner) === fallbackName || splitPeople(item.waitingOn).includes(fallbackName)
  );
  const linkedDecisions = decisions.filter((decision) => {
    const match = matchDecisionWorkstream(decision, workstreams);
    return normalizePersonLabel(match?.owner || inferOwner(decision)) === fallbackName;
  });

  if (!brief) {
    const emptyNote = [
      `1:1 PREP — ${fallbackName}`,
      "",
      "No collaborator signal yet.",
      "Name owners and waiting dependencies in the board, then this pack gets useful fast.",
    ].join("\n");

    return {
      collaborator: fallbackName,
      headline: "No collaborator signal yet.",
      temperature: "steady",
      workstreams: [],
      openWith: `Open by clarifying what ${fallbackName} actually owns or influences right now.`,
      appreciate: `Acknowledge any recent movement before asking for more detail.`,
      pressure: "There is not enough structured signal yet.",
      ask: `Name one concrete outcome and one next owner.`,
      agenda: ["Clarify scope", "Name the next step", "Capture the owner"],
      watchouts: ["The board is too vague for a sharper prep pack."],
      followThrough: ["Update the workstream owner and waiting fields after the conversation."],
      note: emptyNote,
      copyBlock: emptyNote,
    };
  }

  const hottestWorkstream = linkedWorkstreams[0] ?? workstreams.find((item) => item.name === brief.workstreams[0]);
  const overdueDecision = linkedDecisions.find((item) => isPast(item.deadline));
  const temperature: CollaboratorPrepPack["temperature"] = brief.score >= 75 || brief.blockedCount >= 2 ? "hot" : brief.score >= 50 || brief.waitingCount >= 2 ? "warm" : "steady";
  const openWith = brief.blockedCount
    ? `Open calmly: “I want to clear the blocked path around ${hottestWorkstream?.name || brief.workstreams[0] || "the current work"} so we leave with one decision and one owner.”`
    : `Open simply: “I want to make ${hottestWorkstream?.name || brief.workstreams[0] || "this work"} easier to move without another fuzzy follow-up.”`;
  const appreciate = hottestWorkstream
    ? `${brief.name} is already carrying ${brief.ownedCount} thread${brief.ownedCount === 1 ? "" : "s"}. Acknowledge the movement on ${hottestWorkstream.name} before pushing on the constraint.`
    : `${brief.name} is shaping the tempo of current work. Start with what is already moving, not just what is missing.`;
  const pressure = overdueDecision
    ? `There is overdue decision drag around ${overdueDecision.topic}. That risk is now bigger than the discomfort of naming it directly.`
    : brief.risk;
  const ask = overdueDecision
    ? `Ask for a yes/no decision on ${overdueDecision.topic} or a hard date for when that call gets made.`
    : brief.ask;
  const agenda = [
    `Start with the shared outcome for ${hottestWorkstream?.name || brief.workstreams[0] || "the main thread"}.`,
    ask,
    hottestWorkstream?.waitingOn
      ? `Rewrite the dependency on ${hottestWorkstream.waitingOn} into one concrete deliverable.`
      : `Confirm the next step, owner, and date before ending the sync.`,
  ];
  const watchouts = [
    brief.waitingCount ? `Do not leave with “I'll look into it.” Convert it into a dated next step.` : `Do not let the conversation stay overly polite and vague.`,
    hottestWorkstream?.notes ? `Avoid reopening every side-thread in ${hottestWorkstream.name}. Keep the conversation on the next unblock.` : `Avoid pulling new scope into the conversation.`,
    brief.blockedCount ? `If the blocker is really a decision, stop treating it like a status update.` : `If this drifts into storytelling, pull it back to owners and timing.`,
  ];
  const followThrough = [
    `Update ${hottestWorkstream?.name || brief.workstreams[0] || "the board"} immediately after the sync.`,
    `Send the recap to ${brief.name} while the conversation is still fresh.`,
    overdueDecision ? `Log the decision outcome or revised deadline for ${overdueDecision.topic}.` : `Capture the agreed next step so it does not dissolve into memory.`,
  ];
  const note = [
    `1:1 PREP — ${brief.name}`,
    "",
    `Temperature: ${temperature}`,
    `Workstreams: ${(linkedWorkstreams.map((item) => item.name).slice(0, 4).join(", ") || brief.workstreams.join(", ") || "None named yet")}`,
    "",
    `Open with: ${openWith}`,
    `Appreciate: ${appreciate}`,
    `Pressure to name: ${pressure}`,
    `Direct ask: ${ask}`,
    "",
    "Agenda:",
    ...agenda.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Watchouts:",
    ...watchouts.map((item) => `- ${item}`),
    "",
    "Follow-through:",
    ...followThrough.map((item) => `- ${item}`),
  ].join("\n");

  return {
    collaborator: brief.name,
    headline: `${brief.name} needs a ${temperature === "hot" ? "tight unblock conversation" : temperature === "warm" ? "clear alignment pass" : "light maintenance sync"}.`,
    temperature,
    workstreams: linkedWorkstreams.map((item) => item.name).slice(0, 4),
    openWith,
    appreciate,
    pressure,
    ask,
    agenda,
    watchouts,
    followThrough,
    note,
    copyBlock: note,
  };
}

function normalizePersonLabel(value: string) {
  const cleaned = value.replace(/\([^)]*\)/g, " ").replace(/\b(team|shared|general|nobody|none|unknown)\b/gi, " ").trim();
  if (!cleaned) return "";
  const first = cleaned.split(/[\/,&]|\band\b/gi)[0]?.trim() ?? "";
  return first.replace(/^@/, "").trim();
}

function splitPeople(value: string) {
  return value
    .split(/[\n,\/;&]+|\band\b/gi)
    .map((part) => normalizePersonLabel(part))
    .filter(Boolean);
}

function buildDecisionSprint(workstreams: ScoredWorkstream[], decisions: Decision[]) {
  const ranked = decisions
    .map((decision) => {
      const match = matchDecisionWorkstream(decision, workstreams);
      const daysLeft = daysUntil(decision.deadline);
      const overdue = daysLeft < 0;
      const confidenceGap = clamp(10 - decision.confidence, 0, 10);
      const workstreamDrag = match?.drag ?? 28;
      const workstreamScore = match?.score ?? 60;
      const timePressure = overdue ? 35 : daysLeft <= 1 ? 28 : daysLeft <= 3 ? 18 : daysLeft <= 7 ? 10 : 4;
      const score = clamp(Math.round(workstreamScore * 0.35 + workstreamDrag * 0.25 + confidenceGap * 4 + timePressure), 25, 100);
      const urgency: DecisionSprint["urgency"] = score >= 78 || overdue ? "high" : score >= 58 ? "medium" : "low";
      const workstreamName = match?.name || decision.impactArea || "Unassigned decision context";
      const owner = match?.owner || inferOwner(decision);
      const evidenceNeeded = match?.blocker
        ? `Resolve the blocker signal first: ${match.blocker}`
        : match?.waitingOn
          ? `Confirm the dependency from ${match.waitingOn}.`
          : `Bring one fact that would actually change the recommendation for ${workstreamName}.`;
      const exactQuestion = match?.decisionNeeded || decision.topic;
      const whyNow = overdue
        ? `${decision.topic} is overdue since ${prettyDate(decision.deadline)} and is now taxing execution on ${workstreamName}.`
        : `${decision.topic} lands in ${daysLeft} days and the current confidence is only ${decision.confidence}/10.`;
      const preRead = match
        ? `Read the latest state of ${match.name}, current blocker, and next step before making the call.`
        : `Read the existing options and recommendation before discussing new ideas.`;
      const killCriteria = match?.desiredOutcome
        ? `If the call does not improve the path toward ${match.desiredOutcome.toLowerCase()}, park it.`
        : `If the decision adds more ambiguity than clarity, do not escalate it yet.`;
      const sprintPlan = `5 min frame the decision · 10 min gather missing evidence · 5 min pick owner and recommendation · 5 min rewrite the exact next move.`;
      const memo = [
        `DECISION SPRINT`,
        "",
        `Topic: ${decision.topic}`,
        `Workstream: ${workstreamName}`,
        `Owner: ${owner}`,
        `Why now: ${whyNow}`,
        `Exact question: ${exactQuestion}`,
        `Evidence needed: ${evidenceNeeded}`,
        `Recommendation: ${decision.recommendation}`,
        `Kill criteria: ${killCriteria}`,
        `Sprint plan: ${sprintPlan}`,
      ].join('\n');

      return {
        id: decision.id,
        topic: decision.topic,
        workstreamName,
        urgency,
        score,
        confidenceGap,
        daysLeft,
        owner,
        whyNow,
        evidenceNeeded,
        exactQuestion,
        preRead,
        recommendation: decision.recommendation,
        killCriteria,
        sprintPlan,
        memo,
      } satisfies DecisionSprint;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const headline = ranked.length
    ? `${ranked[0].topic} is the sharpest decision to clean up next. The goal is one real call, not another vague conversation.`
    : "No meaningful decision debt detected. Suspicious, but nice if true.";

  const copyBlock = ranked.length
    ? [
        `DECISION SPRINT OVERVIEW`,
        "",
        headline,
        "",
        ...ranked.map((item, index) => `${index + 1}. ${item.topic} — ${item.urgency} pressure — ${item.exactQuestion} — next: ${item.evidenceNeeded}`),
      ].join('\n')
    : headline;

  return {
    items: ranked,
    headline,
    highPressureCount: ranked.filter((item) => item.urgency === "high").length,
    copyBlock,
  };
}

function buildOverlapRadar(workstreams: ScoredWorkstream[]): OverlapRadar {
  const pairs: OverlapRadarItem[] = [];

  for (let index = 0; index < workstreams.length; index += 1) {
    for (let cursor = index + 1; cursor < workstreams.length; cursor += 1) {
      const left = workstreams[index];
      const right = workstreams[cursor];
      const leftTokens = meaningfulTokens(`${left.name} ${left.notes} ${left.nextStep} ${left.desiredOutcome} ${left.decisionNeeded}`);
      const rightTokens = meaningfulTokens(`${right.name} ${right.notes} ${right.nextStep} ${right.desiredOutcome} ${right.decisionNeeded}`);
      const sharedTokens = [...leftTokens].filter((token) => rightTokens.has(token));
      const tokenOverlap = sharedTokens.length;
      const ownerMatch = normalizePerson(left.owner) && normalizePerson(left.owner) === normalizePerson(right.owner);
      const waitingMatch = sharedEntity(left.waitingOn, right.waitingOn);
      const outcomeMatch = sharedEntity(left.desiredOutcome, right.desiredOutcome) || sharedEntity(left.decisionNeeded, right.decisionNeeded);
      const bothHot = left.score >= 65 && right.score >= 65;
      const bothStale = left.ageDays >= 3 && right.ageDays >= 3;
      const oneBlocked = left.status === "blocked" || right.status === "blocked";
      const oneWaiting = Boolean(left.waitingOn.trim()) || Boolean(right.waitingOn.trim());

      const score = clamp(
        tokenOverlap * 14
          + (ownerMatch ? 16 : 0)
          + (waitingMatch ? 18 : 0)
          + (outcomeMatch ? 16 : 0)
          + (bothHot ? 12 : 0)
          + (bothStale ? 8 : 0)
          + (oneBlocked && oneWaiting ? 10 : 0),
        0,
        100
      );

      if (score < 42) continue;

      const severity: OverlapRadarItem["severity"] = score >= 72 ? "high" : score >= 56 ? "medium" : "low";
      const sharedSignals = [
        ownerMatch ? `same owner: ${left.owner}` : "different owners touching the same terrain",
        waitingMatch ? `shared dependency: ${coalesceEntity(left.waitingOn, right.waitingOn)}` : null,
        outcomeMatch ? `same outcome/question: ${coalesceEntity(left.desiredOutcome || left.decisionNeeded, right.desiredOutcome || right.decisionNeeded)}` : null,
        tokenOverlap ? `shared language: ${sharedTokens.slice(0, 4).join(", ")}` : null,
        bothHot ? "both workstreams are still competing for real attention" : null,
        bothStale ? "both threads are aging at the same time" : null,
      ].filter(Boolean) as string[];

      const collisionRisk = ownerMatch
        ? `${left.owner} is carrying two adjacent threads that should probably be one cleaner conversation.`
        : `${left.owner} and ${right.owner} may be advancing the same work through separate mental models.`;
      const keepTogether = outcomeMatch
        ? `Keep the shared goal explicit: ${coalesceEntity(left.desiredOutcome || left.decisionNeeded, right.desiredOutcome || right.decisionNeeded)}.`
        : `Treat these as one joined lane until the next step and blocker stop contradicting each other.`;
      const consolidationMove = `Keep ${left.score >= right.score ? left.name : right.name} as the primary thread, pull the useful notes from ${left.score >= right.score ? right.name : left.name}, and rewrite one owner, one blocker, one next move.`;
      const copyBlock = [
        "OVERLAP FIX",
        "",
        `Threads: ${left.name} ↔ ${right.name}`,
        `Risk: ${collisionRisk}`,
        `Signals: ${sharedSignals.join(" | ")}`,
        `Keep together: ${keepTogether}`,
        `Exact move: ${consolidationMove}`,
      ].join("\n");

      pairs.push({
        id: `${left.id}-${right.id}`,
        leftName: left.name,
        rightName: right.name,
        score,
        severity,
        sharedSignals,
        collisionRisk,
        consolidationMove,
        keepTogether,
        copyBlock,
      });
    }
  }

  const items = pairs.sort((a, b) => b.score - a.score).slice(0, 4);
  const headline = items.length
    ? `${items[0].leftName} and ${items[0].rightName} look split across overlapping threads. Merge the thinking before more work disappears into duplicate updates.`
    : "No obvious duplicate threads found. Nice. Also mildly suspicious.";
  const hiddenWorkCount = items.reduce((sum, item) => sum + (item.severity === "high" ? 2 : 1), 0);
  const copyBlock = items.length
    ? [
        "OVERLAP RADAR",
        "",
        headline,
        "",
        ...items.map((item, index) => `${index + 1}. ${item.leftName} ↔ ${item.rightName} — ${item.severity} risk — ${item.consolidationMove}`),
      ].join("\n")
    : headline;

  return { items, headline, hiddenWorkCount, copyBlock };
}

function meaningfulTokens(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 5)
      .filter((token) => !COMMON_TOKENS.has(token))
  );
}

const COMMON_TOKENS = new Set([
  "about", "after", "again", "albert", "around", "because", "before", "being", "clear", "could", "david", "exact", "focus", "needs", "right", "should", "still", "their", "there", "these", "thing", "those", "through", "until", "while", "which", "workstream"
]);

function normalizePerson(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeEntity(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function sharedEntity(left: string, right: string) {
  const a = normalizeEntity(left);
  const b = normalizeEntity(right);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.length >= 8 && b.length >= 8 && (a.includes(b) || b.includes(a));
}

function coalesceEntity(left: string, right: string) {
  return left.trim() || right.trim() || "shared dependency";
}

function matchDecisionWorkstream(decision: Decision, workstreams: ScoredWorkstream[]) {
  const topic = `${decision.topic} ${decision.impactArea} ${decision.options} ${decision.recommendation}`.toLowerCase();

  return workstreams
    .map((workstream) => {
      const haystack = `${workstream.name} ${workstream.notes} ${workstream.nextStep} ${workstream.desiredOutcome} ${workstream.decisionNeeded}`.toLowerCase();
      let overlap = 0;
      for (const word of topic.split(/[^a-z0-9]+/).filter((word) => word.length >= 4)) {
        if (haystack.includes(word)) overlap += 1;
      }
      if (decision.impactArea && haystack.includes(decision.impactArea.toLowerCase())) overlap += 2;
      return { workstream, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap || b.workstream.score - a.workstream.score)[0]?.workstream;
}

function inferOwner(decision: Decision) {
  const text = `${decision.topic} ${decision.recommendation}`.toLowerCase();
  if (text.includes('david')) return 'David';
  if (text.includes('albert')) return 'Albert';
  return 'Shared';
}

function daysUntil(isoDate: string) {
  const target = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
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

function analyzeHandoffDraft({
  draft,
  focusNow,
  selected,
}: {
  draft: string;
  focusNow?: ScoredWorkstream;
  selected?: Workstream;
}): HandoffDoctor {
  const cleaned = draft.trim();
  const subject = selected?.name || focusNow?.name || "the current top workstream";
  const fallbackNext = selected?.nextStep || focusNow?.nextStep || "Name the next concrete move.";
  const fallbackBlocker = selected?.blocker || "No blocker right now.";

  const parts = splitDraft(cleaned);
  const changed = findSection(parts, ["changed", "shipped", "finished", "updated", "made", "added", "fixed", "launched"], cleaned)
    || fallbackFromSentence(parts, 0)
    || `Updated ${subject}.`;
  const matters = findSection(parts, ["matters", "because", "so that", "impact", "why"], cleaned)
    || `It matters because it should reduce coordination waste around ${subject}.`;
  const blocked = findSection(parts, ["blocked", "blocker", "waiting", "risk", "stuck"], cleaned)
    || (cleaned ? fallbackBlocker : "No blocker right now.");
  const next = findSection(parts, ["next", "then", "follow", "will", "plan"], cleaned)
    || fallbackNext;

  const missing: string[] = [];
  const strengths: string[] = [];
  let score = 35;

  if (cleaned.length >= 50) {
    score += 5;
    strengths.push("There is enough detail to work with.");
  } else {
    missing.push("Too short to be reliably useful.");
  }

  if (hasRealSection(changed, subject)) {
    score += 18;
    strengths.push("It says what changed.");
  } else {
    missing.push("Say clearly what changed.");
  }

  if (hasRealSection(matters, "It matters")) {
    score += 18;
    strengths.push("It explains why the change matters.");
  } else {
    missing.push("Explain why this matters, not just what happened.");
  }

  if (hasRealSection(blocked, "No blocker right now.")) {
    score += 14;
    strengths.push(blocked.toLowerCase().includes("no blocker") ? "It explicitly says blocker status." : "It names the blocker instead of hiding it.");
  } else {
    missing.push("Call out the blocker status explicitly.");
  }

  if (hasRealSection(next, fallbackNext)) {
    score += 18;
    strengths.push("It includes an exact next move.");
  } else {
    missing.push("Name the exact next action.");
  }

  if (cleaned.length > 420) {
    score -= 10;
    missing.push("It is getting too long for a fast async handoff.");
  } else if (cleaned.length >= 90 && cleaned.length <= 320) {
    score += 6;
    strengths.push("Length is sane for async reading.");
  }

  if (sentenceCount(cleaned) >= 3) {
    score += 4;
  } else {
    missing.push("Use a couple of crisp sentences instead of one mushy blob.");
  }

  score = clamp(score, 18, 100);

  const verdict = score >= 85 ? "ready" : score >= 65 ? "close" : "needs cleanup";
  const rewrite = [
    `What changed: ${normalizeSentence(changed)}`,
    `Why it matters: ${normalizeSentence(matters)}`,
    `Blocked by: ${normalizeSentence(blocked)}`,
    `Exact next move: ${normalizeSentence(next)}`,
  ].join("\n");

  return {
    score,
    verdict,
    extracted: { changed, matters, blocked, next },
    missing: uniqueList(missing),
    strengths: uniqueList(strengths),
    rewrite,
  };
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


function buildProtocolPlanner(workstreams: ScoredWorkstream[], decisions: Decision[]) {
  const recommendations = workstreams.slice(0, 5).map(recommendProtocol);
  const syncMinutes = recommendations
    .filter((item) => item.mode === "quick-sync" || item.mode === "decision-review")
    .reduce((sum, item) => sum + item.minutes, 0);
  const asyncCount = recommendations.filter((item) => item.mode === "async").length;
  const decisionCount = recommendations.filter((item) => item.mode === "decision-review").length;
  const deepDiveCount = recommendations.filter((item) => item.mode === "deep-dive").length;
  const overdueDecisions = decisions.filter((item) => isPast(item.deadline)).length;
  const headline = syncMinutes
    ? `Protect ${syncMinutes} minutes of live conversation and keep the rest async. ${overdueDecisions ? `${overdueDecisions} overdue decision${overdueDecisions > 1 ? "s" : ""} are pushing this upward.` : "Meeting sprawl does not get a vote."}`
    : `No real sync budget needed right now. Keep momentum async and save the calendar from itself.`;
  const copyBlock = [
    "COLLABORATION PROTOCOL PLAN",
    "",
    `Live sync budget: ${syncMinutes} min`,
    `Async-first items: ${asyncCount}`,
    `Decision reviews: ${decisionCount}`,
    `Deep dives: ${deepDiveCount}`,
    "",
    ...recommendations.map((item, index) => `${index + 1}. ${item.workstreamName} — ${item.mode} (${item.minutes} min)\n   Why: ${item.reason}\n   Prep: ${item.prep}\n   Output: ${item.output}`),
  ].join("\n");

  return { recommendations, syncMinutes, asyncCount, decisionCount, deepDiveCount, headline, copyBlock };
}

function recommendProtocol(item: ScoredWorkstream): ProtocolRecommendation {
  const missing = missingPieces(item);
  const hasDecisionPressure = item.decisionNeeded.trim().length > 0 || item.status === "blocked" || item.drag >= 55;
  const isAsyncFriendly = item.readiness >= 78 && item.drag <= 28 && !item.waitingOn.trim() && !item.decisionNeeded.trim();
  const needsDeepDive = item.energy === "deep" && item.status !== "blocked" && item.confidence <= 6;

  let mode: ProtocolMode = "async";
  if (item.status === "done" || item.urgency <= 3) mode = "park";
  else if (hasDecisionPressure && (item.blocker.trim() || item.decisionNeeded.trim())) mode = "decision-review";
  else if (needsDeepDive) mode = "deep-dive";
  else if (item.drag >= 38 || item.waitingOn.trim()) mode = "quick-sync";
  else if (isAsyncFriendly) mode = "async";
  else if (item.energy === "deep") mode = "deep-dive";

  const minutes = mode === "decision-review" ? 20 : mode === "quick-sync" ? 12 : mode === "deep-dive" ? 30 : mode === "park" ? 0 : 8;
  const urgencyLabel = item.status === "blocked" ? "unblock now" : item.urgency >= 8 ? "high urgency" : item.ageDays >= 3 ? "stale" : "normal";

  const reason =
    mode === "decision-review"
      ? `${item.name} is carrying decision pressure or a real blocker. A short decision review is cheaper than another round of fuzzy async.`
      : mode === "quick-sync"
        ? `${item.name} has enough coordination drag that a tight sync beats back-and-forth guessing.`
        : mode === "deep-dive"
          ? `${item.name} needs protected thinking time more than chat. The bottleneck is judgment, not messaging.`
          : mode === "park"
            ? `${item.name} does not deserve active collaboration bandwidth right now.`
            : `${item.name} is specified well enough to move asynchronously without wasting anybody's calendar.`;

  const prep =
    mode === "decision-review"
      ? item.decisionNeeded || item.blocker || "Write the choice that actually needs a call."
      : mode === "quick-sync"
        ? missing.length ? `Clean up: ${missing.join(", ")}.` : `Bring the exact next step and any dependency for ${item.name}.`
        : mode === "deep-dive"
          ? `Protect quiet time and answer: what evidence would change the plan for ${item.name}?`
          : mode === "park"
            ? `Archive or deprioritize unless urgency changes.`
            : `Send one crisp update covering changed / matters / blocked / next.`;

  const output =
    mode === "decision-review"
      ? `A logged decision, named owner, and rewritten next step.`
      : mode === "quick-sync"
        ? `A resolved dependency and a cleaner handoff.`
        : mode === "deep-dive"
          ? `A decision-ready artifact or sharper recommendation.`
          : mode === "park"
            ? `A conscious deprioritization, not zombie work.`
            : `A short async note plus forward motion.`;

  return {
    id: item.id,
    workstreamName: item.name,
    mode,
    minutes,
    reason,
    prep,
    output,
    urgencyLabel,
  };
}


function buildRitualCadence({
  workstreams,
  decisions,
  budget,
  blockedCount,
  staleCount,
}: {
  workstreams: ScoredWorkstream[];
  decisions: Decision[];
  budget: Budget;
  blockedCount: number;
  staleCount: number;
}): RitualCadencePlan {
  const top = workstreams[0];
  const blocked = workstreams.find((item) => item.status === "blocked" || item.blocker.trim());
  const decision = decisions
    .slice()
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

  const items: RitualCadenceItem[] = [
    {
      id: "monday-reset",
      dayLabel: "Monday",
      title: "Priority reset",
      mode: "async",
      durationMinutes: 12,
      trigger: top ? `Before the first serious block, rewrite the top stack around ${top.name}.` : "Before work starts, rewrite the top 3 priorities.",
      purpose: "Kill fake urgency early and make the week legible before chat starts freelancing.",
      output: top ? `One crisp async note with focus order, why ${top.name} is first, and one thing that gets ignored.` : "One crisp async note with the week's focus order.",
    },
    {
      id: "tuesday-focus",
      dayLabel: blockedCount ? "Tuesday" : "Midweek",
      title: blocked ? "Unblock window" : "Focus protection",
      mode: blocked ? "sync" : "focus",
      durationMinutes: blocked ? Math.min(20, budget.syncMinutes || 20) : 45,
      trigger: blocked ? `${blocked.name} is blocked or carrying real dependency drag.` : top ? `${top.name} needs protected time more than another meeting.` : "The board needs a protected work block.",
      purpose: blocked ? "Resolve one dependency before it silently burns the week." : "Give the highest-value work enough uninterrupted attention to actually move.",
      output: blocked ? `One owner, one decision, one rewritten next step for ${blocked.name}.` : top ? `A decision-ready artifact or cleaner recommendation for ${top.name}.` : "One meaningful artifact, not just motion.",
    },
    {
      id: "wednesday-decision",
      dayLabel: "Wednesday",
      title: decision ? "Decision sprint" : "Board cleanup",
      mode: decision ? "sync" : "async",
      durationMinutes: decision ? 20 : 10,
      trigger: decision ? `${decision.topic} is the nearest meaningful call on the board.` : staleCount ? `${staleCount} workstreams are getting stale.` : "Use the middle of the week to keep drift from accumulating.",
      purpose: decision ? "Turn ambiguity into a real call while there is still time to use it." : "Clean stale work and rewrite any fuzzy next steps before they grow teeth.",
      output: decision ? `A logged decision on ${decision.topic}, with owner and follow-through date.` : "A cleaned top stack with sharper next steps and less drag.",
    },
    {
      id: "thursday-nudges",
      dayLabel: "Thursday",
      title: "Dependency sweep",
      mode: "async",
      durationMinutes: 10,
      trigger: blockedCount || staleCount ? "Run this before dependencies become Friday surprises." : "Run this lightly to stop the board from aging in silence.",
      purpose: "Flush open asks, overdue replies, and weak waiting states while there is still room to react.",
      output: "2-3 concrete follow-ups sent or consciously killed.",
    },
    {
      id: "friday-retro",
      dayLabel: "Friday",
      title: "Micro retro + snapshot",
      mode: "async",
      durationMinutes: 15,
      trigger: "End the week by checking whether the collaboration system got less annoying or just busier.",
      purpose: "Capture what is improving, what is rotting, and what ritual deserves to survive next week.",
      output: "One saved snapshot, one process fix, and one thing to stop doing next week.",
    },
  ];

  const syncMinutes = items.filter((item) => item.mode === "sync").reduce((sum, item) => sum + item.durationMinutes, 0);
  const asyncCount = items.filter((item) => item.mode === "async").length;
  const focusCount = items.filter((item) => item.mode === "focus").length;
  const headline = blockedCount
    ? `${blockedCount} blocked path${blockedCount === 1 ? " is" : "s are"} forcing a tighter cadence this week. Keep live time short and aim it only at unblock decisions.`
    : staleCount
      ? `${staleCount} stale thread${staleCount === 1 ? " is" : "s are"} pushing for a cleanup-heavy week. Keep the rhythm light but disciplined.`
      : `The board looks stable enough for an async-first operating rhythm with one protected focus ritual.`;
  const operatingSystem = [
    "WEEKLY COLLABORATION CADENCE",
    "",
    `Headline: ${headline}`,
    `Sync budget used: ${syncMinutes} / ${budget.syncMinutes} minutes`,
    `Async rituals: ${asyncCount}`,
    `Focus rituals: ${focusCount}`,
    "",
    ...items.map((item, index) => `${index + 1}. ${item.dayLabel} — ${item.title} (${item.mode}, ${item.durationMinutes} min)\n   Trigger: ${item.trigger}\n   Purpose: ${item.purpose}\n   Output: ${item.output}`),
  ].join("\n\n");

  return { items, syncMinutes, asyncCount, focusCount, headline, operatingSystem };
}

function buildInterventionSimulations({
  workstreams,
  decisions,
  budget,
}: {
  workstreams: Workstream[];
  decisions: Decision[];
  budget: Budget;
}): InterventionSimulation[] {
  const baselineScored = scoreWorkstreams(workstreams);
  const baselineHealth = collaborationHealthScore(baselineScored, decisions);
  const baselineBlocked = workstreams.filter((item) => item.status === "blocked").length;

  const scenarios = [
    {
      id: "clear-top-blocker",
      title: "Clear the top blocker",
      premise: "Assume David and Albert spend one clean pass removing the ugliest dependency on the most important item.",
      run: () => {
        const target = workstreams.find((item) => item.status === "blocked" || item.blocker.trim() || item.waitingOn.trim()) ?? workstreams[0];
        const nextWorkstreams: Workstream[] = workstreams.map((item) =>
          item.id === target?.id
            ? {
                ...item,
                status: (item.status === "done" ? "done" : "active") as Status,
                blocker: "",
                waitingOn: "",
                confidence: clamp(item.confidence + 2, 1, 10),
                lastTouched: todayIso(),
              }
            : item
        );
        return {
          workstreams: scoreWorkstreams(nextWorkstreams),
          decisions,
          budget,
          exactMove: target
            ? `Book 20 minutes to resolve "${target.name}". Leave with one owner, no blocker text, and a rewritten next step.`
            : "Add one real workstream first.",
        };
      },
    },
    {
      id: "decision-sprint",
      title: "Run a decision sprint",
      premise: "Assume one short decision review kills overdue ambiguity instead of letting it poison the week.",
      run: () => {
        const nextDecisions = decisions.map((item, index) =>
          index < 2
            ? { ...item, deadline: futureIso(3) }
            : item
        );
        const nextWorkstreams: Workstream[] = workstreams.map((item, index) =>
          index < 2 && item.decisionNeeded.trim()
            ? {
                ...item,
                confidence: clamp(item.confidence + 1, 1, 10),
                status: (item.status === "watch" ? "active" : item.status) as Status,
                lastTouched: todayIso(),
              }
            : item
        );
        return {
          workstreams: scoreWorkstreams(nextWorkstreams),
          decisions: nextDecisions,
          budget: { ...budget, syncMinutes: budget.syncMinutes + 20 },
          exactMove: "Hold a 20-minute decision review on the two oldest open calls. End with a yes/no and a dated owner for follow-through.",
        };
      },
    },
    {
      id: "protect-deep-work",
      title: "Protect deep work",
      premise: "Assume Albert gets real maker time back and one meeting disappears instead of chewing the calendar.",
      run: () => {
        const target = workstreams.find((item) => item.energy === "deep") ?? workstreams[0];
        const nextWorkstreams = workstreams.map((item) =>
          item.id === target?.id
            ? {
                ...item,
                confidence: clamp(item.confidence + 1, 1, 10),
                nextStep:
                  item.nextStep.trim().length >= 24
                    ? item.nextStep
                    : "Protect a 90-minute block and use it to finish the next concrete deliverable without context switching.",
                lastTouched: todayIso(),
              }
            : item
        );
        return {
          workstreams: scoreWorkstreams(nextWorkstreams),
          decisions,
          budget: { ...budget, deepHours: budget.deepHours + 3, syncMinutes: Math.max(0, budget.syncMinutes - 15) },
          exactMove: target
            ? `Protect three extra deep-work hours for "${target.name}" and cancel one low-yield sync.`
            : "Protect a block for the top item.",
        };
      },
    },
    {
      id: "async-cleanup",
      title: "Async cleanup sweep",
      premise: "Assume the messy handoffs get cleaned up before the next sync, so the meeting stops doing async work badly.",
      run: () => {
        const nextWorkstreams = workstreams.map((item, index) =>
          index < 3
            ? {
                ...item,
                nextStep:
                  item.nextStep.trim().length >= 24
                    ? item.nextStep
                    : `Send a crisp async update for ${item.name} with changed, why it matters, blocker, and exact next move.`,
                desiredOutcome: item.desiredOutcome || `A clean handoff and one obvious next move for ${item.name}.`,
                lastTouched: todayIso(),
              }
            : item
        );
        return {
          workstreams: scoreWorkstreams(nextWorkstreams),
          decisions,
          budget: { ...budget, lightHours: budget.lightHours + 1, syncMinutes: Math.max(0, budget.syncMinutes - 10) },
          exactMove: "Do a 15-minute async cleanup on the top three workstreams, then use the meeting only for decisions that still need a human call.",
        };
      },
    },
  ];

  return scenarios
    .map((scenario) => {
      const result = scenario.run();
      const nextHealth = collaborationHealthScore(result.workstreams, result.decisions);
      const nextBlocked = result.workstreams.filter((item) => item.status === "blocked").length;
      const nextFocus = result.workstreams[0]?.name ?? "No workstreams";
      const deltaHealth = nextHealth - baselineHealth;
      const deltaBlocked = nextBlocked - baselineBlocked;
      const deltaDeep = result.budget.deepHours - budget.deepHours;
      const deltaSync = result.budget.syncMinutes - budget.syncMinutes;
      return {
        id: scenario.id,
        title: scenario.title,
        premise: scenario.premise,
        deltaHealth,
        deltaBlocked,
        deltaDeep,
        deltaSync,
        nextFocus,
        summary:
          deltaHealth > 0
            ? `${scenario.title} improves collaboration health by ${deltaHealth} points and leaves ${nextFocus} on top.`
            : deltaHealth < 0
              ? `${scenario.title} makes the system worse by ${Math.abs(deltaHealth)} points. Nice theory, bad trade.`
              : `${scenario.title} barely moves the score, so only do it if the human context makes it worth it.`,
        exactMove: result.exactMove,
      };
    })
    .sort((a, b) => b.deltaHealth - a.deltaHealth);
}

function scoreWorkstreams(workstreams: Workstream[]): ScoredWorkstream[] {
  return [...workstreams]
    .map((item) => ({
      ...item,
      score: priorityScore(item),
      ageDays: daysSince(item.lastTouched),
      readiness: readinessScore(item),
      drag: collaborationDrag(item),
    }))
    .sort((a, b) => b.score - a.score);
}

function buildBudgetPlan(workstreams: ScoredWorkstream[], budget: Budget): BudgetPlan {
  const allocations = workstreams
    .filter((item) => item.status !== "done")
    .slice(0, 6)
    .map((item, index) => {
      const lane: BudgetAllocation["lane"] = item.status === "blocked"
        ? "sync"
        : item.energy === "deep"
          ? "deep"
          : item.waitingOn.trim() || item.decisionNeeded.trim() || item.drag >= 40
            ? "sync"
            : "light";
      const hours = lane === "deep" ? (item.status === "blocked" ? 0 : item.urgency >= 8 ? 3 : 2) : lane === "light" ? (item.urgency >= 8 ? 2 : 1) : 0;
      const minutes = lane === "sync" ? (item.status === "blocked" || item.decisionNeeded.trim() ? 20 : 10) : 0;
      const reason = lane === "deep"
        ? `${item.name} needs protected thinking, not more chat.`
        : lane === "sync"
          ? `${item.name} needs a decision or unblock conversation.`
          : `${item.name} can move with lighter execution energy.`;
      return { item, lane, hours, minutes, order: index, reason };
    });

  let deepLeft = budget.deepHours;
  let lightLeft = budget.lightHours;
  let syncLeft = budget.syncMinutes;

  const commit: BudgetAllocation[] = [];
  const stretch: BudgetAllocation[] = [];
  const defer: BudgetAllocation[] = [];

  allocations.forEach(({ item, lane, hours, minutes, reason }, index) => {
    const fits = lane === "deep" ? hours <= deepLeft : lane === "light" ? hours <= lightLeft : minutes <= syncLeft;
    const nearMiss = lane === "deep"
      ? hours <= deepLeft + 2
      : lane === "light"
        ? hours <= lightLeft + 1
        : minutes <= syncLeft + 15;
    const verdict: BudgetAllocation["verdict"] = fits ? "commit" : nearMiss && index <= 3 ? "stretch" : "defer";
    const allocation: BudgetAllocation = {
      workstreamName: item.name,
      lane,
      hours,
      minutes,
      verdict,
      reason,
      nextMove: item.nextStep,
    };

    if (verdict === "commit") {
      if (lane === "deep") deepLeft -= hours;
      if (lane === "light") lightLeft -= hours;
      if (lane === "sync") syncLeft -= minutes;
      commit.push(allocation);
    } else if (verdict === "stretch") {
      stretch.push(allocation);
    } else {
      defer.push(allocation);
    }
  });

  const deepUsed = budget.deepHours - deepLeft;
  const lightUsed = budget.lightHours - lightLeft;
  const syncUsed = budget.syncMinutes - syncLeft;
  const overload = stretch.length > 0 || defer.some((item) => item.lane !== "light" || item.hours > 0 || item.minutes > 0);
  const summary = overload
    ? `The board wants more than this week can hold. Commit ${commit.length}, keep ${stretch.length} as stretch, and explicitly defer ${defer.length} item${defer.length === 1 ? "" : "s"}.`
    : `The current top stack fits inside the budget. Weirdly adult behavior.`;
  const contract = [
    "COLLABORATION CONTRACT",
    "",
    `Budget: ${budget.deepHours}h deep · ${budget.lightHours}h light · ${budget.syncMinutes}m sync`,
    `Verdict: ${summary}`,
    "",
    "Commit:",
    ...(commit.length ? commit.map((item, index) => `${index + 1}. ${item.workstreamName} — ${item.lane} ${item.hours ? `${item.hours}h` : `${item.minutes}m`}\n   Why: ${item.reason}\n   Next: ${item.nextMove}`) : ["- Nothing committed yet."]),
    "",
    "Stretch:",
    ...(stretch.length ? stretch.map((item, index) => `${index + 1}. ${item.workstreamName} — ${item.lane} ${item.hours ? `${item.hours}h` : `${item.minutes}m`}\n   Why: ${item.reason}`) : ["- Nothing in stretch."]),
    "",
    "Defer:",
    ...(defer.length ? defer.map((item, index) => `${index + 1}. ${item.workstreamName} — stop pretending this fits automatically.`) : ["- Nothing deferred."]),
  ].join("\n");

  return { summary, overload, deepUsed, lightUsed, syncUsed, commit, stretch, defer, contract };
}

function buildNudgeQueue(workstreams: ScoredWorkstream[], decisions: Decision[]) {
  const items = workstreams
    .filter((item) => item.status !== "done")
    .flatMap((item) => {
      const nudges: NudgeItem[] = [];
      const target = inferNudgeTarget(item);
      const waitingReason = item.waitingOn.trim();
      const decisionReason = item.decisionNeeded.trim();
      const isStale = item.ageDays >= 3;
      const needsNudge = Boolean(waitingReason || decisionReason || item.status === "blocked" || (isStale && item.urgency >= 7));

      if (!needsNudge) return nudges;

      const urgency: NudgeItem["urgency"] = item.status === "blocked" || item.urgency >= 8 || item.drag >= 50
        ? "high"
        : item.ageDays >= 3 || item.waitingOn.trim()
          ? "medium"
          : "low";

      const reason = item.status === "blocked"
        ? `${item.name} is blocked and should not be left to quietly rot.`
        : waitingReason
          ? `${item.name} is waiting on an external answer, so silence is now part of the blocker.`
          : decisionReason
            ? `${item.name} needs a real choice, not more ambient discussion.`
            : `${item.name} is stale enough that a small follow-up is cheaper than more drift.`;

      const timing = urgency === "high" ? "today" : urgency === "medium" ? "within 24h" : "this week";
      const sendBy = urgency === "high"
        ? `Today by ${suggestSendHour(item, 16)}`
        : urgency === "medium"
          ? `Tomorrow by ${suggestSendHour(item, 11)}`
          : `This week by ${suggestSendHour(item, 15)}`;

      const message = [
        `Quick nudge on ${item.name}.`,
        `What changed: this work is currently ${item.status}${item.blocker.trim() ? ` because ${normalizeSentence(item.blocker).replace(/[.]$/, "")}` : ""}.`,
        `Why it matters: impact ${item.impact}/10, urgency ${item.urgency}/10, collaboration drag ${item.drag}%.`,
        `Need from ${target}: ${normalizeSentence(waitingReason || decisionReason || `Confirm whether ${item.name} should stay in the top stack.`)}`,
        `Exact next move after reply: ${normalizeSentence(item.nextStep)}`,
      ].join("\n");

      nudges.push({
        id: `${item.id}-nudge`,
        workstreamName: item.name,
        target,
        reason,
        urgency,
        timing,
        sendBy,
        message,
      });

      return nudges;
    })
    .slice(0, 6)
    .sort((a, b) => urgencyWeight(b.urgency) - urgencyWeight(a.urgency));

  const overdueDecisionItems = decisions.filter((item) => isPast(item.deadline)).length;
  const todayCount = items.filter((item) => item.timing === "today").length;
  const highCount = items.filter((item) => item.urgency === "high").length;
  const headline = items.length
    ? `${highCount ? `${highCount} high-urgency follow-up${highCount > 1 ? "s" : ""}` : "No emergency nudges"}, ${todayCount} that should go out today, and ${overdueDecisionItems} overdue decision${overdueDecisionItems === 1 ? "" : "s"} feeding the queue.`
    : `No nudges queued. Either the board is healthy or it is being suspiciously polite.`;
  const copyBlock = [
    "NUDGE QUEUE",
    "",
    ...items.map((item, index) => `${index + 1}. ${item.workstreamName} — ${item.urgency} urgency · ${item.sendBy}\nTarget: ${item.target}\nReason: ${item.reason}\n\n${item.message}`),
  ].join("\n\n");

  return {
    items,
    todayCount,
    highCount,
    decisionCount: overdueDecisionItems,
    headline,
    copyBlock,
  };
}

function buildCommitmentPulse(workstreams: ScoredWorkstream[], decisions: Decision[]): CommitmentPulse {
  const workstreamItems = workstreams
    .filter((item) => item.status !== "done")
    .map((item) => {
      const waiting = item.waitingOn.trim();
      const blocked = item.status === "blocked";
      const dueOffset = blocked ? 0 : item.urgency >= 9 ? 1 : item.urgency >= 7 ? 2 : item.ageDays >= 4 ? 3 : 5;
      const dueDate = futureIso(dueOffset);
      const lane: CommitmentLane = blocked || item.ageDays >= 5 || item.urgency >= 9
        ? "due-now"
        : waiting
          ? "waiting"
          : item.urgency >= 7 || item.ageDays >= 3 || item.confidence <= 6
            ? "this-week"
            : "stable";
      const risk = clamp(
        Math.round(item.score / 2 + item.drag / 5 + (blocked ? 16 : 0) + (waiting ? 8 : 0) + (item.ageDays >= 4 ? 8 : 0) + (item.confidence <= 6 ? 6 : 0)),
        45,
        99,
      );
      const owner = item.owner || inferNudgeTarget(item);
      const reason = blocked
        ? `${item.name} is blocked, and the board already knows why: ${normalizeSentence(item.blocker || "the current path is not moving")}`
        : waiting
          ? `${item.name} is effectively waiting on ${waiting}. Until that reply lands, silence is part of the risk.`
          : `${item.name} is still live work with urgency ${item.urgency}/10, confidence ${item.confidence}/10, and ${item.ageDays} day${item.ageDays === 1 ? "" : "s"} since it was last touched.`;
      const promise = blocked
        ? `Unblock ${item.name} and confirm the next concrete move by ${prettyDate(dueDate)}.`
        : waiting
          ? `Get a reply or explicit no by ${prettyDate(dueDate)}, then either move forward or re-scope.`
          : `Advance ${item.name} with one visible step by ${prettyDate(dueDate)}: ${normalizeSentence(item.nextStep)}`;
      const followUp = [
        `Quick check on ${item.name}.`,
        `Current risk: ${reason}`,
        `Commitment for the next ${lane === "due-now" ? "24 hours" : lane === "this-week" ? "72 hours" : "few days"}: ${promise}`,
        `If this is no longer the right commitment, say so directly and I’ll re-cut the board instead of pretending it is still fine.`,
      ].join("\n");
      const escalation = blocked || waiting
        ? `Escalate the dependency, cut scope, or drop it from the active stack.`
        : `Lower priority explicitly or convert it into a real decision review.`;
      return {
        id: `${item.id}-commitment`,
        source: "workstream" as const,
        title: item.name,
        owner,
        lane,
        dueDate,
        dueLabel: dueLabel(dueDate, lane),
        risk,
        reason,
        promise,
        followUp,
        escalation,
      };
    });

  const decisionItems = decisions.map((decision) => {
    const overdue = isPast(decision.deadline);
    const dueSoon = daysUntil(decision.deadline) <= 2;
    const lane: CommitmentLane = overdue ? "due-now" : dueSoon ? "this-week" : "stable";
    const risk = clamp(58 + (overdue ? 22 : 0) + (dueSoon ? 10 : 0) + (10 - decision.confidence) * 2, 48, 99);
    const owner = decision.options.match(/owner:\s*([^\n]+)/i)?.[1]?.trim() || "Decision owner";
    const reason = overdue
      ? `${decision.topic} is already overdue, which means uncertainty is now part of execution.`
      : `${decision.topic} needs a call by ${prettyDate(decision.deadline)} to avoid more drift in ${decision.impactArea}.`;
    const promise = `Close the decision or make the missing evidence explicit by ${prettyDate(decision.deadline)}.`;
    const followUp = [
      `Decision check: ${decision.topic}.`,
      `Why this needs attention: ${reason}`,
      `Commitment: ${promise}`,
      `Recommendation on the table: ${normalizeSentence(decision.recommendation)}`,
    ].join("\n");
    return {
      id: `${decision.id}-decision-commitment`,
      source: "decision" as const,
      title: decision.topic,
      owner,
      lane,
      dueDate: decision.deadline,
      dueLabel: dueLabel(decision.deadline, lane),
      risk,
      reason,
      promise,
      followUp,
      escalation: "Either decide, assign evidence gathering, or explicitly push the deadline.",
    };
  });

  const items = [...workstreamItems, ...decisionItems]
    .filter((item) => item.lane !== "stable" || item.risk >= 70)
    .sort((a, b) => b.risk - a.risk || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 8);

  const dueNowCount = items.filter((item) => item.lane === "due-now").length;
  const thisWeekCount = items.filter((item) => item.lane === "this-week").length;
  const waitingCount = items.filter((item) => item.lane === "waiting").length;
  const ownerCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.owner] = (acc[item.owner] ?? 0) + 1;
    return acc;
  }, {});
  const topOwner = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1])[0];
  const ownerLoad = topOwner ? `${topOwner[0]} ×${topOwner[1]}` : "Balanced";
  const headline = items.length
    ? `${dueNowCount} due now, ${thisWeekCount} due this week, ${waitingCount} trapped in dependency mode. Heaviest load sits with ${ownerLoad}.`
    : "No stressed commitments detected. Either things are tidy or the board is being weirdly optimistic.";
  const copyBlock = [
    "COMMITMENT PULSE",
    "",
    ...items.map((item, index) => `${index + 1}. ${item.title} — ${item.dueLabel} · risk ${item.risk}\nOwner: ${item.owner}\nReason: ${item.reason}\nPromise: ${item.promise}\nEscalation: ${item.escalation}\n\n${item.followUp}`),
  ].join("\n\n");

  return { items, dueNowCount, thisWeekCount, waitingCount, ownerLoad, headline, copyBlock };
}

function buildCalendarExportPlan({
  workstreams,
  decisions,
  cadence,
}: {
  workstreams: ScoredWorkstream[];
  decisions: Decision[];
  cadence: RitualCadencePlan;
}): CalendarExportPlan {
  const items: CalendarExportItem[] = [];
  const startOfWeek = nextMondayAt(9, 0);

  workstreams
    .filter((item) => item.status !== "done")
    .slice(0, 3)
    .forEach((item, index) => {
      const dayOffset = index === 0 ? 0 : index === 1 ? 1 : 3;
      const start = addMinutes(startOfWeek, dayOffset * 24 * 60 + (item.energy === "deep" ? 0 : 210));
      const durationMinutes = item.energy === "deep" ? 90 : item.status === "blocked" ? 30 : 45;
      items.push({
        id: `${item.id}-calendar-commitment`,
        title: item.status === "blocked" ? `Unblock · ${item.name}` : `Move · ${item.name}`,
        start: start.toISOString(),
        end: addMinutes(start, durationMinutes).toISOString(),
        category: "commitment",
        detail: `${item.nextStep} ${item.waitingOn.trim() ? `Dependency: ${item.waitingOn}` : ""}`.trim(),
      });
    });

  decisions
    .slice()
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 2)
    .forEach((decision, index) => {
      const date = isoToLocalDate(decision.deadline);
      const start = withTime(date, 13 + index, 0);
      items.push({
        id: `${decision.id}-calendar-decision`,
        title: `Decision review · ${decision.topic}`,
        start: start.toISOString(),
        end: addMinutes(start, 25).toISOString(),
        category: "decision",
        detail: decision.recommendation,
      });
    });

  cadence.items.slice(0, 3).forEach((item, index) => {
    const start = addMinutes(startOfWeek, index * 24 * 60 + 480);
    items.push({
      id: `${item.id}-calendar-ritual`,
      title: `${item.dayLabel} · ${item.title}`,
      start: start.toISOString(),
      end: addMinutes(start, item.durationMinutes).toISOString(),
      category: "ritual",
      detail: `${item.purpose} Output: ${item.output}`,
    });
  });

  const deduped = items
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 8);

  const headline = deduped.length
    ? `Built ${deduped.length} concrete calendar blocks from the current board. Import them, edit them, then let reality fight back.`
    : "No useful calendar blocks yet. The board needs more real work to schedule.";

  const ics = buildIcsFile(deduped);
  return { items: deduped, headline, ics };
}

function buildIcsFile(items: CalendarExportItem[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Albert Linux//Collab Cockpit//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const item of items) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@collab-cockpit`,
      `DTSTAMP:${toIcsUtc(new Date())}`,
      `DTSTART:${toIcsUtc(new Date(item.start))}`,
      `DTEND:${toIcsUtc(new Date(item.end))}`,
      `SUMMARY:${escapeIcsText(item.title)}`,
      `DESCRIPTION:${escapeIcsText(item.detail)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function toIcsUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function nextMondayAt(hour: number, minute: number) {
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const delta = ((8 - day) % 7) || 7;
  monday.setDate(monday.getDate() + delta);
  monday.setHours(hour, minute, 0, 0);
  return monday;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function isoToLocalDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

function withTime(date: Date, hour: number, minute: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
}

function calendarWindowLabel(startIso: string, endIso: string) {
  const formatter = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${formatter.format(start)} → ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(end)}`;
}

function inferNudgeTarget(item: ScoredWorkstream) {
  const waiting = item.waitingOn.toLowerCase();
  if (waiting.includes("david")) return "David";
  if (waiting.includes("albert")) return "Albert";
  if (item.owner.toLowerCase().includes("david")) return "David";
  if (item.owner.toLowerCase().includes("albert")) return "Albert";
  return item.owner || "Owner";
}

function suggestSendHour(item: ScoredWorkstream, fallbackHour: number) {
  const hour = item.urgency >= 8 ? Math.max(10, fallbackHour - 2) : fallbackHour;
  return `${String(hour).padStart(2, "0")}:00`;
}

function urgencyWeight(urgency: NudgeItem["urgency"]) {
  return urgency === "high" ? 3 : urgency === "medium" ? 2 : 1;
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

function dueLabel(date: string, lane: CommitmentLane) {
  const days = daysUntil(date);
  if (lane === "due-now") return days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "today" : "next 24h";
  if (lane === "waiting") return `waiting until ${prettyDate(date)}`;
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return `in ${days} days`;
  return prettyDate(date);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function futureIso(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
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

function splitDraft(text: string) {
  return text
    .split(/\n+/)
    .flatMap((chunk) => chunk.split(/(?<=[.!?])\s+/))
    .map((part) => part.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean);
}

function findSection(parts: string[], keywords: string[], fullText: string) {
  const lowered = fullText.toLowerCase();
  const line = parts.find((part) => keywords.some((keyword) => part.toLowerCase().includes(keyword)));
  if (line) return line;
  if (keywords.some((keyword) => lowered.includes(keyword))) {
    return fullText.trim();
  }
  return "";
}

function fallbackFromSentence(parts: string[], index: number) {
  return parts[index] ?? "";
}

function sentenceCount(text: string) {
  return splitDraft(text).length;
}

function hasRealSection(value: string, fallback: string) {
  const cleaned = value.trim();
  if (!cleaned) return false;
  if (cleaned === fallback) return false;
  return cleaned.length >= 12;
}

function normalizeSentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Missing.";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function uniqueList(items: string[]) {
  return [...new Set(items)];
}

function distillInboxDraft({
  draft,
  selected,
  focusNow,
}: {
  draft: string;
  selected?: Workstream;
  focusNow?: ScoredWorkstream;
}): InboxDistiller {
  const cleaned = draft.trim();
  const reference = selected ?? focusNow;
  const workstreamName = reference?.name || "General collaboration";
  const parts = splitDraft(cleaned);

  const changed = findSection(parts, ["changed", "shipped", "finished", "updated", "made", "added", "fixed", "launched", "refined"], cleaned)
    || fallbackFromSentence(parts, 0)
    || `Updated ${workstreamName}.`;
  const matters = findSection(parts, ["matters", "because", "impact", "so that", "why"], cleaned)
    || inferMatters(parts)
    || `It matters because cleaner collaboration around ${workstreamName} saves time and rework.`;
  const blocker = findSection(parts, ["blocked", "blocker", "stuck", "risk", "issue", "dependency"], cleaned)
    || detectBlocker(parts)
    || "";
  const waitingOn = detectWaitingOn(parts) || reference?.waitingOn || "";
  const decisionNeeded = findSection(parts, ["decide", "decision", "choose", "confirm", "approval"], cleaned)
    || detectDecision(parts)
    || reference?.decisionNeeded
    || "";
  const nextStep = findSection(parts, ["next", "then", "plan", "will", "follow"], cleaned)
    || detectNext(parts)
    || reference?.nextStep
    || "Name the next concrete move.";
  const desiredOutcome = inferOutcome(parts) || reference?.desiredOutcome || `A clearer shared plan for ${workstreamName}.`;
  const status: Status = blocker ? "blocked" : decisionNeeded ? "watch" : "active";
  const energy: Energy = /deep|investigate|analy[sz]e|strategy|recommendation|exception/i.test(cleaned) ? "deep" : blocker ? "stuck" : "light";
  const urgency = clamp(Math.round((reference?.urgency ?? 6) + (blocker ? 2 : 0) + (decisionNeeded ? 1 : 0)), 1, 10);
  const impact = clamp(Math.round((reference?.impact ?? 6) + (/customer|launch|revenue|critical|tenant|auth|central/i.test(cleaned) ? 1 : 0)), 1, 10);
  const confidence = clamp(Math.round((reference?.confidence ?? 6) - (/fuzzy|unclear|unsure|risk|unknown/i.test(cleaned) ? 2 : 0) - (blocker ? 1 : 0) + (/confirmed|resolved|shipped/i.test(cleaned) ? 1 : 0)), 1, 10);
  const notes = cleaned || reference?.notes || "";

  let score = 32;
  const signals: string[] = [];
  if (cleaned.length >= 60) score += 8;
  if (changed) {
    score += 14;
    signals.push("change detected");
  }
  if (matters) {
    score += 14;
    signals.push("impact detected");
  }
  if (blocker) {
    score += 10;
    signals.push("blocker detected");
  }
  if (decisionNeeded) {
    score += 10;
    signals.push("decision request");
  }
  if (waitingOn) {
    score += 6;
    signals.push("dependency named");
  }
  if (nextStep && nextStep.length >= 20) {
    score += 14;
    signals.push("next step extracted");
  }
  if (cleaned.length > 550) score -= 8;
  if (!cleaned) score = 18;
  score = clamp(score, 18, 100);

  const verdict = score >= 85 ? "sharp" : score >= 65 ? "usable" : "needs more signal";
  const updateTitle = toTitle(changed, workstreamName);
  const updateDetail = [
    `What changed: ${normalizeSentence(changed)}`,
    `Why it matters: ${normalizeSentence(matters)}`,
    `Blocked by: ${normalizeSentence(blocker || "No blocker right now")}`,
    `Exact next move: ${normalizeSentence(nextStep)}`,
  ].join(" ");
  const ask = waitingOn
    ? `Likely ask: ${normalizeSentence(waitingOn)}`
    : decisionNeeded
      ? `Likely ask: ${normalizeSentence(decisionNeeded)}`
      : `Likely ask: confirm whether ${workstreamName} still deserves current priority.`;
  const decisionSuggestion = decisionNeeded
    ? `Log a decision around this: ${normalizeSentence(decisionNeeded)}`
    : blocker
      ? `No clean decision request was written, but the blocker suggests David may need to choose a path or owner.`
      : `No obvious decision request. This reads more like execution status than a choice point.`;
  const cleanedBrief = [
    `What changed: ${normalizeSentence(changed)}`,
    `Why it matters: ${normalizeSentence(matters)}`,
    `Blocked by: ${normalizeSentence(blocker || "No blocker right now")}`,
    `Need from David: ${normalizeSentence(waitingOn || decisionNeeded || "No direct ask right now")}`,
    `Exact next move: ${normalizeSentence(nextStep)}`,
  ].join("\n");

  return {
    score,
    verdict,
    workstreamName,
    signals: signals.length ? uniqueList(signals) : ["weak signal"],
    suggestedPatch: {
      status,
      energy,
      impact,
      urgency,
      confidence,
      nextStep: normalizeSentence(nextStep),
      blocker: blocker ? normalizeSentence(blocker) : "",
      waitingOn: waitingOn ? normalizeSentence(waitingOn) : "",
      desiredOutcome: normalizeSentence(desiredOutcome),
      decisionNeeded: decisionNeeded ? normalizeSentence(decisionNeeded) : "",
      notes,
    },
    updateTitle,
    updateDetail,
    decisionSuggestion,
    ask,
    cleanedBrief,
  };
}

function analyzeConversationTranscript({
  draft,
  selected,
  focusNow,
}: {
  draft: string;
  selected?: Workstream;
  focusNow?: ScoredWorkstream;
}): ConversationDigest {
  const cleaned = draft.trim();
  const reference = selected ?? focusNow;
  const parts = splitDraft(cleaned);
  const names = [...new Set((cleaned.match(/[A-Z][a-z]+(?=:)/g) || []).map((name) => name.trim()))];
  const owner = names.find((name) => /David|Albert/i.test(name)) || reference?.owner || "Shared";
  const otherParty = names.find((name) => name !== owner) || (owner === "David" ? "Albert" : "David");
  const topicSeed = reference?.name || detectTopicFromTranscript(cleaned) || "Collaboration follow-up";
  const decisionLine = detectDecision(parts);
  const blocker = detectBlocker(parts);
  const nextLine = detectNext(parts) || parts.find((part) => /(i'll|i will|we'll|we will|follow up|update|send|write|confirm|draft)/i.test(part)) || "Turn the thread into a sharper plan.";
  const due = detectDueDate(cleaned);
  const summary = cleaned
    ? `${topicSeed} looks like the main thread. ${names.length ? `People detected: ${names.join(", ")}.` : "No speakers clearly named."}`
    : "Paste a conversation and the translator will pull out the useful bits.";
  const update = [
    `What changed: ${normalizeSentence(parts[0] || `Reviewed the thread around ${topicSeed}`)}`,
    `Why it matters: ${normalizeSentence(inferMatters(parts) || `The conversation changes how ${topicSeed} should move next.`)}`,
    `Blocked by: ${normalizeSentence(blocker || "No blocker explicitly surfaced")}`,
    `Need from David: ${normalizeSentence(cleaned.toLowerCase().includes("david") ? (decisionLine || detectWaitingOn(parts) || "Confirm the chosen direction") : "No direct ask right now")}`,
    `Exact next move: ${normalizeSentence(nextLine)}`,
  ].join("\n");

  const actions: TranscriptAction[] = extractTranscriptActions(parts, topicSeed, due, owner, otherParty);
  const decisions: TranscriptDecisionItem[] = decisionLine
    ? [{
        id: cryptoId(),
        topic: toTitle(decisionLine, topicSeed),
        owner: cleaned.toLowerCase().includes("david") ? "David" : owner,
        due,
        recommendation: normalizeSentence(decisionLine),
        impactArea: topicSeed,
      }]
    : [];

  let score = 34;
  if (cleaned.length >= 120) score += 12;
  if (names.length >= 2) score += 10;
  if (actions.length) score += 18;
  if (decisions.length) score += 12;
  if (blocker) score += 6;
  if (nextLine) score += 10;
  score = clamp(score, 18, 100);

  const topAction = actions[0];
  const createdWorkstream: Omit<Workstream, "id"> = {
    name: topicSeed,
    owner: topAction?.owner || owner,
    status: blocker ? "blocked" : decisions.length ? "watch" : "active",
    energy: /strategy|analy[sz]e|recommend|exception|tradeoff|deep/i.test(cleaned) ? "deep" : blocker ? "stuck" : "light",
    impact: clamp((reference?.impact ?? 6) + (decisions.length ? 1 : 0), 1, 10),
    urgency: clamp((reference?.urgency ?? 6) + (blocker ? 2 : actions.length ? 1 : 0), 1, 10),
    confidence: clamp((reference?.confidence ?? 6) - (blocker ? 1 : 0) + (decisions.length ? 1 : 0), 1, 10),
    lastTouched: todayIso(),
    nextStep: normalizeSentence(topAction?.task || nextLine),
    blocker: blocker ? normalizeSentence(blocker) : "",
    notes: cleaned,
    waitingOn: cleaned.toLowerCase().includes("david") ? normalizeSentence(decisionLine || detectWaitingOn(parts) || "David confirmation on direction") : "",
    desiredOutcome: normalizeSentence(inferOutcome(parts) || `A cleaner collaboration plan for ${topicSeed}`),
    decisionNeeded: decisions[0]?.recommendation || "",
  };

  const nextSync = decisions.length
    ? `Run a short decision sync on ${decisions[0].topic}, then push the rest async.`
    : actions.length
      ? `Skip a big meeting. Just confirm ownership on ${actions[0].task.toLowerCase()} and let the work move.`
      : `The thread is still vague. Ask one clarifying question before it grows teeth.`;

  return {
    score,
    summary,
    nextSync,
    actions,
    decisions,
    update,
    createdWorkstream,
  };
}

function extractTranscriptActions(parts: string[], topicSeed: string, due: string, owner: string, otherParty: string): TranscriptAction[] {
  return parts
    .filter((part) => /(i'll|i will|we'll|we will|follow up|update|send|write|confirm|draft|turn this into|log the decision|ship)/i.test(part))
    .slice(0, 4)
    .map((part, index) => {
      const normalizedOwner = /^David:/i.test(part) ? "David" : /^Albert:/i.test(part) ? "Albert" : /david/i.test(part) ? "David" : /albert/i.test(part) ? "Albert" : index === 0 ? owner : otherParty;
      const urgency: TranscriptAction["urgency"] = /today|asap|now|urgent|by monday/i.test(part) ? "high" : /this week|soon|tomorrow/i.test(part) ? "medium" : "low";
      return {
        id: cryptoId(),
        owner: normalizedOwner,
        task: normalizeSentence(stripSpeaker(part)),
        due,
        urgency,
        workstreamName: topicSeed,
        why: normalizeSentence(inferMatters(parts) || `This keeps ${topicSeed} from drifting back into chat sludge.`),
      };
    });
}

function detectTopicFromTranscript(text: string) {
  const matches = text.match(/[A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,3}/g) || [];
  const ranked = matches
    .map((item) => item.trim())
    .filter((item) => item.length >= 8 && !/^(David|Albert|Monday|Tuesday|Wednesday|Thursday|Friday)$/i.test(item))
    .sort((a, b) => b.length - a.length);
  return ranked[0] || "";
}

function detectDueDate(text: string) {
  const lowered = text.toLowerCase();
  if (lowered.includes('today')) return todayIso();
  if (lowered.includes('tomorrow')) return futureIso(1);
  if (lowered.includes('next week') || lowered.includes('this week')) return futureIso(7);
  const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const now = new Date();
  for (let i = 0; i < weekdays.length; i += 1) {
    if (lowered.includes(weekdays[i])) {
      const date = new Date(now);
      const delta = (i - now.getDay() + 7) % 7 || 7;
      date.setDate(now.getDate() + delta);
      return date.toISOString().slice(0, 10);
    }
  }
  return futureIso(3);
}

function stripSpeaker(text: string) {
  return text.replace(/^[A-Z][a-z]+:\s*/, '').trim();
}

function detectBlocker(parts: string[]) {
  return parts.find((part) => /(blocked|stuck|waiting on|dependency|can't|cannot|risk|issue)/i.test(part)) || "";
}

function detectWaitingOn(parts: string[]) {
  return parts.find((part) => /(need david|waiting on|need from david|need approval|need input|need confirm|need confirmation|ask david)/i.test(part)) || "";
}

function detectDecision(parts: string[]) {
  return parts.find((part) => /(decide|decision|choose|confirm whether|approval|go\/no-go|happy path|tradeoff)/i.test(part)) || "";
}

function detectNext(parts: string[]) {
  return parts.find((part) => /(next|then i|next i|i will|plan is|follow up|turn that into|update plan)/i.test(part)) || "";
}

function inferMatters(parts: string[]) {
  const explicit = parts.find((part) => /(reduce|save|improve|matters|impact|important|helps|unblocks)/i.test(part));
  if (explicit) return explicit;
  const first = parts[1];
  return first && first.length >= 20 ? first : "";
}

function inferOutcome(parts: string[]) {
  return parts.find((part) => /(outcome|so that|in order to|goal|result|recommendation|plan)/i.test(part)) || "";
}

function toTitle(changed: string, fallback: string) {
  const cleaned = changed.replace(/^what changed:\s*/i, "").trim();
  const short = cleaned.split(/[.!?]/)[0].trim();
  if (!short) return `Update on ${fallback}`;
  return short.length > 72 ? `${short.slice(0, 69).trimEnd()}...` : short;
}
