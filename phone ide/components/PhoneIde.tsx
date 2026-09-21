'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IdeView, FileItem, EditorTab, TerminalSession, AiChatMessage } from '../types';
import {
  initialFiles,
  initialTabs,
  initialTerminalSessions,
  initialAiMessages
} from '../mockData';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { EditorView } from './EditorView';
import { FileExplorerView } from './FileExplorerView';
import { TerminalView } from './TerminalView';
import { AiAssistantView } from './AiAssistantView';
import { Smartphone, Monitor } from 'lucide-react';

export const PhoneIde: React.FC = () => {
  const [currentView, setCurrentView] = useState<IdeView>('editor');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  // States
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [tabs, setTabs] = useState<EditorTab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string>('server-ts');
  const [activeFilePath, setActiveFilePath] = useState<string>('app/page.tsx');
  const [editorCode, setEditorCode] = useState<string>('');
  const [terminalSessions, setTerminalSessions] = useState<TerminalSession[]>(
    initialTerminalSessions
  );
  const [activeTerminalId, setActiveTerminalId] = useState<string>('1');
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>(initialAiMessages);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [currentCwd, setCurrentCwd] = useState<string>('~');
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);

  // Helper: Find file recursively
  const findFileById = (items: FileItem[], id: string): FileItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFileById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  // Helper: Update file content in files tree recursively
  const updateFileContent = (items: FileItem[], pathOrId: string, newContent: string): FileItem[] => {
    return items.map((item) => {
      if (item.id === pathOrId || item.path === pathOrId) {
        return { ...item, content: newContent, status: 'M' };
      }
      if (item.children) {
        return { ...item, children: updateFileContent(item.children, pathOrId, newContent) };
      }
      return item;
    });
  };

  // 1. Fetch real workspace files tree from /api/ide/files
  const fetchFileTree = useCallback(async () => {
    try {
      const res = await fetch('/api/ide/files?action=tree');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tree && data.tree.length > 0) {
          setFiles(data.tree);

          // Find first code file to open if not loaded
          if (!isInitialLoaded) {
            const findFirstFile = (nodes: FileItem[]): FileItem | null => {
              for (const n of nodes) {
                if (n.type === 'file') return n;
                if (n.children) {
                  const sub = findFirstFile(n.children);
                  if (sub) return sub;
                }
              }
              return null;
            };

            const first = findFirstFile(data.tree);
            if (first) {
              loadFileContent(first.path, first.id, first.name);
            }
            setIsInitialLoaded(true);
          }
        }
      }
    } catch (err) {
      console.warn('Real file tree load fallback to mock:', err);
    }
  }, [isInitialLoaded]);

  // Load real file content from API
  const loadFileContent = async (filePath: string, fileId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/ide/files?action=read&path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEditorCode(data.content || '');
          setActiveFilePath(filePath);
          setActiveTabId(fileId);

          // Update in tree
          setFiles((prev) => updateFileContent(prev, filePath, data.content));

          // Ensure tab exists
          setTabs((prev) => {
            const exists = prev.find((t) => t.path === filePath || t.id === fileId);
            if (exists) return prev;
            return [
              ...prev,
              {
                id: fileId,
                name: fileName,
                path: filePath,
                language: filePath.endsWith('.json') ? 'json' : (filePath.endsWith('.rs') ? 'rust' : 'typescript'),
                isDirty: false
              }
            ];
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read real file, falling back:', err);
    }
  };

  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  // Select file in Explorer -> load real content & open tab
  const handleSelectFile = async (file: FileItem) => {
    if (file.type === 'file') {
      await loadFileContent(file.path, file.id, file.name);
      setCurrentView('editor');
    }
  };

  // Select tab
  const handleSelectTab = (id: string) => {
    setActiveTabId(id);
    const targetTab = tabs.find((t) => t.id === id);
    if (targetTab) {
      setActiveFilePath(targetTab.path);
      const targetFile = findFileById(files, id);
      if (targetFile?.content !== undefined) {
        setEditorCode(targetFile.content);
      } else {
        loadFileContent(targetTab.path, targetTab.id, targetTab.name);
      }
    }
  };

  // Close tab
  const handleCloseTab = (id: string) => {
    const updated = tabs.filter((t) => t.id !== id);
    setTabs(updated);
    if (activeTabId === id && updated.length > 0) {
      handleSelectTab(updated[0].id);
    }
  };

  // Editor code change
  const handleCodeChange = (newCode: string) => {
    setEditorCode(newCode);
    setFiles((prev) => updateFileContent(prev, activeTabId, newCode));
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, isDirty: true } : t))
    );
  };

  // Save current file to disk via /api/ide/files
  const handleSaveFile = async () => {
    try {
      const res = await fetch('/api/ide/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'write',
          path: activeFilePath,
          content: editorCode
        })
      });

      if (res.ok) {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, isDirty: false } : t))
        );
        // Log in terminal
        const saveLog = {
          id: 'save-' + Date.now(),
          type: 'badge-success' as const,
          text: `Файл сақталды: ${activeFilePath} (${new Blob([editorCode]).size} bytes)`
        };
        setTerminalSessions((prev) =>
          prev.map((s) =>
            s.id === activeTerminalId ? { ...s, logs: [...s.logs, saveLog] } : s
          )
        );
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Create real file/folder
  const handleCreateFile = async (name: string, isFolder = false) => {
    try {
      const newPath = name.startsWith('/') ? name.slice(1) : name;
      const res = await fetch('/api/ide/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          path: newPath,
          isFolder,
          content: isFolder ? undefined : `// ${name}\n`
        })
      });
      if (res.ok) {
        await fetchFileTree();
      }
    } catch (e) {
      console.error('Create error:', e);
    }
  };

  // Top bar Run Button
  const handleRunProject = () => {
    setCurrentView('terminal');
    handleRunCommand('npm run dev');
  };

  // Real Terminal Execution via /api/ide/terminal
  const handleRunCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    if (cmd === 'clear' || cmd === 'cls') {
      setTerminalSessions((prev) =>
        prev.map((s) => (s.id === activeTerminalId ? { ...s, logs: [] } : s))
      );
      return;
    }

    const startLog = {
      id: 'cmd-' + Date.now(),
      type: 'cmd' as const,
      text: `developer@codecraft : ${currentCwd} $ ${cmd}`
    };

    setTerminalSessions((prev) =>
      prev.map((s) =>
        s.id === activeTerminalId ? { ...s, logs: [...s.logs, startLog] } : s
      )
    );

    try {
      const res = await fetch('/api/ide/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          cwd: currentCwd === '~' ? '' : currentCwd
        })
      });

      const data = await res.json();
      if (data.cwd) {
        setCurrentCwd(data.cwd);
      }

      const logsToAdd: any[] = [];

      if (data.stdout) {
        logsToAdd.push({
          id: 'out-' + Date.now(),
          type: 'info',
          text: data.stdout
        });
      }

      if (data.stderr) {
        logsToAdd.push({
          id: 'err-' + Date.now(),
          type: data.exitCode === 0 ? 'info' : 'error',
          text: data.stderr
        });
      }

      if (data.exitCode !== undefined) {
        logsToAdd.push({
          id: 'exit-' + Date.now(),
          type: data.exitCode === 0 ? 'badge-success' : 'badge-warn',
          text: data.exitCode === 0
            ? `[СӘТТІ] Exit code: 0 (${data.durationMs || 15}ms)`
            : `[ҚАТЕ / ERROR] Exit code: ${data.exitCode} (${data.durationMs || 15}ms)`
        });
      }

      setTerminalSessions((prev) =>
        prev.map((s) =>
          s.id === activeTerminalId
            ? { ...s, cwd: data.cwd ? `~/${data.cwd}` : s.cwd, logs: [...s.logs, ...logsToAdd] }
            : s
        )
      );

      // If command modified git or files, refresh tree
      if (cmd.includes('touch') || cmd.includes('mkdir') || cmd.includes('rm') || cmd.includes('git')) {
        fetchFileTree();
      }
    } catch (err: any) {
      setTerminalSessions((prev) =>
        prev.map((s) =>
          s.id === activeTerminalId
            ? {
                ...s,
                logs: [
                  ...s.logs,
                  {
                    id: 'err-' + Date.now(),
                    type: 'error',
                    text: `Терминал қатесі: ${err.message}`
                  }
                ]
              }
            : s
        )
      );
    }
  };

  // Add new terminal session
  const handleNewTerminalSession = () => {
    const newId = String(terminalSessions.length + 1);
    const newSession: TerminalSession = {
      id: newId,
      title: `${newId}: bash`,
      cwd: currentCwd === '~' ? '~/workspace' : currentCwd,
      logs: [
        {
          id: 'init-' + Date.now(),
          type: 'info',
          text: 'Linux tty сессиясы қосылды • Пәрмен орындауға дайын.'
        }
      ]
    };
    setTerminalSessions([...terminalSessions, newSession]);
    setActiveTerminalId(newId);
  };

  // Close terminal session
  const handleCloseTerminalSession = (id: string) => {
    if (terminalSessions.length <= 1) return;
    const remaining = terminalSessions.filter((s) => s.id !== id);
    setTerminalSessions(remaining);
    if (activeTerminalId === id) {
      setActiveTerminalId(remaining[0].id);
    }
  };

  // Real AI Assistant Call via /api/ide/ai
  const handleSendAiMessage = async (userText: string) => {
    const userMsg: AiChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ide/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          activeFile: activeFilePath,
          fileContent: editorCode,
          history: aiMessages.slice(-6)
        })
      });

      const data = await res.json();
      if (data.success) {
        const aiReply: AiChatMessage = {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: data.reply || 'Жауап дайындалды.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          codeBlock: data.codeBlock,
          highlights: data.highlights,
          metrics: data.metrics || `${data.model || 'DevCopilot'} • ${Date.now() % 50 + 20}ms`
        };
        setAiMessages((prev) => [...prev, aiReply]);
      } else {
        throw new Error(data.error || 'AI жауап бере алмады');
      }
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: `⚠️ Қате: ${err.message}. Қайта көріңіз.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI Code to Editor
  const handleApplyAiCode = (codeToInsert: string) => {
    handleCodeChange(codeToInsert);
    setCurrentView('editor');
  };

  const activeFileName = activeFilePath.split('/').pop() || 'file';

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-0 md:p-6 font-sans">
      {/* Top Toggle Switch on Desktop */}
      <div className="hidden md:flex items-center gap-3 mb-4 bg-[#0d1117] border border-[#30363d] px-4 py-2 rounded-2xl shadow-xl">
        <span className="text-xs text-gray-400 font-mono">Қарау режимі:</span>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
            isPhoneFrame
              ? 'bg-[#1f6feb] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Телефон Frame (390x844)</span>
        </button>
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
            !isPhoneFrame
              ? 'bg-[#1f6feb] text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Толық экран</span>
        </button>
      </div>

      {/* Main IDE Container */}
      <div
        className={`w-full bg-[#0d1117] overflow-hidden flex flex-col transition-all duration-300 ${
          isPhoneFrame
            ? 'md:w-[395px] md:h-[844px] md:rounded-[44px] md:ring-[10px] md:ring-[#1f242c] md:shadow-2xl md:shadow-blue-950/40 h-screen'
            : 'w-full h-screen md:h-[90vh] md:max-w-5xl md:rounded-2xl md:border md:border-[#30363d]'
        }`}
      >
        {/* Dynamic Island on Phone Frame */}
        {isPhoneFrame && (
          <div className="hidden md:flex justify-center pt-2.5 pb-1 bg-[#0d1117] select-none shrink-0">
            <div className="w-24 h-4 bg-black rounded-full ring-1 ring-white/10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#161b22] mr-auto ml-2 ring-1 ring-white/5" />
              <div className="w-2 h-2 rounded-full bg-[#1f6feb]/60 mr-2" />
            </div>
          </div>
        )}

        {/* 1. Header */}
        <Header
          onRun={handleRunProject}
          branchName="main"
          projectName="LunarEC"
        />

        {/* 2. Dynamic Main View */}
        <main className="flex-1 overflow-hidden relative">
          {currentView === 'editor' && (
            <EditorView
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              code={editorCode}
              onChangeCode={handleCodeChange}
              onOpenQuickFix={() => setCurrentView('ai')}
              activeFilePath={activeFilePath}
              onSave={handleSaveFile}
            />
          )}

          {currentView === 'files' && (
            <FileExplorerView
              files={files}
              onSelectFile={handleSelectFile}
              activeFileId={activeTabId}
              onCommitSuccess={(msg) => {
                setCurrentView('terminal');
                handleRunCommand(`git commit -am "${msg}"`);
              }}
              onCreateFile={(name) => handleCreateFile(name, false)}
              onCreateFolder={(name) => handleCreateFile(name, true)}
            />
          )}

          {currentView === 'terminal' && (
            <TerminalView
              sessions={terminalSessions}
              activeSessionId={activeTerminalId}
              onSelectSession={setActiveTerminalId}
              onClearSession={(id) => {
                setTerminalSessions((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, logs: [] } : s))
                );
              }}
              onRunCommand={handleRunCommand}
              onNewSession={handleNewTerminalSession}
              onCloseSession={handleCloseTerminalSession}
            />
          )}

          {currentView === 'ai' && (
            <AiAssistantView
              messages={aiMessages}
              onSendMessage={handleSendAiMessage}
              onApplyCode={handleApplyAiCode}
              onClearHistory={() => setAiMessages([])}
              activeFileName={activeFileName}
              activeCode={editorCode}
            />
          )}
        </main>

        {/* 3. Bottom Navigation */}
        <BottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
          aiBadgeCount={isAiLoading ? 1 : 0}
        />
      </div>
    </div>
  );
};
