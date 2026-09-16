'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Plus, Truck, Package, CheckCircle2, Phone, X, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

export default function SuppliersClient() {
  const { lang } = useApp()
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [tab, setTab] = useState<'suppliers' | 'orders'>('suppliers')
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showCreatePO, setShowCreatePO] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', email: '', address: '' })
  const [newPO, setNewPO] = useState({ supplier_id: '', notes: '', items: [{ name_ru: '', qty: '', unit: 'кг', price_per_unit: '' }] })
  const [savingPO, setSavingPO] = useState(false)
  const [expandedPO, setExpandedPO] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/warehouse/suppliers')
      const data = await res.json()
      if (data.success) {
        setSuppliers(data.suppliers || [])
        setPurchaseOrders(data.purchaseOrders || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function addSupplier() {
    if (!newSupplier.name.trim()) { toast.error(lang === 'kk' ? 'Атауды енгізіңіз' : 'Введите название'); return }
    try {
      const res = await fetch('/api/warehouse/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_supplier', ...newSupplier })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setShowAddSupplier(false)
      setNewSupplier({ name: '', phone: '', email: '', address: '' })
      await loadData()
      toast.success(lang === 'kk' ? 'Жеткізуші қосылды!' : 'Поставщик добавлен!')
    } catch (e: any) { toast.error(e.message) }
  }

  async function createPO() {
    setSavingPO(true)
    try {
      const items = newPO.items.filter(i => i.name_ru.trim() && Number(i.qty) > 0)
      if (items.length === 0) { toast.error(lang === 'kk' ? 'Тауарларды толтырыңыз' : 'Добавьте товары'); return }
      const res = await fetch('/api/warehouse/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_po', ...newPO, items })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setShowCreatePO(false)
      setNewPO({ supplier_id: '', notes: '', items: [{ name_ru: '', qty: '', unit: 'кг', price_per_unit: '' }] })
      await loadData()
      toast.success(lang === 'kk' ? 'Тапсырыс жасалды!' : 'Заказ создан!')
    } catch (e: any) { toast.error(e.message) }
    finally { setSavingPO(false) }
  }

  async function receivePO(poId: string) {
    try {
      const res = await fetch('/api/warehouse/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'receive_po', poId })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await loadData()
      toast.success(lang === 'kk' ? 'Тауар қабылданды!' : 'Товар принят!')
    } catch (e: any) { toast.error(e.message) }
  }

  const poStatusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    ordered: 'bg-blue-100 text-blue-600',
    received: 'bg-emerald-100 text-emerald-600',
    cancelled: 'bg-red-100 text-red-600'
  }
  const poStatusLabels: Record<string, { kk: string; ru: string }> = {
    draft: { kk: 'Жоба', ru: 'Черновик' },
    ordered: { kk: 'Тапсырыс берілді', ru: 'Заказано' },
    received: { kk: 'Қабылданды', ru: 'Принято' },
    cancelled: { kk: 'Болдырылмады', ru: 'Отменён' }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col min-h-full bg-muted/20">
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/warehouse" className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold">{lang === 'kk' ? 'Жеткізушілер' : 'Поставщики'}</h1>
          </div>
          <div className="flex gap-2">
            {tab === 'suppliers' && (
              <button onClick={() => setShowAddSupplier(true)} className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">
                <Plus className="w-3.5 h-3.5" />{lang === 'kk' ? 'Жеткізуші' : 'Поставщик'}
              </button>
            )}
            {tab === 'orders' && (
              <button onClick={() => setShowCreatePO(true)} className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">
                <Plus className="w-3.5 h-3.5" />{lang === 'kk' ? 'Тапсырыс' : 'Заказ'}
              </button>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {(['suppliers', 'orders'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
              {t === 'suppliers' ? (lang === 'kk' ? 'Жеткізушілер' : 'Поставщики') : (lang === 'kk' ? 'Тапсырыстар' : 'Заказы')}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Add Supplier Form */}
        <AnimatePresence>
          {showAddSupplier && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-card border-2 border-primary/20 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black">{lang === 'kk' ? 'Жеткізуші қосу' : 'Новый поставщик'}</h3>
                <button onClick={() => setShowAddSupplier(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              {['name', 'phone', 'email', 'address'].map(field => (
                <input key={field} placeholder={field === 'name' ? (lang === 'kk' ? 'Атауы *' : 'Название *') : field}
                  value={(newSupplier as any)[field]} onChange={e => setNewSupplier(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary bg-background" />
              ))}
              <button onClick={addSupplier} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-sm">
                {lang === 'kk' ? 'Қосу' : 'Добавить'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {tab === 'suppliers' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {suppliers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{lang === 'kk' ? 'Жеткізушілер жоқ' : 'Поставщиков нет'}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {suppliers.map(s => (
                  <div key={s.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{s.name}</p>
                      {s.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <>
            {showCreatePO && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border-2 border-primary/20 rounded-3xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-black">{lang === 'kk' ? 'Тапсырыс жасау' : 'Создать заказ'}</h3>
                  <button onClick={() => setShowCreatePO(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <select value={newPO.supplier_id} onChange={e => setNewPO(p => ({ ...p, supplier_id: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary bg-background">
                  <option value="">{lang === 'kk' ? 'Жеткізушіні таңдаңыз' : 'Выберите поставщика'}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{lang === 'kk' ? 'Тауарлар:' : 'Товары:'}</p>
                {newPO.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2">
                    <input placeholder={lang === 'kk' ? 'Атауы' : 'Название'} value={item.name_ru}
                      onChange={e => setNewPO(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, name_ru: e.target.value } : it) }))}
                      className="col-span-2 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-background" />
                    <input type="number" placeholder={lang === 'kk' ? 'Саны' : 'Кол-во'} value={item.qty}
                      onChange={e => setNewPO(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, qty: e.target.value } : it) }))}
                      className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-background" />
                    <input type="number" placeholder={lang === 'kk' ? 'Бағасы' : 'Цена'} value={item.price_per_unit}
                      onChange={e => setNewPO(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, price_per_unit: e.target.value } : it) }))}
                      className="border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary bg-background" />
                  </div>
                ))}
                <button onClick={() => setNewPO(p => ({ ...p, items: [...p.items, { name_ru: '', qty: '', unit: 'кг', price_per_unit: '' }] }))}
                  className="text-xs text-primary font-bold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />{lang === 'kk' ? 'Жол қосу' : 'Добавить строку'}
                </button>
                <button onClick={createPO} disabled={savingPO}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {savingPO ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {lang === 'kk' ? 'Тапсырыс жасау' : 'Создать заказ'}
                </button>
              </motion.div>
            )}

            <div className="space-y-3">
              {purchaseOrders.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl py-12 text-center text-muted-foreground text-sm">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{lang === 'kk' ? 'Тапсырыстар жоқ' : 'Заказов нет'}</p>
                </div>
              ) : purchaseOrders.map(po => (
                <div key={po.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}>
                    <div>
                      <p className="text-sm font-bold text-foreground">{po.suppliers?.name || (lang === 'kk' ? 'Жеткізуші жоқ' : 'Без поставщика')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(po.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-xl ${poStatusColors[po.status]}`}>
                        {(poStatusLabels[po.status] || { kk: po.status, ru: po.status })[lang === 'kk' ? 'kk' : 'ru']}
                      </span>
                      {expandedPO === po.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedPO === po.id && (
                    <div className="border-t border-border">
                      <div className="divide-y divide-border">
                        {(po.purchase_order_items || []).map((item: any) => (
                          <div key={item.id} className="px-4 py-2 flex justify-between text-sm">
                            <span className="font-medium">{item.name_ru}</span>
                            <span className="text-muted-foreground">{item.qty} × {item.price_per_unit} ₸</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 flex items-center justify-between border-t border-border">
                        <span className="font-black text-foreground">{(po.total_amount || 0).toLocaleString()} ₸</span>
                        {po.status === 'draft' && (
                          <button onClick={() => receivePO(po.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold active:scale-95">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {lang === 'kk' ? 'Тауар қабылдау' : 'Принять товар'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
