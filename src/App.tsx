import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import WelcomeScreen from "./components/WelcomeScreen";
import Workspace from "./components/Workspace";
import ProjectSettings from "./components/ProjectSettings";
import DatabaseHubModal from "./components/DatabaseHubModal";
import { Project, FileData, ChatMessage } from "./types";
import { Scale, ShieldCheck, Download, AlertTriangle, Layers, X, Check, HelpCircle, Terminal, RefreshCw } from "lucide-react";

const STORAGE_KEY = "orca_app_builder_projects";
const THEME_KEY = "orca_app_builder_theme";

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Status flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDatabaseHubOpen, setIsDatabaseHubOpen] = useState(false);
  
  // Deployment Simulation states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  
  // Active selected File in Workspace
  const [activeFile, setActiveFile] = useState<FileData | null>(null);
  
  // Show standard Export / Notification Banner
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Load projects & themes from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects) as Project[];
        setProjects(parsed);
        if (parsed.length > 0) {
          // Default to the most recently created project
          const lastProject = parsed[parsed.length - 1];
          setActiveProjectId(lastProject.id);
          if (lastProject.files.length > 0) {
            setActiveFile(lastProject.files[0]);
          }
        }
      } catch (e) {
        console.error("Failed to parse projects from storage", e);
      }
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light") {
      setTheme("light");
    }
  }, []);

  // Save projects to localStorage with custom autosave trigger feedback
  const saveProjects = (updatedProjects: Project[]) => {
    setIsSaving(true);
    setProjects(updatedProjects);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    setTimeout(() => {
      setIsSaving(false);
    }, 1200);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  };

  const getActiveProject = (): Project | null => {
    return projects.find((p) => p.id === activeProjectId) || null;
  };

  // Main Generator Function (natural language to full app stack)
  const handleGenerateProject = async (prompt: string, techCategory: string, preset?: string, stylingArchitecture: "tailwind" | "shadcn" | "css-modules" = "tailwind") => {
    setIsGenerating(true);
    setDeployUrl(null);
    setDeployLogs([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, techCategory, preset, stylingArchitecture }),
      });

      if (!response.ok) {
        throw new Error("Generation request failed on synthesis compiler.");
      }

      const appData = await response.json();

      const newProject: Project = {
        id: Date.now().toString(),
        name: appData.appName || "Synthesized App",
        description: appData.description || "Designed via Orca AI natural language model.",
        techStack: appData.techStack,
        databaseSchema: appData.databaseSchema,
        checklist: appData.checklist,
        files: appData.files,
        createdAt: new Date().toISOString(),
        stylingArchitecture: stylingArchitecture,
        conversation: [
          {
            id: "system-1",
            role: "assistant",
            content: `I have compiled and designed ${appData.appName || "the requested application"} utilizing the '${stylingArchitecture}' styling architecture. Active platform has been set to: ${appData.techStack.category}. I have created a fully interactive TSX component App.tsx with standard styles and structured database specifications.`,
            timestamp: new Date().toISOString(),
          },
        ],
        history: [
          {
            id: "initial",
            timestamp: new Date().toISOString(),
            summary: "Initial workspace generation",
            files: JSON.parse(JSON.stringify(appData.files)),
          },
        ],
        currentHistoryIndex: 0,
        liveGenerated: appData.liveGenerated,
      };

      const updated = [...projects, newProject];
      setActiveProjectId(newProject.id);
      if (newProject.files.length > 0) {
        setActiveFile(newProject.files[0]);
      }
      saveProjects(updated);
    } catch (err: any) {
      console.error(err);
      alert("Orca Synthesis Error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Continuous conversational modifier function
  const handleSendMessage = async (msgText: string) => {
    const activeProj = getActiveProject();
    if (!activeProj || !activeFile || isProcessingChat) return;

    setIsProcessingChat(true);

    // Append user's chat message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: msgText,
      timestamp: new Date().toISOString(),
    };

    const updatedConversation = [...activeProj.conversation, userMsg];
    let updatedProj = { ...activeProj, conversation: updatedConversation };
    
    // Set immediate status feedback in state
    let updatedProjects = projects.map((p) => (p.id === activeProj.id ? updatedProj : p));
    setProjects(updatedProjects);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: msgText,
          currentFileContent: activeFile.content,
          appName: activeProj.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Compilation request failed on modification compiler.");
      }

      const modData = await response.json();

      // Create modified copy of file structure
      const nextFiles = activeProj.files.map((file) => {
        if (file.path === activeFile.path) {
          return {
            ...file,
            content: modData.updatedContent,
          };
        }
        return file;
      });

      // Update selected active file state in UI
      const matchingActiveFile = nextFiles.find((f) => f.path === activeFile.path);
      if (matchingActiveFile) {
        setActiveFile(matchingActiveFile);
      }

      // Record this state in Version Control history
      const nextHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        summary: modData.changeSummary || `Updated ${activeFile.path}`,
        files: JSON.parse(JSON.stringify(nextFiles)),
      };

      // Discard any history indices ahead of current index (standard Undo branch pruning)
      const prunedHistory = activeProj.history.slice(0, activeProj.currentHistoryIndex + 1);
      const nextHistory = [...prunedHistory, nextHistoryItem];
      const nextIndex = nextHistory.length - 1;

      // Append assistant's explanation chat message
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: modData.changeSummary || "Applied changes to the codebase successfully.",
        timestamp: new Date().toISOString(),
        filesTouched: modData.filesTouched || [activeFile.path],
      };

      updatedProj = {
        ...updatedProj,
        files: nextFiles,
        conversation: [...updatedConversation, assistantMsg],
        history: nextHistory,
        currentHistoryIndex: nextIndex,
      };

      const finalProjects = projects.map((p) => (p.id === activeProj.id ? updatedProj : p));
      saveProjects(finalProjects);
    } catch (err: any) {
      console.error(err);
      
      // Inject friendly notification message if fail
      const failMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Error applying modification: " + err.message + ". Re-routing compilation.",
        timestamp: new Date().toISOString(),
      };
      updatedProj = {
        ...updatedProj,
        conversation: [...updatedConversation, failMsg],
      };
      setProjects(projects.map((p) => (p.id === activeProj.id ? updatedProj : p)));
    } finally {
      setIsProcessingChat(false);
    }
  };

  // Undo / Redo mechanics
  const handleUndo = () => {
    const activeProj = getActiveProject();
    if (!activeProj || activeProj.currentHistoryIndex <= 0) return;

    const nextIndex = activeProj.currentHistoryIndex - 1;
    const historicFiles = JSON.parse(JSON.stringify(activeProj.history[nextIndex].files)) as FileData[];

    const updatedProj = {
      ...activeProj,
      files: historicFiles,
      currentHistoryIndex: nextIndex,
      conversation: [
        ...activeProj.conversation,
        {
          id: Date.now().toString(),
          role: "system",
          content: `Workspace rolled back to: "${activeProj.history[nextIndex].summary}" (Index v${nextIndex + 1})`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (activeFile) {
      const restoredActive = historicFiles.find((f) => f.path === activeFile.path) || historicFiles[0];
      setActiveFile(restoredActive);
    }

    saveProjects(projects.map((p) => (p.id === activeProj.id ? updatedProj : p)));
  };

  const handleRedo = () => {
    const activeProj = getActiveProject();
    if (!activeProj || activeProj.currentHistoryIndex >= activeProj.history.length - 1) return;

    const nextIndex = activeProj.currentHistoryIndex + 1;
    const historicFiles = JSON.parse(JSON.stringify(activeProj.history[nextIndex].files)) as FileData[];

    const updatedProj = {
      ...activeProj,
      files: historicFiles,
      currentHistoryIndex: nextIndex,
      conversation: [
        ...activeProj.conversation,
        {
          id: Date.now().toString(),
          role: "system",
          content: `Workspace rolled forward to: "${activeProj.history[nextIndex].summary}" (Index v${nextIndex + 1})`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (activeFile) {
      const restoredActive = historicFiles.find((f) => f.path === activeFile.path) || historicFiles[0];
      setActiveFile(restoredActive);
    }

    saveProjects(projects.map((p) => (p.id === activeProj.id ? updatedProj : p)));
  };

  const handleJumpToHistoryIndex = (index: number) => {
    const activeProj = getActiveProject();
    if (!activeProj || index < 0 || index >= activeProj.history.length) return;

    const historicFiles = JSON.parse(JSON.stringify(activeProj.history[index].files)) as FileData[];

    const updatedProj = {
      ...activeProj,
      files: historicFiles,
      currentHistoryIndex: index,
      conversation: [
        ...activeProj.conversation,
        {
          id: Date.now().toString(),
          role: "system" as const,
          content: `Workspace time-traveled to revision: "${activeProj.history[index].summary}" (Index v${index + 1})`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (activeFile) {
      const restoredActive = historicFiles.find((f) => f.path === activeFile.path) || historicFiles[0];
      setActiveFile(restoredActive);
    }

    saveProjects(projects.map((p) => (p.id === activeProj.id ? updatedProj : p)));
  };

  const handleAddMilestone = (milestoneData: { title: string; description: string; type: "feat" | "fix" | "refactor" | "release" | "test" | "custom"; timestamp: string }) => {
    const activeProj = getActiveProject();
    if (!activeProj) return;

    const newMilestone = {
      id: `milestone-${Date.now()}`,
      ...milestoneData
    };

    const updatedProj = {
      ...activeProj,
      milestones: [...(activeProj.milestones || []), newMilestone]
    };

    saveProjects(projects.map((p) => (p.id === activeProj.id ? updatedProj : p)));
  };

  const handleDeleteMilestone = (id: string) => {
    const activeProj = getActiveProject();
    if (!activeProj) return;

    const updatedProj = {
      ...activeProj,
      milestones: (activeProj.milestones || []).filter((m) => m.id !== id)
    };

    saveProjects(projects.map((p) => (p.id === activeProj.id ? updatedProj : p)));
  };

  const handleUpdateStylingArchitecture = async (targetStyling: "tailwind" | "shadcn" | "css-modules") => {
    const activeProj = getActiveProject();
    if (!activeProj) return;

    setIsProcessingChat(true);

    try {
      const response = await fetch("/api/convert-styling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentFiles: activeProj.files,
          targetStyling,
          appName: activeProj.name
        }),
      });

      if (!response.ok) {
        throw new Error("Styling conversion failed on server compilation.");
      }

      const data = await response.json();
      const updatedFiles = data.files;
      const explanation = data.explanation;

      const updatedHistoryItem = {
        id: `styling-refactor-${Date.now()}`,
        timestamp: new Date().toISOString(),
        summary: `Refactored styling architecture to ${targetStyling === "css-modules" ? "CSS Modules" : targetStyling === "shadcn" ? "Shadcn/UI" : "Tailwind CSS"}`,
        files: JSON.parse(JSON.stringify(updatedFiles))
      };

      const updatedProject = {
        ...activeProj,
        files: updatedFiles,
        stylingArchitecture: targetStyling,
        history: [...activeProj.history, updatedHistoryItem],
        currentHistoryIndex: activeProj.history.length + 1,
        conversation: [
          ...activeProj.conversation,
          {
            id: `convert-styling-${Date.now()}`,
            role: "assistant" as const,
            content: `### Styling Architecture Switcher\nI have successfully refactored the application's styling architecture to **${targetStyling === "css-modules" ? "CSS Modules" : targetStyling === "shadcn" ? "Shadcn/UI" : "Tailwind CSS"}**.\n\n**Process Overview:**\n${explanation}`,
            timestamp: new Date().toISOString()
          }
        ]
      };

      const updatedProjects = projects.map(p => p.id === activeProj.id ? updatedProject : p);
      saveProjects(updatedProjects);

      const nextActiveFile = updatedFiles.find((f: FileData) => f.path === activeFile?.path) || updatedFiles[0];
      setActiveFile(nextActiveFile);
    } catch (err: any) {
      console.error(err);
      alert("Styling Switcher Error: " + err.message);
    } finally {
      setIsProcessingChat(false);
    }
  };

  // One-click Export trigger (APK, Docker, ZIP package)
  const handleExport = (type: string = "ZIP") => {
    const activeProj = getActiveProject();
    if (!activeProj) return;

    setExportNotification(`Generating secure ${type} package & establishing private git binaries...`);
    setTimeout(() => {
      setExportNotification(null);
      
      // Simulate file download
      const element = document.createElement("a");
      const file = new Blob([activeFile?.content || ""], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${activeProj.name.toLowerCase().replace(/\s+/g, "_")}_src.zip`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 2200);
  };

  // Simulated live deployment compilation logic
  const handleDeploy = () => {
    const activeProj = getActiveProject();
    if (!activeProj || isDeploying) return;

    setIsDeploying(true);
    setDeployUrl(null);
    setDeployLogs([]);

    const logSteps = [
      "Establishing isolated cloud build workspace container...",
      "Resolving server-side micro-architecture dependencies...",
      "Linting and typechecking source directory App.tsx...",
      "Executing system command 'esbuild App.tsx --minify --bundle --platform=browser'...",
      "Bundle size compiled: 142.5 KB. Asset tree optimization 100% complete.",
      "Parsing PostgreSQL schema into target cloud container database...",
      "Injecting safe CORS and environment secrets into production runtime...",
      "Uploading assets to decentralized content deliver networks...",
      "Routing live preview HTTPS certificates... SUCCESS",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        setDeployLogs((prev) => [...prev, `[INFO ${new Date().toLocaleTimeString()}] ${logSteps[currentStep]}`]);
        currentStep++;
      } else {
        clearInterval(interval);
        setDeployUrl(`https://orca-build-${activeProj.id}.vercel.app`);
        setDeployLogs((prev) => [...prev, `[SUCCESS] Deployed production server successfully!`]);
        setIsDeploying(false);
      }
    }, 450);
  };

  // GDPR Data purger
  const handleDeleteAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProjects([]);
    setActiveProjectId(null);
    setActiveFile(null);
    setDeployUrl(null);
    setDeployLogs([]);
    alert("Purge successful. All local workspace projects and custom prompts have been permanently deleted.");
  };

  const handleImportDatabase = (importedProjects: Project[], merge: boolean) => {
    let nextProjects: Project[] = [];
    if (merge) {
      const importedIds = new Set(importedProjects.map(p => p.id));
      const projectsToKeep = projects.filter(p => !importedIds.has(p.id));
      nextProjects = [...projectsToKeep, ...importedProjects];
    } else {
      nextProjects = importedProjects;
    }

    saveProjects(nextProjects);
    if (nextProjects.length > 0) {
      const lastProject = nextProjects[nextProjects.length - 1];
      setActiveProjectId(lastProject.id);
      if (lastProject.files.length > 0) {
        setActiveFile(lastProject.files[0]);
      }
    } else {
      setActiveProjectId(null);
      setActiveFile(null);
    }
  };

  const activeProject = getActiveProject();

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-[#05070a] text-slate-200" : "bg-[#f0f2f5] text-slate-800"} font-sans flex flex-col transition-colors duration-300 relative`}>
      {/* Dynamic ambient blur spots for frosted glow */}
      {theme === "dark" ? (
        <>
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>
        </>
      ) : (
        <>
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>
        </>
      )}
      
      {/* Header Room */}
      <Header
        currentProject={activeProject}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDeploy={handleDeploy}
        onExport={() => handleExport("ZIP")}
        onOpenDatabaseHub={() => setIsDatabaseHubOpen(true)}
        isDeploying={isDeploying}
        isSaving={isSaving}
      />

      {/* Main View Container */}
      <div className="flex-1 flex flex-col z-10 relative">
        {activeProject && activeFile ? (
          <Workspace
            project={activeProject}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessingChat}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onRegenerateFile={() => {}}
            onUpdateStylingArchitecture={handleUpdateStylingArchitecture}
            onJumpToHistoryIndex={handleJumpToHistoryIndex}
            onAddMilestone={handleAddMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            isDeploying={isDeploying}
            onDeploy={handleDeploy}
            deployUrl={deployUrl}
            deployLogs={deployLogs}
            theme={theme}
          />
        ) : (
          <WelcomeScreen onGenerate={handleGenerateProject} isGenerating={isGenerating} theme={theme} />
        )}
      </div>

      {/* SettingsSpecs Modal */}
      <ProjectSettings
        currentProject={activeProject}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDeleteAllData={handleDeleteAllData}
        theme={theme}
      />

      {/* Database Hub Modal */}
      <DatabaseHubModal
        isOpen={isDatabaseHubOpen}
        onClose={() => setIsDatabaseHubOpen(false)}
        projects={projects}
        onImportDatabase={handleImportDatabase}
        theme={theme}
      />

      {/* Export loading Drawer / Indicator Overlay */}
      {exportNotification && (
        <div className={`fixed bottom-6 right-6 z-50 ${theme === "dark" ? "glass-panel-dark text-slate-200 border-cyan-500/40" : "glass-panel-light text-slate-800 border-cyan-500/40"} rounded-2xl p-5 shadow-2xl max-w-sm flex items-start space-x-3.5 animate-in slide-in-from-bottom-5 duration-300 shadow-cyan-500/5`}>
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider">Compiling Export package</h4>
            <p className={`text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>{exportNotification}</p>
          </div>
        </div>
      )}
    </div>
  );
}
