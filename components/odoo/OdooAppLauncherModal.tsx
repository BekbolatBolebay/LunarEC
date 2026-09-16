'use client';

import React, { useState } from 'react';
import { 
  X, Search, Target, Package, FileSpreadsheet, Truck, Users, 
  UtensilsCrossed, Gift, TrendingUp, RefreshCw, Sparkles, ArrowRight 
} from 'lucide-react';
import { useApp, AppModule } from '@/lib/app-context';

export function OdooAppLauncherModal() {
  const { isAppLauncherOpen, setIsAppLauncherOpen, setActiveModule, lang } = useApp();
  const [filterQuery, setFilterQuery] = useState('');

  if (!isAppLauncherOpen) return null;

  const apps = [
    {
      id: 'crm' as AppModule,
      name: lang === 'kk' ? 'CRM & Сату құбыры' : 'CRM и Воронка продаж',
      description: lang === 'kk' ? 'Лидтер, келісімдер сатысы, B2B сату' : 'Лиды, этапы сделок, B2B продажи',
      icon: Target,
      color: 'from-amber-500 to-orange-600',
      badge: '5 Лид',
    },
    {
      id: 'inventory' as AppModule,
      name: lang === 'kk' ? 'Қойма & Қалдықтар' : 'Склад и Запасы',
      description: lang === 'kk' ? 'Тауар қалдықтары, инвентаризация, дефицит' : 'Остатки товаров, инвентаризация',
      icon: Package,
      color: 'from-blue-600 to-cyan-600',
      badge: '2 Аз қалған',
    },
    {
      id: 'bom' as AppModule,
      name: lang === 'kk' ? 'Техкарталар & BOM' : 'Техкарты и Рецептура',
      description: lang === 'kk' ? 'Калькуляция, тағам өзіндік құны (COGS)' : 'Калькуляция, себестоимость блюд',
      icon: FileSpreadsheet,
      color: 'from-emerald-600 to-teal-700',
      badge: '100% Авто-шегеру',
    },
    {
      id: 'purchase' as AppModule,
      name: lang === 'kk' ? 'Сатып алу & Жеткізушілер' : 'Закупки и Поставщики',
      description: lang === 'kk' ? 'Сатып алу тапсырыстары (PO), шот-фактуралар' : 'Заказы поставщикам (PO), накладные',
      icon: Truck,
      color: 'from-purple-600 to-indigo-700',
      badge: '4 Тапсырыс',
    },
    {
      id: 'hr' as AppModule,
      name: lang === 'kk' ? 'Кадрлар & Жұмыс Табелі' : 'Сотрудники и Табель',
      description: lang === 'kk' ? 'Қызметкерлер, Check-in/out, жұмыс сағаты' : 'Учет рабочего времени, Check-in/out',
      icon: Users,
      color: 'from-rose-500 to-pink-600',
      badge: '3 Онлайн',
    },
    {
      id: 'pos' as AppModule,
      name: lang === 'kk' ? 'Залдар & Үстелдер (POS)' : 'Залы и Столы (POS)',
      description: lang === 'kk' ? 'Интерактивті зал картасы, брондаулар' : 'Интерактивная карта залов, брони',
      icon: UtensilsCrossed,
      color: 'from-violet-600 to-purple-800',
      badge: '8 Үстел',
    },
    {
      id: 'loyalty' as AppModule,
      name: lang === 'kk' ? 'Адалдық & Маркетинг' : 'Лояльность и Маркетинг',
      description: lang === 'kk' ? 'Бонустар, кэшбэк, промокод, сертификаттар' : 'Бонусная система, купоны, сертификаты',
      icon: Gift,
      color: 'from-fuchsia-600 to-pink-500',
      badge: '4 Деңгей',
    },
    {
      id: 'analytics' as AppModule,
      name: lang === 'kk' ? 'Қаржылық Аналитика' : 'Финансовая Аналитика',
      description: lang === 'kk' ? 'Түсім динамикасы, P&L, орташа чек, ABC' : 'Динамика выручки, маржа, средний чек',
      icon: TrendingUp,
      color: 'from-emerald-500 to-green-600',
      badge: '+18.4%',
    },
    {
      id: 'odoo_sync' as AppModule,
      name: lang === 'kk' ? 'Odoo ERP Синхронизация' : 'Odoo ERP Синхронизация',
      description: lang === 'kk' ? 'Odoo JSON-RPC 2.0 нақты сервер байланысы' : 'Прямая связь с Odoo через JSON-RPC',
      icon: RefreshCw,
      color: 'from-odoo-purple to-slate-900',
      badge: 'JSON-RPC 2.0',
    },
  ];

  const filtered = apps.filter(a => 
    a.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSelectApp = (appId: AppModule) => {
    setActiveModule(appId);
    setIsAppLauncherOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              🌙
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>LunarEC</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-odoo-purple/10 text-odoo-purple border border-odoo-purple/20">
                  Odoo Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'kk' ? 'Модульдік CRM & ERP Қосымшалар Экожүйесі' : 'Модульная экосистема CRM и ERP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={lang === 'kk' ? 'Қосымшаны іздеу...' : 'Поиск приложения...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                autoFocus
              />
            </div>

            <button
              onClick={() => setIsAppLauncherOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-[#F8F9FA]">
          {filtered.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => handleSelectApp(app.id)}
                className="group relative text-left bg-white p-4 rounded-xl border border-slate-200/80 hover:border-odoo-purple/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {app.badge && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-odoo-purple/10 group-hover:text-odoo-purple group-hover:border-odoo-purple/20 transition-colors">
                      {app.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-odoo-purple transition-colors flex items-center justify-between">
                    <span>{app.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-odoo-purple" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-odoo-purple" />
            <span>MazirApp Enterprise Suite v1.0 • Odoo 17/18 Architecture</span>
          </div>
          <span>Esc пернесі арқылы жабу</span>
        </div>
      </div>
    </div>
  );
}
