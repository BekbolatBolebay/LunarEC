export type IdeView = 'editor' | 'files' | 'terminal' | 'ai';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: 'ts' | 'json' | 'md' | 'env' | 'js' | 'css' | 'html' | 'rs';
  status?: 'M' | 'U' | 'checked' | 'none';
  childrenCount?: number;
  content?: string;
  isOpen?: boolean;
  children?: FileItem[];
}

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  isDirty?: boolean;
  language: string;
}

export interface TerminalLog {
  id: string;
  type: 'cmd' | 'info' | 'success' | 'warn' | 'error' | 'badge-success' | 'badge-db' | 'badge-warn' | 'http' | 'json' | 'raw';
  text?: string;
  data?: any;
}

export interface TerminalSession {
  id: string;
  title: string;
  cwd: string;
  logs: TerminalLog[];
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  model?: string;
  contextSnippet?: {
    file: string;
    lines: string;
  };
  codeBlock?: {
    fileName: string;
    language: string;
    code: string;
  };
  highlights?: string[];
  metrics?: string;
}

export interface GitCommitRecord {
  hash: string;
  message: string;
  author: string;
  time: string;
  filesChanged: number;
}
