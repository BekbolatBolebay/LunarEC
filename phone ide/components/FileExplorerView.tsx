'use client';

import React, { useState } from 'react';
import { FileItem } from '../types';
import {
  Search,
  FilePlus,
  FolderPlus,
  RotateCw,
  ChevronsDownUp,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GitCommit,
  Check,
  FileCode2,
  FileJson,
  FileText,
  Lock
} from 'lucide-react';

interface FileExplorerViewProps {
  files: FileItem[];
  onSelectFile: (file: FileItem) => void;
  activeFileId?: string;
  onCommit?: () => void;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({
  files,
  onSelectFile,
  activeFileId,
  onCommit
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [treeData, setTreeData] = useState<FileItem[]>(files);

  const toggleFolder = (folderId: string) => {
    const updateNodes = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.id === folderId) {
          return { ...item, isOpen: !item.isOpen };
        }
        if (item.children) {
          return { ...item, children: updateNodes(item.children) };
        }
        return item;
      });
    };
    setTreeData(updateNodes(treeData));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* 1. Search Bar */}
      <div className="p-3 bg-[#0d1117] border-b border-[#21262d] shrink-0">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[#8b949e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Файлдар мен папкаларды іздеу..."
            className="w-full pl-9 pr-12 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] transition"
          />
          <span className="absolute right-3 px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] text-[10px] font-mono font-medium border border-[#30363d]">
            ⌘P
          </span>
        </div>
      </div>

      {/* 2. Repository Root Header & Actions */}
      <div className="px-3 py-2 bg-[#161b22]/50 border-b border-[#21262d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#58a6ff]" />
          <span className="font-semibold text-sm text-white font-mono">nexflow-api</span>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition">
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition">
            <ChevronsDownUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Git Stats Subheader */}
      <div className="px-3 py-2 bg-[#090d13] border-b border-[#21262d] flex items-center justify-between text-xs font-mono shrink-0">
        <div className="flex items-center gap-1.5 text-[#8b949e]">
          <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
          <span>🌿 main</span>
          <span>•</span>
          <span>3 өзгертілген файл</span>
        </div>
        <div className="text-xs font-medium">
          <span className="text-[#3fb950]">+142</span>
          <span className="text-[#f85149] ml-1">-28</span>
        </div>
      </div>

      {/* 4. File Tree Body */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs select-none">
        {treeData.map((node) => (
          <FileTreeNode
            key={node.id}
            item={node}
            depth={0}
            activeFileId={activeFileId}
            onToggleFolder={toggleFolder}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>

      {/* 5. Project Footer Metrics & Commit Action */}
      <div className="p-3 bg-[#090d13] border-t border-[#21262d] flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">Жоба көлемі</p>
          <p className="text-xs font-mono text-white mt-0.5">24 файл • 4,820 жол • 1.2 MB</p>
        </div>

        <button
          onClick={onCommit}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1f6feb] hover:bg-[#388bfd] active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-[#1f6feb30] transition"
        >
          <GitCommit className="w-4 h-4" />
          <span>Git Commit</span>
        </button>
      </div>
    </div>
  );
};

interface FileTreeNodeProps {
  item: FileItem;
  depth: number;
  activeFileId?: string;
  onToggleFolder: (id: string) => void;
  onSelectFile: (file: FileItem) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  item,
  depth,
  activeFileId,
  onToggleFolder,
  onSelectFile
}) => {
  const isFolder = item.type === 'folder';
  const isActive = activeFileId === item.id;

  const renderIcon = () => {
    if (isFolder) {
      return item.isOpen ? (
        <FolderOpen className="w-4 h-4 text-[#58a6ff]" />
      ) : (
        <Folder className="w-4 h-4 text-[#58a6ff]" />
      );
    }
    if (item.extension === 'ts') {
      return (
        <span className="w-3.5 h-3.5 rounded bg-[#3178c6] text-white font-bold text-[8px] flex items-center justify-center">
          TS
        </span>
      );
    }
    if (item.extension === 'json') {
      return (
        <span className="text-[#e3b341] font-bold text-xs">{'{ }'}</span>
      );
    }
    if (item.extension === 'env') {
      return <Lock className="w-3.5 h-3.5 text-[#e3b341]" />;
    }
    if (item.extension === 'md') {
      return (
        <span className="text-[#8b949e] font-bold text-[10px]">M↓</span>
      );
    }
    return <FileCode2 className="w-3.5 h-3.5 text-[#8b949e]" />;
  };

  return (
    <div>
      <div
        onClick={() => {
          if (isFolder) {
            onToggleFolder(item.id);
          } else {
            onSelectFile(item);
          }
        }}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? 'bg-[#161b22] text-white font-semibold'
            : 'text-[#c9d1d9] hover:bg-[#161b22]/70'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {isFolder ? (
            item.isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
            )
          ) : (
            <span className="w-3.5" />
          )}

          {renderIcon()}

          <span className="truncate text-xs">{item.name}</span>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isFolder && item.childrenCount && !item.isOpen && (
            <span className="text-[10px] text-[#8b949e]">{item.childrenCount}</span>
          )}

          {item.status === 'M' && (
            <span className="w-4 h-4 rounded bg-[#d29922]/20 text-[#d29922] font-bold text-[10px] flex items-center justify-center">
              M
            </span>
          )}
          {item.status === 'U' && (
            <span className="w-4 h-4 rounded bg-[#58a6ff]/20 text-[#58a6ff] font-bold text-[10px] flex items-center justify-center">
              U
            </span>
          )}
          {item.status === 'checked' && (
            <Check className="w-3.5 h-3.5 text-[#3fb950]" />
          )}
        </div>
      </div>

      {/* Children */}
      {isFolder && item.isOpen && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeNode
              key={child.id}
              item={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              onToggleFolder={onToggleFolder}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};
