'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Search, RefreshCw, Calendar, User, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function CertificatesClient({ restaurantId }: { restaurantId: string }) {
  const { lang } = useApp()
  const supabase = createClient()
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchCertificates = useCallback(async () => {
    setRefreshing(true)
    const { data, error } = await supabase
      .from('gift_certificates')
      .select(`
        *,
        buyer:clients!buyer_id(full_name, phone)
      `)
      .eq('cafe_id', restaurantId)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setCertificates(data)
    } else if (error) {
      console.error('Error fetching certificates:', error)
    }
    setLoading(false)
    setRefreshing(false)
  }, [restaurantId])

  useEffect(() => {
    fetchCertificates()
  }, [fetchCertificates])

  const filtered = certificates.filter(c => 
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'fully_used': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
      case 'expired': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400'
      default: return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lang === 'kk' ? 'Сыйлық сертификаттары' : 'Подарочные сертификаты'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lang === 'kk' ? 'Сатылым тарихы және баланс' : 'История продаж и баланс'}
            </p>
          </div>
          <button 
            onClick={fetchCertificates}
            className="p-2.5 rounded-xl bg-secondary text-foreground active:scale-95 transition-all"
          >
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
              {lang === 'kk' ? 'Барлығы сатылды' : 'Всего продано'}
            </p>
            <p className="text-xl font-black italic">{certificates.length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
              {lang === 'kk' ? 'Жалпы сома' : 'Общая сумма'}
            </p>
            <p className="text-xl font-black italic">
              {certificates.reduce((acc, c) => acc + Number(c.initial_amount), 0).toLocaleString()} ₸
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'kk' ? "Код немесе аты бойынша іздеу..." : "Поиск по коду или имени..."}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-24 bg-card rounded-2xl border border-border animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm">{lang === 'kk' ? 'Сертификаттар табылмады' : 'Сертификаты не найдены'}</p>
            </div>
          ) : (
            filtered.map(cert => (
              <div key={cert.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm">{cert.code}</p>
                      <p className="text-[10px] text-muted-foreground font-bold italic">
                        {new Date(cert.created_at).toLocaleString(lang === 'kk' ? 'kk-KZ' : 'ru-RU')}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border",
                    getStatusStyle(cert.status)
                  )}>
                    {cert.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Бастапқы</p>
                    <p className="text-sm font-black">{cert.initial_amount.toLocaleString()} ₸</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Қалдық</p>
                    <p className="text-sm font-black text-emerald-500">{cert.current_balance.toLocaleString()} ₸</p>
                  </div>
                </div>

                {cert.buyer ? (
                  <div className="flex flex-col gap-1 bg-secondary/30 p-3 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {cert.buyer.full_name || 'Guest'}
                    </div>
                    {cert.buyer.phone && (
                      <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground ml-5">
                        <Phone className="w-3 h-3" />
                        {cert.buyer.phone}
                      </div>
                    )}
                  </div>
                ) : cert.customer_name ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                    <User className="w-3 h-3" />
                    {cert.customer_name}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground italic px-1">
                    <User className="w-3 h-3" />
                    {lang === 'kk' ? 'Анонимді сатып алу' : 'Анонимная покупка'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
