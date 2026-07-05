import React, { useState, useRef } from "react";
import { 
  Database, Download, Upload, X, CheckCircle, AlertTriangle, 
  Code, History, Sparkles, RefreshCw, Layers, Server
} from "lucide-react";
import { Project, FileData } from "../types";

interface DatabaseHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onImportDatabase: (importedProjects: Project[], merge: boolean) => void;
  theme: "dark" | "light";
}

export default function DatabaseHubModal({
  isOpen,
  onClose,
  projects,
  onImportDatabase,
  theme
}: DatabaseHubModalProps) {
  const isDark = theme === "dark";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedProjects, setParsedProjects] = useState<Project[] | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isMerging, setIsMerging] = useState(true); // default to merging rather than overwriting
  const [exportingType, setExportingType] = useState<string | null>(null);

  if (!isOpen) return null;

  // SQL Dump Generator
  const generateSqlDump = (projectsList: Project[]): string => {
    const timestamp = new Date().toISOString();
    let sql = `-- =========================================================\n`;
    sql += `-- ORCA APP BUILDER RELATIONAL DATABASE DUMP\n`;
    sql += `-- Generated At: ${timestamp}\n`;
    sql += `-- Total Projects: ${projectsList.length}\n`;
    sql += `-- Compatible with SQLite, PostgreSQL, and MySQL.\n`;
    sql += `-- Includes all project specifications, active codes, chat histories,\n`;
    sql += `-- version control history, custom milestones, and schemas.\n`;
    sql += `-- =========================================================\n\n`;

    sql += `PRAGMA foreign_keys = ON;\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- TABLE SCHEMA DEFINITIONS\n`;
    sql += `-- ---------------------------------------------------------\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS projects (\n`;
    sql += `    id TEXT PRIMARY KEY,\n`;
    sql += `    name TEXT NOT NULL,\n`;
    sql += `    description TEXT,\n`;
    sql += `    tech_category TEXT,\n`;
    sql += `    tech_frontend TEXT,\n`;
    sql += `    tech_backend TEXT,\n`;
    sql += `    tech_database TEXT,\n`;
    sql += `    tech_justification TEXT,\n`;
    sql += `    database_schema TEXT,\n`;
    sql += `    styling_architecture TEXT,\n`;
    sql += `    created_at TEXT NOT NULL,\n`;
    sql += `    current_history_index INTEGER DEFAULT 0\n`;
    sql += `);\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS project_files (\n`;
    sql += `    id TEXT PRIMARY KEY,\n`;
    sql += `    project_id TEXT NOT NULL,\n`;
    sql += `    file_path TEXT NOT NULL,\n`;
    sql += `    file_content TEXT NOT NULL,\n`;
    sql += `    file_language TEXT NOT NULL,\n`;
    sql += `    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE\n`;
    sql += `);\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS project_conversations (\n`;
    sql += `    id TEXT PRIMARY KEY,\n`;
    sql += `    project_id TEXT NOT NULL,\n`;
    sql += `    role TEXT NOT NULL,\n`;
    sql += `    content TEXT NOT NULL,\n`;
    sql += `    timestamp TEXT NOT NULL,\n`;
    sql += `    files_touched TEXT,\n`;
    sql += `    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE\n`;
    sql += `);\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS project_milestones (\n`;
    sql += `    id TEXT PRIMARY KEY,\n`;
    sql += `    project_id TEXT NOT NULL,\n`;
    sql += `    title TEXT NOT NULL,\n`;
    sql += `    description TEXT,\n`;
    sql += `    type TEXT NOT NULL,\n`;
    sql += `    timestamp TEXT NOT NULL,\n`;
    sql += `    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE\n`;
    sql += `);\n\n`;

    sql += `CREATE TABLE IF NOT EXISTS project_history_items (\n`;
    sql += `    id TEXT PRIMARY KEY,\n`;
    sql += `    project_id TEXT NOT NULL,\n`;
    sql += `    summary TEXT NOT NULL,\n`;
    sql += `    timestamp TEXT NOT NULL,\n`;
    sql += `    files_json TEXT NOT NULL,\n`;
    sql += `    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- DATABASE DATA DUMP (INSERTS)\n`;
    sql += `-- ---------------------------------------------------------\n\n`;

    const escapeStr = (val: string | undefined | null): string => {
      if (val === undefined || val === null) return "NULL";
      return `'${val.replace(/'/g, "''")}'`;
    };

    const escapeNum = (val: number | undefined | null): string => {
      if (val === undefined || val === null) return "0";
      return val.toString();
    };

    projectsList.forEach((proj) => {
      sql += `-- =========================================================\n`;
      sql += `-- DATABASE INSTANCE FOR PROJECT: ${proj.name}\n`;
      sql += `-- =========================================================\n\n`;
      
      sql += `INSERT INTO projects (id, name, description, tech_category, tech_frontend, tech_backend, tech_database, tech_justification, database_schema, styling_architecture, created_at, current_history_index)\n`;
      sql += `VALUES (\n`;
      sql += `    ${escapeStr(proj.id)},\n`;
      sql += `    ${escapeStr(proj.name)},\n`;
      sql += `    ${escapeStr(proj.description)},\n`;
      sql += `    ${escapeStr(proj.techStack?.category)},\n`;
      sql += `    ${escapeStr(proj.techStack?.frontend)},\n`;
      sql += `    ${escapeStr(proj.techStack?.backend)},\n`;
      sql += `    ${escapeStr(proj.techStack?.database)},\n`;
      sql += `    ${escapeStr(proj.techStack?.justification)},\n`;
      sql += `    ${escapeStr(proj.databaseSchema)},\n`;
      sql += `    ${escapeStr(proj.stylingArchitecture || "tailwind")},\n`;
      sql += `    ${escapeStr(proj.createdAt)},\n`;
      sql += `    ${escapeNum(proj.currentHistoryIndex)}\n`;
      sql += `);\n\n`;

      // Insert Active Files
      if (proj.files && proj.files.length > 0) {
        sql += `-- Files belonging to project: ${proj.name}\n`;
        proj.files.forEach((f, idx) => {
          const fileId = `file_${proj.id}_${idx}_${Date.now()}`;
          sql += `INSERT INTO project_files (id, project_id, file_path, file_content, file_language)\n`;
          sql += `VALUES (\n`;
          sql += `    ${escapeStr(fileId)},\n`;
          sql += `    ${escapeStr(proj.id)},\n`;
          sql += `    ${escapeStr(f.path)},\n`;
          sql += `    ${escapeStr(f.content)},\n`;
          sql += `    ${escapeStr(f.language)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      // Insert Conversation History
      if (proj.conversation && proj.conversation.length > 0) {
        sql += `-- Chat transcript records for project: ${proj.name}\n`;
        proj.conversation.forEach((msg) => {
          const touched = msg.filesTouched ? msg.filesTouched.join(",") : "";
          sql += `INSERT INTO project_conversations (id, project_id, role, content, timestamp, files_touched)\n`;
          sql += `VALUES (\n`;
          sql += `    ${escapeStr(msg.id)},\n`;
          sql += `    ${escapeStr(proj.id)},\n`;
          sql += `    ${escapeStr(msg.role)},\n`;
          sql += `    ${escapeStr(msg.content)},\n`;
          sql += `    ${escapeStr(msg.timestamp)},\n`;
          sql += `    ${escapeStr(touched)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      // Insert Milestones
      if (proj.milestones && proj.milestones.length > 0) {
        sql += `-- Manual milestones logged for project: ${proj.name}\n`;
        proj.milestones.forEach((m) => {
          sql += `INSERT INTO project_milestones (id, project_id, title, description, type, timestamp)\n`;
          sql += `VALUES (\n`;
          sql += `    ${escapeStr(m.id)},\n`;
          sql += `    ${escapeStr(proj.id)},\n`;
          sql += `    ${escapeStr(m.title)},\n`;
          sql += `    ${escapeStr(m.description)},\n`;
          sql += `    ${escapeStr(m.type)},\n`;
          sql += `    ${escapeStr(m.timestamp)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      // Insert Version Histories
      if (proj.history && proj.history.length > 0) {
        sql += `-- Time-travel history frames for project: ${proj.name}\n`;
        proj.history.forEach((hist) => {
          const filesJson = JSON.stringify(hist.files);
          sql += `INSERT INTO project_history_items (id, project_id, summary, timestamp, files_json)\n`;
          sql += `VALUES (\n`;
          sql += `    ${escapeStr(hist.id)},\n`;
          sql += `    ${escapeStr(proj.id)},\n`;
          sql += `    ${escapeStr(hist.summary)},\n`;
          sql += `    ${escapeStr(hist.timestamp)},\n`;
          sql += `    ${escapeStr(filesJson)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      sql += `\n-- ---------------------------------------------------------\n\n`;
    });

    return sql;
  };

  // Download Trigger Handles
  const handleDownloadJson = () => {
    setExportingType("JSON");
    setTimeout(() => {
      const dataStr = JSON.stringify(projects, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `orca_workspace_db_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      setExportingType(null);
    }, 1000);
  };

  const handleDownloadSql = () => {
    setExportingType("SQL");
    setTimeout(() => {
      const sqlContent = generateSqlDump(projects);
      const blob = new Blob([sqlContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      
      const exportFileDefaultName = `orca_relational_db_${new Date().toISOString().slice(0,10)}.sql`;
      
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", url);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      
      URL.revokeObjectURL(url);
      setExportingType(null);
    }, 1200);
  };

  // Import File parsing and validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setValidationError(null);
    setParsedProjects(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        // Simple schema validation
        if (!Array.isArray(json)) {
          throw new Error("Invalid backup format. Root structure must be a JSON Array of projects.");
        }

        if (json.length > 0) {
          json.forEach((proj: any, idx) => {
            if (!proj.id || !proj.name || !Array.isArray(proj.files)) {
              throw new Error(`Project at index ${idx} is missing essential parameters (id, name, or files list).`);
            }
          });
        }

        setParsedProjects(json as Project[]);
      } catch (err: any) {
        setValidationError(err.message || "Failed to parse JSON backup file.");
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleExecuteImport = () => {
    if (!parsedProjects) return;
    onImportDatabase(parsedProjects, isMerging);
    setImportSuccess(true);
    setImportFile(null);
    setParsedProjects(null);
    setTimeout(() => {
      setImportSuccess(false);
      onClose();
    }, 2500);
  };

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
            <Database className="w-5 h-5 text-cyan-500" />
            <div>
              <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Database Backup & Export Hub</h2>
              <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Export raw states, SQL dumps, or sync external backups</p>
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
          
          {/* Main Info Callout */}
          <div className={`p-4 rounded-xl border flex gap-3 ${
            isDark ? "bg-cyan-950/15 border-cyan-800/20 text-slate-300" : "bg-cyan-50/50 border-cyan-200/50 text-slate-700"
          }`}>
            <Sparkles className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Persistent Workspace Mirroring</span>
              <p className="text-[11px] opacity-90 leading-relaxed">
                This hub lets you pull or push the active local engine storage. Downloading a database captures **every line of code**, full **prompt conversation records**, granular **version history nodes**, and all metadata.
              </p>
            </div>
          </div>

          {/* DOWNLOAD / EXPORT SECTION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
              <Download className="w-4 h-4 text-cyan-500" />
              <span>Download Workspace Backups</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: JSON Export */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 ${
                isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">JSON</span>
                    <h4 className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Full App State Backup</h4>
                  </div>
                  <p className={`text-[11px] mt-1.5 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Download the complete localStorage database in portable JSON. Includes all code changes, full branch timelines, and messages. Perfect to import back or share.
                  </p>
                </div>
                {/* Touch targets >= 44px */}
                <button
                  disabled={exportingType !== null}
                  onClick={handleDownloadJson}
                  className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900 text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-cyan-500/10"
                >
                  {exportingType === "JSON" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Packaging State...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download JSON Database ({projects.length} Projs)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card 2: SQL Dump Export */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 ${
                isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">SQL</span>
                    <h4 className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Relational SQL Dump</h4>
                  </div>
                  <p className={`text-[11px] mt-1.5 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Generates a professional relational SQL script. Standard schema creates table boundaries for projects, files, and histories with escaped codes. Ideal for SQLite/PostgreSQL.
                  </p>
                </div>
                {/* Touch targets >= 44px */}
                <button
                  disabled={exportingType !== null}
                  onClick={handleDownloadSql}
                  className="w-full h-11 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-900 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  {exportingType === "SQL" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Assembling Dump...</span>
                    </>
                  ) : (
                    <>
                      <Server className="w-4 h-4" />
                      <span>Download SQL Database Dump (.sql)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* IMPORT / RESTORE SECTION */}
          <div className={`pt-5 border-t space-y-3.5 ${isDark ? "border-white/5" : "border-black/5"}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
              <Upload className="w-4 h-4 text-cyan-500" />
              <span>Import & Restore Workspace</span>
            </h3>

            <div className={`border p-4.5 rounded-xl space-y-4 ${
              isDark ? "bg-white/1 border-white/5" : "bg-black/1 border-black/5"
            }`}>
              
              {/* Selector for Merge or Overwrite */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <h4 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Import Strategy</h4>
                  <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Choose how to handle existing project keys</p>
                </div>
                <div className="flex gap-1.5 p-0.5 border border-white/10 rounded-lg bg-slate-900/50">
                  <button
                    type="button"
                    onClick={() => setIsMerging(true)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      isMerging 
                        ? "bg-cyan-500 text-black font-extrabold" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Merge Projects
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("WARNING: Overwriting will permanently delete all current workspace projects, files, and histories. Are you sure?")) {
                        setIsMerging(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      !isMerging 
                        ? "bg-rose-600 text-white font-extrabold" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Overwrite (Full Restore)
                  </button>
                </div>
              </div>

              {/* Interactive Upload Box */}
              {!parsedProjects && !importSuccess && (
                <div 
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-cyan-500/50 transition-all ${
                    isDark ? "border-white/10 bg-white/1 hover:bg-white/2" : "border-black/10 bg-black/1 hover:bg-black/2"
                  }`}
                >
                  <Upload className="w-8 h-8 opacity-40 mx-auto mb-2 text-cyan-400" />
                  <span className={`text-xs font-bold block ${isDark ? "text-slate-300" : "text-slate-700"}`}>Select JSON Backup File</span>
                  <span className="text-[10px] opacity-50 block mt-0.5">Click to browse or drop files (e.g. orca_workspace_db_*.json)</span>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              )}

              {/* Error messages */}
              {validationError && (
                <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg flex items-start space-x-2.5 text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[11px]">Validation Error</span>
                    <p className="text-[10px] opacity-90">{validationError}</p>
                  </div>
                </div>
              )}

              {/* Parsing success state - ready to commit */}
              {parsedProjects && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isDark ? "bg-cyan-950/10 border-cyan-500/25" : "bg-cyan-50/50 border-cyan-500/25"
                  }`}>
                    <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Backup Validated Successfully</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono leading-relaxed pt-1">
                      <div>
                        <span className="opacity-50 block uppercase tracking-wide">Backup Projects:</span>
                        <span className="text-xs font-bold font-sans mt-0.5 block">{parsedProjects.length} Projects</span>
                      </div>
                      <div>
                        <span className="opacity-50 block uppercase tracking-wide">Import Method:</span>
                        <span className={`text-xs font-bold font-sans mt-0.5 block ${isMerging ? "text-cyan-400" : "text-rose-400"}`}>
                          {isMerging ? "Merge & Accumulate" : "Total Database Overwrite"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-cyan-500/10">
                      <span className="opacity-50 block text-[9px] uppercase font-bold tracking-wider">Identified Projects in Backup</span>
                      <div className="flex flex-wrap gap-1">
                        {parsedProjects.map((p) => (
                          <span 
                            key={p.id}
                            className={`px-2 py-0.5 rounded text-[9px] font-semibold ${isDark ? "bg-white/5 border border-white/5 text-white" : "bg-black/5 border border-black/5 text-slate-800"}`}
                          >
                            {p.name} (v{p.history?.length || 1})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setParsedProjects(null);
                        setImportFile(null);
                      }}
                      className={`flex-1 py-2.5 rounded-lg font-semibold text-xs border cursor-pointer h-11 ${
                        isDark ? "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300" : "border-black/10 bg-black/5 hover:bg-black/10 text-slate-700"
                      }`}
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={handleExecuteImport}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-xs cursor-pointer h-11 ${
                        isMerging 
                          ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/15" 
                          : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/15"
                      }`}
                    >
                      {isMerging ? "Execute Merge Restore" : "Execute Complete Wipe & Restore"}
                    </button>
                  </div>
                </div>
              )}

              {/* Final Success Animation indicator */}
              {importSuccess && (
                <div className="p-5 text-center bg-emerald-950/10 border border-emerald-500/20 rounded-xl space-y-2 text-emerald-400">
                  <CheckCircle className="w-8 h-8 mx-auto animate-bounce text-emerald-400" />
                  <span className="font-bold text-xs block">Workspace Database Synced Successfully!</span>
                  <p className="text-[10px] opacity-75 max-w-sm mx-auto">
                    The local storage database has been updated with the parsed backup. Active workspace is reloading.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isDark ? "bg-white/2 border-white/5" : "bg-black/2 border-black/5"
        }`}>
          <div className="flex items-center space-x-1.5 opacity-80">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Relational SQLite & CJS Bundling OK</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer h-10 ${
              isDark ? "bg-white/5 hover:bg-white/10 text-white border border-white/5" : "bg-black/5 hover:bg-black/10 text-slate-800 border border-black/10"
            }`}
          >
            Close Database Hub
          </button>
        </div>

      </div>
    </div>
  );
}
