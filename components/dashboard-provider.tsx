"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ────────────────────────────────────────────────

type AgentStatus = "idle" | "working" | "error" | "offline";
type Tab = "agents" | "inbox" | "saas" | "org";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  model: string;
  cost: number;
  messages: number;
  lastActivity: string;
  tmuxSession: string;
  phase: 1 | 2 | 3;
  emoji: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

interface Activity {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  timestamp: string;
}

interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  assignedTo: string;
  status: "pending" | "in_progress" | "done";
  dueIn: string;
}

// ── Mock data ────────────────────────────────────────────

// Static ISO timestamps — no Date.now() calls at module level (causes SSR/hydration mismatch)
// Relative "X ago" labels are computed in the render function via useEffect or suppressHydrationWarning
const MS = { m2: 120000, s30: 30000 };

const INITIAL_AGENTS: Agent[] = [
  { id: "market-scout", name: "Market Scout", role: "Market Research & Trend Analysis", status: "working", model: "minimax/minimax-m2.7", cost: 0.12, messages: 47, lastActivity: "2026-03-31T14:08:00.000Z", tmuxSession: "market-scout", phase: 1, emoji: "🔍" },
  { id: "competitor-analyzer", name: "Competitor Analyzer", role: "Competitive Intelligence", status: "idle", model: "minimax/minimax-m2.7", cost: 0, messages: 0, lastActivity: "", tmuxSession: "competitor-analyzer", phase: 1, emoji: "📊" },
  { id: "idea-scorer", name: "Idea Scorer", role: "Idea Validation & MVP Scoping", status: "idle", model: "minimax/minimax-m2.7", cost: 0, messages: 0, lastActivity: "", tmuxSession: "idea-scorer", phase: 1, emoji: "💡" },
  { id: "architect", name: "System Architect", role: "System Design & Technical Specs", status: "idle", model: "anthropic/claude-sonnet-4.6", cost: 0, messages: 0, lastActivity: "", tmuxSession: "architect", phase: 2, emoji: "🏗️" },
  { id: "backend-dev", name: "Backend Dev", role: "Backend Engineering (FastAPI, PostgreSQL, RAG)", status: "idle", model: "anthropic/claude-sonnet-4.6", cost: 0, messages: 0, lastActivity: "", tmuxSession: "backend-dev", phase: 2, emoji: "⚙️" },
  { id: "frontend-ux-dev", name: "Frontend / UX Dev", role: "Frontend Engineering & UX", status: "working", model: "anthropic/claude-sonnet-4.6", cost: 0.08, messages: 12, lastActivity: "2026-03-31T14:10:00.000Z", tmuxSession: "frontend-ux-dev", phase: 2, emoji: "🎨" },
  { id: "qa-debug", name: "QA / Debug", role: "QA, Testing & Debugging", status: "idle", model: "anthropic/claude-sonnet-4.6", cost: 0, messages: 0, lastActivity: "", tmuxSession: "qa-debug", phase: 2, emoji: "🧪" },
  { id: "growth", name: "Growth Agent", role: "SEO, Content & Paid Acquisition", status: "offline", model: "minimax/minimax-m2.7", cost: 0, messages: 0, lastActivity: "", tmuxSession: "growth", phase: 3, emoji: "📈" },
  { id: "publishing", name: "Publishing Agent", role: "Launch & Community", status: "offline", model: "minimax/minimax-m2.7", cost: 0, messages: 0, lastActivity: "", tmuxSession: "publishing", phase: 3, emoji: "🚀" },
];

const INITIAL_ACTIVITIES: Activity[] = [
  { id: "a1", agentId: "frontend-ux-dev", agentName: "Frontend / UX Dev", action: "Building Command Center dashboard — agent overview, cost tracking, SaaS pipeline view", timestamp: new Date(Date.now() - 30000).toISOString() },
  { id: "a2", agentId: "market-scout", agentName: "Market Scout", action: "Research complete: Top 3 SaaS ideas — Field Service AI KB ranked #1 with 9/10 score", timestamp: new Date(Date.now() - 90000).toISOString() },
  { id: "a3", agentId: "market-scout", agentName: "Market Scout", action: "Scraping Reddit r/HVAC for technician pain points: manual lookup cited 340+ times", timestamp: new Date(Date.now() - 210000).toISOString() },
  { id: "a4", agentId: "market-scout", agentName: "Market Scout", action: "Analyzing paperclip.ing for AI SaaS inspiration and autonomous org patterns", timestamp: new Date(Date.now() - 360000).toISOString() },
];

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Validate Field Service AI KB idea with 5 real technicians", priority: "high", assignedTo: "market-scout", status: "in_progress", dueIn: "2h" },
  { id: "t2", title: "Write SPEC.md for AI-KB system architecture", priority: "high", assignedTo: "architect", status: "pending", dueIn: "4h" },
  { id: "t3", title: "Build Command Center dashboard — agent overview + cost tracking", priority: "high", assignedTo: "frontend-ux-dev", status: "in_progress", dueIn: "6h" },
  { id: "t4", title: "Set up FastAPI backend with PostgreSQL + pgvector", priority: "high", assignedTo: "backend-dev", status: "pending", dueIn: "8h" },
  { id: "t5", title: "Build AI-KB SaaS landing page + auth shell", priority: "high", assignedTo: "frontend-ux-dev", status: "pending", dueIn: "10h" },
  { id: "t6", title: "Deploy dashboard to Vercel / localtunnel with live URL", priority: "medium", assignedTo: "frontend-ux-dev", status: "pending", dueIn: "6h" },
  { id: "t7", title: "Write Playwright tests for agent status polling", priority: "medium", assignedTo: "qa-debug", status: "pending", dueIn: "12h" },
  { id: "t8", title: "Competitor deep-dive: HouseCall Pro, Jobber, Fieldd", priority: "medium", assignedTo: "competitor-analyzer", status: "pending", dueIn: "3h" },
];

const SAAS_FEATURES = [
  { id: "f1", title: "AI-Powered Manual Search", desc: "Semantic search across 10,000+ HVAC/plumbing/electrical manuals", status: "planned", priority: "core" },
  { id: "f2", title: "Voice Search On-Site", desc: "Hands-free lookup via Whisper — technicians speak, AI finds the answer", status: "planned", priority: "core" },
  { id: "f3", title: "Document Upload & Indexing", desc: "Upload proprietary manuals, SOPs, and service docs — auto-indexed with pgvector", status: "planned", priority: "core" },
  { id: "f4", title: "Multi-Tenant Auth (Supabase)", desc: "Company accounts + technician sub-accounts with role-based access", status: "in_dev", priority: "core" },
  { id: "f5", title: "Mobile-First Tech App", desc: "PWA + responsive — designed for field use, works offline with cached docs", status: "planned", priority: "core" },
  { id: "f6", title: "Team Knowledge Base", desc: "Company-specific SOPs, troubleshooting guides, notes — shareable", status: "planned", priority: "plus" },
  { id: "f7", title: "AI Chat with Context", desc: "Ask follow-up questions about a manual or procedure — GPT-4o with RAG context", status: "planned", priority: "plus" },
  { id: "f8", title: "Usage Analytics & Billing", desc: "Track per-technician usage, auto-bill monthly, Stripe integration", status: "planned", priority: "enterprise" },
];

const PHASES = [
  {
    id: 1,
    name: "Research",
    subtitle: "Market validation & idea scoring",
    status: "active",
    agents: ["market-scout", "competitor-analyzer", "idea-scorer"],
    deliverable: "Chosen SaaS idea + MVP scope",
  },
  {
    id: 2,
    name: "Build",
    subtitle: "System design + parallel dev",
    status: "queued",
    agents: ["architect", "backend-dev", "frontend-ux-dev", "qa-debug"],
    deliverable: "Working MVP deployed on Railway + Vercel",
  },
  {
    id: 3,
    name: "Launch",
    subtitle: "GTM + community + SEO",
    status: "locked",
    agents: ["growth", "publishing"],
    deliverable: "First paying customers",
  },
];

const AVAILABLE_MODELS = [
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-opus-4.6",
  "minimax/minimax-m2.7",
  "google/gemini-2.5-flash",
  "openai/gpt-4o",
];

const DAILY_BUDGET = 5.0;

// ── Helpers ──────────────────────────────────────────────

function formatRelTime(ts: string) {
  if (!ts) return "—";
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── StatusBadge ───────────────────────────────────────────

function StatusBadge({ status }: { status: AgentStatus }) {
  const configs = {
    working: { label: "Working", cls: "bg-green-500/20 text-green-400 border-green-500/40", dot: "bg-green-400 status-working" },
    idle: { label: "Idle", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", dot: "bg-yellow-400" },
    error: { label: "Error", cls: "bg-red-500/20 text-red-400 border-red-500/40", dot: "bg-red-400" },
    offline: { label: "Offline", cls: "bg-gray-600/30 text-gray-500 border-gray-600/40", dot: "bg-gray-500" },
  };
  const c = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── PriorityBadge ─────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const cls = {
    high: "bg-red-500/20 text-red-400 border-red-500/40",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${cls[priority]}`}>
      {priority}
    </span>
  );
}

// ── ChatDrawer ────────────────────────────────────────────

function ChatDrawer({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", role: "agent", content: `Hello! I'm ${agent.name}, your ${agent.role}. How can I help you today?`, timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setTimeout(() => {
      const agentResp: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: `Message received. I'm currently ${agent.status === "working" ? "working on your task" : "idle and ready"}. As your ${agent.role}, I'll process your request and report back.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentResp]);
      setSending(false);
    }, 1200 + Math.random() * 800);
  }, [input, sending, agent]);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-lg">
              {agent.emoji}
            </div>
            <div>
              <div className="font-semibold text-sm gold-text">{agent.name}</div>
              <div className="flex items-center gap-2">
                <StatusBadge status={agent.status} />
                <span className="text-[10px] text-muted-foreground">{agent.model.split("/")[1]}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors">
            ✕
          </button>
        </div>
        <div className="px-5 py-2 border-b border-border bg-secondary/30">
          <span className="text-[10px] text-muted-foreground">{agent.role}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary border border-border text-foreground rounded-bl-md"}`}>
                <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-secondary border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message ${agent.name}...`}
              rows={1}
              className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <button onClick={sendMessage} disabled={!input.trim() || sending} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors">
              →
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">tmux: {agent.tmuxSession}</span>
            <span className="text-[10px] text-muted-foreground ml-auto">Phase {agent.phase}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── AgentRow ──────────────────────────────────────────────

function AgentRow({ agent, onModelChange, onChat }: { agent: Agent; onModelChange: (id: string, model: string) => void; onChat: (a: Agent) => void }) {
  return (
    <tr className="border-b border-border hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-base">
            {agent.emoji}
          </div>
          <div>
            <div className="font-medium text-sm">{agent.name}</div>
            <div className="text-[10px] text-muted-foreground">{agent.tmuxSession}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground max-w-[180px] hidden md:table-cell">{agent.role}</td>
      <td className="py-3 px-4"><StatusBadge status={agent.status} /></td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <select
          value={agent.model}
          onChange={(e) => onModelChange(agent.id, e.target.value)}
          className="bg-input border border-border rounded px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {AVAILABLE_MODELS.map((m) => <option key={m} value={m}>{m.split("/")[1]}</option>)}
        </select>
      </td>
      <td className="py-3 px-4 text-xs font-mono">
        {agent.cost > 0 ? <span className="gold-text">${agent.cost.toFixed(4)}</span> : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">{agent.messages > 0 ? agent.messages : "—"}</td>
      <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">{formatRelTime(agent.lastActivity)}</td>
      <td className="py-3 px-4">
        <button onClick={() => onChat(agent)} className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 hover:border-primary/50 transition-all text-xs" title={`Chat with ${agent.name}`}>
          💬
        </button>
      </td>
    </tr>
  );
}

// ── ActivityFeed ──────────────────────────────────────────

function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div className="space-y-3">
      {activities.map((a) => {
        const agent = INITIAL_AGENTS.find((ag) => ag.id === a.agentId);
        return (
          <div key={a.id} className="flex gap-3">
            <div className="mt-0.5 w-7 h-7 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 text-sm">
              {agent?.emoji ?? "🤖"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground leading-relaxed">{a.action}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                <span className="gold-text">{a.agentName}</span> · {formatRelTime(a.timestamp)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TaskInbox ─────────────────────────────────────────────

function TaskInbox({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <PriorityBadge priority={t.priority} />
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === "done" ? "bg-green-500/20 text-green-400" : t.status === "in_progress" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                {t.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-xs font-medium text-foreground">{t.title}</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              <span className="gold-text">{t.assignedTo}</span> · due in {t.dueIn}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BudgetBar ─────────────────────────────────────────────

function BudgetBar({ totalCost }: { totalCost: number }) {
  const pct = Math.min((totalCost / DAILY_BUDGET) * 100, 100);
  const isWarning = pct >= 70;
  const isCritical = pct >= 90;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Daily Budget</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 gold-text font-mono">
            ${totalCost.toFixed(4)} / ${DAILY_BUDGET.toFixed(2)}
          </span>
        </div>
        <span className={`text-xs font-mono font-semibold ${isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "gold-text"}`}>
          {pct.toFixed(1)}% used
        </span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isCritical ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── PipelineTracker ───────────────────────────────────────

function PipelineTracker({ agents }: { agents: Agent[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-sm">Pipeline Progress</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">Research → Build → Launch</p>
      </div>
      <div className="flex items-start gap-0">
        {PHASES.map((phase, i) => {
          const phaseAgents = agents.filter((a) => phase.agents.includes(a.id));
          const workingInPhase = phaseAgents.filter((a) => a.status === "working").length;
          const isActive = phase.status === "active";
          const isQueued = phase.status === "queued";
          const isLocked = phase.status === "locked";
          return (
            <div key={phase.id} className="flex-1 flex items-start">
              <div className={`flex-1 rounded-xl border p-4 transition-all ${isActive ? "border-primary/60 bg-primary/5 gold-glow" : isQueued ? "border-border bg-secondary/20" : "border-border/40 bg-secondary/10 opacity-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-primary text-black" : isQueued ? "bg-secondary border border-border text-muted-foreground" : "bg-secondary/50 border border-border/40 text-muted-foreground/50"}`}>
                    {phase.id}
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${isActive ? "gold-text" : "text-foreground"}`}>{phase.name}</div>
                    <div className="text-[10px] text-muted-foreground">{phase.subtitle}</div>
                  </div>
                  {isActive && workingInPhase > 0 && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 status-working">
                      {workingInPhase} active
                    </span>
                  )}
                  {isLocked && <span className="ml-auto text-muted-foreground/40 text-xs">🔒</span>}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {phaseAgents.map((a) => (
                    <span key={a.id} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${a.status === "working" ? "bg-green-500/10 text-green-400 border border-green-500/20" : a.status === "idle" ? "bg-secondary text-muted-foreground border border-border" : "bg-secondary/30 text-muted-foreground/50 border border-border/30"}`}>
                      {a.emoji} {a.name.split(" ")[0]}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2 mt-1">
                  → {phase.deliverable}
                </div>
              </div>
              {i < PHASES.length - 1 && (
                <div className="flex items-center justify-center w-6 pt-5 flex-shrink-0">
                  <span className={`text-lg ${isActive ? "gold-text" : "text-muted-foreground/30"}`}>›</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SaaSView ──────────────────────────────────────────────

function SaaSView() {
  const tiers = [
    { name: "Starter", price: "$49", unit: "/tech/mo", features: ["AI manual search", "Voice lookup", "5 technicians", "Standard support"], color: "border-border" },
    { name: "Professional", price: "$89", unit: "/tech/mo", features: ["Everything in Starter", "Document upload & indexing", "Team knowledge base", "AI chat with context", "Priority support"], color: "border-primary/60", highlight: true },
    { name: "Enterprise", price: "$149", unit: "/tech/mo", features: ["Everything in Pro", "Unlimited technicians", "Custom integrations", "Analytics & billing", "Dedicated CSM"], color: "border-border" },
  ];

  const featurePriorityColors: Record<string, string> = {
    core: "bg-primary/20 text-primary border-primary/30",
    plus: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    enterprise: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider gold-text font-semibold">Active MVP · Phase 1</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 status-working">In Progress</span>
            </div>
            <h2 className="text-xl font-bold gold-text">Field Service AI Knowledge Base</h2>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              AI-powered knowledge base for HVAC / Plumbing / Electrical technicians. RAG pipeline + voice search + real-time manual lookup.
              Target: $49–149 per technician per month. 500K+ field service contractors in the US alone.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {[
                { label: "Target Market", value: "HVAC / Field Service" },
                { label: "Pricing", value: "$49–149/tech/mo" },
                { label: "Top Competitor", value: "HouseCall Pro" },
                { label: "Build Estimate", value: "5–7 weeks" },
              ].map((item) => (
                <div key={item.label} className="bg-secondary/30 rounded-lg p-2.5">
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  <div className="text-xs font-semibold gold-text mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-center">
              <div className="text-[10px] text-muted-foreground">Idea Score</div>
              <div className="text-lg font-bold gold-text">9/10</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
              <div className="text-[10px] text-muted-foreground">Pain Level</div>
              <div className="text-xs font-bold text-red-400">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider text-[11px]">Pricing Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div key={tier.name} className={`bg-card border rounded-xl p-5 ${tier.color} ${tier.highlight ? "gold-glow" : ""} relative`}>
              {tier.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-black text-[10px] font-bold">
                  Most Popular
                </div>
              )}
              <div className="mb-3">
                <div className="text-sm font-semibold">{tier.name}</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold gold-text">{tier.price}</span>
                  <span className="text-xs text-muted-foreground">{tier.unit}</span>
                </div>
              </div>
              <ul className="space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-primary mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Roadmap */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider text-[11px]">Feature Roadmap</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAAS_FEATURES.map((f) => (
            <div key={f.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="text-sm font-medium">{f.title}</div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${featurePriorityColors[f.priority]}`}>
                    {f.priority}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${f.status === "in_dev" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
                    {f.status}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 gold-text">Tech Stack</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { layer: "Frontend", tech: "Next.js 15 + TypeScript + Tailwind + shadcn", icon: "⚛️" },
            { layer: "Backend", tech: "FastAPI + Python", icon: "🐍" },
            { layer: "Database", tech: "PostgreSQL + pgvector", icon: "🗄️" },
            { layer: "AI", tech: "GPT-4o + Whisper + Embeddings", icon: "🧠" },
            { layer: "Auth", tech: "Supabase", icon: "🔐" },
            { layer: "Infra", tech: "Vercel + Railway", icon: "☁️" },
          ].map((s) => (
            <div key={s.layer} className="bg-secondary/30 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <div className="text-[10px] font-semibold gold-text uppercase tracking-wide">{s.layer}</div>
              <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.tech}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── OrgChart ──────────────────────────────────────────────

function OrgView({ agents, onChat }: { agents: Agent[]; onChat: (a: Agent) => void }) {
  return (
    <div className="space-y-4">
      {/* Alfred — CEO node */}
      <div className="flex justify-center">
        <div className="bg-primary/10 border border-primary/60 rounded-2xl p-4 w-56 text-center gold-glow">
          <div className="text-3xl mb-2">👑</div>
          <div className="font-bold gold-text text-sm">Alfred</div>
          <div className="text-[10px] text-muted-foreground">Orchestrator / CEO</div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-working" />
            <span className="text-[10px] text-green-400">Orchestrating</span>
          </div>
        </div>
      </div>

      {/* Connector line */}
      <div className="flex justify-center">
        <div className="w-px h-6 bg-primary/30" />
      </div>

      {/* Phases */}
      {PHASES.map((phase, pi) => {
        const phaseAgents = agents.filter((a) => phase.agents.includes(a.id));
        const isActive = phase.status === "active";
        return (
          <div key={phase.id}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-full h-px ${isActive ? "bg-primary/30" : "bg-border/50"}`} />
              <div className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${isActive ? "bg-primary/10 border-primary/40 gold-text" : "bg-secondary border-border text-muted-foreground"}`}>
                Phase {phase.id}: {phase.name}
              </div>
              <div className={`w-full h-px ${isActive ? "bg-primary/30" : "bg-border/50"}`} />
            </div>
            <div className={`grid gap-3 ${phaseAgents.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
              {phaseAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => onChat(agent)}
                  className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 hover:bg-white/[0.02] agent-card ${agent.status === "working" ? "border-green-500/40" : agent.status === "offline" ? "border-border/30 opacity-50" : "border-border"}`}
                >
                  <div className="text-2xl mb-2">{agent.emoji}</div>
                  <div className="text-xs font-semibold text-foreground">{agent.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{agent.role.split("(")[0].trim()}</div>
                  <div className="mt-2">
                    <StatusBadge status={agent.status} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    {agent.model.split("/")[1]}
                  </div>
                  {agent.cost > 0 && (
                    <div className="text-[10px] gold-text font-mono mt-0.5">${agent.cost.toFixed(4)}</div>
                  )}
                </div>
              ))}
            </div>
            {pi < PHASES.length - 1 && (
              <div className="flex justify-center mt-3">
                <div className="w-px h-4 bg-border/40" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [tasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<Tab>("agents");
  const [activeAgentSubTab, setActiveAgentSubTab] = useState<"agents" | "inbox">("agents");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);

  // Simulate live updates for working agents
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.status === "working"
            ? { ...a, cost: +(a.cost + Math.random() * 0.003).toFixed(4), messages: a.messages + 1, lastActivity: new Date().toISOString() }
            : a
        )
      );
      setLastRefresh(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleModelChange = useCallback((agentId: string, model: string) => {
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, model } : a)));
  }, []);

  const totalCost = agents.reduce((sum, a) => sum + a.cost, 0);
  const workingCount = agents.filter((a) => a.status === "working").length;
  const idleCount = agents.filter((a) => a.status === "idle").length;
  const pendingTasks = tasks.filter((t) => t.status !== "done").length;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "agents", label: "Agents", icon: "🤖" },
    { id: "saas", label: "SaaS MVP", icon: "🚀" },
    { id: "org", label: "Org Chart", icon: "🏢" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {chatAgent && <ChatDrawer agent={chatAgent} onClose={() => setChatAgent(null)} />}

      {/* ── Header ──────────────────────────────────────── */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-base">A</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg gold-text leading-none">Command Center</h1>
              <p className="text-[10px] text-muted-foreground">Alfred&apos;s SaaS Pipeline · Live</p>
            </div>
          </div>

          {/* Tab nav — desktop */}
          <div className="hidden sm:flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground hidden md:block">
              {lastRefresh.toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-working" />
              <span className="text-xs text-green-400 font-medium hidden sm:block">Live</span>
            </div>
          </div>
        </div>

        {/* Tab nav — mobile */}
        <div className="sm:hidden flex items-center gap-1 px-4 pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Budget Bar ─────────────────────────────────── */}
        <BudgetBar totalCost={totalCost} />

        {/* ── Stat Strip ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Agents", value: agents.length, icon: "🤖", accent: false },
            { label: "Working", value: workingCount, icon: "⚡", accent: true },
            { label: "Idle", value: idleCount, icon: "💤", accent: false },
            { label: "Total Cost", value: `$${totalCost.toFixed(4)}`, icon: "💰", accent: true },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 agent-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-base">{stat.icon}</span>
              </div>
              <div className={`text-2xl font-bold font-mono ${stat.accent ? "gold-text" : "text-foreground"}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Pipeline Tracker (always visible) ──────────── */}
        <PipelineTracker agents={agents} />

        {/* ── Tab Content ────────────────────────────────── */}
        {activeTab === "agents" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent table */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="font-semibold text-sm">Agent Overview</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Live status · Model switching · Cost tracking</p>
                </div>
                <div className="flex gap-1">
                  {(["agents", "inbox"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveAgentSubTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeAgentSubTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {t === "inbox" ? `Inbox (${pendingTasks})` : "Agents"}
                    </button>
                  ))}
                </div>
              </div>

              {activeAgentSubTab === "agents" ? (
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4">Agent</th>
                        <th className="text-left py-3 px-4 hidden md:table-cell">Role</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4 hidden lg:table-cell">Model</th>
                        <th className="text-left py-3 px-4">Cost</th>
                        <th className="text-left py-3 px-4 hidden sm:table-cell">Msgs</th>
                        <th className="text-left py-3 px-4 hidden xl:table-cell">Last Active</th>
                        <th className="text-left py-3 px-4">Chat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <AgentRow key={agent.id} agent={agent} onModelChange={handleModelChange} onChat={setChatAgent} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 overflow-y-auto max-h-[500px]">
                  <TaskInbox tasks={tasks} />
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-sm">Activity Feed</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Live stream from active agents</p>
              </div>
              <div className="p-4 overflow-y-auto max-h-[500px]">
                <ActivityFeed activities={activities} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "saas" && <SaaSView />}

        {activeTab === "org" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="mb-4">
              <h2 className="font-semibold text-sm">Organization Chart</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Click any agent to open a chat drawer</p>
            </div>
            <OrgView agents={agents} onChat={setChatAgent} />
          </div>
        )}
      </main>
    </div>
  );
}
