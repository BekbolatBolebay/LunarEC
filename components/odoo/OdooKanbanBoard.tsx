'use client';

import React from 'react';
import { 
  Plus, MoreHorizontal, User, DollarSign, Calendar, Star, 
  ChevronRight, Phone, Clock, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { Lead, Employee, TableItem, formatCurrency } from '@/lib/store';

interface KanbanProps {
  leads: Lead[];
  employees: Employee[];
  tables: TableItem[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStage: (id: string, newStage: Lead['stage']) => void;
  onClockToggle?: (empId: string) => void;
}

export function OdooKanbanBoard({
  leads,
  employees,
  tables,
  onSelectLead,
  onUpdateLeadStage,
  onClockToggle,
}: KanbanProps) {
  const { activeModule, activeSubmenu, lang, searchQuery } = useApp();

  // 1. CRM Pipeline Kanban
  if (activeModule === 'crm' && activeSubmenu === 'pipeline') {
    const stages: { id: Lead['stage']; label: string; color: string }[] = [
      { id: 'new', label: lang === 'kk' ? 'Жаңа Лидтер' : 'Новые Лиды', color: 'border-blue-500 bg-blue-50/40 text-blue-800' },
      { id: 'qualified', label: lang === 'kk' ? 'Квалификация' : 'Квалификация', color: 'border-amber-500 bg-amber-50/40 text-amber-800' },
      { id: 'proposal', label: lang === 'kk' ? 'Комм. Ұсыныс' : 'Предложение', color: 'border-purple-500 bg-purple-50/40 text-purple-800' },
      { id: 'won', label: lang === 'kk' ? 'Жеңіс (Келісім)' : 'Выиграно', color: 'border-emerald-500 bg-emerald-50/40 text-emerald-800' },
      { id: 'lost', label: lang === 'kk' ? 'Ұтылыс' : 'Проиграно', color: 'border-slate-400 bg-slate-50 text-slate-700' },
    ];

    const filteredLeads = leads.filter(l => 
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getNextStage = (current: Lead['stage']): Lead['stage'] | null => {
      const order: Lead['stage'][] = ['new', 'qualified', 'proposal', 'won'];
      const idx = order.indexOf(current);
      if (idx >= 0 && idx < order.length - 1) return order[idx + 1];
      return null;
    };

    return (
      <div className="flex-1 overflow-x-auto p-4 bg-[#F1F3F5] min-h-[calc(100vh-100px)]">
        <div className="flex gap-4 min-w-[1200px] items-start">
          {stages.map((stg) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stg.id);
            const stageTotal = stageLeads.reduce((acc, l) => acc + l.expectedRevenue, 0);

            return (
              <div
                key={stg.id}
                className="w-80 flex-shrink-0 flex flex-col bg-[#EBEDF0] rounded-xl border border-slate-200/80 shadow-xs max-h-[85vh]"
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-slate-200 bg-white/70 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-odoo-purple" />
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        {stg.label}
                      </h4>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Жалпы сома:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(stageTotal)}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg">
                      Мұнда әзірге келісім жоқ
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const next = getNextStage(lead.stage);

                      return (
                        <div
                          key={lead.id}
                          onClick={() => onSelectLead(lead)}
                          className="group bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-odoo-purple/50 cursor-pointer transition-all relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-semibold text-xs text-slate-900 group-hover:text-odoo-purple transition-colors leading-snug">
                              {lead.title}
                            </h5>
                            {lead.priority === 'high' && (
                              <span className="text-amber-500 text-xs flex">
                                ★★★
                              </span>
                            )}
                          </div>

                          {lead.company && (
                            <p className="text-[11px] font-medium text-slate-600 mt-1 flex items-center gap-1">
                              🏢 {lead.company}
                            </p>
                          )}

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{lead.contactName}</span>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lead.tags.map((tg, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                              >
                                {tg}
                              </span>
                            ))}
                          </div>

                          {/* Bottom Row: Amount, Next stage button */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div className="font-bold text-xs text-emerald-700 font-mono">
                              {formatCurrency(lead.expectedRevenue)}
                            </div>

                            {next && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateLeadStage(lead.id, next);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px] font-semibold text-odoo-purple hover:underline bg-odoo-purple/5 px-1.5 py-0.5 rounded"
                                title="Келесі сатыға өткізу"
                              >
                                <span>Алға</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. HR Attendance Kanban
  if (activeModule === 'hr') {
    const hrStages: { id: Employee['status']; label: string; bg: string }[] = [
      { id: 'active', label: lang === 'kk' ? '🟢 Жұмыс орнында (Active)' : '🟢 На смене (Active)', bg: 'border-emerald-500' },
      { id: 'on_break', label: lang === 'kk' ? '🟡 Үзілісте (On Break)' : '🟡 На перерыве (On Break)', bg: 'border-amber-500' },
      { id: 'clocked_out', label: lang === 'kk' ? '⚪ Аяқтаған (Clocked Out)' : '⚪ Смена закрыта', bg: 'border-slate-300' },
    ];

    return (
      <div className="flex-1 p-6 bg-[#F1F3F5] min-h-[calc(100vh-100px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {hrStages.map((stg) => {
            const emps = employees.filter((e) => e.status === stg.id);
            return (
              <div key={stg.id} className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
                <div className={`p-3.5 border-b border-slate-200 flex items-center justify-between font-bold text-xs text-slate-800 ${stg.bg} border-t-4 rounded-t-xl`}>
                  <span>{stg.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-xs">
                    {emps.length}
                  </span>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {emps.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-odoo-purple/40 hover:shadow-xs transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{emp.avatar}</span>
                        <div>
                          <h5 className="font-semibold text-xs text-slate-900">{emp.name}</h5>
                          <p className="text-[11px] text-slate-500">{emp.role} • {emp.phone}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {emp.lastCheckIn ? `Келген уақыты: ${emp.lastCheckIn}` : 'Бүгін келмеген'}
                          </p>
                        </div>
                      </div>

                      {onClockToggle && (
                        <button
                          onClick={() => onClockToggle(emp.id)}
                          className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                            emp.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {emp.status === 'active' ? 'Check-out' : 'Check-in'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. POS Tables Kanban
  if (activeModule === 'pos') {
    return (
      <div className="flex-1 p-6 bg-[#F1F3F5] min-h-[calc(100vh-100px)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">
              Зал мен Үстелдердің Интерактивті Топологиясы
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Бос (Free)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Бос емес (Occupied)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Брондалған (Reserved)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tables.map((t) => {
              const isFree = t.status === 'free';
              const isOccupied = t.status === 'occupied';
              const isReserved = t.status === 'reserved';

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all relative ${
                    isFree 
                      ? 'bg-white border-slate-200 hover:border-emerald-400' 
                      : isOccupied 
                      ? 'bg-rose-50/50 border-rose-200' 
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">
                      Үстел №{t.number}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isFree ? 'bg-emerald-500' : isOccupied ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                  </div>

                  <p className="text-xs text-slate-500">{t.section} • {t.capacity} орын</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-xs">
                    {isOccupied && (
                      <div>
                        <span className="text-slate-500 text-[11px]">Ағымдағы чек:</span>
                        <p className="font-bold text-rose-700 font-mono">
                          {formatCurrency(t.activeOrderTotal || 0)}
                        </p>
                      </div>
                    )}
                    {isReserved && (
                      <div>
                        <span className="text-amber-700 font-medium text-[11px]">Брон: {t.reservedFor}</span>
                        <p className="text-slate-500 text-[10px]">Уақыты: {t.reservedTime}</p>
                      </div>
                    )}
                    {isFree && (
                      <span className="text-emerald-600 font-medium">Қонақ қабылдауға дайын</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-slate-500">
      Бұл көрініс үшін Kanban тақтасы қолжетімді емес. Тізім (List) көрінісін таңдаңыз.
    </div>
  );
}
