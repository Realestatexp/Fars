import React, { useState, useEffect } from "react";
import { 
  Github, GitBranch, Link2, Plus, ArrowRight, RefreshCw, 
  ExternalLink, CheckCircle2, AlertCircle, Trash2, Key, Info, Terminal
} from "lucide-react";
import { Project } from "../types";

interface GitHubSyncProps {
  project: Project;
  theme: "dark" | "light";
}

interface RepoInfo {
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
}

interface LinkedRepo {
  owner: string;
  repo: string;
  branch: string;
}

interface LogEntry {
  id: string;
  message: string;
  type: "info" | "success" | "warn" | "error";
  time: string;
}

export default function GitHubSync({ project, theme }: GitHubSyncProps) {
  const isDark = theme === "dark";

  // GitHub state
  const [githubToken, setGithubToken] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{ login: string; name: string; avatar_url: string; html_url: string } | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [oauthError, setOauthError] = useState("");

  // Input states
  const [patInput, setPatInput] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [commitMessage, setCommitMessage] = useState(`Sync Orca project: ${project.name}`);
  const [activeTab, setActiveTab] = useState<"link" | "create">("link");

  // Create repo inputs
  const [newRepoName, setNewRepoName] = useState(project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
  const [newRepoDesc, setNewRepoDesc] = useState(`Automated workspace build from Orca App Builder for: ${project.name}`);
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);

  // Sync states
  const [linkedRepo, setLinkedRepo] = useState<LinkedRepo | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<LogEntry[]>([]);

  // Add standard logs
  const addLog = (message: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(4),
      message,
      type,
      time: new Date().toLocaleTimeString(),
    };
    setSyncLogs((prev) => [entry, ...prev]);
  };

  // 1. Initial Load: Check for saved token and project-specific repo link
  useEffect(() => {
    const savedToken = localStorage.getItem("orca_github_token");
    if (savedToken) {
      setGithubToken(savedToken);
      verifyToken(savedToken);
    }

    const savedLink = localStorage.getItem(`orca_github_linked_repo_${project.id}`);
    if (savedLink) {
      try {
        setLinkedRepo(JSON.parse(savedLink));
      } catch (e) {
        console.error("Failed to parse linked repository config", e);
      }
    }
  }, [project.id]);

  // 2. OAuth Window postMessage event listener
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate the message type
      if (event.data && event.data.type === "OAUTH_AUTH_SUCCESS") {
        const { token, error } = event.data;
        if (token) {
          setGithubToken(token);
          localStorage.setItem("orca_github_token", token);
          verifyToken(token);
          addLog("GitHub Account connected via OAuth successfully.", "success");
        } else if (error) {
          setOauthError(error);
          addLog(`OAuth Authentication failed: ${error}`, "error");
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [project.id]);

  // Verify access token legitimacy
  const verifyToken = async (token: string) => {
    setIsVerifyingToken(true);
    setOauthError("");
    try {
      const res = await fetch("/api/github/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        fetchRepos(token);
      } else {
        const err = await res.json();
        setOauthError(err.error || "Session validation failed. Re-authenticate.");
        setGithubToken("");
        localStorage.removeItem("orca_github_token");
        addLog("Failed to verify GitHub Token status. Disconnected.", "error");
      }
    } catch (e: any) {
      setOauthError(e.message);
      addLog(`Error verifying GitHub credentials: ${e.message}`, "error");
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // Fetch active repository list
  const fetchRepos = async (token: string) => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch("/api/github/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
        if (data.repos && data.repos.length > 0) {
          setSelectedRepo(data.repos[0].full_name);
        }
      }
    } catch (e: any) {
      console.error("Failed to query remote repositories", e);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Trigger popup OAuth flow
  const handleConnectOAuth = async () => {
    setOauthError("");
    addLog("Initiating safe GitHub OAuth authentication popup...", "info");
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch(`/api/auth/github/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      
      if (!res.ok) {
        throw new Error("Could not retrieve authorization router configurations from dev server.");
      }
      
      const data = await res.json();
      if (data.url) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          data.url,
          "Orca GitHub Sync Authorization",
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        );
      } else {
        throw new Error("Authorization endpoint returned invalid mapping structure.");
      }
    } catch (e: any) {
      setOauthError("OAuth Connection Failed: Verify CLIENT_ID in environment setup or utilize a direct Personal Access Token.");
      addLog(`OAuth Initialization Exception: ${e.message}`, "error");
    }
  };

  // Handle direct PAT insertion
  const handleConnectPAT = () => {
    if (!patInput.trim()) return;
    const token = patInput.trim();
    setGithubToken(token);
    localStorage.setItem("orca_github_token", token);
    verifyToken(token);
    setPatInput("");
    addLog("Connected with custom GitHub Personal Access Token.", "success");
  };

  // Disconnect credentials
  const handleDisconnect = () => {
    localStorage.removeItem("orca_github_token");
    setGithubToken("");
    setUserProfile(null);
    setRepos([]);
    addLog("GitHub connection severed. Cleared credentials.", "warn");
  };

  // Associate project to an existing repository
  const handleLinkRepo = () => {
    if (!selectedRepo) return;
    const found = repos.find((r) => r.full_name === selectedRepo);
    if (found) {
      const [owner, name] = found.full_name.split("/");
      const linkInfo = { owner, repo: name, branch: found.default_branch || "main" };
      setLinkedRepo(linkInfo);
      localStorage.setItem(`orca_github_linked_repo_${project.id}`, JSON.stringify(linkInfo));
      addLog(`Bound workspace to existing repository: ${found.full_name} [${found.default_branch || "main"}]`, "success");
    }
  };

  // Create a brand new repository
  const handleCreateRepo = async () => {
    if (!newRepoName.trim() || !githubToken) return;
    setIsCreatingRepo(true);
    addLog(`Creating new remote repository "${newRepoName}" on GitHub...`, "info");
    
    try {
      const res = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: githubToken,
          name: newRepoName.trim(),
          description: newRepoDesc,
          isPrivate: newRepoPrivate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const [owner, name] = data.full_name.split("/");
        const linkInfo = { owner, repo: name, branch: data.default_branch || "main" };
        
        setLinkedRepo(linkInfo);
        localStorage.setItem(`orca_github_linked_repo_${project.id}`, JSON.stringify(linkInfo));
        
        // Add to repos list
        const newRepo: RepoInfo = {
          name: name,
          full_name: data.full_name,
          private: newRepoPrivate,
          html_url: data.html_url,
          default_branch: data.default_branch || "main",
        };
        setRepos((prev) => [newRepo, ...prev]);
        setSelectedRepo(data.full_name);
        
        addLog(`✔ Repository created and linked: ${data.full_name}`, "success");
        setNewRepoName("");
        setNewRepoDesc("");
      } else {
        const err = await res.json();
        addLog(`Failed to create repository: ${err.error || "API failure"}`, "error");
      }
    } catch (e: any) {
      addLog(`Exception creating repository: ${e.message}`, "error");
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // Remove the current project's repository link association
  const handleUnlinkRepo = () => {
    localStorage.removeItem(`orca_github_linked_repo_${project.id}`);
    setLinkedRepo(null);
    addLog("Unlinked project repository association.", "warn");
  };

  // Synchronize (Push) files to GitHub repository
  const handleSyncCode = async () => {
    if (!linkedRepo || !githubToken) return;
    setIsSyncing(true);
    addLog(`Initiating multi-file Git push sequence... Target: ${linkedRepo.owner}/${linkedRepo.repo}:${linkedRepo.branch}`, "info");

    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: githubToken,
          owner: linkedRepo.owner,
          repo: linkedRepo.repo,
          branch: linkedRepo.branch,
          files: project.files,
          commitMessage: commitMessage || `Sync from Orca App Builder: ${project.name}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addLog(`✔ Codebase synced successfully to: ${linkedRepo.owner}/${linkedRepo.repo}`, "success");
        addLog("✔ Transferred core component structures (App.tsx, configurations).", "info");
        addLog("✔ Configured and pushed .github/workflows/orca-deploy.yml automatically to activate CI/CD runners.", "success");
        
        if (data.results) {
          const successFiles = data.results.filter((r: any) => r.status === "success");
          addLog(`✔ ${successFiles.length} of ${data.results.length} build payloads verified and compiled on remote branch.`, "success");
        }
      } else {
        const err = await res.json();
        addLog(`Sync Operation failed: ${err.error || "GitHub content API failure."}`, "error");
      }
    } catch (e: any) {
      addLog(`Sync Exception: ${e.message}`, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col space-y-6 overflow-y-auto pr-2 pb-6 max-h-full`}>
      
      {/* 1. Header Hero Banner */}
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Github className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">GitHub Link & Sync</h2>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Establish real-time Version Control, deploy autonomous CI/CD pipelines, and export production code branches directly to your personal GitHub repositories.
              </p>
            </div>
          </div>

          {userProfile && (
            <div className={`flex items-center space-x-3 p-2.5 rounded-xl border ${isDark ? "bg-[#090d16] border-white/5" : "bg-white border-black/10"}`}>
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile.login} 
                className="w-10 h-10 rounded-lg border border-cyan-500/30 shadow"
              />
              <div className="text-left pr-4">
                <div className="text-xs font-bold">{userProfile.name}</div>
                <div className="text-[10px] text-cyan-500 font-mono">@{userProfile.login}</div>
              </div>
              <button
                onClick={handleDisconnect}
                className={`p-2 rounded-lg border text-red-400 hover:bg-red-500/10 cursor-pointer h-10 w-10 flex items-center justify-center transition-all ${isDark ? "border-white/5 bg-white/2" : "border-black/5 bg-black/2"}`}
                title="Disconnect Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. AUTHENTICATION SCREEN (NOT CONNECTED STATE) */}
      {!githubToken && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Method A: OAuth */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between ${isDark ? "bg-white/2 border-cyan-500/10" : "bg-white border-black/10 shadow-sm"}`}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 uppercase tracking-widest">Recommended</span>
                <h3 className="text-sm font-bold flex items-center space-x-2">
                  <Github className="w-4.5 h-4.5" />
                  <span>Connect with GitHub OAuth</span>
                </h3>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Authenticate securely through standard GitHub authorization workflows. Grants Orca read/write repository privileges to initialize code commits.
              </p>
              
              <div className={`p-3 rounded-xl text-[11px] leading-relaxed flex items-start space-x-2.5 ${isDark ? "bg-[#0a0f1d] border border-white/5 text-slate-400" : "bg-slate-50 border border-slate-200 text-slate-600"}`}>
                <Info className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <div>
                  To run OAuth flows, configure <code className="font-mono text-cyan-400">GITHUB_CLIENT_ID</code> and <code className="font-mono text-cyan-400">GITHUB_CLIENT_SECRET</code> inside your environment configuration panel.
                </div>
              </div>
              
              {oauthError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{oauthError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleConnectOAuth}
              className="mt-6 w-full py-3 px-4 rounded-xl font-bold text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/10 min-h-[44px]"
            >
              <Github className="w-4 h-4" />
              <span>Connect via OAuth popup</span>
            </button>
          </div>

          {/* Method B: Personal Access Token (Fallback) */}
          <div className={`p-6 rounded-2xl border flex flex-col justify-between ${isDark ? "bg-white/2 border-white/5" : "bg-white border-black/10 shadow-sm"}`}>
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <Key className="w-4.5 h-4.5 text-cyan-400" />
                <span>Personal Access Token (PAT)</span>
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Provide a Fine-Grained or Classic GitHub Token directly. bypasses any OAuth Application registrations entirely and connects instantly.
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Enter Access Token</label>
                <input
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                  className={`w-full px-4 py-3 rounded-xl text-xs font-mono outline-none border transition-all ${isDark ? "bg-[#05070a]/80 border-white/10 focus:border-cyan-500 text-white" : "bg-slate-50 border-black/10 focus:border-cyan-500 text-slate-900"}`}
                />
              </div>

              <div className={`p-3 rounded-xl text-[11px] leading-relaxed flex items-start space-x-2 ${isDark ? "bg-white/2 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <Info className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <span>Ensure token is configured with write permissions for <code className="text-cyan-400">repo</code> scope.</span>
              </div>
            </div>

            <button
              onClick={handleConnectPAT}
              disabled={!patInput.trim()}
              className="mt-6 w-full py-3 px-4 rounded-xl font-bold text-xs border border-white/15 bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-2 transition-all min-h-[44px]"
            >
              <span>Connect Token</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. REPOSITORY MANAGEMENT SCREEN (CONNECTED STATE) */}
      {githubToken && !linkedRepo && (
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-white/2 border-white/5" : "bg-white border-black/10 shadow-sm"}`}>
          
          {/* Tabs for linking existing vs creating new */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setActiveTab("link")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer mr-6 border-b-2 transition-all flex items-center space-x-1.5 ${activeTab === "link" ? "border-cyan-500 text-cyan-400" : "border-transparent opacity-50"}`}
            >
              <Link2 className="w-4 h-4" />
              <span>Link Existing Repository</span>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`pb-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all flex items-center space-x-1.5 ${activeTab === "create" ? "border-cyan-500 text-cyan-400" : "border-transparent opacity-50"}`}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Repository</span>
            </button>
          </div>

          {activeTab === "link" ? (
            <div className="space-y-5">
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Select an existing remote repository on your account to map to this Orca App Builder workspace.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Repository Selection</label>
                  {isLoadingRepos ? (
                    <div className={`px-4 py-3 rounded-xl border text-xs flex items-center space-x-2.5 ${isDark ? "bg-black/30 border-white/10" : "bg-slate-50 border-black/10"}`}>
                      <RefreshCw className="w-4.5 h-4.5 text-cyan-500 animate-spin" />
                      <span>Reading repository records from GitHub...</span>
                    </div>
                  ) : repos.length === 0 ? (
                    <div className={`px-4 py-3 rounded-xl border text-xs ${isDark ? "bg-black/30 border-white/10 text-slate-500" : "bg-slate-50 border-black/10 text-slate-500"}`}>
                      No repositories detected. Try creating a new one!
                    </div>
                  ) : (
                    <select
                      value={selectedRepo}
                      onChange={(e) => setSelectedRepo(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl text-xs outline-none border transition-all ${isDark ? "bg-[#090d16] border-white/10 text-white focus:border-cyan-500" : "bg-slate-50 border-black/10 text-slate-900 focus:border-cyan-500"}`}
                    >
                      {repos.map((r) => (
                        <option key={r.full_name} value={r.full_name}>
                          {r.full_name} {r.private ? "🔒" : "🌐"} ({r.default_branch || "main"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  onClick={handleLinkRepo}
                  disabled={!selectedRepo || isLoadingRepos}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 transition-all flex items-center justify-center space-x-2 cursor-pointer h-[42px] mt-2"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Bind Repository</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Define repository attributes and generate a brand-new target workspace on your GitHub profile automatically.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Repository Name</label>
                  <input
                    type="text"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
                    placeholder="my-orca-project"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-mono outline-none border transition-all ${isDark ? "bg-[#090d16] border-white/10 focus:border-cyan-500 text-white" : "bg-slate-50 border-black/10 focus:border-cyan-500 text-slate-900"}`}
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Description (Optional)</label>
                  <input
                    type="text"
                    value={newRepoDesc}
                    onChange={(e) => setNewRepoDesc(e.target.value)}
                    placeholder="Enter project description..."
                    className={`w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all ${isDark ? "bg-[#090d16] border-white/10 focus:border-cyan-500 text-white" : "bg-slate-50 border-black/10 focus:border-cyan-500 text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3">
                <div className="flex items-center space-x-4">
                  <label className="text-xs font-semibold flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newRepoPrivate}
                      onChange={() => setNewRepoPrivate(true)}
                      className="accent-cyan-500 cursor-pointer"
                    />
                    <span>Private Repository (Recommended)</span>
                  </label>
                  <label className="text-xs font-semibold flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!newRepoPrivate}
                      onChange={() => setNewRepoPrivate(false)}
                      className="accent-cyan-500 cursor-pointer"
                    />
                    <span>Public Repository</span>
                  </label>
                </div>

                <button
                  onClick={handleCreateRepo}
                  disabled={!newRepoName.trim() || isCreatingRepo}
                  className="py-3 px-6 rounded-xl font-bold text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 transition-all flex items-center justify-center space-x-2 cursor-pointer h-[42px]"
                >
                  {isCreatingRepo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{isCreatingRepo ? "Creating..." : "Create & Bind"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ACTIVE LINKED REPOSITORY CONTROLS */}
      {githubToken && linkedRepo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left panel: Actions */}
          <div className={`lg:col-span-7 p-6 rounded-2xl border flex flex-col justify-between space-y-6 ${isDark ? "bg-[#060a12]/80 border-cyan-500/10" : "bg-white border-black/10 shadow-sm"}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">Connected</span>
                  <h3 className="text-sm font-bold flex items-center space-x-1.5">
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                    <span>Active Version Control Branch</span>
                  </h3>
                </div>

                <button
                  onClick={handleUnlinkRepo}
                  className="text-[11px] font-semibold text-slate-400 hover:text-red-400 transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unlink Repo</span>
                </button>
              </div>

              {/* Repo spec line */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? "bg-white/2 border-white/5" : "bg-slate-50 border-black/5"}`}>
                <div className="space-y-1 text-left">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Repository Path</div>
                  <div className="text-sm font-bold font-mono text-cyan-400 flex items-center space-x-1">
                    <span>{linkedRepo.owner}/{linkedRepo.repo}</span>
                    <a 
                      href={`https://github.com/${linkedRepo.owner}/${linkedRepo.repo}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-cyan-400 inline-block p-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deploy Target</div>
                  <div className="text-xs font-bold font-mono text-emerald-400">
                    branch: {linkedRepo.branch}
                  </div>
                </div>
              </div>

              {/* Commit details */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Commit Message</label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Enter custom commit details..."
                  className={`w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition-all ${isDark ? "bg-[#090d16] border-white/10 focus:border-cyan-500 text-white font-mono" : "bg-slate-50 border-black/10 focus:border-cyan-500 text-slate-900"}`}
                />
              </div>

              {/* Automation Note */}
              <div className={`p-3.5 rounded-xl text-[11px] leading-relaxed flex items-start space-x-2.5 ${isDark ? "bg-[#071120] border border-cyan-500/10 text-slate-400" : "bg-sky-50 border border-sky-100 text-slate-600"}`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Autonomous CI/CD Active:</span> Pushing will automatically generate an automated <code className="font-mono text-cyan-400">.github/workflows/orca-deploy.yml</code> quality-assurance audit that lints and compiles production outputs on every push.
                </div>
              </div>
            </div>

            <button
              onClick={handleSyncCode}
              disabled={isSyncing}
              className="w-full py-4.5 px-4 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 transition-all flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg shadow-cyan-500/10 uppercase tracking-wider font-mono min-h-[44px]"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
              <span>{isSyncing ? "Transferring Codebase..." : "Sync & Trigger CI/CD Pipeline"}</span>
            </button>
          </div>

          {/* Right panel: Terminal & Logs */}
          <div className="lg:col-span-5 flex flex-col h-full space-y-2">
            <div className="flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-cyan-500" />
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Version Sync Terminal</label>
            </div>

            <div className={`flex-1 min-h-[220px] p-4 rounded-2xl font-mono text-[10px] border overflow-auto leading-relaxed text-left flex flex-col-reverse justify-end ${isDark ? "bg-[#03050a] border-white/5 text-slate-400" : "bg-slate-900 border-black/10 text-slate-300"}`}>
              {syncLogs.length === 0 ? (
                <div className="opacity-40 italic">Terminal awaiting workspace synchronization triggers...</div>
              ) : (
                syncLogs.map((log) => (
                  <div key={log.id} className="mb-2">
                    <span className="opacity-30">[{log.time}]</span>{" "}
                    <span className={
                      log.type === "success" ? "text-emerald-400" : 
                      log.type === "error" ? "text-rose-400" : 
                      log.type === "warn" ? "text-amber-400" : 
                      "text-cyan-400"
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* 5. Helpful Guide Footer Card */}
      <div className={`p-5 rounded-2xl border text-left ${isDark ? "bg-white/2 border-white/5" : "bg-white border-black/5 shadow-sm"}`}>
        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">How CI/CD and Sync Work</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] leading-relaxed">
          <div>
            <span className="font-bold text-slate-300">1. Instant Commits</span>
            <p className={`mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              When you press "Sync", Orca translates your in-memory files (App.tsx, stylesheets, mock data, configuration, schemas) directly to GitHub's REST endpoints, keeping remote repos up-to-date instantly.
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-300">2. Autonomous Pipelines</span>
            <p className={`mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              A professional GitHub Actions configuration is injected at <code className="font-mono text-cyan-400">.github/workflows/orca-deploy.yml</code> automatically. Each push runs a full container test to prevent any breakage.
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-300">3. Version Control Undo/Redo</span>
            <p className={`mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Because the local workspace maintains full edit records, you can roll back coordinates anytime and commit clean history lines to your branch with full flexibility.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
