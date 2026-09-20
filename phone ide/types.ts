export type IdeView = 'editor' | 'files' | 'terminal' | 'ai';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: 'ts' | 'json' | 'md' | 'env' | 'js';
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
  logs: TerminalLog[];
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
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
