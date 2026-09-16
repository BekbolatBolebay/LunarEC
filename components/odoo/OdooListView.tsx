'use client';

import React from 'react';
import { 
  Customer, StockItem, RecipeItem, PurchaseOrder, Employee, formatCurrency, formatDate 
} from '@/lib/store';
import { useApp } from '@/lib/app-context';
import { AlertCircle, CheckCircle2, Clock, Eye, Trash2 } from 'lucide-react';

interface ListViewProps {
  customers: Customer[];
  stock: StockItem[];
  recipes: RecipeItem[];
  purchaseOrders: PurchaseOrder[];
  employees: Employee[];
  onSelectCustomer?: (c: Customer) => void;
  onSelectStock?: (s: StockItem) => void;
}

export function OdooListView({
  customers,
  stock,
  recipes,
  purchaseOrders,
  employees,
  onSelectCustomer,
  onSelectStock,
}: ListViewProps) {
  const { activeModule, activeSubmenu, lang, searchQuery } = useApp();

  // Helper for filter
  const filterText = searchQuery.toLowerCase();

  // 1. Customers List
  if (activeModule === 'crm' || (activeModule === 'crm' && activeSubmenu === 'clients')) {
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(filterText) ||
      c.phone.includes(filterText) ||
      c.email.toLowerCase().includes(filterText)
    );

    return (
      <div className="flex-1 p-6 bg-white overflow-y-auto">
        <div className="max-w-7xl mx-auto border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center"><input type="checkbox" className="rounded" /></th>
                <th className="p-3">Клиент аты-жөні</th>
                <th className="p-3">Телефон</th>
                <th className="p-3">Email</th>
                <th className="p-3">Тапсырыс саны</th>
                <th className="p-3">Жалпы сома (LTV)</th>
                <th className="p-3">Бонустар</th>
                <th className="p-3">Деңгейі</th>
                <th className="p-3">Тегтер</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => onSelectCustomer && onSelectCustomer(c)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="p-3 font-mono">{c.phone}</td>
                  <td className="p-3 text-slate-500">{c.email}</td>
                  <td className="p-3 font-semibold text-center">{c.totalOrders}</td>
                  <td className="p-3 font-bold text-slate-900 font-mono">{formatCurrency(c.totalSpent)}</td>
                  <td className="p-3 font-semibold text-amber-600 font-mono">{c.loyaltyPoints.toLocaleString()} b</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                      c.tier === 'gold' ? 'bg-amber-100 text-amber-700' :
                      c.tier === 'silver' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {c.tier}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. Inventory / Stock List
  if (activeModule === 'inventory') {
    const filtered = stock.filter(s =>
      s.name.toLowerCase().includes(filterText) ||
      s.sku.toLowerCase().includes(filterText) ||
      s.supplier.toLowerCase().includes(filterText)
    );

    return (
      <div className="flex-1 p-6 bg-white overflow-y-auto">
        <div className="max-w-7xl mx-auto border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center"><input type="checkbox" className="rounded" /></th>
                <th className="p-3">Тауар атауы</th>
                <th className="p-3">Артикул (SKU)</th>
                <th className="p-3">Санат</th>
                <th className="p-3 text-right">Қоймадағы қалдық</th>
                <th className="p-3 text-right">Мин. шек</th>
                <th className="p-3 text-right">Өзіндік құн</th>
                <th className="p-3">Жеткізуші</th>
                <th className="p-3 text-center">Мәртебе</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isLow = item.currentStock <= item.minStock;
                return (
                  <tr 
                    key={item.id}
                    onClick={() => onSelectStock && onSelectStock(item)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="p-3 font-mono text-slate-500">{item.sku}</td>
                    <td className="p-3 capitalize">{item.category}</td>
                    <td className={`p-3 text-right font-mono font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-800">
                      {formatCurrency(item.costPrice)}
                    </td>
                    <td className="p-3 text-slate-600">{item.supplier}</td>
                    <td className="p-3 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          <AlertCircle className="w-3 h-3" /> Дефицит!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Қалыпты
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. BOM / Recipes List
  if (activeModule === 'bom') {
    return (
      <div className="flex-1 p-6 bg-white overflow-y-auto">
        <div className="max-w-7xl mx-auto border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">Тағам атауы (BOM)</th>
                <th className="p-3">Санат</th>
                <th className="p-3 text-right">Сату бағасы</th>
                <th className="p-3 text-right">Өзіндік құн (COGS)</th>
                <th className="p-3 text-right">Маржинальділік</th>
                <th className="p-3">Ингредиенттер құрамы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipes.map((rec) => {
                const margin = Math.round(((rec.salePrice - rec.costPrice) / rec.salePrice) * 100);
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{rec.name}</td>
                    <td className="p-3">{rec.category}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(rec.salePrice)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-rose-600">{formatCurrency(rec.costPrice)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{margin}%</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {rec.ingredients.map((ing, idx) => (
                          <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                            {ing.name} ({ing.quantity} {ing.unit})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. Purchase Orders List
  if (activeModule === 'purchase') {
    return (
      <div className="flex-1 p-6 bg-white overflow-y-auto">
        <div className="max-w-7xl mx-auto border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">PO Нөмірі</th>
                <th className="p-3">Жеткізуші</th>
                <th className="p-3">Құрылған күні</th>
                <th className="p-3 text-center">Тауар позициялары</th>
                <th className="p-3 text-right">Жалпы сома</th>
                <th className="p-3 text-center">Мәртебесі</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold font-mono text-odoo-purple">{po.poNumber}</td>
                  <td className="p-3 font-semibold text-slate-900">{po.supplierName}</td>
                  <td className="p-3">{po.date}</td>
                  <td className="p-3 text-center">{po.itemsCount} позиция</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(po.totalAmount)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      po.status === 'billed' ? 'bg-emerald-100 text-emerald-800' :
                      po.status === 'received' ? 'bg-blue-100 text-blue-800' :
                      po.status === 'sent' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex-1 p-8 text-center text-slate-400">
      Таңдалған модуль үшін тізімдік кесте деректері жүктелуде...
    </div>
  );
}
