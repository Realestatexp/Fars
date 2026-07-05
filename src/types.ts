export interface FileData {
  path: string;
  language: string;
  content: string;
  description: string;
}

export interface TechStack {
  category: string;
  frontend: string;
  backend: string;
  database: string;
  justification: string;
}

export interface Checklist {
  performance: string[];
  accessibility: string[];
  seo: string[];
  security: string[];
  ux: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  summary: string;
  files: FileData[];
}

export interface CustomMilestone {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "feat" | "fix" | "refactor" | "release" | "test" | "custom";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  filesTouched?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: TechStack;
  databaseSchema: string;
  checklist: Checklist;
  files: FileData[];
  createdAt: string;
  history: HistoryItem[];
  milestones?: CustomMilestone[];
  conversation: ChatMessage[];
  currentHistoryIndex: number;
  liveGenerated?: boolean;
  stylingArchitecture?: "tailwind" | "shadcn" | "css-modules";
}

export interface LogEntry {
  id: string;
  type: "info" | "success" | "warn" | "error";
  message: string;
  timestamp: string;
}
