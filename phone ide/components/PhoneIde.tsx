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
  const [activeFilePath, setActiveFilePath] = useState<string>('src/api/controllers/server.ts');
  const [editorCode, setEditorCode] = useState<string>(
    initialFiles[0]?.children?.[0]?.children?.[0]?.children?.[0]?.content || ''
  );
  const [terminalSessions, setTerminalSessions] = useState<TerminalSession[]>(
    initialTerminalSessions
  );
  const [activeTerminalId, setActiveTerminalId] = useState<string>('1');
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>(initialAiMessages);

  // Find file recursively
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

  // Update file content in files tree recursively
  const updateFileContent = (items: FileItem[], id: string, newContent: string): FileItem[] => {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, content: newContent, status: 'M' };
      }
      if (item.children) {
        return { ...item, children: updateFileContent(item.children, id, newContent) };
      }
      return item;
    });
  };

  // Select file in Explorer -> open tab & load code
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
      setActiveFilePath(file.path);
      setEditorCode(file.content || `// ${file.name}\n`);
      setCurrentView('editor');
    }
  };

  // Select tab
  const handleSelectTab = (id: string) => {
    setActiveTabId(id);
    const targetFile = findFileById(files, id);
    if (targetFile) {
      setActiveFilePath(targetFile.path);
      setEditorCode(targetFile.content || '');
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

  // Save current file
  const handleSaveFile = () => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, isDirty: false } : t))
    );
  };

  // Top bar Run Button
  const handleRunProject = () => {
    setCurrentView('terminal');
    const newLogs = [
      {
        id: 'run-cmd-' + Date.now(),
        type: 'cmd' as const,
        text: 'developer@codecraft : ~/nexflow-api $ npm run dev'
      },
      {
        id: 'run-succ-' + Date.now(),
        type: 'badge-success' as const,
        text: 'Сервер қосылды: http://localhost:8080 (Hot Reload белсенді)'
      },
      {
        id: 'run-http-' + Date.now(),
        type: 'http' as const,
        data: {
          method: 'GET',
          path: '/api/v1/health',
          status: '200 OK',
          time: '4ms',
          ip: '127.0.0.1'
        }
      }
    ];

    setTerminalSessions((prev) =>
      prev.map((s) =>
        s.id === activeTerminalId ? { ...s, logs: [...s.logs, ...newLogs] } : s
      )
    );
  };

  // Run terminal command emulator
  const handleRunCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    const isGit = cmd.startsWith('git');
    const isLs = cmd === 'ls' || cmd === 'dir';
    const isClear = cmd === 'clear' || cmd === 'cls';
    const isHelp = cmd === 'help' || cmd === '?';
    const isNpm = cmd.startsWith('npm');

    if (isClear) {
      setTerminalSessions((prev) =>
        prev.map((s) => (s.id === activeTerminalId ? { ...s, logs: [] } : s))
      );
      return;
    }

    let resultLog: any = {
      id: 'res-' + Date.now(),
      type: 'info' as const,
      text: `Пәрмен орындалды: ${cmd}`
    };

    if (isHelp) {
      resultLog = {
        id: 'res-' + Date.now(),
        type: 'info' as const,
        text: `Қолжетімді пәрмендер:\n • npm run dev | npm run build | npm test\n • git status | git commit -m "..." | git log | git push\n • ls | cat <файл> | clear | curl <url> | whoami | node -v`
      };
    } else if (isLs) {
      resultLog = {
        id: 'res-' + Date.now(),
        type: 'info' as const,
        text: `src/   package.json   tsconfig.json   .env.local   README.md`
      };
    } else if (cmd.startsWith('cat')) {
      const targetName = cmd.split(' ')[1] || 'server.ts';
      resultLog = {
        id: 'res-' + Date.now(),
        type: 'info' as const,
        text: `=== ${targetName} ===\n` + editorCode.slice(0, 300) + '...'
      };
    } else if (isGit) {
      if (cmd.includes('commit')) {
        resultLog = {
          id: 'res-' + Date.now(),
          type: 'badge-db' as const,
          text: `[main ${Math.random().toString(36).substring(2, 9)}] ${cmd.replace('git commit -m', '').replace(/"/g, '') || 'update changes'}\n 3 files changed, +142 insertions(+), -28 deletions(-)`
        };
      } else if (cmd.includes('push')) {
        resultLog = {
          id: 'res-' + Date.now(),
          type: 'badge-success' as const,
          text: `To github.com:BekbolatBolebay/LunarEC.git\n   main -> main [СӘТТІ / PUSHED]`
        };
      } else {
        resultLog = {
          id: 'res-' + Date.now(),
          type: 'badge-db' as const,
          text: `On branch main\nChanges not staged for commit:\n  modified: src/api/controllers/server.ts\n  modified: package.json\nUntracked files:\n  .env.local`
        };
      }
    } else if (isNpm) {
      if (cmd.includes('build')) {
        resultLog = {
          id: 'res-' + Date.now(),
          type: 'badge-success' as const,
          text: `✓ Compiled 24 modules successfully in 1.2s! (0 errors, 0 warnings)`
        };
      } else if (cmd.includes('test')) {
        resultLog = {
          id: 'res-' + Date.now(),
          type: 'badge-success' as const,
          text: `PASS src/api/controllers/server.test.ts\n Tests: 8 passed, 8 total\n Time: 0.94s`
        };
      } else {
        resultLog = {
          id: 'res-' + Date.now(),
          type: 'badge-success' as const,
          text: `[СӘТТІ / SUCCESS] Сервер қосылды: http://localhost:8080 (Hot Reload белсенді)`
        };
      }
    } else if (cmd === 'whoami') {
      resultLog = {
        id: 'res-' + Date.now(),
        type: 'info' as const,
        text: 'developer@codecraft (Lead Cloud Architect)'
      };
    } else if (cmd.startsWith('node')) {
      resultLog = {
        id: 'res-' + Date.now(),
        type: 'info' as const,
        text: 'v20.18.0 (ARM64 linux)'
      };
    }

    const newLogs = [
      {
        id: 'cmd-' + Date.now(),
        type: 'cmd' as const,
        text: `developer@codecraft : ~/nexflow-api $ ${cmd}`
      },
      resultLog
    ];

    setTerminalSessions((prev) =>
      prev.map((s) =>
        s.id === activeTerminalId ? { ...s, logs: [...s.logs, ...newLogs] } : s
      )
    );
  };

  // Add new terminal session
  const handleNewTerminalSession = () => {
    const newId = String(terminalSessions.length + 1);
    const newSession: TerminalSession = {
      id: newId,
      title: `${newId}: zsh (bash)`,
      cwd: '~/nexflow-api',
      logs: [
        {
          id: 'init-' + Date.now(),
          type: 'info',
          text: 'CodeCraft POSIX tty session started • Type "help" for commands.'
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

  // Send AI Message
  const handleSendAiMessage = (userText: string) => {
    const userMsg: AiChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let aiCode = `// Fastify оңтайландырылған маршрут\nexport const deployHandler = async (req: FastifyRequest, reply: FastifyReply) => {\n  const { clusterTarget } = req.body as any;\n  const cluster = await db.nodes.findUnique({ where: { id: clusterTarget } });\n  return reply.status(200).send({ success: true, cluster });\n};`;
      let explanation = `"${userText}" бойынша код тексерілді. Төменде оңтайландырылған және қауіпсіз нұсқасын ұсынамын:`;
      let points = [
        'TypeScript типтеу қателері толықтай реттелді.',
        'Дерекқор сұрауы оңтайландырылып, жауап қайтару жылдамдығы 2.4 есе артты.'
      ];

      if (userText.includes('түсіндір') || userText.includes('логика')) {
        explanation = `"${activeFilePath}" файлы Fastify фреймворкіндегі басты API контроллері қызметін атқарады. Мұнда JWT токендерін тексеру, clusterTarget арқылы микросервис кластерлерін іске қосу және EventBus оқиғаларын тарату орындалады.`;
        points = [
          'FastifyReply және FastifyRequest арқылы клиент сұраныстары өңделеді.',
          'db.nodes және db.events модулі арқылы инфрақұрылымдық түйіндер басқарылады.'
        ];
      } else if (userText.includes('қате') || userText.includes('тап')) {
        explanation = `Кодта 1 ықтимал типтеу ескертуі табылды: "clusterTarget" қасиеті FastifyBody типінде міндетті емес ретінде көрсетілгендіктен, (req.body as any) немесе Generic Interface арқылы қауіпсіздендіру ұсынылады.`;
        points = [
          '401 Unauthorized жауабы токен болмаған жағдайда нақты қайтарылады.',
          'Try/catch блогындағы 500 ішкі қателік қазақша қателік хабарламасымен жабдықталған.'
        ];
      }

      const aiReply: AiChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: explanation,
        timestamp: 'жаңа ғана',
        codeBlock: {
          fileName: activeFilePath.split('/').pop() || 'server.ts',
          language: 'TypeScript',
          code: aiCode
        },
        highlights: points,
        metrics: '196 tokens • 0.8s'
      };
      setAiMessages((prev) => [...prev, aiReply]);
    }, 600);
  };

  // Apply AI Code to Editor
  const handleApplyAiCode = (codeToInsert: string) => {
    const updated = editorCode + '\n\n' + codeToInsert;
    handleCodeChange(updated);
    setCurrentView('editor');
  };

  const activeFileName = activeFilePath.split('/').pop() || 'server.ts';

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
                handleRunCommand(`git commit -m "${msg}"`);
              }}
              onCreateFile={(name) => {
                handleRunCommand(`touch src/${name}`);
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
          aiBadgeCount={1}
        />
      </div>
    </div>
  );
};
