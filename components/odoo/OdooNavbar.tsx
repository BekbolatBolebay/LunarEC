'use client';

import React from 'react';
import { 
  Grid, Search, Plus, Filter, Download, 
  LayoutGrid, List, BarChart3, RefreshCw, Globe, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { useApp, AppModule, ViewMode } from '@/lib/app-context';
import { t } from '@/lib/i18n';

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenSync: () => void;
}

export function OdooNavbar({ onOpenCreate, onOpenSync }: NavbarProps) {
  const { 
    activeModule, 
    setActiveModule, 
    activeSubmenu, 
    setActiveSubmenu, 
    viewMode, 
    setViewMode, 
    setIsAppLauncherOpen,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    restaurant,
    lang,
    setLang
  } = useApp();

  const getModuleTitle = (mod: AppModule) => {
    switch (mod) {
      case 'crm': return { name: t('app_crm', lang), icon: '🎯' };
      case 'inventory': return { name: t('app_inventory', lang), icon: '📦' };
      case 'bom': return { name: t('app_bom', lang), icon: '🧾' };
      case 'purchase': return { name: t('app_purchase', lang), icon: '🚚' };
      case 'hr': return { name: t('app_hr', lang), icon: '👷' };
      case 'pos': return { name: t('app_pos', lang), icon: '🍽️' };
      case 'loyalty': return { name: t('app_loyalty', lang), icon: '🎁' };
      case 'analytics': return { name: t('app_analytics', lang), icon: '📈' };
      case 'odoo_sync': return { name: t('app_odoo_sync', lang), icon: '🔄' };
      default: return { name: 'Odoo Suite', icon: '🏢' };
    }
  };

  const getSubmenus = (mod: AppModule) => {
    switch (mod) {
      case 'crm':
        return [
          { id: 'pipeline', label: lang === 'kk' ? 'Сату құбыры' : 'Воронка продаж' },
          { id: 'clients', label: lang === 'kk' ? 'Клиенттер' : 'Клиенты' },
          { id: 'activities', label: lang === 'kk' ? 'Әрекеттер' : 'Действия' },
        ];
      case 'inventory':
        return [
          { id: 'products', label: lang === 'kk' ? 'Қалдықтар' : 'Остатки' },
          { id: 'low_stock', label: lang === 'kk' ? 'Аз қалғандар' : 'Дефицит' },
          { id: 'moves', label: lang === 'kk' ? 'Қозғалыс журналы' : 'Перемещения' },
        ];
      case 'bom':
        return [
          { id: 'recipes', label: lang === 'kk' ? 'Техкарталар' : 'Техкарты' },
          { id: 'cost_calc', label: lang === 'kk' ? 'Өзіндік құн (COGS)' : 'Себестоимость' },
        ];
      case 'purchase':
        return [
          { id: 'orders', label: lang === 'kk' ? 'Сатып алу тапсырыстары' : 'Заказы (PO)' },
          { id: 'suppliers', label: lang === 'kk' ? 'Жеткізушілер' : 'Поставщики' },
        ];
      case 'hr':
        return [
          { id: 'attendance', label: lang === 'kk' ? 'Жұмыс табелі' : 'Табель' },
          { id: 'employees', label: lang === 'kk' ? 'Қызметкерлер' : 'Сотрудники' },
        ];
      case 'pos':
        return [
          { id: 'tables', label: lang === 'kk' ? 'Залдар & Үстелдер' : 'Залы и Столы' },
          { id: 'reservations', label: lang === 'kk' ? 'Брондаулар' : 'Бронирования' },
        ];
      case 'loyalty':
        return [
          { id: 'cards', label: lang === 'kk' ? 'Бонустық карталар' : 'Бонусные карты' },
          { id: 'coupons', label: lang === 'kk' ? 'Промокодтар' : 'Промокоды' },
        ];
      case 'analytics':
        return [
          { id: 'dashboard', label: lang === 'kk' ? 'Қаржылық шолу' : 'Финансовый обзор' },
        ];
      case 'odoo_sync':
        return [
          { id: 'status', label: lang === 'kk' ? 'Odoo Байланысы' : 'Связь с Odoo' },
        ];
      default:
        return [];
    }
  };

  const currentInfo = getModuleTitle(activeModule);
  const submenus = getSubmenus(activeModule);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Upper Odoo Bar: App Switcher, App Name, Search, Controls */}
      <div className="flex items-center justify-between px-4 h-14 gap-3">
        {/* Left: Odoo App Launcher Button & Current App */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAppLauncherOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 text-odoo-purple transition-all duration-150 active:scale-95 group"
            title="Odoo Қолданбалар Басты Мәзірі (App Launcher)"
          >
            <Grid className="w-5 h-5 text-odoo-purple group-hover:rotate-12 transition-transform" />
          </button>

          <div className="h-5 w-[1px] bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="text-xl">{currentInfo.icon}</span>
            <span className="font-semibold text-slate-800 text-base tracking-tight">
              {currentInfo.name}
            </span>
          </div>
        </div>

        {/* Center: Odoo Unified Search & Filter Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder', lang)}
              className="w-full pl-9 pr-24 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple focus:bg-white transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button 
                onClick={() => setSelectedFilter(selectedFilter === 'all' ? 'important' : 'all')}
                className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 border transition-colors ${
                  selectedFilter !== 'all' 
                    ? 'bg-odoo-purple/10 text-odoo-purple border-odoo-purple/30 font-medium' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{selectedFilter === 'all' ? t('filters', lang) : 'VIP/Маңызды'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions, Sync, Language, Profile */}
        <div className="flex items-center gap-2">
          {/* Action Button: Create New */}
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-odoo-purple hover:bg-odoo-purple-dark active:scale-95 rounded-md shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('create_new', lang)}</span>
          </button>

          {/* Odoo JSON-RPC Sync Button */}
          <button
            onClick={onOpenSync}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors"
            title="Odoo ERP интеграциясын тексеру"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin-hover" />
            <span className="hidden sm:inline">Odoo Sync</span>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'kk' ? 'ru' : 'kk')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            title="Тілді ауыстыру / Сменить язык"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="uppercase font-semibold">{lang}</span>
          </button>

          {/* User/Rest badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs shadow-xs">
              <span>🌙</span>
              <span className="tracking-wide">LunarEC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-bar: Navigation Tabs and View Switchers (Kanban, List, Analytics) */}
      <div className="flex items-center justify-between px-6 h-11 bg-slate-50/70 border-t border-slate-100">
        {/* Submenu Tabs */}
        <nav className="flex items-center gap-1">
          {submenus.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubmenu(sub.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeSubmenu === sub.id
                  ? 'bg-white text-odoo-purple shadow-sm border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </nav>

        {/* View Switchers (Kanban, List, Graph) */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-2xs">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === 'kanban'
                ? 'bg-odoo-purple text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Kanban тақтасы"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === 'list'
                ? 'bg-odoo-purple text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Тізімдік көрініс (Таблица)"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setViewMode('analytics')}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === 'analytics'
                ? 'bg-odoo-purple text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Аналитика және графиктер"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
