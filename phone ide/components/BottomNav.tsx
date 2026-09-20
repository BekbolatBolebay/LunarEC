'use client';

import React from 'react';
import { IdeView } from '../types';
import { Code2, FolderTree, Terminal, Sparkles } from 'lucide-react';

interface BottomNavProps {
  currentView: IdeView;
  onViewChange: (view: IdeView) => void;
  aiBadgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onViewChange,
  aiBadgeCount
}) => {
  const tabs = [
    {
      id: 'editor' as IdeView,
      label: 'Редактор',
      icon: Code2
    },
    {
      id: 'files' as IdeView,
      label: 'Файлдар',
      icon: FolderTree
    },
    {
      id: 'terminal' as IdeView,
      label: 'Терминал',
      icon: Terminal
    },
    {
      id: 'ai' as IdeView,
      label: 'AI Көмекші',
      icon: Sparkles,
      badge: aiBadgeCount
    }
  ];

  return (
    <nav className="flex items-center justify-around bg-[#090d13] border-t border-[#21262d] py-1.5 px-2 select-none shrink-0 z-20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 relative ${
              isActive
                ? 'text-white font-medium'
                : 'text-[#8b949e] hover:text-[#c9d1d9] active:scale-95'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isActive ? 'scale-110 text-[#58a6ff]' : ''
                }`}
              />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#090d13]">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight ${
                isActive ? 'text-[#f0f6fc]' : 'text-[#8b949e]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
