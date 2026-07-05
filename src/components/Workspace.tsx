import React, { useState, useRef, useEffect } from "react";
import { 
  Send, RefreshCw, Layers, ShieldCheck, Play, 
  Terminal, CheckCircle, HelpCircle, Code, FileCode, 
  Database, GitCommit, ChevronRight, CornerDownRight, 
  Settings, Copy, Sparkles, Check, Zap, AlertTriangle, Github, History
} from "lucide-react";
import { Project, FileData, ChatMessage, LogEntry } from "../types";
import PreviewSandbox from "./PreviewSandbox";
import GitHubSync from "./GitHubSync";
import ProjectTimeline from "./ProjectTimeline";

interface WorkspaceProps {
  project: Project;
  onSendMessage: (msg: string) => void;
  isProcessing: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRegenerateFile: (filePath: string) => void;
  onUpdateStylingArchitecture?: (targetStyling: "tailwind" | "shadcn" | "css-modules") => void;
  onJumpToHistoryIndex?: (index: number) => void;
  onAddMilestone?: (milestone: { title: string; description: string; type: "feat" | "fix" | "refactor" | "release" | "test" | "custom"; timestamp: string }) => void;
  onDeleteMilestone?: (id: string) => void;
  activeFile: FileData;
  setActiveFile: (file: FileData) => void;
  isDeploying: boolean;
  onDeploy: () => void;
  deployUrl: string | null;
  deployLogs: string[];
  theme: "dark" | "light";
}

export default function Workspace({
  project,
  onSendMessage,
  isProcessing,
  onUndo,
  onRedo,
  onRegenerateFile,
  onUpdateStylingArchitecture,
  onJumpToHistoryIndex,
  onAddMilestone,
  onDeleteMilestone,
  activeFile,
  setActiveFile,
  isDeploying,
  onDeploy,
  deployUrl,
  deployLogs,
  theme
}: WorkspaceProps) {
  const [chatInput, setChatInput] = useState("");
  const [rightTab, setRightTab] = useState<"preview" | "code" | "schema" | "checklist" | "deploy" | "github" | "timeline">("preview");
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll chat to bottom when messages stream
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [project.conversation, isProcessing]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDark = theme === "dark";

  return (
    <div className={`flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-73px)] ${isDark ? "text-slate-200" : "text-slate-800"} bg-transparent p-4 gap-4`}>
      
      {/* LEFT COLUMN: AI Assistant Chat & Project Manager (span 5) */}
      <div className={`lg:col-span-5 flex flex-col h-full rounded-2xl overflow-hidden shadow-xl ${isDark ? "glass-panel-dark" : "glass-panel-light"}`}>
        
        {/* Workspace Sub-header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}>
          <div className="flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Orca Assistant & Codebase</span>
          </div>
          
          {/* Undo / Redo controls */}
          <div className={`flex rounded-lg p-0.5 text-xs border ${isDark ? "bg-black/40 border-white/5" : "bg-white/40 border-black/5"}`}>
            <button
              onClick={onUndo}
              disabled={project.currentHistoryIndex <= 0}
              className={`px-2.5 py-1 rounded transition-all disabled:opacity-40 cursor-pointer ${isDark ? "hover:bg-white/5 text-slate-300" : "hover:bg-black/5 text-slate-700"}`}
              title="Undo modification"
            >
              &larr; Undo
            </button>
            <span className="opacity-20 px-1">|</span>
            <button
              onClick={onRedo}
              disabled={project.currentHistoryIndex >= project.history.length - 1}
              className={`px-2.5 py-1 rounded transition-all disabled:opacity-40 cursor-pointer ${isDark ? "hover:bg-white/5 text-slate-300" : "hover:bg-black/5 text-slate-700"}`}
              title="Redo modification"
            >
              Redo &rarr;
            </button>
          </div>
        </div>

        {/* File Navigator List */}
        <div className={`px-4 py-3 border-b space-y-2 ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Generated Assets</span>
          <div className="flex flex-wrap gap-2">
            {project.files.map((file) => {
              const isActive = file.path === activeFile.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setActiveFile(file)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isActive 
                      ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-500" 
                      : (isDark ? "bg-white/5 border-white/5 text-slate-400 hover:text-white" : "bg-black/5 border-black/5 text-slate-600 hover:text-slate-900")
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{file.path}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Styling Architecture Switcher (UI Toggle) */}
        <div className={`px-4 py-3 border-b space-y-2.5 ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Styling Architecture
            </span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/20">
              {project.stylingArchitecture === "css-modules" ? "CSS Modules" : project.stylingArchitecture === "shadcn" ? "Shadcn/UI" : "Tailwind CSS"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onUpdateStylingArchitecture && onUpdateStylingArchitecture("tailwind")}
              disabled={isProcessing || project.stylingArchitecture === "tailwind" || !project.stylingArchitecture}
              className={`px-2 py-2.5 rounded-xl text-center font-semibold transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 border ${
                project.stylingArchitecture === "tailwind" || !project.stylingArchitecture
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-500 font-bold"
                  : (isDark ? "border-white/5 bg-white/5 text-slate-400 hover:text-white" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900")
              }`}
            >
              <span className="text-[11px]">Tailwind</span>
              <span className="text-[8px] opacity-60 font-normal">Utility Class</span>
            </button>
            <button
              onClick={() => onUpdateStylingArchitecture && onUpdateStylingArchitecture("shadcn")}
              disabled={isProcessing || project.stylingArchitecture === "shadcn"}
              className={`px-2 py-2.5 rounded-xl text-center font-semibold transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 border ${
                project.stylingArchitecture === "shadcn"
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-500 font-bold"
                  : (isDark ? "border-white/5 bg-white/5 text-slate-400 hover:text-white" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900")
              }`}
            >
              <span className="text-[11px]">Shadcn/UI</span>
              <span className="text-[8px] opacity-60 font-normal">Primitives</span>
            </button>
            <button
              onClick={() => onUpdateStylingArchitecture && onUpdateStylingArchitecture("css-modules")}
              disabled={isProcessing || project.stylingArchitecture === "css-modules"}
              className={`px-2 py-2.5 rounded-xl text-center font-semibold transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 border ${
                project.stylingArchitecture === "css-modules"
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-500 font-bold"
                  : (isDark ? "border-white/5 bg-white/5 text-slate-400 hover:text-white" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900")
              }`}
            >
              <span className="text-[11px]">Modules</span>
              <span className="text-[8px] opacity-60 font-normal">Scoped CSS</span>
            </button>
          </div>
        </div>

        {/* AI Chat History Pane */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* System intro banner */}
          <div className={`border rounded-xl p-4 space-y-2 ${isDark ? "bg-cyan-950/20 border-cyan-500/10 text-slate-300" : "bg-cyan-50/50 border-cyan-200 text-slate-700"}`}>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Orca Synthesizer Engine</h3>
            </div>
            <p className="text-[11px] leading-relaxed opacity-85">
              Describe additions or adjustments (e.g. "Add a conversion card to stats", "make the theme crimson", "add custom category tags") and watch Orca reconstruct the files instantly.
            </p>
          </div>

          {/* Dialog Bubbles */}
          {project.conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
            >
              <div
                className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold shadow-lg shadow-cyan-500/10" 
                    : (isDark ? "glass-card-dark text-slate-200" : "glass-card-light text-slate-800")
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Touch Feedback if touches files */}
                {msg.filesTouched && msg.filesTouched.length > 0 && (
                  <div className={`mt-3 pt-2 border-t flex items-center space-x-2 text-[10px] font-mono ${isDark ? "border-white/5 text-slate-400" : "border-black/5 text-slate-500"}`}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Recompiled: {msg.filesTouched.join(", ")}</span>
                  </div>
                )}
              </div>
              <span className={`text-[9px] mt-1 px-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {/* Real-time thinking animation */}
          {isProcessing && (
            <div className={`flex flex-col max-w-[85%] mr-auto items-start space-y-1.5 border rounded-xl p-4 shadow-lg ${isDark ? "glass-card-dark border-cyan-500/20" : "glass-card-light border-cyan-500/20"}`}>
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />
                <span className="text-xs font-bold font-mono text-cyan-500 uppercase tracking-wider animate-pulse">
                  Orca AI is synthesizing code...
                </span>
              </div>
              <p className={`text-[11px] font-mono leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Analyzing request parameters &rarr; Re-compiling state trees &rarr; Applying secure modifications to {activeFile.path}.
              </p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Prompter panel */}
        <div className={`p-4 border-t ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          <form onSubmit={handleSendChat} className="flex items-center space-x-2 relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Suggest edits to ${activeFile.path} (e.g., 'Change color theme to green')...`}
              className={`flex-1 rounded-xl pl-4 pr-12 py-3.5 text-xs placeholder-slate-500 focus:outline-none transition-colors h-12 border ${
                isDark 
                  ? "glass-input-dark text-white border-white/5 focus:border-cyan-500/50" 
                  : "glass-input-light text-slate-900 border-black/10 focus:border-cyan-500/50"
              }`}
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !chatInput.trim()}
              className="absolute right-2 top-1.5 p-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-black font-bold rounded-lg transition-colors cursor-pointer w-9 h-9 flex items-center justify-center shadow-md shadow-cyan-500/10"
              title="Send modification instruction"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Live Playground & Specs (span 7) */}
      <div className={`lg:col-span-7 flex flex-col h-full rounded-2xl overflow-hidden shadow-xl ${isDark ? "glass-panel-dark" : "glass-panel-light"}`}>
        
        {/* Navigation Tabs bar */}
        <div className={`flex px-2 pt-2 gap-1 overflow-x-auto shrink-0 border-b ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          <button
            onClick={() => setRightTab("preview")}
            className={`px-4.5 py-2.5 rounded-t-lg text-xs font-semibold tracking-tight transition-all flex items-center space-x-1.5 border-t-2 cursor-pointer ${
              rightTab === "preview" 
                ? "bg-transparent border-cyan-500 text-cyan-500 font-bold" 
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Interactive Preview</span>
          </button>
          <button
            onClick={() => setRightTab("code")}
            className={`px-4.5 py-2.5 rounded-t-lg text-xs font-semibold tracking-tight transition-all flex items-center space-x-1.5 border-t-2 cursor-pointer ${
              rightTab === "code" 
                ? "bg-transparent border-cyan-500 text-cyan-500 font-bold" 
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code Explorer</span>
          </button>
          <button
            onClick={() => setRightTab("schema")}
            className={`px-4.5 py-2.5 rounded-t-lg text-xs font-semibold tracking-tight transition-all flex items-center space-x-1.5 border-t-2 cursor-pointer ${
              rightTab === "schema" 
                ? "bg-transparent border-cyan-500 text-cyan-500 font-bold" 
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Schema</span>
          </button>
          <button
            onClick={() => setRightTab("checklist")}
            className={`px-4.5 py-2.5 rounded-t-lg text-xs font-semibold tracking-tight transition-all flex items-center space-x-1.5 border-t-2 cursor-pointer ${
              rightTab === "checklist" 
                ? "bg-transparent border-cyan-500 text-cyan-500 font-bold" 
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compliance Specs</span>
          </button>
          <button
            onClick={() => setRightTab("deploy")}
            className={`px-4.5 py-2.5 rounded-t-lg text-xs font-semibold tracking-tight transition-all flex items-center space-x-1.5 border-t-2 cursor-pointer ${
              rightTab === "deploy" 
                ? "bg-transparent border-cyan-500 text-cyan-500 font-bold" 
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Cloud Deployment</span>
          </button>
          <button
            onClick={() => setRightTab("github")}
            className={`px-4.5 py-2.5 rounded-t-lg text-xs font-semibold tracking-tight transition-all flex items-center space-x-1.5 border-t-2 cursor-pointer ${
              rightTab === "github" 
                ? "bg-transparent border-cyan-500 text-cyan-500 font-bold" 
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Sync</span>
          </button>
          <button
            onClick={() => setRightTab("timeline")}
            className={`px-4.5 py-2.5 rounded-t-lg text-xs font-semibold tracking-tight transition-all flex items-center space-x-1.5 border-t-2 cursor-pointer ${
              rightTab === "timeline" 
                ? "bg-transparent border-cyan-500 text-cyan-500 font-bold" 
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Project Timeline</span>
          </button>
        </div>

        {/* Tab content panel */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col bg-transparent">
          
          {rightTab === "preview" && (
            <div className="flex-1 h-full overflow-hidden">
              <PreviewSandbox code={activeFile.content} appName={project.name} />
            </div>
          )}

          {rightTab === "code" && (
            <div className={`flex-1 flex flex-col border rounded-xl overflow-hidden h-full ${isDark ? "bg-[#05070a]/80 border-white/5" : "bg-white/80 border-black/10"}`}>
              <div className={`px-4 py-2 border-b flex items-center justify-between text-xs ${isDark ? "bg-white/5 border-white/5 text-slate-400" : "bg-black/5 border-black/5 text-slate-600"}`}>
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-cyan-500" />
                  <span className="font-mono">{activeFile.path} &bull; {activeFile.language}</span>
                </div>
                <button
                  onClick={copyCodeToClipboard}
                  className={`px-3 py-1 border rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer h-8 ${isDark ? "bg-black/40 border-white/10 hover:text-white hover:bg-white/5" : "bg-white/40 border-black/10 hover:text-slate-900 hover:bg-black/5"}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
              <div className={`flex-1 p-5 overflow-auto font-mono text-[11px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                <pre className="whitespace-pre">
                  {activeFile.content}
                </pre>
              </div>
            </div>
          )}

          {rightTab === "schema" && (
            <div className={`flex-1 flex flex-col border rounded-xl overflow-hidden h-full space-y-4 p-5 overflow-y-auto ${isDark ? "bg-[#05070a]/80 border-white/5" : "bg-white/80 border-black/10"}`}>
              <div>
                <h3 className="text-sm font-bold flex items-center space-x-2">
                  <Database className="w-4.5 h-4.5 text-cyan-500" />
                  <span>Relational Database Struct (PostgreSQL DDL)</span>
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Every user project includes complete optimized, fully-indexed schemas built to fit the design.
                </p>
              </div>
              <div className={`border rounded-lg p-4 font-mono text-[11px] overflow-auto whitespace-pre ${isDark ? "bg-white/2 border-white/5 text-emerald-400" : "bg-black/2 border-black/5 text-emerald-600"}`}>
                {project.databaseSchema}
              </div>
            </div>
          )}

          {rightTab === "checklist" && (
            <div className="flex-1 overflow-y-auto space-y-6">
              
              {/* Compliance Scores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`border rounded-xl p-4 text-center space-y-1 ${isDark ? "glass-card-dark" : "glass-card-light"}`}>
                  <span className={`text-[10px] uppercase font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>SEO Rank</span>
                  <p className="text-xl font-bold text-cyan-500">100/100</p>
                </div>
                <div className={`border rounded-xl p-4 text-center space-y-1 ${isDark ? "glass-card-dark" : "glass-card-light"}`}>
                  <span className={`text-[10px] uppercase font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Performance</span>
                  <p className="text-xl font-bold text-emerald-500">99%</p>
                </div>
                <div className={`border rounded-xl p-4 text-center space-y-1 ${isDark ? "glass-card-dark" : "glass-card-light"}`}>
                  <span className={`text-[10px] uppercase font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Accessibility</span>
                  <p className="text-xl font-bold text-cyan-500">WCAG AA</p>
                </div>
                <div className={`border rounded-xl p-4 text-center space-y-1 ${isDark ? "glass-card-dark" : "glass-card-light"}`}>
                  <span className={`text-[10px] uppercase font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Secured</span>
                  <p className="text-xl font-bold text-emerald-500">AES-256</p>
                </div>
              </div>

              {/* Checklist Expanders */}
              <div className={`border rounded-xl p-5 space-y-4 ${isDark ? "glass-card-dark" : "glass-card-light"}`}>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Orca Optimization Blueprint</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Lists */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold tracking-wide uppercase">⚡ Performance & Speed</span>
                    <ul className={`space-y-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {project.checklist.performance.map((item, i) => (
                        <li key={i} className="flex items-center space-x-1.5">
                          <span className="text-emerald-500">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold tracking-wide uppercase">♿ Accessibility Compliance</span>
                    <ul className={`space-y-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {project.checklist.accessibility.map((item, i) => (
                        <li key={i} className="flex items-center space-x-1.5">
                          <span className="text-emerald-500">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`space-y-2 pt-4 border-t ${isDark ? "border-white/5" : "border-black/5"}`}>
                    <span className="text-[11px] font-bold tracking-wide uppercase">🔍 Search Engine Optimization</span>
                    <ul className={`space-y-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {project.checklist.seo.map((item, i) => (
                        <li key={i} className="flex items-center space-x-1.5">
                          <span className="text-emerald-500">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`space-y-2 pt-4 border-t ${isDark ? "border-white/5" : "border-black/5"}`}>
                    <span className="text-[11px] font-bold tracking-wide uppercase">🔒 Application Security Controls</span>
                    <ul className={`space-y-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {project.checklist.security.map((item, i) => (
                        <li key={i} className="flex items-center space-x-1.5">
                          <span className="text-emerald-500">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {rightTab === "deploy" && (
            <div className="flex-1 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4 overflow-y-auto p-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Terminal className="w-5 h-5 text-cyan-500 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-bold">Cloud Container Deployment</h3>
                      <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Simulate compilation builds to edge nodes in real-time</p>
                    </div>
                  </div>
                  {/* Deployment Trigger >= 44px */}
                  <button
                    onClick={onDeploy}
                    disabled={isDeploying}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer h-11 shadow-lg shadow-cyan-500/10"
                  >
                    {isDeploying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isDeploying ? "Compiling..." : "Trigger Live Deploy"}</span>
                  </button>
                </div>

                {/* Selected target selector */}
                <div className="grid grid-cols-5 gap-2.5">
                  {["Vercel", "Netlify", "Firebase", "AWS Edge", "Docker"].map((target) => (
                    <div 
                      key={target} 
                      className={`border rounded-xl p-3 text-center space-y-1.5 cursor-pointer hover:border-cyan-500 transition-colors ${
                        isDark ? "glass-card-dark" : "glass-card-light"
                      }`}
                    >
                      <span className={`text-[9px] font-semibold uppercase ${isDark ? "text-slate-500" : "text-slate-400"}`}>{target === "Vercel" ? "★ Primary" : "Optional"}</span>
                      <p className="text-xs font-bold">{target}</p>
                    </div>
                  ))}
                </div>

                {/* Deploy outputs */}
                {deployUrl && (
                  <div className={`border rounded-xl p-4 space-y-2 flex items-start space-x-3.5 shadow-2xl ${isDark ? "bg-[#121c15] border-emerald-800/80" : "bg-emerald-50 border-emerald-300"}`}>
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Production Deploy Active</h4>
                      <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Container compiled & deployed globally to cloud clusters. Ready to share:
                      </p>
                      <a
                        href={deployUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center space-x-1.5 text-xs text-cyan-500 hover:text-cyan-400 font-mono font-bold mt-2.5 px-3 py-1.5 rounded-lg border ${
                          isDark ? "bg-black/60 border-white/5" : "bg-white/60 border-black/10"
                        }`}
                      >
                        <span>{deployUrl}</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Build logs simulator terminal */}
                <div className="space-y-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Terminal Compilation Output</span>
                  <div className={`border rounded-xl p-4 font-mono text-[10px] space-y-1.5 max-h-56 overflow-y-auto leading-relaxed ${
                    isDark ? "bg-[#05070a]/90 border-white/5 text-slate-300" : "bg-white/90 border-black/10 text-slate-700"
                  }`}>
                    {deployLogs.map((log, i) => (
                      <p key={i} className={log.includes("SUCCESS") || log.includes("Deployed") ? "text-emerald-500" : log.includes("Error") ? "text-rose-500" : ""}>
                        {log}
                      </p>
                    ))}
                    {deployLogs.length === 0 && (
                      <p className="opacity-40">// Press 'Trigger Live Deploy' above to watch compiler stream logs...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {rightTab === "github" && (
            <GitHubSync project={project} theme={theme} />
          )}

          {rightTab === "timeline" && (
            <ProjectTimeline 
              project={project}
              onJumpToHistoryIndex={onJumpToHistoryIndex || (() => {})}
              onAddMilestone={onAddMilestone || (() => {})}
              onDeleteMilestone={onDeleteMilestone || (() => {})}
              theme={theme}
            />
          )}

        </div>

      </div>

    </div>
  );
}
