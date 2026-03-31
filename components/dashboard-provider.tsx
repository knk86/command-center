"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────

type AgentStatus = "idle" | "working" | "error" | "offline";

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

const INITIAL_AGENTS: Agent[] = [
  { id: "market-scout", name: "Market Scout", role: "Market Research & Trend Analysis", status: "working", model: "minimax/minimax-m2.7", cost: 0.12, messages: 47, lastActivity: new Date(Date.now() - 120000).toISOString(), tmuxSession: "market-scout" },
  { id: "competitor-analyzer", name: "Competitor Analyzer", role: "Competitive Intelligence", status: "idle", model: "minimax/minimax-m2.7", cost: 0, messages: 0, lastActivity: "", tmuxSession: "competitor-analyzer" },
  { id: "idea-scorer", name: "Idea Scorer", role: "Idea Validation & MVP Scoping", status: "idle", model: "minimax/minimax-m2.7", cost: 0, messages: 0, lastActivity: "", tmuxSession: "idea-scorer" },
  { id: "architect", name: "System Architect", role: "System Design & Technical Specs", status: "idle", model: "anthropic/claude-sonnet-4.6", cost: 0, messages: 0, lastActivity: "", tmuxSession: "architect" },
  { id: "backend-dev", name: "Backend Dev", role: "Backend Engineering (FastAPI, PostgreSQL, RAG)", status: "idle", model: "anthropic/claude-sonnet-4.6", cost: 0, messages: 0, lastActivity: "", tmuxSession: "backend-dev" },
  { id: "frontend-ux-dev", name: "Frontend / UX Dev", role: "Frontend Engineering & UX", status: "idle", model: "anthropic/claude-sonnet-4.6", cost: 0, messages: 0, lastActivity: "", tmuxSession: "frontend-ux-dev" },
  { id: "qa-debug", name: "QA / Debug Agent", role: "QA, Testing & Debugging", status: "idle", model: "anthropic/claude-sonnet-4.6", cost: 0, messages: 0, lastActivity: "", tmuxSession: "qa-debug" },
  { id: "growth", name: "Growth Agent", role: "SEO, Content & Paid Acquisition", status: "idle", model: "minimax/minimax-m2.7", cost: 0, messages: 0, lastActivity: "", tmuxSession: "growth" },
  { id: "publishing", name: "Publishing Agent", role: "Launch & Community", status: "idle", model: "minimax/minimax-m2.7", cost: 0, messages: 0, lastActivity: "", tmuxSession: "publishing" },
];

const INITIAL_ACTIVITIES: Activity[] = [
  { id: "a1", agentId: "market-scout", agentName: "Market Scout", action: "Research complete: Top 3 SaaS ideas identified — Field Service AI KB ranked #1", timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: "a2", agentId: "market-scout", agentName: "Market Scout", action: "Scraping Reddit for HVAC technician pain points...", timestamp: new Date(Date.now() - 180000).toISOString() },
  { id: "a3", agentId: "market-scout", agentName: "Market Scout", action: "Analyzing paperclip.ing for AI SaaS inspiration", timestamp: new Date(Date.now() - 300000).toISOString() },
];

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Validate Field Service AI KB idea with 5 real technicians", priority: "high", assignedTo: "market-scout", status: "in_progress", dueIn: "2h" },
  { id: "t2", title: "Write SPEC.md for AI-KB system architecture", priority: "high", assignedTo: "architect", status: "pending", dueIn: "4h" },
  { id: "t3", title: "Build Command Center dashboard — agent overview + cost tracking", priority: "high", assignedTo: "frontend-ux-dev", status: "in_progress", dueIn: "6h" },
  { id: "t4", title: "Set up FastAPI backend with PostgreSQL + pgvector", priority: "high", assignedTo: "backend-dev", status: "pending", dueIn: "8h" },
  { id: "t5", title: "Deploy dashboard to Vercel with live URL", priority: "medium", assignedTo: "frontend-ux-dev", status: "pending", dueIn: "6h" },
  { id: "t6", title: "Write Playwright tests for agent status polling", priority: "medium", assignedTo: "qa-debug", status: "pending", dueIn: "10h" },
  { id: "t7", title: "Competitor analysis: HouseCall Pro, Jobber, Fieldd", priority: "medium", assignedTo: "competitor-analyzer", status: "pending", dueIn: "3h" },
];

const AVAILABLE_MODELS = [
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-opus-4.6",
  "minimax/minimax-m2.7",
  "google/gemini-2.5-flash",
  "openai/gpt-4o",
];

// ── Components ────────────────────────────────────────────

function StatusBadge({ status }: { status: AgentStatus }) {
  const configs = {
    working: { label: "Working", class: "bg-green-500/20 text-green-400 border-green-500/40", pulse: "status-working" },
    idle: { label: "Idle", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", pulse: "" },
    error: { label: "Error", class: "bg-red-500/20 text-red-400 border-red-500/40", pulse: "" },
    offline: { label: "Offline", class: "bg-gray-500/20 text-gray-400 border-gray-500/40", pulse: "" },
  };
  const cfg = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${cfg.pulse}`} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const configs = {
    high: "bg-red-500/20 text-red-400 border-red-500/40",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${configs[priority]}`}>
      {priority}
    </span>
  );
}

function AgentRow({ agent, onModelChange }: { agent: Agent; onModelChange: (id: string, model: string) => void }) {
  return (
    <tr className="border-b border-border hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-sm">
            {agent.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-sm">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.tmuxSession}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground max-w-[180px]">{agent.role}</td>
      <td className="py-3 px-4"><StatusBadge status={agent.status} /></td>
      <td className="py-3 px-4">
        <select
          value={agent.model}
          onChange={(e) => onModelChange(agent.id, e.target.value)}
          className="bg-input border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {AVAILABLE_MODELS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </td>
      <td className="py-3 px-4 text-xs font-mono">
        {agent.cost > 0 ? <span className="gold-text">${agent.cost.toFixed(4)}</span> : "—"}
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground">{agent.messages > 0 ? agent.messages : "—"}</td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {agent.lastActivity ? new Date(agent.lastActivity).toLocaleTimeString() : "—"}
      </td>
    </tr>
  );
}

function ActivityFeed({ activities }: { activities: Activity[] }) {
  const formatTime = (ts: string) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="flex gap-3">
          <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] gold-text font-bold">{a.agentName.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-foreground leading-relaxed">{a.action}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              <span className="gold-text">{a.agentName}</span> · {formatTime(a.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskInbox({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PriorityBadge priority={t.priority} />
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                t.status === "done" ? "bg-green-500/20 text-green-400" :
                t.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {t.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-xs font-medium text-foreground">{t.title}</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {t.assignedTo} · due in {t.dueIn}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [tasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<"agents" | "inbox">("agents");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Simulate live cost updates for working agents
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.status === "working"
            ? { ...a, cost: +(a.cost + Math.random() * 0.003).toFixed(4), messages: a.messages + 1 }
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ─────────────────────────────────── */}
      <header className="border-b border-border bg-card">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="font-bold text-lg gold-text">Command Center</h1>
              <p className="text-[10px] text-muted-foreground">Alfred's SaaS Pipeline · Live</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-working" />
              <span className="text-xs text-green-400 font-medium">System Online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* ── Stat Strip ────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Agent Table ─────────────────────────── */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-sm">Agent Overview</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Live status · Model switching · Cost tracking</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("agents")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "agents" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Agents
                </button>
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "inbox" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Inbox ({tasks.filter((t) => t.status !== "done").length})
                </button>
              </div>
            </div>

            {activeTab === "agents" ? (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold">Agent</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold">Model</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold">Cost</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold">Msgs</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <AgentRow key={agent.id} agent={agent} onModelChange={handleModelChange} />
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

          {/* ── Activity Feed ──────────────────────── */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Recent Activity</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Live feed from active agents</p>
            </div>
            <div className="p-4 overflow-y-auto max-h-[500px]">
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>

        {/* ── SaaS Product Card ─────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Active MVP</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                  In Progress
                </span>
              </div>
              <h2 className="text-lg font-bold gold-text">Field Service AI Knowledge Base</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                AI-powered knowledge base for HVAC/Plumbing/Electrical technicians. RAG pipeline + voice search + real-time
                manual lookup. Target: $49-149/technician/month. 500K+ contractors in the US alone.
              </p>
              <div className="flex gap-4 mt-3">
                {[
                  { label: "Target Market", value: "HVAC/Field Service" },
                  { label: "Pricing", value: "$49–149/tech/mo" },
                  { label: "Top Competitor", value: "HouseCall Pro" },
                  { label: "Build Time", value: "5–7 weeks" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                    <div className="text-xs font-medium gold-text">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary font-medium text-center">
                Idea Score: 9/10
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-xs text-green-400 font-medium text-center">
                Pain: Critical
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
