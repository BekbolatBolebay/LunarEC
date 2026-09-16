'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Loader2, Plus, ClipboardList, CheckCircle2,
  AlertCircle, Package, ChevronRight, X
} from 'lucide-react'
import Link from 'next/link'

export default function InventoryClient() {
  const { lang } = useApp()
  const [loading, setLoading] = useState(true)
  const [stockItems, setStockItems] = useState<any[]>([])
  const [activeCount, setActiveCount] = useState<any | null>(null)
  const [countItems, setCountItems] = useState<any[]>([])
  const [savingCount, setSavingCount] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ name_ru: '', name_kk: '', unit: 'кг', qty: '', low_stock_threshold: '5' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/warehouse/inventory')
      const data = await res.json()
      if (data.success) setStockItems(data.stockItems || [])
    } finally {
      setLoading(false)
    }
  }

  async function startCount() {
    try {
      const res = await fetch('/api/warehouse/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_count' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      const items = (data.items || []).map((ri: any) => {
        const matchingStock = stockItems.find(s => s.id === ri.stock_item_id)
        return {
          id: ri.id,
          stock_item_id: ri.stock_item_id,
          name_ru: matchingStock?.name_ru || '',
          name_kk: matchingStock?.name_kk || '',
          unit: matchingStock?.unit || 'кг',
          system_qty: ri.system_qty,
          counted_qty: ''
        }
      })
      setActiveCount(data.count)
      setCountItems(items)
      toast.success(lang === 'kk' ? 'Инвентаризация басталды!' : 'Инвентаризация начата!')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function finishCount() {
    if (!activeCount) return
    setSavingCount(true)
    try {
      const payload = countItems.map(item => ({
        id: item.id,
        counted_qty: item.counted_qty !== '' ? Number(item.counted_qty) : item.system_qty
      }))

      const res = await fetch('/api/warehouse/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finish_count', countId: activeCount.id, items: payload })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setActiveCount(null)
      setCountItems([])
      await loadData()
      toast.success(lang === 'kk' ? 'Инвентаризация аяқталды!' : 'Инвентаризация завершена!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingCount(false)
    }
  }

  async function addStockItem() {
    if (!newItem.name_ru.trim()) { toast.error(lang === 'kk' ? 'Атауды енгізіңіз' : 'Введите название'); return }
    try {
      const res = await fetch('/api/warehouse/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_item', ...newItem, qty: Number(newItem.qty) || 0 })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setShowAddItem(false)
      setNewItem({ name_ru: '', name_kk: '', unit: 'кг', qty: '', low_stock_threshold: '5' })
      await loadData()
      toast.success(lang === 'kk' ? 'Тауар қосылды!' : 'Товар добавлен!')
    } catch (e: any) { toast.error(e.message) }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex flex-col min-h-full bg-muted/20">
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/warehouse" className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{lang === 'kk' ? 'Инвентаризация' : 'Инвентаризация'}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddItem(true)} className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-xl text-xs font-bold hover:bg-muted transition-colors">
              <Plus className="w-3.5 h-3.5" />
              {lang === 'kk' ? 'Тауар' : 'Товар'}
            </button>
            {!activeCount && stockItems.length > 0 && (
              <button onClick={startCount} className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold active:scale-95 transition-all">
                <ClipboardList className="w-3.5 h-3.5" />
                {lang === 'kk' ? 'Санау' : 'Считать'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Add stock item modal */}
        <AnimatePresence>
          {showAddItem && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-card border-2 border-primary/20 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-foreground">{lang === 'kk' ? 'Жаңа тауар қосу' : 'Новый товар'}</h3>
                <button onClick={() => setShowAddItem(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <input placeholder={lang === 'kk' ? 'Атауы (орысша)' : 'Название (RU)'} value={newItem.name_ru}
                onChange={e => setNewItem(p => ({ ...p, name_ru: e.target.value }))}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary bg-background" />
              <input placeholder={lang === 'kk' ? 'Атауы (қазақша)' : 'Название (KK)'} value={newItem.name_kk}
                onChange={e => setNewItem(p => ({ ...p, name_kk: e.target.value }))}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary bg-background" />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder={lang === 'kk' ? 'Өлшем' : 'Ед.'} value={newItem.unit}
                  onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                  className="border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-primary bg-background" />
                <input type="number" placeholder={lang === 'kk' ? 'Бастапқы сан' : 'Кол-во'} value={newItem.qty}
                  onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))}
                  className="border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-primary bg-background" />
                <input type="number" placeholder={lang === 'kk' ? 'Мин' : 'Мин.'} value={newItem.low_stock_threshold}
                  onChange={e => setNewItem(p => ({ ...p, low_stock_threshold: e.target.value }))}
                  className="border border-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-primary bg-background" />
              </div>
              <button onClick={addStockItem} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-sm active:scale-95">
                {lang === 'kk' ? 'Қосу' : 'Добавить'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active count form */}
        {activeCount && (
          <div className="bg-card border-2 border-primary/20 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between">
              <h3 className="font-black text-primary">{lang === 'kk' ? '📋 Санау жүріп жатыр' : '📋 Идёт пересчёт'}</h3>
              <span className="text-xs font-bold text-muted-foreground">{countItems.length} позиция</span>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {countItems.map((item, idx) => (
                <div key={item.stock_item_id} className="flex items-center justify-between p-3 gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{lang === 'kk' ? item.name_kk : item.name_ru}</p>
                    <p className="text-xs text-muted-foreground">{lang === 'kk' ? 'Жүйеде:' : 'В системе:'} {item.system_qty} {item.unit}</p>
                  </div>
                  <input
                    type="number"
                    value={item.counted_qty}
                    onChange={e => setCountItems(prev => prev.map((ci, i) => i === idx ? { ...ci, counted_qty: e.target.value } : ci))}
                    placeholder={String(item.system_qty)}
                    className="w-24 border border-border rounded-xl px-3 py-2 text-sm text-right font-bold focus:outline-none focus:border-primary bg-background"
                  />
                </div>
              ))}
            </div>
            <div className="p-4">
              <button onClick={finishCount} disabled={savingCount}
                className="w-full py-3 bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
                {savingCount ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {lang === 'kk' ? 'Инвентаризацияны бекіту' : 'Завершить инвентаризацию'}
              </button>
            </div>
          </div>
        )}

        {/* Stock Items List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 font-bold text-xs uppercase tracking-wider text-muted-foreground">
            {lang === 'kk' ? `Тауар тізімі (${stockItems.length})` : `Список товаров (${stockItems.length})`}
          </div>
          {stockItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{lang === 'kk' ? 'Тауарлар жоқ. «Тауар» батырмасын басыңыз' : 'Нет товаров. Нажмите кнопку «Товар»'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {stockItems.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.qty <= item.low_stock_threshold ? 'bg-red-100 text-red-600' : 'bg-secondary text-foreground'}`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{lang === 'kk' ? item.name_kk : item.name_ru}</p>
                      {item.qty <= item.low_stock_threshold && (
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {lang === 'kk' ? 'Таусылып жатыр' : 'Заканчивается'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${item.qty <= item.low_stock_threshold ? 'text-red-600' : 'text-foreground'}`}>{item.qty}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
