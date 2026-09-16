'use client';

import React, { useState } from 'react';
import { 
  X, Check, Star, User, Phone, Mail, DollarSign, Tag, MessageSquare, 
  Clock, Send, Calendar, ArrowRight, ShieldCheck, FileText, CheckCircle2 
} from 'lucide-react';
import { Lead, ChatterNote, formatCurrency } from '@/lib/store';
import { toast } from 'sonner';

interface FormModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSaveLead: (updated: Lead) => void;
  chatter: ChatterNote[];
  onAddNote: (recordId: string, content: string, type: 'note' | 'activity') => void;
}

export function OdooFormModal({
  lead,
  onClose,
  onSaveLead,
  chatter,
  onAddNote,
}: FormModalProps) {
  if (!lead) return null;

  const [title, setTitle] = useState(lead.title);
  const [contactName, setContactName] = useState(lead.contactName);
  const [company, setCompany] = useState(lead.company || '');
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState(lead.email || '');
  const [revenue, setRevenue] = useState(lead.expectedRevenue);
  const [probability, setProbability] = useState(lead.probability);
  const [stage, setStage] = useState<Lead['stage']>(lead.stage);
  const [newNote, setNewNote] = useState('');
  const [activeChatterTab, setActiveChatterTab] = useState<'note' | 'activity'>('note');

  const stages: { id: Lead['stage']; label: string }[] = [
    { id: 'new', label: 'Жаңа' },
    { id: 'qualified', label: 'Квалификация' },
    { id: 'proposal', label: 'Ұсыныс' },
    { id: 'won', label: 'Жеңіс' },
  ];

  const handleSave = () => {
    onSaveLead({
      ...lead,
      title,
      contactName,
      company,
      phone,
      email,
      expectedRevenue: Number(revenue),
      probability: Number(probability),
      stage,
    });
    toast.success('Өзгерістер сәтті сақталды!');
    onClose();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(lead.id, newNote.trim(), activeChatterTab);
    setNewNote('');
    toast.success(activeChatterTab === 'note' ? 'Ескертпе қосылды' : 'Әрекет жоспарланды');
  };

  const recordChatter = chatter.filter(c => c.recordId === lead.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Odoo Status Bar & Smart Buttons */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-6 py-3 bg-slate-50/80 gap-3">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-odoo-purple hover:bg-odoo-purple-dark text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Сақтау</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium rounded-md transition-colors"
            >
              Болдырмау
            </button>
          </div>

          {/* Right: Odoo Chevron Status Pipeline */}
          <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs">
            {stages.map((stg) => {
              const isActive = stage === stg.id;
              return (
                <button
                  key={stg.id}
                  onClick={() => setStage(stg.id)}
                  className={`px-3 py-1 text-xs font-medium border-r last:border-r-0 border-slate-200 transition-colors ${
                    isActive 
                      ? 'bg-odoo-purple text-white font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {stg.label}
                </button>
              );
            })}
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body: Form Fields + Smart Buttons + Odoo Chatter */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Smart Buttons Row */}
          <div className="flex justify-end gap-2">
            <div className="border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 flex items-center gap-2 text-right">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Күтілетін Түсім</p>
                <p className="font-bold text-xs text-slate-900 font-mono">{formatCurrency(lead.expectedRevenue)}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 flex items-center gap-2 text-right">
              <ShieldCheck className="w-4 h-4 text-odoo-purple" />
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Ықтималдық</p>
                <p className="font-bold text-xs text-slate-900 font-mono">{lead.probability}%</p>
              </div>
            </div>
          </div>

          {/* Main Title input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Келісім атауы / Тақырыбы
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-slate-900 border-b-2 border-slate-200 focus:border-odoo-purple focus:outline-none pb-1 transition-colors"
            />
          </div>

          {/* Fields 2-columns grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-4 rounded-xl border border-slate-200/70">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Байланыс тұлғасы (Аты-жөні)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1 flex items-center gap-1.5">
                  🏢 Компания атауы
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Телефон нөмірі
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md px-3 py-2 font-mono focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email поштасы
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Сомасы (₸)
                  </label>
                  <input
                    type="number"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Ықтималдық (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md px-3 py-2 font-mono focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Жауапты менеджер
                </label>
                <input
                  type="text"
                  disabled
                  value={lead.assignedTo}
                  className="w-full text-xs bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-slate-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Odoo Chatter Section */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-odoo-purple" />
                <span>Odoo Chatter (Әрекеттер мен Ескертпелер тарихы)</span>
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveChatterTab('note')}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    activeChatterTab === 'note'
                      ? 'bg-odoo-purple text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📝 Ескертпе жазу
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChatterTab('activity')}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    activeChatterTab === 'activity'
                      ? 'bg-odoo-purple text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ⏰ Әрекет жоспарлау
                </button>
              </div>
            </div>

            {/* Chatter Input Box */}
            <form onSubmit={handleAddNote} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={
                    activeChatterTab === 'note'
                      ? 'Ішкі ескертпе немесе клиентпен сөйлесу нәтижесін жазыңыз...'
                      : 'Жоспарланған әрекет: "Ертең 14:00 келісім-шартты жіберу"...'
                  }
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-odoo-purple text-white text-xs font-semibold rounded-lg hover:bg-odoo-purple-dark flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Қосу</span>
                </button>
              </div>
            </form>

            {/* Timeline Stream */}
            <div className="space-y-3">
              {recordChatter.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Әзірге ескертпелер жоқ. Жоғарыдағы жолақ арқылы алғашқы жазбаңызды қалдырыңыз.
                </div>
              ) : (
                recordChatter.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-3 text-xs"
                  >
                    <div className="w-7 h-7 rounded-full bg-odoo-purple/10 text-odoo-purple flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {note.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{note.author}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{note.createdAt}</span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{note.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
