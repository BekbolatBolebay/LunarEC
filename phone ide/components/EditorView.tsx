'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EditorTab } from '../types';
import {
  X,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Undo2,
  Redo2,
  RotateCw,
  Save,
  Check
} from 'lucide-react';

interface EditorViewProps {
  tabs: EditorTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  code: string;
  onChangeCode?: (newCode: string) => void;
  onOpenQuickFix?: () => void;
  activeFilePath?: string;
  onSave?: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  code,
  onChangeCode,
  onOpenQuickFix,
  activeFilePath = 'src/api/controllers/server.ts',
  onSave
}) => {
  const [cursorLine, setCursorLine] = useState<number>(14);
  const [cursorCol, setCursorCol] = useState<number>(22);
  const [showQuickFix, setShowQuickFix] = useState<boolean>(true);
  const [breakpointLine, setBreakpointLine] = useState<number | null>(7);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = (code || '').split('\n');
  const pathParts = activeFilePath.split('/');

  // Track cursor position
  const handleTextareaSelect = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, pos);
    const lineList = textBefore.split('\n');
    setCursorLine(lineList.length);
    setCursorCol((lineList[lineList.length - 1] || '').length + 1);
  };

  // Insert token at cursor
  const handleKeyClick = (token: string) => {
    if (!textareaRef.current || !onChangeCode) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newCode = code.substring(0, start) + token + code.substring(end);
    onChangeCode(newCode);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + token.length, start + token.length);
        handleTextareaSelect();
      }
    }, 10);
  };

  const handleApplyQuickFix = () => {
    setShowQuickFix(false);
    if (onChangeCode) {
      const fixed = code.replace(
        'req.body.clusterTarget',
        '(req.body as any)?.clusterTarget'
      );
      onChangeCode(fixed);
    }
    if (onOpenQuickFix) {
      onOpenQuickFix();
    }
  };

  const handleManualSave = () => {
    setSavedSuccess(true);
    if (onSave) onSave();
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* 1. Editor Tabs Bar */}
      <div className="flex items-center bg-[#090d13] border-b border-[#30363d] overflow-x-auto no-scrollbar shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isTs = tab.name.endsWith('.ts') || tab.name.endsWith('.tsx');
          const isJson = tab.name.endsWith('.json');
          const isMd = tab.name.endsWith('.md');

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
              {isTs && (
                <span className="w-4 h-4 rounded bg-[#3178c6] text-white font-bold text-[9px] flex items-center justify-center">
                  TS
                </span>
              )}
              {isJson && (
                <span className="text-[#e3b341] font-bold text-xs">{'{ }'}</span>
              )}
              {isMd && (
                <span className="text-[#8b949e] font-bold text-[9px]">M↓</span>
              )}

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
          {pathParts.map((part, idx) => {
            const isLast = idx === pathParts.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-[#484f58] shrink-0" />}
                {isLast ? (
                  <span className="text-white flex items-center gap-1 shrink-0 font-medium">
                    <span className="text-[#58a6ff]">•</span> {part}
                  </span>
                ) : (
                  <span className="shrink-0">{part}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Diagnostics & Save Button */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <button
            onClick={handleManualSave}
            title="Сақтау (Ctrl+S)"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-gray-300 transition"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3 h-3 text-[#3fb950]" />
                <span className="text-[#3fb950] text-[10px]">Сақталды</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3 text-[#58a6ff]" />
                <span className="text-[10px]">Сақтау</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e]">
            <XCircle className="w-3.5 h-3.5 text-[#f85149]" />
            <span className="font-semibold text-white">0</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#d29922]" />
            <span className="font-semibold text-white">{showQuickFix ? '1' : '0'}</span>
          </div>
        </div>
      </div>

      {/* 3. Code Editor Body with Line Numbers & Real-time Textarea */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs leading-relaxed">
        {/* Left Gutter: Breakpoints & Line numbers */}
        <div className="w-12 bg-[#0d1117] select-none text-[#484f58] py-2 flex flex-col items-end pr-2.5 shrink-0 border-r border-[#21262d]/50 overflow-hidden">
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

        {/* Live Editable Textarea with syntax appearance */}
        <div className="flex-1 relative overflow-hidden bg-[#0d1117]">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              if (onChangeCode) onChangeCode(e.target.value);
              handleTextareaSelect();
            }}
            onSelect={handleTextareaSelect}
            onClick={handleTextareaSelect}
            onKeyUp={handleTextareaSelect}
            spellCheck={false}
            className="w-full h-full p-2 bg-transparent text-[#e6edf3] font-mono text-xs leading-5 resize-none outline-none overflow-auto whitespace-pre selection:bg-[#264f78]"
          />
        </div>

        {/* Right Mini-Map preview */}
        <div className="w-9 bg-[#090d13]/80 border-l border-[#21262d] py-2 px-1 flex flex-col gap-0.5 select-none opacity-70 shrink-0 overflow-hidden">
          {lines.slice(0, 35).map((l, i) => (
            <div
              key={i}
              className={`h-1 rounded-sm ${
                i === 6
                  ? 'bg-[#1f6feb] w-full'
                  : i === 13 && showQuickFix
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
            className="ml-2 px-2.5 py-1 bg-[#1f6feb] hover:bg-[#388bfd] active:scale-95 text-white font-medium text-xs rounded-lg whitespace-nowrap transition shadow-sm"
          >
            Түзету (Quick Fix)
          </button>
        </div>
      )}

      {/* 5. Mobile Accessory Keyboard Toolbar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#161b22] border-t border-[#30363d] overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => {}}
          title="Undo"
          className="w-8 h-8 rounded-lg bg-[#21262d] active:bg-[#30363d] text-gray-300 flex items-center justify-center shrink-0 border border-[#30363d]"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {}}
          title="Redo"
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

        {['{}', '()', '[]', '=>', ';', ':', "'", '"', '$', 'async', 'return'].map((sym) => (
          <button
            key={sym}
            onClick={() => handleKeyClick(sym === 'async' || sym === 'return' ? sym + ' ' : sym)}
            className="px-2 h-8 rounded-lg bg-[#21262d] active:bg-[#30363d] text-gray-200 font-mono text-xs font-semibold flex items-center justify-center shrink-0 border border-[#30363d] transition active:scale-95"
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
