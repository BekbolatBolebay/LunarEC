'use client';

import React, { useState } from 'react';
import { 
  CreditCard, QrCode, Phone, Mail, FileText, CheckCircle2, 
  Clock, Send, MessageSquare, ShieldCheck, Sparkles, AlertCircle, Plus 
} from 'lucide-react';
import { ChatterNote } from '@/lib/store';
import { toast } from 'sonner';

export interface TimelineEvent {
  id: string;
  type: 'kaspi_fiscal' | 'esf_tax' | 'stock_fifo' | 'phone_call' | 'note' | 'stage_change';
  title: string;
  description: string;
  meta?: string;
  timestamp: string;
  author?: string;
}

interface TwentyActivityTimelineProps {
  recordId: string;
  notes: ChatterNote[];
  onAddNote: (recordId: string, content: string, type: 'note' | 'activity') => void;
}

export function TwentyActivityTimeline({
  recordId,
  notes,
  onAddNote,
}: TwentyActivityTimelineProps) {
  const [inputContent, setInputContent] = useState('');
  const [eventType, setEventType] = useState<'note' | 'activity'>('note');

  // Realistic mock events combined with actual chatter notes
  const standardTimeline: TimelineEvent[] = [
    {
      id: 'event-1',
      type: 'kaspi_fiscal',
      title: 'Kaspi QR төлемі расталды (ОФД Фискалдандырылды)',
      description: 'Тапсырыс № ORD-2026-88 бойынша 3,500 ₸ қабылданды. 12% ҚҚС: 375 ₸. Фискалды чек: #KASPI-998822',
      meta: 'ОФД Тексеру: consumer.oofd.kz',
      timestamp: 'Бүгін, 14:20',
      author: 'Go POS Gateway',
    },
    {
      id: 'event-2',
      type: 'esf_tax',
      title: 'ЭСФ XML v2 шот-фактурасы тіркелді',
      description: 'ҚР МКД талаптарына сай ТН ВЭД 0901210000 кодымен электрондық шот-фактура қалыптастырылды.',
      meta: 'МКД Статусы: Тіркелді (Қабылданды)',
      timestamp: 'Бүгін, 14:21',
      author: 'Python Tax Exporter',
    },
    {
      id: 'event-3',
      type: 'stock_fifo',
      title: 'Қоймадан тауар есептен шығарылды (FIFO)',
      description: '2.0 кг Арабика кофесі №B-104 партиясынан COGS 2,400 ₸ бағамымен шегерілді.',
      meta: 'Rust Stock Engine v1.0',
      timestamp: 'Бүгін, 14:22',
      author: 'Rust Engine',
    },
  ];

  // Convert chatter notes to timeline events
  const chatterEvents: TimelineEvent[] = notes
    .filter((n) => n.recordId === recordId)
    .map((n) => ({
      id: n.id,
      type: n.type === 'system' ? 'stage_change' : 'note',
      title: n.type === 'system' ? 'Жүйелік оқиға' : 'Менеджер жазбасы',
      description: n.content,
      timestamp: n.createdAt,
      author: n.author,
    }));

  const allEvents = [...chatterEvents, ...standardTimeline];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    onAddNote(recordId, inputContent.trim(), eventType);
    setInputContent('');
    toast.success('Белсенділік лентасына жаңа жазба қосылды');
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'kaspi_fiscal':
        return <QrCode className="w-4 h-4 text-rose-500" />;
      case 'esf_tax':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'stock_fifo':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'phone_call':
        return <Phone className="w-4 h-4 text-amber-500" />;
      case 'stage_change':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Twenty-Style Хронология (Activity Timeline)
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          {allEvents.length} оқиға
        </span>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="p-3 border-b border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#1A1C1E]">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setEventType('note')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              eventType === 'note'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            Жазба (Note)
          </button>
          <button
            type="button"
            onClick={() => setEventType('activity')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              eventType === 'activity'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            Тапсырма / Қоңырау
          </button>
        </div>
        <div className="relative">
          <textarea
            rows={2}
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Жаңа белсенділік немесе келісім туралы түсініктеме жазу..."
            className="w-full text-xs p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-slate-800 dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={!inputContent.trim()}
            className="absolute right-2 bottom-2.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
          >
            <span>Жіберу</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allEvents.map((evt, idx) => (
          <div key={evt.id} className="relative flex gap-3 text-xs group">
            {/* Vertical timeline connector */}
            {idx < allEvents.length - 1 && (
              <div className="absolute left-[17px] top-7 bottom-[-16px] w-[2px] bg-slate-200 dark:bg-white/10 group-hover:bg-indigo-300 dark:group-hover:bg-indigo-500/40 transition-colors" />
            )}

            {/* Icon circle */}
            <div className="relative z-10 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white dark:bg-[#1E2023] border border-slate-200 dark:border-white/10 shadow-sm">
              {getEventIcon(evt.type)}
            </div>

            {/* Content card */}
            <div className="flex-1 bg-white dark:bg-[#1E2023] border border-slate-200/80 dark:border-white/10 rounded-xl p-3 shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {evt.title}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {evt.timestamp}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-1.5">
                {evt.description}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-white/5 pt-1.5 mt-1.5">
                <span>{evt.author || 'LunarEC жүйесі'}</span>
                {evt.meta && (
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {evt.meta}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
