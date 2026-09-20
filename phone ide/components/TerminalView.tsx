'use client';

import React, { useState } from 'react';
import { TerminalSession, TerminalLog } from '../types';
import { Trash2, RotateCw, Columns, X } from 'lucide-react';

interface TerminalViewProps {
  sessions: TerminalSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onClearSession?: (id: string) => void;
  onRunCommand?: (cmd: string) => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onClearSession,
  onRunCommand
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;
    if (onRunCommand) {
      onRunCommand(currentInput);
    }
    setCurrentInput('');
  };

  const insertKey = (token: string) => {
    setCurrentInput((prev) => prev + token);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] overflow-hidden font-mono">
      {/* 1. Terminal Tabs & Actions */}
      <div className="flex items-center justify-between bg-[#090d13] border-b border-[#30363d] px-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs border-r border-[#21262d] cursor-pointer shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#0d1117] text-[#f0f6fc] border-t-2 border-t-[#1f6feb] font-medium'
                    : 'text-[#8b949e] hover:bg-[#161b22]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-[#58a6ff]' : 'bg-[#8b949e]'
                  }`}
                />
                <span className="truncate max-w-[120px]">{session.title}</span>
                {isActive && (
                  <button className="p-0.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white transition ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1 py-1 shrink-0 text-[#8b949e]">
          <button
            onClick={() => onClearSession && onClearSession(activeSessionId)}
            className="p-1.5 rounded-lg hover:bg-[#21262d] hover:text-white transition"
            title="Тазарту"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-[#21262d] hover:text-white transition"
            title="Қайта жүктеу"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-[#21262d] hover:text-white transition"
            title="Бөлу (Split)"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Terminal Console Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs text-[#e6edf3] selection:bg-[#264f78]">
        {activeSession.logs.map((log) => (
          <RenderTerminalLog key={log.id} log={log} />
        ))}

        {/* Active Input Line */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-1">
          <span className="text-[#58a6ff]">developer@codecraft</span>
          <span className="text-[#8b949e]">:</span>
          <span className="text-[#d2a8ff]">~/nexflow-api</span>
          <span className="text-[#3fb950] font-bold">$</span>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="пәрменді енгізіңіз..."
            className="flex-1 bg-transparent text-[#f0f6fc] outline-none font-mono text-xs placeholder-[#484f58]"
          />
          <span className="w-2 h-4 bg-[#58a6ff] animate-pulse shrink-0" />
        </form>
      </div>

      {/* 3. System Metrics Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#090d13] border-t border-[#21262d] text-[11px] text-[#8b949e] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>⎋</span>
          <span>Жүйе:</span>
          <span className="text-white font-medium">CPU 12%</span>
          <span>•</span>
          <span className="text-white font-medium">RAM 410MB</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Пакет: <strong className="text-white font-normal">main</strong></span>
          <span className="text-[#58a6ff] flex items-center gap-1 font-medium">
            ⬇ Авто
          </span>
        </div>
      </div>

      {/* 4. Terminal Mobile Keyboard Shortcuts Bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#161b22] border-t border-[#30363d] overflow-x-auto no-scrollbar shrink-0">
        {['Ctrl', 'Esc', 'Tab', '|', '~', '/', '-', '&&', 'sudo', 'c'].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => insertKey(k === 'Tab' ? '  ' : k === 'Ctrl' ? '^C' : k + ' ')}
            className="px-2.5 h-8 rounded-lg bg-[#21262d] active:bg-[#30363d] text-gray-200 text-xs font-semibold flex items-center justify-center shrink-0 border border-[#30363d] transition active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
};

const RenderTerminalLog: React.FC<{ log: TerminalLog }> = ({ log }) => {
  switch (log.type) {
    case 'info':
      return <div className="text-[#8b949e] whitespace-pre-line">{log.text}</div>;

    case 'cmd':
      return (
        <div className="text-white font-semibold">
          {log.text}
        </div>
      );

    case 'badge-success':
      return (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-[#238636]/20 border border-[#238636]/40 text-[#3fb950] font-bold text-[10px]">
            [СӘТТІ / SUCCESS]
          </span>
          <span className="text-[#58a6ff]">{log.text}</span>
        </div>
      );

    case 'badge-db':
      return (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-[#8957e5]/20 border border-[#8957e5]/40 text-[#d2a8ff] font-bold text-[10px]">
            [ДЕРЕКҚОР]
          </span>
          <span className="text-gray-300">{log.text}</span>
        </div>
      );

    case 'badge-warn':
      return (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-[#d29922]/20 border border-[#d29922]/40 text-[#d29922] font-bold text-[10px]">
            [ЕСКЕРТУ / WARN]
          </span>
          <span className="text-[#e3b341]">{log.text}</span>
        </div>
      );

    case 'http':
      return (
        <div className="flex items-center justify-between text-xs py-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[#58a6ff] font-bold">{log.data?.method}</span>
            <span className="text-gray-300">{log.data?.path}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#21262d] text-[#3fb950] font-bold text-[10px]">
              {log.data?.status}
            </span>
            <span className="text-[#8b949e]">{log.data?.time}</span>
            {log.data?.ip && <span className="text-[#8b949e]">• {log.data?.ip}</span>}
          </div>
        </div>
      );

    case 'json':
      return (
        <div className="p-2.5 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1.5 my-1">
          <div className="flex items-center justify-between text-[11px] text-[#8b949e]">
            <span>{log.data?.title}</span>
            <span className="text-[10px]">{log.data?.mime}</span>
          </div>
          <pre className="text-xs text-[#79c0ff] whitespace-pre overflow-x-auto">
            {JSON.stringify(log.data?.content, null, 2)}
          </pre>
        </div>
      );

    default:
      return <div className="text-gray-300">{log.text}</div>;
  }
};
