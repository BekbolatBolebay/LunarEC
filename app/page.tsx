'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { 
  initialLeads, initialCustomers, initialStock, initialRecipes, 
  initialPurchaseOrders, initialEmployees, initialTables, initialChatter,
  Lead, Customer, StockItem, Employee, ChatterNote 
} from '@/lib/store';
import { OdooNavbar } from '@/components/odoo/OdooNavbar';
import { OdooAppLauncherModal } from '@/components/odoo/OdooAppLauncherModal';
import { OdooKanbanBoard } from '@/components/odoo/OdooKanbanBoard';
import { OdooListView } from '@/components/odoo/OdooListView';
import { OdooFormModal } from '@/components/odoo/OdooFormModal';
import { OdooSyncModal } from '@/components/odoo/OdooSyncModal';
import { OdooAnalyticsView } from '@/components/odoo/OdooAnalyticsView';
import { OdooCreateModal } from '@/components/odoo/OdooCreateModal';
import { KaspiFiscalPaymentModal } from '@/components/odoo/KaspiFiscalPaymentModal';
import { QrCode, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';

export default function OdooHomePage() {
  const { activeModule, viewMode } = useApp();

  // State
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [stock, setStock] = useState<StockItem[]>(initialStock);
  const [recipes, setRecipes] = useState(initialRecipes);
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [tables, setTables] = useState(initialTables);
  const [chatter, setChatter] = useState<ChatterNote[]>(initialChatter);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isKaspiPaymentOpen, setIsKaspiPaymentOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Actions
  const handleUpdateLeadStage = (leadId: string, newStage: Lead['stage']) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return { ...l, stage: newStage };
      }
      return l;
    }));

    // Add chatter record
    const systemNote: ChatterNote = {
      id: `chat-${Date.now()}`,
      recordId: leadId,
      author: 'Жүйе (System)',
      content: `Келісім сатысы жаңартылды: "${newStage.toUpperCase()}"`,
      type: 'system',
      createdAt: new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatter(prev => [systemNote, ...prev]);
    toast.info('Келісім сатысы өзгертілді');
  };

  const handleClockToggle = (empId: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        const isNowActive = emp.status !== 'active';
        const nowTime = new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' });
        toast.success(
          isNowActive 
            ? `${emp.name} жұмыс ауысымын бастады (${nowTime})` 
            : `${emp.name} жұмыс ауысымын аяқтады`
        );
        return {
          ...emp,
          status: isNowActive ? 'active' : 'clocked_out',
          lastCheckIn: isNowActive ? `Бүгін ${nowTime}` : emp.lastCheckIn,
        };
      }
      return emp;
    }));
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
  };

  const handleAddStock = (newStock: StockItem) => {
    setStock(prev => [newStock, ...prev]);
  };

  const handleSaveLead = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleAddNote = (recordId: string, content: string, type: 'note' | 'activity') => {
    const newNote: ChatterNote = {
      id: `chat-${Date.now()}`,
      recordId,
      author: 'Әкімші (Admin)',
      content,
      type,
      createdAt: new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatter(prev => [newNote, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] relative">
      {/* Odoo Unified Navigation Bar */}
      <OdooNavbar 
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'analytics' || activeModule === 'analytics' ? (
          <OdooAnalyticsView />
        ) : viewMode === 'kanban' ? (
          <OdooKanbanBoard 
            leads={leads}
            employees={employees}
            tables={tables}
            onSelectLead={(l) => setSelectedLead(l)}
            onUpdateLeadStage={handleUpdateLeadStage}
            onClockToggle={handleClockToggle}
          />
        ) : (
          <OdooListView 
            customers={customers}
            stock={stock}
            recipes={recipes}
            purchaseOrders={purchaseOrders}
            employees={employees}
            onSelectCustomer={(c) => toast.info(`Клиент таңдалды: ${c.name}`)}
            onSelectStock={(s) => toast.info(`Тауар: ${s.name} (Қалдық: ${s.currentStock} ${s.unit})`)}
          />
        )}
      </main>

      {/* Quick Access Floating Kaspi QR Fiscal Bar */}
      <aside aria-label="Фискалды Kaspi QR төлем тақтасы" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsKaspiPaymentOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white rounded-2xl shadow-xl shadow-red-500/25 border border-white/20 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 group"
        >
          <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-none flex items-center gap-1.5">
              Kaspi QR & ОФД
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-white/80 leading-tight">ҚР Салық / 1С / ЭСФ</div>
          </div>
        </button>
      </aside>

      {/* Modals */}
      <OdooAppLauncherModal />
      
      <OdooCreateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onAddLead={handleAddLead}
        onAddStock={handleAddStock}
      />

      <OdooSyncModal 
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
      />

      <OdooFormModal 
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onSaveLead={handleSaveLead}
        chatter={chatter}
        onAddNote={handleAddNote}
      />

      <KaspiFiscalPaymentModal
        isOpen={isKaspiPaymentOpen}
        onClose={() => setIsKaspiPaymentOpen(false)}
        orderNumber="ORD-2026-88"
      />
    </div>
  );
}
