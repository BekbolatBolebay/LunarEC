'use client'

import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { Package, Search, SlidersHorizontal, ArrowLeft, Loader2, AlertCircle, ClipboardList, Truck } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WarehouseClient({ cafeId }: { cafeId: string }) {
  const supabase = createClient()
  const { lang } = useApp()
  const [loading, setLoading] = useState(true)

  const [stock, setStock] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/warehouse/inventory')
      const data = await res.json()
      if (res.ok && data.success) {
        setStock(data.stockItems || [])
      } else {
        setError(data.error || 'Failed to fetch stock')
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStock()

    // Real-time subscription to stock_moves to update inventory instantly
    const channel = supabase.channel('warehouse_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_moves' },
        (payload) => {
          console.log('Stock move detected, refreshing inventory...', payload)
          fetchStock()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        (payload) => {
          console.log('Inventory items changed, refreshing...', payload)
          fetchStock()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchStock])

  const filteredStock = stock.filter(item => {
    const name = lang === 'kk' ? (item.name_kk || '') : (item.name_ru || '')
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const totalCount = stock.length
  const lowCount = stock.filter(item => item.status === 'low').length

  return (
    <div className="flex flex-col min-h-full bg-muted/20">
      {/* Top Header */}
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex justify-between items-center gap-3 mb-2">
          <div className="flex items-center gap-3">
            <Link href="/management" className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{lang === 'kk' ? 'Қойма' : 'Склад'}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/warehouse/inventory" className="px-3 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl hover:bg-muted transition-all active:scale-95 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" />{lang === 'kk' ? 'Инвентарь' : 'Инвент.'}
            </Link>
            <Link href="/warehouse/suppliers" className="px-3 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl hover:bg-muted transition-all active:scale-95 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />{lang === 'kk' ? 'Жеткізуші' : 'Поставщик'}
            </Link>
            <Link href="/warehouse/recipes" className="px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all active:scale-95">
              {lang === 'kk' ? 'Рецепттер' : 'Рецепты'}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 w-fit px-2 py-1 rounded-lg">
          <Package className="w-3 h-3" />
          {lang === 'kk' ? 'Қойма жүйесі' : 'Система склада'}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'kk' ? 'Шикізатты іздеу...' : 'Поиск сырья...'}
              className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex gap-3 text-destructive items-start text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{lang === 'kk' ? 'Қойма жүктеу қатесі' : 'Ошибка загрузки склада'}</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-black text-foreground">{totalCount}</div>
            <div className="text-xs font-medium text-muted-foreground mt-1">
              {lang === 'kk' ? 'Барлық тауар саны' : 'Всего товаров'}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{lowCount}</div>
            <div className="text-xs font-medium text-red-600/80 dark:text-red-400/80 mt-1">
              {lang === 'kk' ? 'Азайып қалған' : 'Заканчивается'}
            </div>
          </div>
        </div>

        {/* Stock List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-semibold">
                {lang === 'kk' ? 'Қойма мәліметтері жүктелуде...' : 'Загрузка данных склада...'}
              </p>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm font-medium">
              {lang === 'kk' ? 'Шикізат табылмады' : 'Товары не найдены'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredStock.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.status === 'low' 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-secondary text-foreground'
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {lang === 'kk' ? item.name_kk : item.name_ru}
                      </h3>
                      {item.status === 'low' && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {lang === 'kk' ? 'Таусылып жатыр' : 'Заканчивается'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black ${item.status === 'low' ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                      {item.qty}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {item.unit}
                    </div>
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
