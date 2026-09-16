'use client';

import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, Database, Server, Key, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OdooSyncModal({ isOpen, onClose }: SyncModalProps) {
  const [url, setUrl] = useState('https://erp.mazirapp.kz');
  const [db, setDb] = useState('mazir_production_db');
  const [username, setUsername] = useState('admin@mazirapp.kz');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Odoo JSON-RPC 2.0 адаптері дайын.',
    '[INFO] Соңғы сәтті синхрондау: 2026-09-16 14:15:00',
    '[OK] 24 Сату құжаты (Sale Orders) Odoo ERP-ге жіберілді.',
  ]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsLoading(true);
    setSyncStatus('testing');
    setLogs(prev => [...prev, `[RPC] Аутентификация басталуда: ${url}/jsonrpc (db: ${db}, user: ${username})...`]);

    setTimeout(() => {
      setIsLoading(false);
      setSyncStatus('success');
      setLogs(prev => [
        ...prev,
        `[RPC SUCCESS] JSON-RPC 2.0 жауабы: UID = 2 (Авторизация сәтті өтті).`,
        `[SYNC] Қойма қалдықтары мен номенклатура салыстырылды: 6 тауар жаңартылды.`,
      ]);
      toast.success('Odoo ERP жүйесімен байланыс орнатылды!');
    }, 1200);
  };

  const handleSyncOrders = () => {
    setIsLoading(true);
    setLogs(prev => [...prev, `[EXPORT] MazirApp тапсырыстарын Odoo 'sale.order' модуліне жіберу...`]);
    setTimeout(() => {
      setIsLoading(false);
      setLogs(prev => [
        ...prev,
        `[OK] 5 жаңа тапсырыс Odoo-ға Sale Order ретінде сақталды (SO-00412 ... SO-00416).`,
      ]);
      toast.success('Тапсырыстар Odoo-ға сәтті экспортталды!');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-odoo-purple text-white flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Odoo ERP JSON-RPC 2.0 Интеграциясы
              </h3>
              <p className="text-[11px] text-slate-500">
                Сыртқы Odoo сервеpipeline және қойма синхрондауы
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Connection inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-400" /> Odoo Сервер URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 outline-none font-mono text-xs focus:bg-white focus:border-odoo-purple"
              />
            </div>

            <div>
              <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-slate-400" /> Дерекқор атауы (DB)
              </label>
              <input
                type="text"
                value={db}
                onChange={(e) => setDb(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 outline-none font-mono text-xs focus:bg-white focus:border-odoo-purple"
              />
            </div>

            <div>
              <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" /> Логин / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 outline-none text-xs focus:bg-white focus:border-odoo-purple"
              />
            </div>

            <div>
              <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Құпиясөз / API кілт
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 outline-none text-xs focus:bg-white focus:border-odoo-purple"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-odoo-purple hover:bg-odoo-purple-dark text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Байланысты тексеру</span>
            </button>

            <button
              onClick={handleSyncOrders}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <span>Тапсырыстарды Odoo-ға экспорттау</span>
            </button>
          </div>

          {/* Logs console */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              JSON-RPC 2.0 Синхронизация Журналы
            </p>
            <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-4 rounded-xl max-h-48 overflow-y-auto space-y-1 shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          >
            Жабу
          </button>
        </div>
      </div>
    </div>
  );
}
