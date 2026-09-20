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
  FileText,
  Lock,
  X
} from 'lucide-react';

interface FileExplorerViewProps {
  files: FileItem[];
  onSelectFile: (file: FileItem) => void;
  activeFileId?: string;
  onCommitSuccess?: (msg: string) => void;
  onCreateFile?: (name: string) => void;
  onCreateFolder?: (name: string) => void;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({
  files,
  onSelectFile,
  activeFileId,
  onCommitSuccess,
  onCreateFile,
  onCreateFolder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [treeData, setTreeData] = useState<FileItem[]>(files);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('feat(api): update cluster deploy endpoint');

  // Toggle folder
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

  // Collapse all
  const handleCollapseAll = () => {
    const collapseNodes = (items: FileItem[]): FileItem[] => {
      return items.map((item) => ({
        ...item,
        isOpen: false,
        children: item.children ? collapseNodes(item.children) : undefined
      }));
    };
    setTreeData(collapseNodes(treeData));
  };

  // Filter items by search query
  const filterNodes = (items: FileItem[], query: string): FileItem[] => {
    if (!query) return items;
    const lower = query.toLowerCase();

    return items.reduce<FileItem[]>((acc, item) => {
      if (item.type === 'file' && item.name.toLowerCase().includes(lower)) {
        acc.push(item);
      } else if (item.children) {
        const filteredChildren = filterNodes(item.children, query);
        if (filteredChildren.length > 0 || item.name.toLowerCase().includes(lower)) {
          acc.push({ ...item, isOpen: true, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  };

  const visibleData = searchQuery ? filterNodes(treeData, searchQuery) : treeData;

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    if (onCreateFile) {
      onCreateFile(newFileName);
    }
    const newFile: FileItem = {
      id: 'file-' + Date.now(),
      name: newFileName,
      path: 'src/' + newFileName,
      type: 'file',
      extension: newFileName.endsWith('.json') ? 'json' : 'ts',
      status: 'U',
      content: `// ${newFileName}\nexport const defaultExport = {};\n`
    };
    setTreeData((prev) => [newFile, ...prev]);
    onSelectFile(newFile);
    setNewFileName('');
    setShowNewFileModal(false);
  };

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    if (onCommitSuccess) {
      onCommitSuccess(commitMessage);
    }
    setShowCommitModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] overflow-hidden relative">
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
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-0.5 rounded text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-3 px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] text-[10px] font-mono font-medium border border-[#30363d]">
              ⌘P
            </span>
          )}
        </div>
      </div>

      {/* 2. Repository Root Header & Actions */}
      <div className="px-3 py-2 bg-[#161b22]/50 border-b border-[#21262d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#58a6ff]" />
          <span className="font-semibold text-sm text-white font-mono">nexflow-api</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewFileModal(true)}
            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
            title="Жаңа файл"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const fName = prompt('Жаңа папка атауы:');
              if (fName) {
                const newFolder: FileItem = {
                  id: 'folder-' + Date.now(),
                  name: fName,
                  path: 'src/' + fName,
                  type: 'folder',
                  isOpen: true,
                  children: []
                };
                setTreeData([newFolder, ...treeData]);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
            title="Жаңа папка"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTreeData([...files])}
            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
            title="Жаңарту"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCollapseAll}
            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition"
            title="Жинақтау"
          >
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
        {visibleData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Файлдар табылмады
          </div>
        ) : (
          visibleData.map((node) => (
            <FileTreeNode
              key={node.id}
              item={node}
              depth={0}
              activeFileId={activeFileId}
              onToggleFolder={toggleFolder}
              onSelectFile={onSelectFile}
            />
          ))
        )}
      </div>

      {/* 5. Project Footer Metrics & Commit Action */}
      <div className="p-3 bg-[#090d13] border-t border-[#21262d] flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">Жоба көлемі</p>
          <p className="text-xs font-mono text-white mt-0.5">24 файл • 4,820 жол • 1.2 MB</p>
        </div>

        <button
          onClick={() => setShowCommitModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1f6feb] hover:bg-[#388bfd] active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-[#1f6feb30] transition"
        >
          <GitCommit className="w-4 h-4" />
          <span>Git Commit</span>
        </button>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <FilePlus className="w-4 h-4 text-[#58a6ff]" />
                Жаңа файл құру
              </h3>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFileSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="мыс: metrics.controller.ts"
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#58a6ff]"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#21262d] text-xs text-gray-300 hover:bg-[#30363d]"
                >
                  Бас тарту
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#1f6feb] text-xs text-white font-medium hover:bg-[#388bfd]"
                >
                  Құру
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Git Commit Modal */}
      {showCommitModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-[#3fb950]" />
                Git Commit жасау
              </h3>
              <button
                onClick={() => setShowCommitModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1 text-xs">
              <span className="text-[11px] text-gray-400">Өзгертілген файлдар:</span>
              <p className="text-amber-400 font-mono">M src/api/controllers/server.ts</p>
              <p className="text-amber-400 font-mono">M package.json</p>
              <p className="text-blue-400 font-mono">U .env.local</p>
            </div>

            <form onSubmit={handleCommitSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Коммит хабарламасы:</label>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#58a6ff] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCommitModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#21262d] text-xs text-gray-300 hover:bg-[#30363d]"
                >
                  Жабу
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-xs text-white font-medium flex items-center gap-1 shadow-md shadow-green-900/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Commit & Push</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
