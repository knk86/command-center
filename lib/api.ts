// ── API Client ────────────────────────────────────────────────
// Points to the FastAPI backend. In development it falls back to
// mock data so the dashboard still renders without a live backend.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────

export type AgentStatus = "idle" | "working" | "error" | "offline";

export interface Agent {
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

export interface Activity {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  assignedTo: string;
  status: "pending" | "in_progress" | "done";
  dueIn: string;
}

export interface DailyBudget {
  spent: number;
  limit: number; // always 5.00
  date: string;
}

// ── Mock data (fallback when backend is unreachable) ───────────

export const MOCK_AGENTS: Agent[] = [
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

export const MOCK_ACTIVITIES: Activity[] = [
  { id: "a1", agentId: "market-scout", agentName: "Market Scout", action: "Research complete: Top 3 SaaS ideas identified — Field Service AI KB ranked #1", timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: "a2", agentId: "market-scout", agentName: "Market Scout", action: "Scraping Reddit for HVAC technician pain points...", timestamp: new Date(Date.now() - 180000).toISOString() },
  { id: "a3", agentId: "market-scout", agentName: "Market Scout", action: "Analyzing paperclip.ing for AI SaaS inspiration", timestamp: new Date(Date.now() - 300000).toISOString() },
];

export const MOCK_TASKS: Task[] = [
  { id: "t1", title: "Validate Field Service AI KB idea with 5 real technicians", priority: "high", assignedTo: "market-scout", status: "in_progress", dueIn: "2h" },
  { id: "t2", title: "Write SPEC.md for AI-KB system architecture", priority: "high", assignedTo: "architect", status: "pending", dueIn: "4h" },
  { id: "t3", title: "Build Command Center dashboard — agent overview + cost tracking", priority: "high", assignedTo: "frontend-ux-dev", status: "in_progress", dueIn: "6h" },
  { id: "t4", title: "Set up FastAPI backend with PostgreSQL + pgvector", priority: "high", assignedTo: "backend-dev", status: "pending", dueIn: "8h" },
  { id: "t5", title: "Deploy dashboard to Vercel with live URL", priority: "medium", assignedTo: "frontend-ux-dev", status: "pending", dueIn: "6h" },
  { id: "t6", title: "Write Playwright tests for agent status polling", priority: "medium", assignedTo: "qa-debug", status: "pending", dueIn: "10h" },
  { id: "t7", title: "Competitor analysis: HouseCall Pro, Jobber, Fieldd", priority: "medium", assignedTo: "competitor-analyzer", status: "pending", dueIn: "3h" },
];

// ── Fetch helpers ─────────────────────────────────────────────

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchAgents(): Promise<Agent[]> {
  return apiFetch<Agent[]>("/api/agents", MOCK_AGENTS);
}

export async function fetchActivities(): Promise<Activity[]> {
  return apiFetch<Activity[]>("/api/activities", MOCK_ACTIVITIES);
}

export async function fetchTasks(): Promise<Task[]> {
  return apiFetch<Task[]>("/api/tasks", MOCK_TASKS);
}

export async function fetchDailyBudget(): Promise<DailyBudget> {
  const fallback: DailyBudget = { spent: 0, limit: 5, date: new Date().toISOString().slice(0, 10) };
  return apiFetch<DailyBudget>("/api/budget/daily", fallback);
}
