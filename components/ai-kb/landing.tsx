"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

// ── Data ──────────────────────────────────────────────────

const PRICING: PricingTier[] = [
  {
    name: "Starter",
    price: "$49",
    period: "/tech/month",
    description: "For small shops with 1–5 technicians",
    features: [
      "AI manual search (10,000+ docs)",
      "Voice search on-site",
      "Up to 5 technicians",
      "Standard manuals library",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$89",
    period: "/tech/month",
    description: "For growing teams of 5–20 technicians",
    features: [
      "Everything in Starter",
      "Upload proprietary manuals",
      "Team knowledge base + SOPs",
      "AI chat with follow-up questions",
      "Priority support + Slack",
      "Mobile PWA (offline access)",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/tech/month",
    description: "For large fleets of 20+ technicians",
    features: [
      "Everything in Professional",
      "Unlimited technicians",
      "Custom integrations (ServiceTitan, etc.)",
      "Usage analytics & billing reports",
      "Dedicated Customer Success Manager",
      "SSO + advanced security",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const FEATURES = [
  {
    icon: "🔍",
    title: "AI Semantic Search",
    desc: "Type or speak a symptom — get the exact page in the manual instantly. No more flipping through 400-page PDFs on a hot rooftop.",
  },
  {
    icon: "🎙️",
    title: "Hands-Free Voice Lookup",
    desc: "Say 'Carrier 5-ton unit, error code E4' and get the fix in seconds. Works with dirty gloves, in tight spaces, in the dark.",
  },
  {
    icon: "📄",
    title: "Document Upload & Indexing",
    desc: "Upload your company SOPs, proprietary manuals, and service bulletins. Automatically indexed and searchable by your whole team.",
  },
  {
    icon: "🧠",
    title: "AI Troubleshooting Chat",
    desc: "Ask follow-up questions about any procedure. The AI understands context — ask 'what if the capacitor checks out?' and get a real answer.",
  },
  {
    icon: "📱",
    title: "Mobile-First, Works Offline",
    desc: "Built for the field. Loads fast on 3G, works offline with cached docs, and fits in one hand. No laptop required.",
  },
  {
    icon: "🏢",
    title: "Team Knowledge Base",
    desc: "Share notes, create SOPs, and build your company's institutional knowledge. When a veteran tech retires, his knowledge stays.",
  },
];

const PAIN_STATS = [
  { stat: "2.5 hrs", label: "lost per tech per week to manual lookup", icon: "⏱️" },
  { stat: "$4,200", label: "annual productivity loss per technician", icon: "💸" },
  { stat: "500K+", label: "HVAC contractors in the US alone", icon: "🏗️" },
  { stat: "89%", label: "of techs say finding manuals is their #1 frustration", icon: "😤" },
];

const TESTIMONIALS = [
  {
    name: "Mike Torres",
    role: "Service Manager, AirTech HVAC",
    avatar: "M",
    quote: "My guys were spending 45 minutes per call looking up specs. With FieldAI, it's under 2 minutes. That's 3 more jobs per tech per week.",
  },
  {
    name: "Sarah Chen",
    role: "Owner, Precision Plumbing",
    avatar: "S",
    quote: "The voice search is a game changer. My techs are on the phone, under a sink, with their hands full. They just talk to it now.",
  },
  {
    name: "Dave Okonkwo",
    role: "Lead Electrician, Spark Electrical",
    avatar: "D",
    quote: "We uploaded all our company SOPs and now every tech has our 10 years of experience in their pocket. Onboarding new guys is 3x faster.",
  },
];

// ── Nav ────────────────────────────────────────────────────

function Nav({ waitlistCount }: { waitlistCount: number }) {
  return (
    <nav className="sticky top-0 z-40 bg-[#000]/90 backdrop-blur-md border-b border-[#2a2a2a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center">
            <span className="text-black font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-white text-base">FieldAI</span>
          <span className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-medium">BETA</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-[#888]">
            {waitlistCount.toLocaleString()} techs waiting
          </span>
          <Link
            href="/ai-kb/dashboard"
            className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#B8962E] transition-colors"
          >
            Try Demo
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Landing Page ──────────────────────────────────────────

export default function AIKBLanding() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [waitlistCount] = useState(247);
  const [billingPeriod] = useState<"monthly" | "annual">("monthly");

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#000] text-white">
      <Nav waitlistCount={waitlistCount} />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            {waitlistCount} field service technicians on the waitlist
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Stop wasting time<br />
            <span className="text-[#D4AF37]">hunting for manuals</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#888] max-w-2xl mx-auto mb-10 leading-relaxed">
            FieldAI gives every technician instant AI-powered access to 10,000+ manuals, voice search,
            and a team knowledge base — on any device, in the field.
          </p>

          {!submitted ? (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@company.com"
                required
                className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#B8962E] transition-all hover:shadow-lg hover:shadow-[#D4AF37]/20"
              >
                Join Waitlist
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 max-w-md mx-auto mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <span className="text-green-400">✓</span>
              <span className="text-green-400 text-sm font-medium">You&apos;re on the waitlist! We&apos;ll be in touch.</span>
            </div>
          )}

          <p className="text-xs text-[#555]">No credit card required · Free 14-day trial · Cancel anytime</p>

          {/* Demo CTA */}
          <div className="mt-8">
            <Link
              href="/ai-kb/dashboard"
              className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#B8962E] font-medium transition-colors"
            >
              <span>→ See the live demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pain Stats ─────────────────────────────────── */}
      <section className="border-y border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {PAIN_STATS.map((s) => (
              <div key={s.stat} className="text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold text-[#D4AF37] font-mono">{s.stat}</div>
                <div className="text-xs text-[#888] mt-1 leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Built for the field, not the office</h2>
          <p className="text-[#888] text-sm max-w-xl mx-auto">Every feature designed for a technician with dirty hands, on a hot rooftop, with a customer waiting.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#D4AF37]/30 transition-all hover:bg-[#D4AF37]/[0.03] group">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-2 group-hover:text-[#D4AF37] transition-colors">{f.title}</h3>
              <p className="text-xs text-[#888] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────── */}
      <section className="bg-[#080808] border-y border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">From the field</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-6">
                <p className="text-sm text-[#ccc] leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-[10px] text-[#888]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Simple pricing</h2>
          <p className="text-[#888] text-sm">Start free for 14 days. No credit card required.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PRICING.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 relative ${tier.highlight ? "border-[#D4AF37]/60 bg-[#D4AF37]/[0.04] shadow-lg shadow-[#D4AF37]/10" : "border-[#2a2a2a] bg-[#0d0d0d]"}`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-sm mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#D4AF37]">{tier.price}</span>
                  <span className="text-xs text-[#888]">{tier.period}</span>
                </div>
                <p className="text-[11px] text-[#888] mt-1.5">{tier.description}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#bbb]">
                    <span className="text-[#D4AF37] mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/ai-kb/dashboard"
                className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${tier.highlight ? "bg-[#D4AF37] text-black hover:bg-[#B8962E]" : "bg-[#1a1a1a] text-white border border-[#2a2a2a] hover:border-[#D4AF37]/40"}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ─────────────────────────────────── */}
      <section className="bg-[#080808] border-t border-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Your technicians shouldn&apos;t be<br />
            <span className="text-[#D4AF37]">Googling on a job site.</span>
          </h2>
          <p className="text-[#888] text-sm mb-8 max-w-xl mx-auto">
            Give your team the knowledge they need, the second they need it. 14-day free trial.
          </p>
          <Link
            href="/ai-kb/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#B8962E] transition-all hover:shadow-xl hover:shadow-[#D4AF37]/20"
          >
            Start Free Trial
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-[#1a1a1a] bg-[#000]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#D4AF37] flex items-center justify-center">
              <span className="text-black font-bold text-xs">F</span>
            </div>
            <span className="text-sm font-semibold">FieldAI</span>
          </div>
          <p className="text-xs text-[#555]">
            Built by Alfred&apos;s SaaS Pipeline · © 2026
          </p>
          <div className="flex gap-4 text-xs text-[#555]">
            <a href="#" className="hover:text-[#D4AF37] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
