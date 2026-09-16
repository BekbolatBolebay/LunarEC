'use client';

import React, { useState } from 'react';
import { X, Plus, Target, Package, Truck, Users } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { Lead, StockItem, PurchaseOrder, Employee } from '@/lib/store';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: Lead) => void;
  onAddStock: (stock: StockItem) => void;
}

export function OdooCreateModal({
  isOpen,
  onClose,
  onAddLead,
  onAddStock,
}: CreateModalProps) {
  const { activeModule, lang } = useApp();
  const [recordType, setRecordType] = useState<string>(activeModule === 'inventory' ? 'stock' : 'lead');

  // Lead fields
  const [leadTitle, setLeadTitle] = useState('');
  const [contactName, setContactName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [revenue, setRevenue] = useState(250000);

  // Stock fields
  const [itemName, setItemName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState<'кг' | 'литр' | 'дана' | 'қап'>('кг');
  const [currentStock, setCurrentStock] = useState(10);
  const [minStock, setMinStock] = useState(5);
  const [costPrice, setCostPrice] = useState(2000);
  const [supplier, setSupplier] = useState('KazBeef Trade');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (recordType === 'lead') {
      if (!leadTitle.trim() || !contactName.trim()) {
        toast.error('Атауын және байланыс тұлғасын енгізіңіз!');
        return;
      }
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        title: leadTitle,
        contactName,
        company: company || undefined,
        phone: phone || '+7 (700) 000-0000',
        expectedRevenue: Number(revenue),
        probability: 30,
        stage: 'new',
        priority: 'medium',
        assignedTo: 'Менеджер',
        tags: ['Жаңа'],
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddLead(newLead);
      toast.success('Жаңа келісім CRM құбырына қосылды!');
    } else if (recordType === 'stock') {
      if (!itemName.trim()) {
        toast.error('Тауар атауын жазыңыз!');
        return;
      }
      const newStock: StockItem = {
        id: `stock-${Date.now()}`,
        name: itemName,
        sku: sku || `RAW-${Math.floor(Math.random() * 1000)}`,
        category: 'raw',
        unit,
        currentStock: Number(currentStock),
        minStock: Number(minStock),
        costPrice: Number(costPrice),
        supplier,
        updatedAt: 'Дәл қазір',
      };
      onAddStock(newStock);
      toast.success('Тауар қойма тізіміне енгізілді!');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-odoo-purple text-white flex items-center justify-center font-bold">
              +
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              Жаңа Жазба Құру (Odoo Quick Record)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setRecordType('lead')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              recordType === 'lead'
                ? 'bg-odoo-purple text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>CRM Келісім (Lead)</span>
          </button>

          <button
            type="button"
            onClick={() => setRecordType('stock')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              recordType === 'stock'
                ? 'bg-odoo-purple text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Қойма Тауары (Stock)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {recordType === 'lead' ? (
            <>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Келісім / Банкет / Іс-шара тақырыбы *
                </label>
                <input
                  type="text"
                  required
                  value={leadTitle}
                  onChange={(e) => setLeadTitle(e.target.value)}
                  placeholder="мыс: Корпоративтік банкет (40 адам)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Байланыс тұлғасы *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Айдос Нұрлан"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Компания
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Kcell / жеке"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Телефон нөмірі
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (777) 123-4567"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Күтілетін сома (₸)
                  </label>
                  <input
                    type="number"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple font-mono font-bold"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Тауар / Ингредиент атауы *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="мыс: Моцарелла ірімшігі"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Артикул (SKU)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="RAW-MOZ-01"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Өлшем бірлігі
                  </label>
                  <select
                    value={unit}
                    onChange={(e: any) => setUnit(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple"
                  >
                    <option value="кг">Килограмм (кг)</option>
                    <option value="литр">Литр (л)</option>
                    <option value="дана">Дана (шт)</option>
                    <option value="қап">Қап / Қорап</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Бастапқы қалдық
                  </label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Мин. шек (Дефицит)
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Бағасы (₸)
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-odoo-purple font-mono font-bold"
                  />
                </div>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Болдырмау
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-odoo-purple hover:bg-odoo-purple-dark text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Құру және Сақтау
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
