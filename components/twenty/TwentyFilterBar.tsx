'use client';

import React, { useState } from 'react';
import { 
  Filter, ArrowUpDown, Layers, SlidersHorizontal, Search, 
  Plus, Check, X, Sparkles, Command, ChevronDown 
} from 'lucide-react';

interface TwentyFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeStageFilter: string;
  onStageFilterChange: (stage: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  totalCount: number;
  onOpenCommandPalette: () => void;
}

export function TwentyFilterBar({
  searchQuery,
  onSearchChange,
  activeStageFilter,
  onStageFilterChange,
  sortBy,
  onSortByChange,
  totalCount,
  onOpenCommandPalette,
}: TwentyFilterBarProps) {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const stageFilters = [
    { id: 'all', label: 'Барлық сатылар' },
    { id: 'new', label: 'Жаңа (New)' },
    { id: 'qualified', label: 'Квалификация' },
    { id: 'proposal', label: 'Коммерциялық ұсыныс' },
    { id: 'won', label: 'Жеңіс / Келісім (Won)' },
  ];

  const sortOptions = [
    { id: 'revenue-desc', label: 'Табыс: ең жоғарыдан' },
    { id: 'revenue-asc', label: 'Табыс: ең төменнен' },
    { id: 'probability-desc', label: 'Ықтималдық: жоғары' },
    { id: 'title-asc', label: 'Атауы бойынша (А-Я)' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-white/80 dark:bg-[#18191B]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 text-sm">
      {/* Left side: Search & Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Instant Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Іздеу... (клиент, сома, телефон)"
            className="pl-8 pr-7 py-1.5 w-56 text-xs bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Twenty Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsFilterDropdownOpen(!isFilterDropdownOpen);
              setIsSortDropdownOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              activeStageFilter !== 'all'
                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Сүзгі:{' '}
              {stageFilters.find((f) => f.id === activeStageFilter)?.label || 'Барлығы'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-[#1E2023] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-30 py-1 divide-y divide-slate-100 dark:divide-white/5">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Сатысы бойынша сүзгілеу
              </div>
              <div className="p-1">
                {stageFilters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onStageFilterChange(f.id);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg text-left transition-colors ${
                      activeStageFilter === f.id
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{f.label}</span>
                    {activeStageFilter === f.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Twenty Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsSortDropdownOpen(!isSortDropdownOpen);
              setIsFilterDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Сұрыптау:{' '}
              {sortOptions.find((s) => s.id === sortBy)?.label.split(':')[0] || 'Әдепкі'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isSortDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-[#1E2023] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-30 py-1 divide-y divide-slate-100 dark:divide-white/5">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Сұрыптау реті
              </div>
              <div className="p-1">
                {sortOptions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSortByChange(s.id);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg text-left transition-colors ${
                      sortBy === s.id
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{s.label}</span>
                    {sortBy === s.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear filters badge if active */}
        {(activeStageFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              onStageFilterChange('all');
              onSearchChange('');
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Тазарту</span>
          </button>
        )}
      </div>

      {/* Right side: Count & Cmd+K Trigger Badge */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Барлығы: <strong className="text-slate-700 dark:text-slate-300">{totalCount}</strong> жазба
        </span>

        {/* Twenty-style Command Palette Quick Button */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 transition-colors"
        >
          <Command className="w-3.5 h-3.5 text-slate-400" />
          <span>Пәрмен тақтасы</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded">
            ⌘K
          </kbd>
        </button>
      </div>
    </div>
  );
}
