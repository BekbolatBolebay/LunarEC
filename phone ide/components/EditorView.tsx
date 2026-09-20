'use client';

import React, { useState } from 'react';
import { EditorTab } from '../types';
import { X, ChevronRight, AlertTriangle, XCircle, Undo2, Redo2, RotateCw } from 'lucide-react';

interface EditorViewProps {
  tabs: EditorTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  code: string;
  onChangeCode?: (newCode: string) => void;
  onOpenQuickFix?: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  code,
  onChangeCode,
  onOpenQuickFix
}) => {
  const [cursorLine, setCursorLine] = useState<number>(14);
  const [cursorCol, setCursorCol] = useState<number>(22);
  const [showQuickFix, setShowQuickFix] = useState<boolean>(true);
  const [breakpointLine, setBreakpointLine] = useState<number | null>(7);

  const lines = code.split('\n');

  const handleKeyClick = (token: string) => {
    if (onChangeCode) {
      onChangeCode(code + token);
    }
  };

  const handleApplyQuickFix = () => {
    setShowQuickFix(false);
    if (onOpenQuickFix) {
      onOpenQuickFix();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* 1. Editor Tabs Bar */}
      <div className="flex items-center bg-[#090d13] border-b border-[#30363d] overflow-x-auto no-scrollbar shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs border-r border-[#21262d] cursor-pointer shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#0d1117] text-[#f0f6fc] border-t-2 border-t-[#1f6feb] font-medium'
                  : 'text-[#8b949e] hover:bg-[#161b22]'
              }`}
            >
              {/* TS badge */}
              <span className="w-4 h-4 rounded bg-[#3178c6] text-white font-bold text-[9px] flex items-center justify-center">
                TS
              </span>

              <span className="font-mono text-xs">{tab.name}</span>

              {tab.isDirty && (
                <span className="w-2 h-2 rounded-full bg-[#e3b341] ml-0.5" />
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white transition ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. Breadcrumbs & Diagnostics Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1117] border-b border-[#21262d] text-xs font-mono shrink-0">
        <div className="flex items-center gap-1 text-[#8b949e] overflow-x-auto no-scrollbar">
          <span>src</span>
          <ChevronRight className="w-3 h-3 text-[#484f58]" />
          <span>api</span>
          <ChevronRight className="w-3 h-3 text-[#484f58]" />
          <span>controllers</span>
          <ChevronRight className="w-3 h-3 text-[#484f58]" />
          <span className="text-white flex items-center gap-1">
            <span className="text-[#58a6ff]">•</span> server.ts
          </span>
        </div>

        {/* Diagnostics Pills */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e]">
            <XCircle className="w-3.5 h-3.5 text-[#f85149]" />
            <span className="font-semibold text-white">0</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#d29922]" />
            <span className="font-semibold text-white">1</span>
          </div>
        </div>
      </div>

      {/* 3. Code Editor Body with Minimap & Line numbers */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs leading-relaxed">
        {/* Left Gutter: Breakpoints & Line numbers */}
        <div className="w-12 bg-[#0d1117] select-none text-[#484f58] py-2 flex flex-col items-end pr-2.5 shrink-0 border-r border-[#21262d]/50">
          {lines.map((_, index) => {
            const lineNum = index + 1;
            const hasBreakpoint = breakpointLine === lineNum;
            const isCursorLine = cursorLine === lineNum;

            return (
              <div
                key={lineNum}
                onClick={() => setBreakpointLine(hasBreakpoint ? null : lineNum)}
                className={`h-5 w-full flex items-center justify-end gap-1 cursor-pointer transition ${
                  isCursorLine ? 'text-[#f0f6fc] font-bold' : 'hover:text-[#8b949e]'
                }`}
              >
                {hasBreakpoint ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f85149] shadow-sm animate-pulse" />
                ) : (
                  <span className="w-2.5" />
                )}
                <span className="text-[11px]">{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Code Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-2 text-[#e6edf3] whitespace-pre font-mono selection:bg-[#264f78] selection:text-white">
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = lineNum === cursorLine;

            return (
              <div
                key={lineNum}
                onClick={() => setCursorLine(lineNum)}
                className={`h-5 flex items-center px-1 rounded transition-colors ${
                  isHighlighted ? 'bg-[#161b22] border-l-2 border-[#1f6feb]' : ''
                }`}
              >
                <RenderCodeLine line={lineText} lineNum={lineNum} />
              </div>
            );
          })}
        </div>

        {/* Right Mini-Map preview bar */}
        <div className="w-10 bg-[#090d13]/80 border-l border-[#21262d] py-2 px-1 flex flex-col gap-0.5 select-none opacity-80 shrink-0 overflow-hidden">
          {lines.map((l, i) => (
            <div
              key={i}
              className={`h-1 rounded-sm ${
                i === 6
                  ? 'bg-blue-500 w-full'
                  : i === 13
                  ? 'bg-amber-400 w-3/4'
                  : l.trim().length > 0
                  ? 'bg-[#30363d] w-4/5'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4. Quick Fix Popover Overlay (if active) */}
      {showQuickFix && (
        <div className="mx-3 mb-2 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center justify-between shadow-lg shadow-black/40 text-xs shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 overflow-hidden text-gray-300">
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
              ℹ
            </span>
            <p className="truncate">
              <span className="text-amber-300 font-mono font-medium">clusterTarget:</span> FastifyBody типінде міндетті емес
            </p>
          </div>
          <button
            onClick={handleApplyQuickFix}
            className="ml-2 px-2.5 py-1 bg-[#1f6feb] hover:bg-[#388bfd] active:scale-95 text-white font-medium text-xs rounded-lg whitespace-nowrap transition"
          >
            Түзету (Quick Fix)
          </button>
        </div>
      )}

      {/* 5. Mobile Accessory Keyboard Toolbar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#161b22] border-t border-[#30363d] overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => {}}
          className="w-8 h-8 rounded-lg bg-[#21262d] active:bg-[#30363d] text-gray-300 flex items-center justify-center shrink-0 border border-[#30363d]"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {}}
          className="w-8 h-8 rounded-lg bg-[#21262d] active:bg-[#30363d] text-gray-300 flex items-center justify-center shrink-0 border border-[#30363d]"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleKeyClick('  ')}
          className="px-2.5 h-8 rounded-lg bg-[#21262d] active:bg-[#30363d] text-gray-300 font-mono text-xs font-semibold flex items-center justify-center shrink-0 border border-[#30363d]"
        >
          Tab
        </button>

        {['{}', '()', '[]', '=>', ';', ':', "'"].map((sym) => (
          <button
            key={sym}
            onClick={() => handleKeyClick(sym)}
            className="w-8 h-8 rounded-lg bg-[#21262d] active:bg-[#30363d] text-gray-200 font-mono text-xs font-semibold flex items-center justify-center shrink-0 border border-[#30363d] transition active:scale-95"
          >
            {sym}
          </button>
        ))}
      </div>

      {/* 6. Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#090d13] border-t border-[#21262d] text-[11px] font-mono text-[#8b949e] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[#58a6ff]">
            <span className="w-2 h-2 rounded-full bg-[#1f6feb]" />
            TypeScript 5.4
          </span>
          <span>•</span>
          <span>UTF-8</span>
          <span>•</span>
          <span>Жол {cursorLine}, Баған {cursorCol}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#3fb950] font-semibold">+12</span>
          <span className="text-[#f85149] font-semibold">-3</span>
          <RotateCw className="w-3 h-3 text-[#8b949e] hover:text-white cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

// Helper for syntax styling simulation
const RenderCodeLine: React.FC<{ line: string; lineNum: number }> = ({ line, lineNum }) => {
  if (line.trim().startsWith('//')) {
    return <span className="text-[#8b949e] italic">{line}</span>;
  }

  // Tokenize roughly
  const parts = line.split(/(\b(?:import|from|export|const|async|return|await|if|try|catch|where)\b|'[^']*'|"[^"]*"|\b\d+\b)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (!part) return null;
        if (
          ['import', 'from', 'export', 'const', 'async', 'return', 'await', 'if', 'try', 'catch', 'where'].includes(
            part
          )
        ) {
          return (
            <span key={i} className="text-[#ff7b72] font-semibold">
              {part}
            </span>
          );
        }
        if (part.startsWith("'") || part.startsWith('"')) {
          return (
            <span key={i} className="text-[#a5d6ff]">
              {part}
            </span>
          );
        }
        if (/^\d+$/.test(part)) {
          return (
            <span key={i} className="text-[#79c0ff]">
              {part}
            </span>
          );
        }
        if (part.includes('clusterTarget')) {
          return (
            <span key={i} className="text-[#d2a8ff] underline decoration-amber-400 decoration-wavy">
              {part}
            </span>
          );
        }
        if (part.includes('FastifyRequest') || part.includes('FastifyReply')) {
          return (
            <span key={i} className="text-[#7ee787]">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
