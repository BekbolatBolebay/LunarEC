'use client';

import React from 'react';
import { GitBranch, Play, Sparkles } from 'lucide-react';

interface HeaderProps {
  onRun?: () => void;
  branchName?: string;
  projectName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  branchName = 'main',
  projectName = 'nexflow-api'
}) => {
  return (
    <header className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border-b border-[#30363d] select-none text-white shrink-0">
      {/* Left: Code logo & Branch Selector */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#1f293d] flex items-center justify-center text-[#58a6ff] border border-[#388bfd33]">
          <span className="font-mono font-bold text-sm tracking-tighter">&lt;/&gt;</span>
        </div>

        <button className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] active:scale-95 transition rounded-lg border border-[#30363d] text-xs font-medium text-[#c9d1d9]">
          <GitBranch className="w-3.5 h-3.5 text-[#8b949e]" />
          <span className="text-gray-300 font-mono">{projectName}</span>
          <span className="text-gray-500">:{branchName}</span>
        </button>
      </div>

      {/* Right: Run Button & User Avatar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          title="Жобаны іске қосу (Run)"
          className="w-8 h-8 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] active:scale-95 transition flex items-center justify-center text-white shadow-sm shadow-[#1f6feb40]"
        >
          <Play className="w-4 h-4 fill-white translate-x-0.5" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full ring-1 ring-[#388bfd80] overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
          <span>BB</span>
        </div>
      </div>
    </header>
  );
};
