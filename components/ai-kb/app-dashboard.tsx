"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  brand: string;
  modelNumber: string;
  excerpt: string;
  page: number;
  relevance: number;
  category: "hvac" | "plumbing" | "electrical";
}

interface ChatMsg {
  id: string;
  role: "user" | "ai";
  content: string;
  sources?: string[];
  timestamp: Date;
}

// ── Mock data ──────────────────────────────────────────────

const MOCK_RESULTS: SearchResult[] = [
  {
    id: "r1",
    title: "Carrier 5-Ton Split System — Error Code E4 Diagnosis",
    brand: "Carrier",
    modelNumber: "24ACC636A003",
    excerpt: "Error code E4 indicates a high-pressure lockout. Check condenser coil for restrictions, verify refrigerant charge, and inspect the high-pressure switch (SW2). If coil temp exceeds 130°F, clean condenser fins before resetting.",
    page: 47,
    relevance: 98,
    category: "hvac",
  },
  {
    id: "r2",
    title: "Carrier 24ACC Series — Refrigerant Charging Procedure",
    brand: "Carrier",
    modelNumber: "24ACC636A003",
    excerpt: "For R-410A systems: attach manifold gauges to service ports. Target subcooling 8–12°F at outdoor unit. Add refrigerant in liquid phase only. Do not exceed 410 psig high-side pressure during charging.",
    page: 63,
    relevance: 84,
    category: "hvac",
  },
  {
    id: "r3",
    title: "Carrier General Troubleshooting — High-Pressure Switch Reset",
    brand: "Carrier",
    modelNumber: "All Split Systems",
    excerpt: "High-pressure switch auto-resets after pressure drops below 550 psig. Manual reset required after 3 consecutive lockouts. Locate reset button behind control panel cover. Hold for 5 seconds until LED flashes twice.",
    page: 12,
    relevance: 71,
    category: "hvac",
  },
];

const QUICK_SEARCHES = [
  "Carrier error code E4",
  "Trane furnace won't ignite",
  "Bradford White water heater T&P valve",
  "Square D breaker keeps tripping",
  "Lennox AC not cooling",
  "Rheem heat pump defrost cycle",
];

const RECENT_DOCS = [
  { title: "Carrier 24ACC Series Installation Manual", brand: "Carrier", lastViewed: "2m ago", pages: 124 },
  { title: "Trane XR15 Service Manual", brand: "Trane", lastViewed: "1h ago", pages: 89 },
  { title: "Company SOP — Refrigerant Handling", brand: "Internal", lastViewed: "Yesterday", pages: 8 },
];

const INITIAL_CHAT: ChatMsg[] = [
  {
    id: "init",
    role: "ai",
    content: "Hi! I'm your FieldAI assistant. I have access to your full manual library and company SOPs. Ask me anything — 'How do I charge a 5-ton Carrier unit?' or 'What does error code E4 mean?'",
    sources: [],
    timestamp: new Date(),
  },
];

// ── Category badge ─────────────────────────────────────────

function CategoryBadge({ cat }: { cat: SearchResult["category"] }) {
  const cls = {
    hvac: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    plumbing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    electrical: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  const label = { hvac: "HVAC", plumbing: "Plumbing", electrical: "Electrical" };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cls[cat]}`}>
      {label[cat]}
    </span>
  );
}

// ── App Dashboard ──────────────────────────────────────────

export default function AIKBDashboard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeView, setActiveView] = useState<"search" | "chat" | "library">("search");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSearch = (q: string = query) => {
    if (!q.trim()) return;
    setQuery(q);
    setSearching(true);
    setResults([]);
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setSearching(false);
    }, 800 + Math.random() * 400);
  };

  const handleVoice = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const demoQuery = "Carrier 5 ton error code E4";
      setQuery(demoQuery);
      handleSearch(demoQuery);
    }, 2000);
  };

  const handleChat = () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: chatInput.trim(), timestamp: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      const aiMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `Based on the Carrier 24ACC service manual (p.47), Error Code E4 is a **high-pressure lockout**. Here's the diagnostic procedure:\n\n1. Check condenser coil for dirt, debris, or restrictions\n2. Verify refrigerant charge — subcooling should be 8–12°F\n3. Inspect high-pressure switch SW2 for continuity\n4. If coil temp exceeds 130°F, clean fins before resetting\n\nTo reset: hold the reset button behind the control panel for 5 seconds until LED flashes twice. If it trips again within 1 hour, replace the high-pressure switch.`,
        sources: ["Carrier 24ACC Manual p.47", "Carrier 24ACC Manual p.12"],
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      setChatLoading(false);
    }, 1500 + Math.random() * 700);
  };

  return (
    <div className="min-h-screen bg-[#000] text-white flex flex-col">
      {/* ── Top Nav ──────────────────────────────────────── */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/ai-kb" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37] flex items-center justify-center">
                <span className="text-black font-bold text-xs">F</span>
              </div>
              <span className="font-bold text-sm hidden sm:block">FieldAI</span>
            </Link>
            <span className="text-[#2a2a2a]">|</span>
            <span className="text-xs text-[#888]">AirTech HVAC · Pro Plan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#111] border border-[#2a2a2a] rounded-xl p-0.5">
              {(["search", "chat", "library"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${activeView === v ? "bg-[#D4AF37] text-black" : "text-[#888] hover:text-white"}`}
                >
                  {v === "search" ? "🔍 Search" : v === "chat" ? "💬 Ask AI" : "📚 Library"}
                </button>
              ))}
            </div>
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
              M
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* ── SEARCH VIEW ────────────────────────────────── */}
        {activeView === "search" && (
          <div className="space-y-6">
            {/* Search bar */}
            <div className="max-w-3xl mx-auto">
              <h1 className="text-xl font-bold text-center mb-2">
                Find anything in your <span className="text-[#D4AF37]">manual library</span>
              </h1>
              <p className="text-xs text-[#888] text-center mb-5">10,000+ HVAC, plumbing, and electrical manuals · Your company SOPs</p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="e.g. Carrier 5-ton error code E4, Trane furnace ignition sequence..."
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors"
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleVoice}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center text-base transition-all ${isListening ? "bg-red-500/20 border-red-500/60 text-red-400 animate-pulse" : "bg-[#111] border-[#2a2a2a] text-[#888] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"}`}
                  title="Voice search"
                >
                  🎙️
                </button>
                <button
                  onClick={() => handleSearch()}
                  disabled={!query.trim()}
                  className="px-5 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#B8962E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>

              {isListening && (
                <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  Listening... speak now
                </div>
              )}

              {/* Quick searches */}
              {!results.length && !searching && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[10px] text-[#555] self-center">Try:</span>
                  {QUICK_SEARCHES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSearch(q)}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-[#111] border border-[#2a2a2a] text-[#888] hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="max-w-3xl mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#888]">{results.length} results for &ldquo;{query}&rdquo;</span>
                  <button
                    onClick={() => setActiveView("chat")}
                    className="text-xs text-[#D4AF37] hover:underline"
                  >
                    Ask AI about this →
                  </button>
                </div>
                {results.map((r) => (
                  <div key={r.id} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#D4AF37]/30 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge cat={r.category} />
                        <span className="text-[10px] text-[#555]">{r.brand} · {r.modelNumber}</span>
                        <span className="text-[10px] text-[#555]">p.{r.page}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-12 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${r.relevance}%` }} />
                        </div>
                        <span className="text-[10px] text-[#D4AF37] font-mono">{r.relevance}%</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-2 group-hover:text-[#D4AF37] transition-colors">{r.title}</h3>
                    <p className="text-xs text-[#888] leading-relaxed">{r.excerpt}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button className="text-[11px] text-[#D4AF37] hover:underline font-medium">Open Manual →</button>
                      <button className="text-[11px] text-[#888] hover:text-white">Bookmark</button>
                      <button className="text-[11px] text-[#888] hover:text-white">Share</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent docs */}
            {!results.length && !searching && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">Recently Viewed</h2>
                <div className="space-y-2">
                  {RECENT_DOCS.map((d) => (
                    <div key={d.title} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] hover:border-[#D4AF37]/30 transition-colors cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-sm flex-shrink-0">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium group-hover:text-[#D4AF37] transition-colors truncate">{d.title}</div>
                        <div className="text-[10px] text-[#555]">{d.brand} · {d.pages} pages · {d.lastViewed}</div>
                      </div>
                      <span className="text-[#555] text-xs">→</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CHAT VIEW ──────────────────────────────────── */}
        {activeView === "chat" && (
          <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)]">
            <div className="mb-4">
              <h1 className="text-lg font-bold">Ask AI <span className="text-[#D4AF37]">anything</span></h1>
              <p className="text-xs text-[#888]">Powered by your manual library + company SOPs · GPT-4o with RAG</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "bg-[#D4AF37] text-black rounded-2xl rounded-br-md px-4 py-3" : "bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl rounded-bl-md px-4 py-3"}`}>
                    <div className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#2a2a2a] flex flex-wrap gap-1.5">
                        {msg.sources.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                            📄 {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-black/60" : "text-[#555]"}`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
            <div className="flex gap-2 border-t border-[#1a1a1a] pt-4">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="Ask about any manual, error code, or procedure..."
                rows={1}
                className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] resize-none"
              />
              <button
                onClick={handleChat}
                disabled={!chatInput.trim() || chatLoading}
                className="px-4 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#B8962E] disabled:opacity-40 transition-colors"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* ── LIBRARY VIEW ───────────────────────────────── */}
        {activeView === "library" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">Document Library</h1>
                <p className="text-xs text-[#888] mt-0.5">10,247 manuals · 3 company SOPs · Last updated 2h ago</p>
              </div>
              <button className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#B8962E] transition-colors">
                + Upload Document
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "❄️", label: "HVAC", count: "6,842 docs", color: "border-blue-500/30 bg-blue-500/5" },
                { icon: "💧", label: "Plumbing", count: "2,103 docs", color: "border-cyan-500/30 bg-cyan-500/5" },
                { icon: "⚡", label: "Electrical", count: "1,302 docs", color: "border-yellow-500/30 bg-yellow-500/5" },
              ].map((cat) => (
                <div key={cat.label} className={`rounded-2xl border p-5 ${cat.color} cursor-pointer hover:opacity-80 transition-opacity`}>
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="font-semibold">{cat.label}</div>
                  <div className="text-xs text-[#888] mt-1">{cat.count}</div>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">Company Documents</h2>
              <div className="space-y-2">
                {[
                  { title: "Refrigerant Handling SOP", uploaded: "Mike Torres", date: "2 days ago", pages: 8 },
                  { title: "Customer Invoice Template", uploaded: "Sarah Chen", date: "1 week ago", pages: 2 },
                  { title: "New Tech Onboarding Guide", uploaded: "Admin", date: "2 weeks ago", pages: 24 },
                ].map((d) => (
                  <div key={d.title} className="flex items-center gap-4 p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] hover:border-[#D4AF37]/30 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-base flex-shrink-0">
                      📋
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium group-hover:text-[#D4AF37] transition-colors">{d.title}</div>
                      <div className="text-[10px] text-[#555] mt-0.5">Uploaded by {d.uploaded} · {d.date} · {d.pages} pages</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">Company</span>
                      <span className="text-[#555]">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
