'use client';

import React, { useState } from 'react';
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
  const [editorCode, setEditorCode] = useState<string>(
    initialFiles[0]?.children?.[0]?.children?.[0]?.children?.[0]?.content || ''
  );
  const [terminalSessions, setTerminalSessions] = useState<TerminalSession[]>(
    initialTerminalSessions
  );
  const [activeTerminalId, setActiveTerminalId] = useState<string>('1');
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>(initialAiMessages);

  // Handler: Select file in File Explorer
  const handleSelectFile = (file: FileItem) => {
    if (file.type === 'file') {
      const existingTab = tabs.find((t) => t.id === file.id);
      if (!existingTab) {
        const newTab: EditorTab = {
          id: file.id,
          name: file.name,
          path: file.path,
          language: file.extension === 'json' ? 'json' : 'typescript'
        };
        setTabs([...tabs, newTab]);
      }
      setActiveTabId(file.id);
      if (file.content) {
        setEditorCode(file.content);
      }
      setCurrentView('editor');
    }
  };

  // Handler: Tab select & close
  const handleSelectTab = (id: string) => {
    setActiveTabId(id);
    const findFile = (items: FileItem[]): FileItem | undefined => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const res = findFile(item.children);
          if (res) return res;
        }
      }
      return undefined;
    };
    const targetFile = findFile(files);
    if (targetFile && targetFile.content) {
      setEditorCode(targetFile.content);
    }
  };

  const handleCloseTab = (id: string) => {
    const updated = tabs.filter((t) => t.id !== id);
    setTabs(updated);
    if (activeTabId === id && updated.length > 0) {
      handleSelectTab(updated[0].id);
    }
  };

  // Handler: Run Project (Play button in top bar)
  const handleRunProject = () => {
    setCurrentView('terminal');
    const newLog = {
      id: 'run-' + Date.now(),
      type: 'badge-success' as const,
      text: 'Жоба сәтті іске қосылды: http://localhost:8080 (Hot Reload белсенді)'
    };
    setTerminalSessions((prev) =>
      prev.map((s) =>
        s.id === '1' ? { ...s, logs: [...s.logs, newLog] } : s
      )
    );
  };

  // Handler: Run custom terminal command
  const handleRunCommand = (cmd: string) => {
    const isGit = cmd.startsWith('git');
    const newLogs = [
      {
        id: 'c1-' + Date.now(),
        type: 'cmd' as const,
        text: `developer@codecraft : ~/nexflow-api $ ${cmd}`
      },
      {
        id: 'c2-' + Date.now(),
        type: isGit ? ('badge-db' as const) : ('badge-success' as const),
        text: isGit
          ? 'Git өзгерістері өңделді: On branch main. Nothing to commit, working tree clean.'
          : `Пәрмен орындалды: ${cmd} (0 қателік)`
      }
    ];

    setTerminalSessions((prev) =>
      prev.map((s) =>
        s.id === activeTerminalId ? { ...s, logs: [...s.logs, ...newLogs] } : s
      )
    );
  };

  // Handler: AI message send
  const handleSendAiMessage = (text: string) => {
    const userMsg: AiChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const aiReply: AiChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: `"${text}" сұрағыңыз бойынша код сарапталды. Оңтайландырылған нұсқаны төменде ұсынамын:`,
        timestamp: 'жаңа ғана',
        codeBlock: {
          fileName: 'server.ts',
          language: 'TypeScript',
          code: `// Fastify оңтайландырылған маршрут\nexport const optimizedHandler = async (req, reply) => {\n  return reply.send({ success: true, timestamp: Date.now() });\n};`
        },
        highlights: [
          'Жадты үнемдеу және асинхронды өңдеу жақсартылды.',
          'Қауіпсіздік тексеруі толықтай қосылды.'
        ],
        metrics: '142 tokens • 0.9s'
      };
      setAiMessages((prev) => [...prev, aiReply]);
    }, 800);
  };

  // Handler: Apply AI code into editor
  const handleApplyAiCode = (code: string) => {
    setEditorCode((prev) => prev + '\n\n' + code);
    setCurrentView('editor');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-0 md:p-6 font-sans">
      {/* Top Toggle Switch (Preview Frame vs Fullscreen) on Desktop */}
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
        {/* Dynamic Island / Speaker notch on Phone Frame */}
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
          projectName="nexflow-api"
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
              onChangeCode={setEditorCode}
              onOpenQuickFix={() => setCurrentView('ai')}
            />
          )}

          {currentView === 'files' && (
            <FileExplorerView
              files={files}
              onSelectFile={handleSelectFile}
              activeFileId={activeTabId}
              onCommit={() => {
                setCurrentView('terminal');
                handleRunCommand('git commit -m "feat(api): optimize fastify cluster deployment"');
              }}
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
            />
          )}

          {currentView === 'ai' && (
            <AiAssistantView
              messages={aiMessages}
              onSendMessage={handleSendAiMessage}
              onApplyCode={handleApplyAiCode}
              onClearHistory={() => setAiMessages([])}
            />
          )}
        </main>

        {/* 3. Bottom Navigation */}
        <BottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
          aiBadgeCount={1}
        />
      </div>
    </div>
  );
};
