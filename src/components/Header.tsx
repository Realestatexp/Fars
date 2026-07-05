import React from "react";
import { 
  BarChart3, RefreshCw, CloudLightning, Download, Play, 
  Layers, Sun, Moon, Info, HelpCircle, ArrowUpRight, CheckCircle,
  Database
} from "lucide-react";
import { Project } from "../types";

interface HeaderProps {
  currentProject: Project | null;
  theme: "dark" | "light";
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onDeploy: () => void;
  onExport: () => void;
  onOpenDatabaseHub: () => void;
  isDeploying: boolean;
  isSaving: boolean;
}

export default function Header({
  currentProject,
  theme,
  toggleTheme,
  onOpenSettings,
  onDeploy,
  onExport,
  onOpenDatabaseHub,
  isDeploying,
  isSaving
}: HeaderProps) {
  return (
    <header className={`border-b ${theme === "dark" ? "bg-[#0a0c12]/75 border-white/5 text-slate-200" : "bg-white/75 border-black/5 text-slate-800"} sticky top-0 z-50 px-6 py-3.5 backdrop-blur-xl flex items-center justify-between transition-all duration-300`}>
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3.5">
        <div className="bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-cyan-500/25">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className={`text-base font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              Orca App Builder
            </h1>
            <span className={`text-[10px] ${theme === "dark" ? "bg-cyan-950/60 text-cyan-400 border-cyan-800/40" : "bg-cyan-50 text-cyan-600 border-cyan-200/60"} px-2 py-0.2 rounded-full font-mono border uppercase font-bold tracking-wider`}>
              Engine v3.5
            </span>
          </div>
          <p className={`text-[10px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>The Complete Autonomous Full-Stack AI Factory</p>
        </div>
      </div>

      {/* Active Project Status */}
      {currentProject && (
        <div className={`hidden md:flex items-center space-x-3 ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-slate-800"} border px-4 py-1.5 rounded-full backdrop-blur-md`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold truncate max-w-48">
            {currentProject.name}
          </span>
          <span className="opacity-40">|</span>
          <span className="text-[10px] font-mono flex items-center space-x-1 opacity-80">
            {isSaving ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                <span>Autosaving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Autosaved</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center space-x-3.5">
        {/* Help Info Button */}
        <button
          onClick={onOpenSettings}
          className={`p-2 rounded-lg transition-all cursor-pointer ${theme === "dark" ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-black/5"}`}
          title="Technology Specs & Ownership Rights"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Theme Selector (Touch target >= 44px) */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-lg border transition-all cursor-pointer h-10 w-10 flex items-center justify-center ${theme === "dark" ? "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10" : "bg-black/5 border-black/10 text-slate-500 hover:text-slate-900 hover:bg-black/10"}`}
          title="Toggle UI mode"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8b949e]" />}
        </button>

        {currentProject && (
          <>
            {/* Database Hub Trigger (Touch target >= 44px) */}
            <button
              onClick={onOpenDatabaseHub}
              className={`px-4 py-2 border text-xs font-semibold rounded-lg transition-all cursor-pointer h-10 flex items-center space-x-2 ${theme === "dark" ? "bg-cyan-950/40 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300" : "bg-cyan-50 border-cyan-500/20 text-cyan-700 hover:bg-cyan-500/10 hover:text-cyan-800"}`}
              title="Backup, restore, or export database"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Database Hub</span>
            </button>

            {/* Export Trigger (Touch target >= 44px) */}
            <button
              onClick={onExport}
              className={`px-4 py-2 border text-xs font-semibold rounded-lg transition-all cursor-pointer h-10 flex items-center space-x-2 ${theme === "dark" ? "bg-white/5 border-white/10 text-slate-200 hover:text-white hover:bg-white/10" : "bg-black/5 border-black/10 text-slate-700 hover:text-slate-900 hover:bg-black/10"}`}
              title="Download full source package"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Source</span>
            </button>

            {/* Deploy Trigger (Touch target >= 44px) */}
            <button
              onClick={onDeploy}
              disabled={isDeploying}
              className="px-4.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-xs rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer h-10 flex items-center space-x-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              title="Deploy active container"
            >
              <CloudLightning className={`w-4 h-4 ${isDeploying ? "animate-bounce" : ""}`} />
              <span className="font-bold">{isDeploying ? "Deploying..." : "Deploy"}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
