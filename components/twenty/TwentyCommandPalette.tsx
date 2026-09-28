'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, QrCode, Plus, ArrowRight, Layers, Package, Users, BarChart3, 
  FileCode2, ShieldCheck, Sparkles, Command, CornerDownLeft, Coffee, X 
} from 'lucide-react';
import { Lead, Customer, StockItem, formatCurrency } from '@/lib/store';

export interface CommandPaletteAction {
  id: string;
  category: 'quick' | 'navigation' | 'data';
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface TwentyCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKaspiPayment: () => void;
  onOpenCreateLead: () => void;
  onOpenSync: () => void;
  onSelectModule: (module: any) => void;
  onSelectView: (view: 'kanban' | 'list' | 'analytics') => void;
  leads?: Lead[];
  customers?: Customer[];
  stock?: StockItem[];
  onSelectLead?: (lead: Lead) => void;
}

export function TwentyCommandPalette({
  isOpen,
  onClose,
  onOpenKaspiPayment,
  onOpenCreateLead,
  onOpenSync,
  onSelectModule,
  onSelectView,
  leads = [],
  customers = [],
  stock = [],
  onSelectLead,
}: TwentyCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Actions list
  const allActions: CommandPaletteAction[] = useMemo(() => {
    const actions: CommandPaletteAction[] = [
      // Quick Actions
      {
        id: 'quick-kaspi',
        category: 'quick',
        title: 'Kaspi QR & ОФД Төлем қабылдау',
        subtitle: 'Динамикалық QR код, фискалды чек және автоматты ОФД верификация',
        badge: 'ҚР Салық',
        icon: <QrCode className="w-4 h-4 text-rose-500" />,
        onSelect: () => {
          onClose();
          onOpenKaspiPayment();
        },
      },
      {
        id: 'quick-create-lead',
        category: 'quick',
        title: 'Жаңа Келісім (Lead) тіркеу',
        subtitle: 'CRM сатылым құбырына жаңа тұтынушыны қосу',
        badge: 'C пернесі',
        icon: <Plus className="w-4 h-4 text-emerald-500" />,
        onSelect: () => {
          onClose();
          onOpenCreateLead();
        },
      },
      {
        id: 'quick-sync-1c',
        category: 'quick',
        title: '1C CommerceML & ЭСФ XML v2 синхрондау',
        subtitle: '1C:Предприятие 8.3 және МКД порталымен дерек алмасу',
        badge: '1C 8.3',
        icon: <FileCode2 className="w-4 h-4 text-amber-500" />,
        onSelect: () => {
          onClose();
          onOpenSync();
        },
      },
      // Navigation
      {
        id: 'nav-kanban',
        category: 'navigation',
        title: 'CRM Сатылым Құбыры (Kanban)',
        subtitle: 'Келісімдерді сатылар бойынша сүйреп басқару',
        badge: '1 пернесі',
        icon: <Layers className="w-4 h-4 text-indigo-500" />,
        onSelect: () => {
          onClose();
          onSelectModule('crm');
          onSelectView('kanban');
        },
      },
      {
        id: 'nav-stock',
        category: 'navigation',
        title: 'Қойма қалдықтары & FIFO/LIFO бағалау',
        subtitle: 'Rust қозғалтқышы арқылы COGS және қалдықтар есебі',
        badge: 'Rust Engine',
        icon: <Package className="w-4 h-4 text-blue-500" />,
        onSelect: () => {
          onClose();
          onSelectModule('stock');
          onSelectView('list');
        },
      },
      {
        id: 'nav-pos',
        category: 'navigation',
        title: 'POS Кассалық Терминал',
        subtitle: 'Тез сату, термо-принтер және столдарды басқару',
        badge: 'Go Gateway',
        icon: <Coffee className="w-4 h-4 text-amber-600" />,
        onSelect: () => {
          onClose();
          onSelectModule('pos');
          onSelectView('list');
        },
      },
      {
        id: 'nav-analytics',
        category: 'navigation',
        title: 'AI Аналитика & Тауарлық Матрица',
        subtitle: 'RFM сегменттеу, сатылым болжамы және табыстылық талдауы',
        badge: 'Python AI',
        icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
        onSelect: () => {
          onClose();
          onSelectModule('analytics');
          onSelectView('analytics');
        },
      },
    ];

    // Data matches from Leads
    leads.forEach((l) => {
      actions.push({
        id: `data-lead-${l.id}`,
        category: 'data',
        title: `${l.title} — ${l.contactName}`,
        subtitle: `${formatCurrency(l.expectedRevenue)} | Кезеңі: ${l.stage} | Ықтималдық: ${l.probability}%`,
        badge: 'Келісім',
        icon: <Users className="w-4 h-4 text-slate-500" />,
        onSelect: () => {
          onClose();
          if (onSelectLead) onSelectLead(l);
        },
      });
    });

    // Data matches from Stock
    stock.forEach((s) => {
      actions.push({
        id: `data-stock-${s.id}`,
        category: 'data',
        title: `${s.name} (SKU: ${s.sku})`,
        subtitle: `Қалдық: ${s.currentStock} ${s.unit} | Бағасы: ${formatCurrency(s.costPrice)} | Жабдықтаушы: ${s.supplier}`,
        badge: 'Тауар',
        icon: <Package className="w-4 h-4 text-slate-500" />,
        onSelect: () => {
          onClose();
          onSelectModule('stock');
          onSelectView('list');
        },
      });
    });

    return actions;
  }, [leads, stock, onOpenKaspiPayment, onOpenCreateLead, onOpenSync, onSelectModule, onSelectView, onSelectLead, onClose]);

  // Filter actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return allActions.slice(0, 10);
    const q = query.toLowerCase();
    return allActions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q)) ||
        (a.badge && a.badge.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [allActions, query]);

  // Keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Команда немесе дерек іздеу... (Мысалы: Kaspi, Лид, Қойма, ЭСФ)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100/50 dark:divide-white/[0.04]">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              «{query}» бойынша ешқандай команда немесе дерек табылмады
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => action.onSelect()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200'
                      : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-white dark:bg-indigo-500/20 shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                      }`}
                    >
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        <span>{action.title}</span>
                        {action.badge && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isSelected
                                ? 'bg-indigo-200 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-300'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {action.badge}
                          </span>
                        )}
                      </div>
                      {action.subtitle && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {action.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 shrink-0 text-xs font-medium">
                      <span>Таңдау</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar (Twenty style) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/10 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 text-[10px] font-mono">
                ↑↓
              </kbd>
              <span>Бағыттау</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 text-[10px] font-mono">
                ↵
              </kbd>
              <span>Орындау</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 text-[10px] font-mono">
                ESC
              </kbd>
              <span>Жабу</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>LunarEC Twenty-Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
