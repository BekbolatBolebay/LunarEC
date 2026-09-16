'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, TrendingUp, ShoppingBag, Users, Receipt, Monitor } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import type { Order, MenuItem } from '@/lib/db'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns'
import { ru as ruLocale } from 'date-fns/locale'

type Period = 'daily' | 'weekly' | 'monthly'

interface Props {
  orders: Order[]
  menuItems: MenuItem[]
}

export default function AnalyticsClient({ orders, menuItems }: Props) {
  const { lang, theme } = useApp()
  const [period, setPeriod] = useState<Period>('daily')

  const isKioskOrder = (o: Order) => (o as any).order_source === 'kiosk' || o.notes?.includes('[KIOSK]') || o.delivery_address === 'Kiosk Terminal'

  const completedOrders = orders.filter((o) => (o.status as any) === 'delivered' || o.status === 'completed')
  const kioskOrders = completedOrders.filter(isKioskOrder)
  const appOrders = completedOrders.filter(o => !isKioskOrder(o))

  const chartData = useMemo(() => {
    const now = new Date()
    let days = period === 'daily' ? 7 : period === 'weekly' ? 28 : 90
    const start = startOfDay(subDays(now, days - 1))
    const interval = eachDayOfInterval({ start, end: now })

    return interval.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart.getTime() + 86400000)
      const dayOrders = completedOrders.filter((o) => {
        const d = new Date(o.created_at)
        return d >= dayStart && d < dayEnd
      })
      const dayKiosk = dayOrders.filter(isKioskOrder)
      const dayApp = dayOrders.filter(o => !isKioskOrder(o))
      return {
        date: format(day, 'dd.MM', { locale: ruLocale }),
        revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
        count: dayOrders.length,
        kioskRevenue: dayKiosk.reduce((s, o) => s + Number(o.total_amount), 0),
        appRevenue: dayApp.reduce((s, o) => s + Number(o.total_amount), 0),
      }
    }).filter((_, i, arr) => {
      if (period === 'daily') return true
      const step = period === 'weekly' ? 2 : 7
      return i % step === 0 || i === arr.length - 1
    })
  }, [orders, period])

  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total_amount), 0)
  const totalCompleted = completedOrders.length
  const avgOrder = totalCompleted > 0 ? Math.round(totalRevenue / totalCompleted) : 0

  const kioskRevenue = kioskOrders.reduce((s, o) => s + Number(o.total_amount), 0)
  const kioskAvg = kioskOrders.length > 0 ? Math.round(kioskRevenue / kioskOrders.length) : 0

  const popularItems = menuItems.slice(0, 5).map((item, i) => ({
    name: lang === 'kk' ? item.name_kk : item.name_ru,
    sales: Math.max(15, 80 - i * 12),
  }))

  const statCards = [
    { label: t(lang, 'revenue'), value: `${totalRevenue.toLocaleString()} ₸`, icon: TrendingUp, color: 'text-primary bg-primary/10' },
    { label: t(lang, 'totalOrders'), value: orders.length, icon: ShoppingBag, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' },
    { label: t(lang, 'avgOrder'), value: `${avgOrder.toLocaleString()} ₸`, icon: Receipt, color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30' },
    { label: t(lang, 'completed'), value: totalCompleted, icon: Users, color: 'text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-900/30' },
  ]

  const axisColor = theme === 'dark' ? '#6b7280' : '#9ca3af'
  const gridColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/management" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">{t(lang, 'analytics')}</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-2xl border border-border p-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', color)}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Period picker */}
        <div className="flex gap-2 max-w-md">
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
                period === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              {t(lang, p as any)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Revenue chart */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground mb-4">{t(lang, 'revenue')}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={period === 'monthly' ? 6 : 12}>
                  <CartesianGrid vertical={false} stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={40}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{
                      background: theme === 'dark' ? '#1e293b' : '#fff',
                      border: 'none', borderRadius: 12, fontSize: 12,
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    }}
                    formatter={(v: number) => [`${v.toLocaleString()} ₸`, t(lang, 'revenue')]}
                  />
                  <Bar dataKey="revenue" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular items */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground mb-4">{t(lang, 'popularItems')}</p>
            <div className="space-y-4">
              {popularItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground font-medium truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.sales}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(item.sales / 80) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════ KIOSK ANALYTICS SECTION ═══════════ */}
        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {lang === 'kk' ? 'Киоск аналитикасы' : 'Аналитика киоска'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {lang === 'kk' ? 'Киоск терминалынан келген тапсырыстар есебі' : 'Отчёт по заказам с терминала самообслуживания'}
              </p>
            </div>
          </div>

          {/* Kiosk stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-card rounded-2xl border border-sky-200 dark:border-sky-800/40 p-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2">
                <Monitor className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-foreground">{kioskOrders.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'kk' ? 'Киоск тапсырыстары' : 'Заказы с киоска'}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-sky-200 dark:border-sky-800/40 p-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-foreground">{kioskRevenue.toLocaleString()} ₸</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'kk' ? 'Киоск табысы' : 'Выручка киоска'}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-sky-200 dark:border-sky-800/40 p-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2">
                <Receipt className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-foreground">{kioskAvg.toLocaleString()} ₸</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'kk' ? 'Орташа чек' : 'Средний чек'}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-sky-200 dark:border-sky-800/40 p-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {totalCompleted > 0 ? `${Math.round((kioskOrders.length / totalCompleted) * 100)}%` : '0%'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'kk' ? 'Жалпы үлесі' : 'Доля от общих'}
              </p>
            </div>
          </div>

          {/* Kiosk vs App comparison chart */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-sm font-semibold text-foreground mb-4">
              {lang === 'kk' ? 'Киоск vs Қосымша (табыс салыстыруы)' : 'Киоск vs Приложение (сравнение выручки)'}
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={period === 'monthly' ? 4 : 8}>
                  <CartesianGrid vertical={false} stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={40}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{
                      background: theme === 'dark' ? '#1e293b' : '#fff',
                      border: 'none', borderRadius: 12, fontSize: 12,
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    }}
                    formatter={(v: number, name: string) => [
                      `${v.toLocaleString()} ₸`,
                      name === 'kioskRevenue' ? (lang === 'kk' ? 'Киоск' : 'Киоск') : (lang === 'kk' ? 'Қосымша' : 'Приложение')
                    ]}
                  />
                  <Legend
                    formatter={(value: string) =>
                      value === 'kioskRevenue' ? (lang === 'kk' ? 'Киоск' : 'Киоск') : (lang === 'kk' ? 'Қосымша' : 'Приложение')
                    }
                    wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                  />
                  <Bar dataKey="kioskRevenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="appRevenue" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
