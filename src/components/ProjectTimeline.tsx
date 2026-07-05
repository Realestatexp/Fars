import React, { useState } from "react";
import { 
  GitCommit, Rocket, Zap, CheckCircle, Clock, Settings, Code, Trash2, Plus, 
  X, ChevronRight, History, Calendar, Sparkles, Eye, Info, RefreshCw
} from "lucide-react";
import { Project, HistoryItem, CustomMilestone, FileData } from "../types";

interface ProjectTimelineProps {
  project: Project;
  onJumpToHistoryIndex: (index: number) => void;
  onAddMilestone: (milestone: { title: string; description: string; type: "feat" | "fix" | "refactor" | "release" | "test" | "custom"; timestamp: string }) => void;
  onDeleteMilestone: (id: string) => void;
  theme: "dark" | "light";
}

export default function ProjectTimeline({
  project,
  onJumpToHistoryIndex,
  onAddMilestone,
  onDeleteMilestone,
  theme
}: ProjectTimelineProps) {
  const isDark = theme === "dark";

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"feat" | "fix" | "refactor" | "release" | "test" | "custom">("feat");
  const [newTimestamp, setNewTimestamp] = useState(new Date().toISOString().substring(0, 16));

  // Filter state
  const [activeFilter, setActiveFilter] = useState<"all" | "code" | "styling" | "custom">("all");

  // Selected state for inspecting a milestone
  const [selectedMilestone, setSelectedMilestone] = useState<{
    id: string;
    title: string;
    timestamp: string;
    files?: FileData[];
    type: string;
    summary: string;
    historyIndex?: number;
  } | null>(null);

  const [selectedFileForInspection, setSelectedFileForInspection] = useState<FileData | null>(null);

  // Generate milestone array dynamically
  // 1. Initial State Milestone
  const timelineEvents: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: "init" | "code_update" | "styling_refactor" | "custom_milestone";
    originalType?: string;
    filesCount?: number;
    files?: FileData[];
    historyIndex?: number; // Corresponding history index if applicable
    isActiveState?: boolean;
  }> = [];

  // Add Project Creation Milestone
  timelineEvents.push({
    id: "init-event",
    title: "Project Initialized",
    description: `Created initial codebase for '${project.name}' targeting the ${project.techStack.category} framework (${project.techStack.frontend}).`,
    timestamp: project.createdAt,
    type: "init",
    filesCount: project.history && project.history[0] ? project.history[0].files.length : project.files.length,
    files: project.history && project.history[0] ? project.history[0].files : project.files,
    historyIndex: 0,
    isActiveState: project.currentHistoryIndex === 0
  });

  // Process history updates
  if (project.history && project.history.length > 0) {
    project.history.forEach((histItem, idx) => {
      // Index 0 is often similar to creation, let's treat indices > 0 as updates
      if (idx === 0) return;

      const isStylingRefactor = histItem.summary.toLowerCase().includes("styling") || 
                               histItem.summary.toLowerCase().includes("css") || 
                               histItem.summary.toLowerCase().includes("tailwind") ||
                               histItem.summary.toLowerCase().includes("shadcn");

      timelineEvents.push({
        id: histItem.id,
        title: isStylingRefactor ? "Styling Architecture Refactored" : `Version v${idx + 1} Committed`,
        description: histItem.summary,
        timestamp: histItem.timestamp,
        type: isStylingRefactor ? "styling_refactor" : "code_update",
        filesCount: histItem.files.length,
        files: histItem.files,
        historyIndex: idx,
        isActiveState: project.currentHistoryIndex === idx
      });
    });
  }

  // Inject manual custom milestones
  if (project.milestones && project.milestones.length > 0) {
    project.milestones.forEach((milestone) => {
      timelineEvents.push({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        timestamp: milestone.timestamp,
        type: "custom_milestone",
        originalType: milestone.type
      });
    });
  }

  // Sort timeline events chronologically (latest first)
  const sortedEvents = [...timelineEvents].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Apply filters
  const filteredEvents = sortedEvents.filter(event => {
    if (activeFilter === "all") return true;
    if (activeFilter === "code") return event.type === "code_update" || event.type === "init";
    if (activeFilter === "styling") return event.type === "styling_refactor";
    if (activeFilter === "custom") return event.type === "custom_milestone";
    return true;
  });

  // Stats calculation
  const totalCommits = project.history ? project.history.length : 1;
  const customMilestonesCount = project.milestones ? project.milestones.length : 0;
  const activeStyling = project.stylingArchitecture || "tailwind";

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    onAddMilestone({
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: newType,
      timestamp: new Date(newTimestamp).toISOString()
    });

    setNewTitle("");
    setNewDesc("");
    setNewType("feat");
    setNewTimestamp(new Date().toISOString().substring(0, 16));
    setShowAddForm(false);
  };

  const getMilestoneBadgeStyle = (type: string, originalType?: string) => {
    if (type === "init") {
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    }
    if (type === "styling_refactor") {
      return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
    }
    if (type === "code_update") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (type === "custom_milestone") {
      switch (originalType) {
        case "feat": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
        case "fix": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
        case "refactor": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
        case "release": return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
        case "test": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
        default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
      }
    }
    return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  };

  const getMilestoneIcon = (type: string, originalType?: string) => {
    if (type === "init") return <Zap className="w-4.5 h-4.5 text-amber-500" />;
    if (type === "styling_refactor") return <Settings className="w-4.5 h-4.5 text-cyan-400" />;
    if (type === "code_update") return <Code className="w-4.5 h-4.5 text-emerald-400" />;
    
    switch (originalType) {
      case "release": return <Rocket className="w-4.5 h-4.5 text-amber-500" />;
      case "feat": return <Sparkles className="w-4.5 h-4.5 text-purple-400" />;
      case "fix": return <CheckCircle className="w-4.5 h-4.5 text-rose-400" />;
      case "refactor": return <Settings className="w-4.5 h-4.5 text-blue-400" />;
      case "test": return <CheckCircle className="w-4.5 h-4.5 text-indigo-400" />;
      default: return <Clock className="w-4.5 h-4.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Header Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-1 mb-5">
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Current State</span>
          <span className="text-xl font-bold font-mono text-cyan-500 mt-1">v{project.currentHistoryIndex + 1}</span>
          <span className="text-[10px] opacity-60 mt-0.5">Out of {totalCommits} revisions</span>
        </div>
        
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Styling Architecture</span>
          <span className="text-lg font-bold font-mono text-cyan-500 mt-1 uppercase">
            {activeStyling === "css-modules" ? "CSS Modules" : activeStyling === "shadcn" ? "Shadcn/UI" : "Tailwind CSS"}
          </span>
          <span className="text-[10px] opacity-60 mt-0.5">Active Theme Boundary</span>
        </div>

        <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Custom Milestones</span>
          <span className="text-xl font-bold font-mono text-cyan-500 mt-1">{customMilestonesCount}</span>
          <span className="text-[10px] opacity-60 mt-0.5">Manually logged events</span>
        </div>

        <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Build Status</span>
          <span className="text-sm font-bold font-mono text-emerald-400 flex items-center space-x-1 mt-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>COMPILED OK</span>
          </span>
          <span className="text-[10px] opacity-60 mt-0.5">All assets integrated</span>
        </div>
      </div>

      {/* Main Panel Content split into List + Inspector */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 overflow-hidden min-h-0">
        
        {/* LEFT COMPONENT: The Timeline Flow */}
        <div className="flex-1 flex flex-col overflow-y-auto pr-1 min-h-0">
          
          {/* Filters Bar & Add Milestone Button */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/5">
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeFilter === "all" ? "bg-cyan-500 text-black" : (isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-black/5 text-slate-700 hover:bg-black/10")}`}
              >
                All Events
              </button>
              <button 
                onClick={() => setActiveFilter("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeFilter === "code" ? "bg-cyan-500 text-black" : (isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-black/5 text-slate-700 hover:bg-black/10")}`}
              >
                Code Updates
              </button>
              <button 
                onClick={() => setActiveFilter("styling")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeFilter === "styling" ? "bg-cyan-500 text-black" : (isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-black/5 text-slate-700 hover:bg-black/10")}`}
              >
                Styling Swaps
              </button>
              <button 
                onClick={() => setActiveFilter("custom")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeFilter === "custom" ? "bg-cyan-500 text-black" : (isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-black/5 text-slate-700 hover:bg-black/10")}`}
              >
                Logged Milestones
              </button>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-pointer flex items-center space-x-1 transition-all shrink-0"
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{showAddForm ? "Cancel" : "Add Milestone"}</span>
            </button>
          </div>

          {/* Add Milestone Collapsible Form */}
          {showAddForm && (
            <form onSubmit={handleCreateMilestone} className={`p-4 rounded-xl border mb-5 space-y-3.5 transition-all ${isDark ? "bg-white/2 border-white/10" : "bg-black/2 border-black/10"}`}>
              <div className="flex items-center space-x-2 text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Log Manual Milestone</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Milestone Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v1.0.0 Stable Build"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border bg-transparent ${isDark ? "border-white/10 text-white focus:border-cyan-500/50" : "border-black/15 text-slate-900 focus:border-cyan-500/50"}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Milestone Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border bg-transparent ${isDark ? "border-white/10 text-white focus:border-cyan-500/50" : "border-black/15 text-slate-900 focus:border-cyan-500/50"} [&>option]:bg-slate-950 [&>option]:text-white`}
                  >
                    <option value="feat">Feature Added</option>
                    <option value="fix">Bug Fix</option>
                    <option value="refactor">Code Refactor</option>
                    <option value="release">Production Release</option>
                    <option value="test">Testing / QA Complete</option>
                    <option value="custom">Other Milestone</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Milestone Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newTimestamp}
                  onChange={(e) => setNewTimestamp(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border bg-transparent ${isDark ? "border-white/10 text-white focus:border-cyan-500/50" : "border-black/15 text-slate-900 focus:border-cyan-500/50"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Description / Achievements</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Summarize the significant milestone metrics or features added..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border bg-transparent resize-none ${isDark ? "border-white/10 text-white focus:border-cyan-500/50" : "border-black/15 text-slate-900 focus:border-cyan-500/50"}`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Commit Milestone
              </button>
            </form>
          )}

          {/* Timeline Nodes */}
          {filteredEvents.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border ${isDark ? "border-white/5 bg-white/1" : "border-black/5 bg-black/1"}`}>
              <Clock className="w-8 h-8 opacity-40 mx-auto mb-2.5 text-slate-400" />
              <p className="text-xs font-semibold opacity-65">No milestones found matching your active filter.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6">
              
              {/* Vertical timeline backbone running down */}
              <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dashed border-slate-600/35 z-0" />

              {filteredEvents.map((event) => (
                <div 
                  key={event.id} 
                  className={`relative group p-4 rounded-xl border transition-all z-10 flex flex-col space-y-2.5 ${
                    event.isActiveState 
                      ? "border-cyan-500/50 bg-cyan-950/10 shadow-lg shadow-cyan-500/2" 
                      : (isDark ? "border-white/5 bg-white/2 hover:border-white/10" : "border-black/5 bg-black/2 hover:border-black/10")
                  }`}
                >
                  {/* Point Indicator Bullet */}
                  <div className={`absolute -left-[22px] top-4.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all z-20 ${
                    event.isActiveState 
                      ? "bg-cyan-500 border-cyan-400 scale-110 shadow-md shadow-cyan-500/40" 
                      : (isDark ? "bg-slate-900 border-slate-700 group-hover:border-slate-500" : "bg-white border-slate-300 group-hover:border-slate-500")
                  }`}>
                    {event.isActiveState && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                        {getMilestoneIcon(event.type, event.originalType)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold tracking-tight">{event.title}</h4>
                        <div className="flex items-center space-x-1 opacity-50 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[9px] font-mono">{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 self-start sm:self-center">
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getMilestoneBadgeStyle(event.type, event.originalType)}`}>
                        {event.type === "custom_milestone" ? event.originalType : event.type.replace("_", " ")}
                      </span>
                      {event.isActiveState && (
                        <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500 text-black">
                          Active State
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body description */}
                  <p className="text-xs opacity-75 leading-relaxed pl-1">
                    {event.description}
                  </p>

                  {/* Associated Files List / Meta details */}
                  {event.files && event.files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {event.files.map((file) => (
                        <span 
                          key={file.path}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${isDark ? "bg-white/4 border-white/5 text-slate-300" : "bg-black/4 border-black/5 text-slate-600"}`}
                        >
                          {file.path.split("/").pop()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Node action buttons footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-white/5 pl-1">
                    <div className="flex space-x-2">
                      {/* Only allow inspect for milestones containing files */}
                      {event.files && event.files.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMilestone({
                              id: event.id,
                              title: event.title,
                              timestamp: event.timestamp,
                              files: event.files,
                              type: event.type,
                              summary: event.description,
                              historyIndex: event.historyIndex
                            });
                            // Default to first file for inspection
                            if (event.files && event.files.length > 0) {
                              setSelectedFileForInspection(event.files[0]);
                            }
                          }}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded text-[10px] font-semibold cursor-pointer flex items-center space-x-1 transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect Code</span>
                        </button>
                      )}
                      
                      {event.historyIndex !== undefined && !event.isActiveState && (
                        <button
                          type="button"
                          onClick={() => onJumpToHistoryIndex(event.historyIndex!)}
                          className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded text-[10px] font-semibold cursor-pointer flex items-center space-x-1 transition-all"
                        >
                          <History className="w-3 h-3" />
                          <span>Switch to this state</span>
                        </button>
                      )}
                    </div>

                    {event.type === "custom_milestone" && (
                      <button
                        type="button"
                        onClick={() => onDeleteMilestone(event.id)}
                        className="p-1 hover:bg-rose-500/15 text-rose-400 hover:text-rose-500 rounded cursor-pointer transition-colors"
                        title="Delete logged milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* RIGHT COMPONENT: Interactive Code & State Inspector */}
        <div className={`w-full md:w-[320px] lg:w-[380px] flex flex-col rounded-xl border p-4 overflow-hidden shrink-0 min-h-[300px] md:min-h-0 ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
          
          {selectedMilestone ? (
            <div className="flex flex-col h-full overflow-hidden min-h-0">
              
              {/* Header Details */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3.5">
                <div>
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Version Inspector</h3>
                  <h4 className="text-sm font-bold truncate max-w-[220px] mt-0.5">{selectedMilestone.title}</h4>
                </div>
                <button
                  onClick={() => {
                    setSelectedMilestone(null);
                    setSelectedFileForInspection(null);
                  }}
                  className={`p-1.5 rounded-lg border ${isDark ? "border-white/5 bg-white/5 text-slate-400 hover:text-white" : "border-black/5 bg-black/5 text-slate-600 hover:text-slate-900"} cursor-pointer`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Milestone Details Summary */}
              <div className="space-y-3 pb-3 mb-3 border-b border-white/5">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Commit Details</span>
                  <p className="text-xs opacity-80 leading-relaxed max-h-[100px] overflow-y-auto pr-1">
                    {selectedMilestone.summary}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] opacity-60">
                  <span>Logged At:</span>
                  <span className="font-mono">{new Date(selectedMilestone.timestamp).toLocaleDateString()} {new Date(selectedMilestone.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* File revision switcher */}
              {selectedMilestone.files && selectedMilestone.files.length > 0 && (
                <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Files at this point</span>
                  
                  <div className="flex gap-1 overflow-x-auto pb-1.5 shrink-0">
                    {selectedMilestone.files.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFileForInspection(file)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer whitespace-nowrap ${
                          selectedFileForInspection?.path === file.path 
                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" 
                            : (isDark ? "border-white/5 bg-white/3 text-slate-400 hover:text-white" : "border-black/5 bg-black/3 text-slate-600 hover:text-slate-900")
                        }`}
                      >
                        {file.path.split("/").pop()}
                      </button>
                    ))}
                  </div>

                  {/* Small code container preview */}
                  {selectedFileForInspection ? (
                    <div className="flex-1 flex flex-col overflow-hidden border border-white/5 rounded-lg mt-2 min-h-0">
                      <div className={`px-3 py-1.5 border-b border-white/5 flex items-center justify-between text-[10px] font-mono shrink-0 ${isDark ? "bg-white/3" : "bg-black/3"}`}>
                        <span className="opacity-70 truncate">{selectedFileForInspection.path}</span>
                        <span className="opacity-50 uppercase">{selectedFileForInspection.language}</span>
                      </div>
                      <div className="flex-1 overflow-auto p-2 font-mono text-[10px] leading-relaxed bg-slate-950/80 text-slate-300 select-all whitespace-pre">
                        {selectedFileForInspection.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg p-5 mt-2 opacity-50">
                      <Code className="w-6 h-6 mb-2" />
                      <span className="text-xs">Select a file above to view snapshot</span>
                    </div>
                  )}

                  {/* Revert / Switch to State directly from Inspector */}
                  {selectedMilestone.historyIndex !== undefined && selectedMilestone.historyIndex !== project.currentHistoryIndex && (
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToHistoryIndex(selectedMilestone.historyIndex!);
                      }}
                      className="w-full mt-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Revert Project to This Revision</span>
                    </button>
                  )}
                  
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 opacity-60 flex-1">
              <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Milestone Inspector</h4>
                <p className="text-xs opacity-70 mt-1 max-w-[220px]">
                  Select any committed version or logged milestone on the left to inspect its active file state, view source files, or execute immediate rolling rollbacks.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
