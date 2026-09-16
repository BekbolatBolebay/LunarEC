'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Gift, Star, TrendingUp, Phone, Plus, Minus, Settings2 } from 'lucide-react'
import Link from 'next/link'

export default function LoyaltyClient() {
  const { lang } = useApp()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [savingSettings, setSavingSettings] = useState(false)
  const [tab, setTab] = useState<'cards' | 'settings'>('cards')
  const [localSettings, setLocalSettings] = useState({ loyalty_enabled: false, loyalty_points_per_tenge: '0.01', loyalty_tenge_per_point: '1' })
  const [adjustCard, setAdjustCard] = useState<any | null>(null)
  const [adjustDelta, setAdjustDelta] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/loyalty')
      const data = await res.json()
      if (data.success) {
        setCards(data.cards || [])
        setSettings(data.settings || {})
        setLocalSettings({
          loyalty_enabled: data.settings?.loyalty_enabled || false,
          loyalty_points_per_tenge: String(data.settings?.loyalty_points_per_tenge || '0.01'),
          loyalty_tenge_per_point: String(data.settings?.loyalty_tenge_per_point || '1')
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', ...localSettings })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await loadData()
      toast.success(lang === 'kk' ? 'Сақталды!' : 'Сохранено!')
    } catch (e: any) { toast.error(e.message) }
    finally { setSavingSettings(false) }
  }

  async function adjustPoints() {
    if (!adjustCard || !adjustDelta) return
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adjust_points', card_id: adjustCard.id, points_delta: Number(adjustDelta) })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setAdjustCard(null)
      setAdjustDelta('')
      await loadData()
      toast.success(lang === 'kk' ? 'Баллдар жаңартылды!' : 'Баллы обновлены!')
    } catch (e: any) { toast.error(e.message) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  const totalPoints = cards.reduce((s, c) => s + c.points, 0)
  const totalSpent = cards.reduce((s, c) => s + Number(c.total_spent), 0)

  return (
    <div className="flex flex-col min-h-full bg-muted/20">
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/management" className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{lang === 'kk' ? 'Loyalty' : 'Бонусная программа'}</h1>
            <p className="text-xs text-muted-foreground">
              {settings.loyalty_enabled ? '🟢 ' + (lang === 'kk' ? 'Қосылған' : 'Включена') : '🔴 ' + (lang === 'kk' ? 'Өшірілген' : 'Выключена')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['cards', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
              {t === 'cards' ? (lang === 'kk' ? 'Карталар' : 'Карты') : (lang === 'kk' ? 'Баптаулар' : 'Настройки')}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <h3 className="font-black text-foreground flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" />{lang === 'kk' ? 'Баптаулар' : 'Настройки'}</h3>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                <div>
                  <p className="font-bold text-sm text-foreground">{lang === 'kk' ? 'Loyalty қосу' : 'Включить бонусы'}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'kk' ? 'Тапсырыс аяқталғанда балл береді' : 'Начисляет баллы при завершении заказа'}</p>
                </div>
                <button onClick={() => setLocalSettings(p => ({ ...p, loyalty_enabled: !p.loyalty_enabled }))}
                  className={`w-12 h-6 rounded-full transition-all ${localSettings.loyalty_enabled ? 'bg-primary' : 'bg-muted'} relative`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${localSettings.loyalty_enabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  {lang === 'kk' ? '1 теңге = ? балл' : '1 тенге = ? балл'}
                </label>
                <input type="number" value={localSettings.loyalty_points_per_tenge} step="0.001"
                  onChange={e => setLocalSettings(p => ({ ...p, loyalty_points_per_tenge: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary bg-background" />
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'kk' ? `Мысалы: 1000 ₸ тапсырыс = ${Math.floor(1000 * Number(localSettings.loyalty_points_per_tenge))} балл` : `Например: заказ 1000 ₸ = ${Math.floor(1000 * Number(localSettings.loyalty_points_per_tenge))} баллов`}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  {lang === 'kk' ? '1 балл = ? теңге' : '1 балл = ? тенге'}
                </label>
                <input type="number" value={localSettings.loyalty_tenge_per_point} step="0.1"
                  onChange={e => setLocalSettings(p => ({ ...p, loyalty_tenge_per_point: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary bg-background" />
              </div>

              <button onClick={saveSettings} disabled={savingSettings}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {lang === 'kk' ? 'Сақтау' : 'Сохранить'}
              </button>
            </div>
          </motion.div>
        )}

        {tab === 'cards' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{lang === 'kk' ? 'Жалпы клиент' : 'Всего клиентов'}</p>
                <p className="text-2xl font-black text-foreground mt-1">{cards.length}</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{lang === 'kk' ? 'Жалпы балл' : 'Итого баллов'}</p>
                <p className="text-2xl font-black text-primary mt-1">{totalPoints.toLocaleString()}</p>
              </div>
            </div>

            {/* Adjust points modal */}
            {adjustCard && (
              <div className="bg-card border-2 border-primary/20 rounded-3xl p-5 space-y-3">
                <h3 className="font-black">{lang === 'kk' ? 'Баллды реттеу' : 'Корректировка баллов'}</h3>
                <p className="text-sm text-muted-foreground">{adjustCard.customer_phone} — {adjustCard.points} {lang === 'kk' ? 'балл' : 'баллов'}</p>
                <div className="flex gap-2">
                  <button onClick={() => setAdjustDelta(d => String((Number(d) || 0) - 10))} className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold"><Minus className="w-4 h-4" /></button>
                  <input type="number" value={adjustDelta} onChange={e => setAdjustDelta(e.target.value)} placeholder="0"
                    className="flex-1 border border-border rounded-xl px-4 py-2 text-center text-lg font-bold focus:outline-none focus:border-primary bg-background" />
                  <button onClick={() => setAdjustDelta(d => String((Number(d) || 0) + 10))} className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAdjustCard(null)} className="flex-1 py-2 bg-muted rounded-xl font-bold text-sm">{lang === 'kk' ? 'Болдырмау' : 'Отмена'}</button>
                  <button onClick={adjustPoints} className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm">{lang === 'kk' ? 'Қолдану' : 'Применить'}</button>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {cards.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{lang === 'kk' ? 'Loyalty карталары жоқ' : 'Карт лояльности нет'}</p>
                  {!settings.loyalty_enabled && <p className="text-xs mt-1 text-muted-foreground">{lang === 'kk' ? 'Алдымен Баптаулардан Loyalty-ді қосыңыз' : 'Сначала включите программу в Настройках'}</p>}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cards.map(card => (
                    <div key={card.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />{card.customer_phone || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lang === 'kk' ? 'Жалпы жұмсалды:' : 'Потрачено:'} {Number(card.total_spent).toLocaleString()} ₸
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-black text-amber-500">{card.points}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{lang === 'kk' ? 'балл' : 'баллов'}</p>
                        </div>
                        <button onClick={() => setAdjustCard(card)}
                          className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
                          <Settings2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
