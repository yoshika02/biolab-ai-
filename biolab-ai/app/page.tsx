import Link from "next/link";
import { ArrowRight, Beaker, FileText, Activity, Layers, ShieldCheck, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Background glowing blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-blue-600 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        
        {/* Navigation / Header */}
        <header className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 font-bold text-slate-950">
              B
            </div>
            <span className="text-lg font-semibold tracking-wide text-white">BioLab AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 border border-white/10">
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-300 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
            v1.0 Now Available
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500 pb-4">
            The OS for Modern Biological Research.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            Unify protocol management, AI-assisted paper summarization, and lab inventory in one secured, intelligent dashboard. Stop managing spreadsheets and start advancing science.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full bg-teal-500 px-8 py-4 text-base font-semibold text-slate-950 transition-all hover:bg-teal-400 hover:scale-105 shadow-[0_0_40px_-10px_rgba(20,184,166,0.5)]"
            >
              Start Your Lab
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/dashboard" className="text-base font-semibold leading-6 text-slate-300 hover:text-white transition">
              View Dashboard Demo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Feature Grid (Bento Box style) */}
        <div className="mt-32 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          <div className="col-span-full lg:col-span-2 group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/[0.07] transition duration-300 backdrop-blur-sm">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl group-hover:bg-teal-500/20 transition duration-500" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/20 mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Protocol Assistant & Paper Summarizer</h3>
              <p className="text-slate-400 leading-relaxed max-w-xl">
                Upload lab SOPs, manuals, and PDFs. Our RAG pipeline allows you to chat with your protocols, providing step-by-step guidance and instant, cited answers from PubMed DOIs.
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/[0.07] transition duration-300 backdrop-blur-sm">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/20 mb-6">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Inventory Tracker</h3>
              <p className="text-slate-400 leading-relaxed">
                Smart reagent tracking with AI reorder predictions and expiry alerts. Prevent incompatible chemical storage automatically.
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/[0.07] transition duration-300 backdrop-blur-sm">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/20 mb-6">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Experiment Logger</h3>
              <p className="text-slate-400 leading-relaxed">
                Log daily results, detect anomalies with XGBoost, and generate auto-weekly AI summaries. Export beautiful PDF lab reports.
              </p>
            </div>
          </div>

          <div className="col-span-full lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 mb-6">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Primer Designer</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Auto-compute Tm, GC%, and secondary structures. Rank primer pairs and perform off-target checks via BLAST API.</p>
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/20 mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Chemical Safety Chatbot</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Instant safety checks. "Is it safe to mix X and Y?" Pull SDS from PubChem and get inventory-aware warnings.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
