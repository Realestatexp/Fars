import React from "react";
import { 
  X, ShieldCheck, Scale, Database, Trash2, 
  HelpCircle, Server, Check, ArrowUpRight 
} from "lucide-react";
import { Project } from "../types";

interface ProjectSettingsProps {
  currentProject: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteAllData: () => void;
  theme: "dark" | "light";
}

export default function ProjectSettings({
  currentProject,
  isOpen,
  onClose,
  onDeleteAllData,
  theme
}: ProjectSettingsProps) {
  if (!isOpen) return null;

  const rights = [
    { title: "100% Code Ownership", desc: "Every line of generated code belongs entirely to you. Orca claims no equity or royalty rights." },
    { title: "Commercial Licensing", desc: "Deploy your built apps for commercial services, SaaS models, private internal tooling, or resale." },
    { title: "Data Isolation Guarantee", desc: "Prompts, keys, or code bases are never leaked or reused for model training, ensuring complete confidentiality." },
    { title: "Private Self-Hosting", desc: "Export Docker containers or standard static files to host on private nodes or on-premise servers." }
  ];

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`border rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
        isDark ? "glass-panel-dark text-slate-200 border-white/5" : "glass-panel-light text-slate-800 border-black/10"
      }`}>
        
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
        }`}>
          <div className="flex items-center space-x-2.5">
            <Scale className="w-5 h-5 text-cyan-500" />
            <div>
              <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Orca Core Specs & Compliance</h2>
              <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Licensing, Ownership, and Infrastructure Control</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isDark ? "hover:bg-white/5 text-slate-400 hover:text-white" : "hover:bg-black/5 text-slate-500 hover:text-slate-900"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          
          {/* IP Ownership & Rights section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span>User Rights & Ownership Mandates</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {rights.map((r, i) => (
                <div key={i} className={`border p-3.5 rounded-xl space-y-1 ${
                  isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"
                }`}>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    <h4 className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>{r.title}</h4>
                  </div>
                  <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Technology Stack Detail */}
          {currentProject && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
                <Server className="w-4 h-4 text-cyan-500" />
                <span>Selected Architecture Configuration</span>
              </h3>
              <div className={`border rounded-xl p-4 space-y-3 ${
                isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"
              }`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Target Platform</span>
                    <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{currentProject.techStack.category}</p>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Frontend framework</span>
                    <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{currentProject.techStack.frontend}</p>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Backend runtime</span>
                    <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{currentProject.techStack.backend}</p>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Target database</span>
                    <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{currentProject.techStack.database}</p>
                  </div>
                </div>
                <div className={`pt-2 border-t ${isDark ? "border-white/5" : "border-black/5"}`}>
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Stack Justification</span>
                  <p className={`text-[11px] mt-1 leading-relaxed italic ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    "{currentProject.techStack.justification}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dangerous Zone - Delete Permanent Data */}
          <div className={`pt-4 border-t space-y-3 ${isDark ? "border-white/5" : "border-black/5"}`}>
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Danger Zone (Permanent Actions)</span>
            </h3>
            <div className={`border p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDark ? "bg-rose-950/20 border-rose-900/40" : "bg-rose-50 border-rose-200"
            }`}>
              <div className="space-y-1">
                <h4 className={`font-bold ${isDark ? "text-rose-300" : "text-rose-800"}`}>Permanently Delete All Workspace Data</h4>
                <p className={`text-[11px] leading-relaxed max-w-md ${isDark ? "text-rose-400/80" : "text-rose-600/80"}`}>
                  This action clears all saved local storage states, code repositories, prompt conversations, and deployment URLs permanently. This cannot be undone.
                </p>
              </div>
              {/* Trigger button >= 44px */}
              <button
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to delete all workspace projects and permanently purge your local session history? This action is irreversible.")) {
                    onDeleteAllData();
                    onClose();
                  }
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 h-11 flex-shrink-0 cursor-pointer shadow-lg shadow-rose-600/10"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All Data</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"
        }`}>
          <div className="flex items-center space-x-1.5 opacity-80">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>GDPR and ISO Rights Verified</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer h-10 ${
              isDark ? "bg-white/5 hover:bg-white/10 text-white border border-white/5" : "bg-black/5 hover:bg-black/10 text-slate-800 border border-black/10"
            }`}
          >
            Close Specs
          </button>
        </div>

      </div>
    </div>
  );
}
