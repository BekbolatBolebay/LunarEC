'use client';

import React, { useState } from 'react';
import { AiChatMessage } from '../types';
import {
  Sparkles,
  ChevronDown,
  Trash2,
  Lightbulb,
  Bug,
  TestTube2,
  Zap,
  Copy,
  Check,
  Code,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Paperclip,
  Mic,
  ArrowUp,
  Plus,
  X,
  FileCode2
} from 'lucide-react';

interface AiAssistantViewProps {
  messages: AiChatMessage[];
  onSendMessage: (text: string) => void;
  onApplyCode?: (code: string) => void;
  onClearHistory?: () => void;
  selectedContext?: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  messages,
  onSendMessage,
  onApplyCode,
  onClearHistory,
  selectedContext = 'server.ts:14-22'
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('Claude 3.5 Sonnet');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [attachedContext, setAttachedContext] = useState<string | null>(selectedContext);

  const models = ['Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'GPT-4o Dev'];

  const quickPrompts = [
    { id: 'explain', label: 'Кодты түсіндіру', icon: Lightbulb },
    { id: 'find-bug', label: 'Қатені табу', icon: Bug },
    { id: 'test', label: 'Тест жазу', icon: TestTube2 },
    { id: 'refactor', label: 'Рефакторинг', icon: Zap }
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (code: string) => {
    if (onApplyCode) {
      onApplyCode(code);
      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* 1. AI Top Bar with Model Selector & Clear */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-[#d2a8ff] flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-4 h-4 text-[#d2a8ff]" />
          </div>
          <span className="font-semibold text-sm text-white">DevCopilot AI</span>

          {/* Model Selector Pill */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-2.5 py-1 bg-[#21262d] rounded-full text-xs text-[#c9d1d9] border border-[#30363d] hover:border-[#58a6ff] transition">
              <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
              <span>{selectedModel}</span>
              <ChevronDown className="w-3 h-3 text-[#8b949e]" />
            </button>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
          title="Тарихты тазарту"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Selected Code Context Pill Banner */}
      <div className="px-3 py-2 bg-[#090d13] border-b border-[#21262d] flex items-center justify-between text-xs font-mono shrink-0">
        <div className="flex items-center gap-1.5 text-gray-300">
          <span className="text-[#e3b341] font-bold">{'{ }'}</span>
          <span>server.ts (14–22 жолдар таңдалған)</span>
        </div>
        <span className="text-[#8b949e] text-[11px] font-sans">9 жол контекст</span>
      </div>

      {/* 3. Action Prompt Chips (Horizontal scroll) */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border-b border-[#21262d] overflow-x-auto no-scrollbar shrink-0">
        {quickPrompts.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => onSendMessage(p.label)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] active:scale-95 text-xs text-[#c9d1d9] rounded-xl border border-[#30363d] whitespace-nowrap transition"
            >
              <Icon className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Chat Messages History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs select-text">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {msg.sender === 'user' ? (
              /* User message */
              <div className="flex justify-end gap-2">
                <div className="max-w-[85%] bg-[#1f6feb]/20 border border-[#1f6feb]/40 rounded-2xl rounded-tr-sm p-3 text-white">
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-blue-300">
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                  BB
                </div>
              </div>
            ) : (
              /* AI Response */
              <div className="space-y-2">
                {/* AI Header */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-[#d2a8ff] border border-purple-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-white">DevCopilot</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#21262d] text-[#8b949e] text-[10px] border border-[#30363d]">
                    AI Ассистент
                  </span>
                  <span className="text-[#8b949e] text-[10px] ml-auto">{msg.timestamp}</span>
                </div>

                {/* AI Text bubble */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 space-y-3 shadow-md shadow-black/30">
                  <p className="leading-relaxed text-[#e6edf3]">{msg.text}</p>

                  {/* Code snippet block */}
                  {msg.codeBlock && (
                    <div className="rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117]">
                      {/* Code Block Top bar */}
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-[11px]">
                        <div className="flex items-center gap-1.5 text-gray-300 font-mono">
                          <FileCode2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                          <span>{msg.codeBlock.fileName}</span>
                          <span className="text-[#8b949e]">{msg.codeBlock.language}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyCode(msg.codeBlock!.code, msg.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-gray-300 text-[10px] transition"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Көшірілді</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Көшіру</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleApply(msg.codeBlock!.code)}
                            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold transition active:scale-95 ${
                              isApplied
                                ? 'bg-green-600 text-white'
                                : 'bg-[#1f6feb] hover:bg-[#388bfd] text-white'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isApplied ? 'Енгізілді!' : 'Кодқа енгізу'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Code Content */}
                      <pre className="p-3 text-xs font-mono text-[#e6edf3] overflow-x-auto leading-relaxed whitespace-pre">
                        <code>{msg.codeBlock.code}</code>
                      </pre>
                    </div>
                  )}

                  {/* Highlights section */}
                  {msg.highlights && msg.highlights.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-[#30363d]/60">
                      <p className="font-semibold text-white flex items-center gap-1.5 text-xs">
                        <span>🎯</span> Негізгі екі өзгеріс:
                      </p>
                      <div className="space-y-2 text-[#c9d1d9] pl-1">
                        {msg.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-xs leading-normal">{h}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback and Metrics Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#30363d]/40 text-[#8b949e]">
                    <div className="flex items-center gap-2">
                      <button className="p-1 rounded hover:bg-[#21262d] hover:text-white transition">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded hover:bg-[#21262d] hover:text-white transition">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded hover:bg-[#21262d] hover:text-white transition">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {msg.metrics && (
                      <span className="text-[10px] font-mono">{msg.metrics}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. AI Input Area with Context Chip & Voice Button */}
      <div className="p-3 bg-[#161b22] border-t border-[#30363d] space-y-2 shrink-0">
        {attachedContext && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#21262d] border border-[#30363d] text-gray-300 font-mono text-[11px]">
              <Paperclip className="w-3 h-3 text-[#58a6ff]" />
              <span>{attachedContext}</span>
              <button
                onClick={() => setAttachedContext(null)}
                className="hover:text-white ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-[#8b949e]">Markdown қолдайды</span>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAttachedContext('server.ts:1-24')}
            className="w-9 h-9 rounded-xl bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white flex items-center justify-center shrink-0 transition"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="AI көмекшіге код туралы сұрақ қойыңыз..."
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] transition font-sans"
          />

          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white flex items-center justify-center shrink-0 transition"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white flex items-center justify-center shrink-0 transition active:scale-95 shadow-md shadow-[#1f6feb40]"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
