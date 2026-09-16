'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './i18n';

export type AppModule = 
  | 'crm' 
  | 'inventory' 
  | 'bom' 
  | 'purchase' 
  | 'hr' 
  | 'pos' 
  | 'loyalty' 
  | 'analytics' 
  | 'odoo_sync';

export type ViewMode = 'kanban' | 'list' | 'form' | 'analytics';

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  activeModule: AppModule;
  setActiveModule: (m: AppModule) => void;
  activeSubmenu: string;
  setActiveSubmenu: (s: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  isAppLauncherOpen: boolean;
  setIsAppLauncherOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFilter: string;
  setSelectedFilter: (f: string) => void;
  restaurant: {
    id: string;
    name: string;
    currency: string;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('kk');
  const [activeModule, setActiveModule] = useState<AppModule>('crm');
  const [activeSubmenu, setActiveSubmenu] = useState<string>('pipeline');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [restaurant] = useState({
    id: 'rest-001',
    name: 'Mazir Grand Cafe & Lounge',
    currency: '₸',
  });

  // When module changes, set sensible default submenus and views
  useEffect(() => {
    if (activeModule === 'crm') {
      setActiveSubmenu('pipeline');
      setViewMode('kanban');
    } else if (activeModule === 'inventory') {
      setActiveSubmenu('products');
      setViewMode('list');
    } else if (activeModule === 'purchase') {
      setActiveSubmenu('orders');
      setViewMode('list');
    } else if (activeModule === 'hr') {
      setActiveSubmenu('attendance');
      setViewMode('kanban');
    } else if (activeModule === 'pos') {
      setActiveSubmenu('tables');
      setViewMode('kanban');
    } else if (activeModule === 'bom') {
      setActiveSubmenu('recipes');
      setViewMode('list');
    } else if (activeModule === 'loyalty') {
      setActiveSubmenu('cards');
      setViewMode('list');
    } else if (activeModule === 'analytics') {
      setActiveSubmenu('dashboard');
      setViewMode('analytics');
    } else if (activeModule === 'odoo_sync') {
      setActiveSubmenu('status');
      setViewMode('form');
    }
  }, [activeModule]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        activeModule,
        setActiveModule,
        activeSubmenu,
        setActiveSubmenu,
        viewMode,
        setViewMode,
        isAppLauncherOpen,
        setIsAppLauncherOpen,
        searchQuery,
        setSearchQuery,
        selectedFilter,
        setSelectedFilter,
        restaurant,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
