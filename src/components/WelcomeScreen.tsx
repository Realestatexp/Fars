import React, { useState } from "react";
import { 
  Sparkles, Layers, ShieldCheck, Smartphone, Monitor, 
  Settings, ArrowRight, HelpCircle, Terminal, RefreshCw, Zap
} from "lucide-react";

interface WelcomeScreenProps {
  onGenerate: (prompt: string, category: string, preset?: string, stylingArchitecture?: "tailwind" | "shadcn" | "css-modules") => void;
  isGenerating: boolean;
  theme: "dark" | "light";
}

export default function WelcomeScreen({ onGenerate, isGenerating, theme }: WelcomeScreenProps) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("Web Application");
  const [stylingArchitecture, setStylingArchitecture] = useState<"tailwind" | "shadcn" | "css-modules">("tailwind");

  const suggestions = [
    {
      title: "SaaS Command Telemetry",
      desc: "High-performance visual dashboard tracking real-time enterprise metrics.",
      category: "Web Application",
      preset: "dashboard"
    },
    {
      title: "Kanban Board Flow",
      desc: "Agile task organizer with reactive stage status columns and card filters.",
      category: "Web Application",
      preset: "todo"
    },
    {
      title: "E-Commerce PWA",
      desc: "Fast responsive storefront with shopping carts and payment summaries.",
      category: "Progressive Web App (PWA)",
      preset: "dashboard"
    },
    {
      title: "Interactive Fitness Planner",
      desc: "Daily tracker tracking calories, exercises, and historical performance.",
      category: "Mobile Application",
      preset: "todo"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt, category, undefined, stylingArchitecture);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-transparent flex flex-col items-center justify-center p-6 selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      <div className="max-w-4xl w-full space-y-10 z-10 relative">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className={`inline-flex items-center space-x-2 ${theme === "dark" ? "bg-cyan-950/40 border-cyan-800/40 text-cyan-400" : "bg-cyan-50 border-cyan-200 text-cyan-700"} border px-3.5 py-1.5 rounded-full shadow-lg`}>
            <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              Autonomous Code Synthesis Enabled
            </span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight leading-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            Design & Build Complete Applications <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Simply by Asking in Natural Language
            </span>
          </h1>
          <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"} max-w-2xl mx-auto leading-relaxed`}>
            Specify features, layouts, or platform targets. Orca builds clean, documented, interactive frontends,
            API layers, administrative workflows, and secure database schemas with 100% user code ownership.
          </p>
        </div>

        {/* Central Creation Card */}
        <div className={`${theme === "dark" ? "glass-panel-dark text-slate-200" : "glass-panel-light text-slate-800"} rounded-2xl p-6 md:p-8 shadow-2xl relative`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prompt Input area */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Describe the application you want Orca to build:
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Build an enterprise SaaS dashboard for cloud resource utilization, containing reactive resource sliders, custom metric charts, a clean admin table, and a secure PostgreSQL schema...'"
                  rows={4}
                  className={`w-full ${theme === "dark" ? "glass-input-dark text-white placeholder-slate-500 border-white/5 focus:border-cyan-500/50" : "glass-input-light text-slate-900 placeholder-slate-400 border-black/10 focus:border-cyan-500/50"} rounded-xl p-4 text-sm focus:outline-none transition-all resize-none leading-relaxed`}
                  disabled={isGenerating}
                />
                <div className={`absolute bottom-3 right-3 text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"} font-mono`}>
                  Markdown support active
                </div>
              </div>
            </div>

            {/* Platform Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Target Runtime Platform
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory("Web Application")}
                    className={`py-2 px-3.5 border rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${category === "Web Application" ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 font-bold" : (theme === "dark" ? "border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900 hover:bg-black/10")}`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Web App (SPA)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("Mobile Application")}
                    className={`py-2 px-3.5 border rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${category === "Mobile Application" ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 font-bold" : (theme === "dark" ? "border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900 hover:bg-black/10")}`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile App</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("Progressive Web App (PWA)")}
                    className={`py-2 px-3.5 border rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${category === "Progressive Web App (PWA)" ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 font-bold" : (theme === "dark" ? "border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900 hover:bg-black/10")}`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>PWA Hybrid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("Desktop Application")}
                    className={`py-2 px-3.5 border rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${category === "Desktop Application" ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 font-bold" : (theme === "dark" ? "border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900 hover:bg-black/10")}`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Desktop App</span>
                  </button>
                </div>
              </div>

              {/* Advanced Configurations */}
              <div className="md:col-span-2 space-y-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Automated Engine Toggles
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center justify-between p-2.5 ${theme === "dark" ? "bg-white/5 border-white/5 text-slate-300" : "bg-black/5 border-black/5 text-slate-700"} border rounded-xl`}>
                    <span className="opacity-80">Auth Workflow</span>
                    <span className="text-cyan-500 font-mono font-bold">AUTO</span>
                  </div>
                  <div className={`flex items-center justify-between p-2.5 ${theme === "dark" ? "bg-white/5 border-white/5 text-slate-300" : "bg-black/5 border-black/5 text-slate-700"} border rounded-xl`}>
                    <span className="opacity-80">Admin Console</span>
                    <span className="text-cyan-500 font-mono font-bold">AUTO</span>
                  </div>
                  <div className={`flex items-center justify-between p-2.5 ${theme === "dark" ? "bg-white/5 border-white/5 text-slate-300" : "bg-black/5 border-black/5 text-slate-700"} border rounded-xl col-span-2`}>
                    <span className="opacity-80">Database Engine</span>
                    <span className="text-emerald-500 font-mono font-bold">PostgreSQL (SQL)</span>
                  </div>
                </div>
              </div>

              {/* Styling Architecture Selector */}
              <div className="md:col-span-2 space-y-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Styling Architecture
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStylingArchitecture("tailwind")}
                    className={`py-2 px-1.5 border rounded-xl text-center font-semibold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${stylingArchitecture === "tailwind" ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 font-bold" : (theme === "dark" ? "border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900 hover:bg-black/10")}`}
                  >
                    <span className="text-xs">Tailwind CSS</span>
                    <span className="text-[9px] opacity-60 font-normal">Utility First</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStylingArchitecture("shadcn")}
                    className={`py-2 px-1.5 border rounded-xl text-center font-semibold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${stylingArchitecture === "shadcn" ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 font-bold" : (theme === "dark" ? "border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900 hover:bg-black/10")}`}
                  >
                    <span className="text-xs">Shadcn/UI</span>
                    <span className="text-[9px] opacity-60 font-normal">Radix Primatives</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStylingArchitecture("css-modules")}
                    className={`py-2 px-1.5 border rounded-xl text-center font-semibold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${stylingArchitecture === "css-modules" ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 font-bold" : (theme === "dark" ? "border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900 hover:bg-black/10")}`}
                  >
                    <span className="text-xs">CSS Modules</span>
                    <span className="text-[9px] opacity-60 font-normal">Scoped Styles</span>
                  </button>
                </div>
              </div>

              {/* Design Language Specifications */}
              <div className="md:col-span-2 space-y-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Pre-Configured Layout Themes
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center justify-between p-2.5 ${theme === "dark" ? "bg-white/5 border-white/5 text-slate-300" : "bg-black/5 border-black/5 text-slate-700"} border rounded-xl`}>
                    <span className="opacity-80">Dynamic Theme</span>
                    <span className="text-cyan-500 font-mono font-bold">Ambient Dark</span>
                  </div>
                  <div className={`flex items-center justify-between p-2.5 ${theme === "dark" ? "bg-white/5 border-white/5 text-slate-300" : "bg-black/5 border-black/5 text-slate-700"} border rounded-xl`}>
                    <span className="opacity-80">Component Sizing</span>
                    <span className="text-cyan-500 font-mono font-bold">High Density</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Actions (Touch target >= 44px) */}
            <div className={`pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t ${theme === "dark" ? "border-white/10" : "border-black/10"}`}>
              <div className={`flex items-center space-x-2 text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Prerender check passes &bull; Code generated belongs 100% to you</span>
              </div>
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xl shadow-cyan-500/20 disabled:opacity-50 h-12"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Orca Synthesizing App...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Workspace</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Suggestion Grid */}
        <div className="space-y-3">
          <h2 className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Or select an optimized enterprise template:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (isGenerating) return;
                  setPrompt(`Build a comprehensive, production-ready ${s.title.toLowerCase()}. It must be a complete ${s.desc.toLowerCase()}`);
                  setCategory(s.category);
                  onGenerate(`Build ${s.title}: ${s.desc}`, s.category, s.preset);
                }}
                className={`border rounded-xl p-4 cursor-pointer transition-all group text-left ${theme === "dark" ? "glass-card-dark hover:border-cyan-500/40 hover:bg-white/5" : "glass-card-light hover:border-cyan-500/40 hover:bg-black/5"}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`text-xs font-bold ${theme === "dark" ? "text-white group-hover:text-cyan-400" : "text-slate-900 group-hover:text-cyan-600"} transition-colors`}>
                    {s.title}
                  </h3>
                  <span className={`text-[9px] border px-2 py-0.5 rounded-full ${theme === "dark" ? "bg-white/5 border-white/10 text-slate-400" : "bg-black/5 border-black/10 text-slate-600"}`}>
                    {s.category}
                  </span>
                </div>
                <p className={`text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"} mt-1.5 leading-relaxed`}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
