'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, Search, User, Phone, MapPin, ClipboardList, Trash2, X, Check, Star, 
  RefreshCw, TrendingUp, Wallet, ShoppingBag 
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ClientsClient({ initialClients }: { initialClients: any[] }) {
    const { lang } = useApp()
    const [clients, setClients] = useState<any[]>(initialClients)
    const [search, setSearch] = useState('')
    const [selectedClient, setSelectedClient] = useState<any | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const supabase = createClient()

    // Real-time polling
    useEffect(() => {
        const poll = async () => {
            setIsRefreshing(true)
            try {
                // In a real app, this would be a more complex view or join
                // But we'll use the existing logic from the server component if possible
                // For now, let's just refresh the 'clients' table and 'orders' stats
                const { data, error } = await supabase.rpc('get_clients_summary') 
                // Note: assuming a RPC function exists or we just fetch clients
                // If no RPC, we'll just fetch clients table
                if (!error && data) {
                  setClients(data)
                } else {
                  // Fallback to simple fetch if RPC fails
                  const { data: c } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
                  if (c) setClients(c)
                }
            } catch (e) {
                console.error('[Clients Polling] Error:', e)
            } finally {
                setTimeout(() => setIsRefreshing(false), 1000)
            }
        }
        const interval = setInterval(poll, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    function formatCustomerValue(value: string, field: 'full_name' | 'phone' | 'address' = 'full_name'): string {
      if (!value) return ''
      if (typeof value !== 'string') return String(value)
      
      if (value.startsWith('db:')) {
        try {
          const jsonStr = value.substring(3)
          const data = JSON.parse(jsonStr)
          return data[field] || data.full_name || data.phone || data.address || value
        } catch (e) {
          return value
        }
      }
      return value
    }

    const filtered = clients.filter(c => {
        const name = formatCustomerValue(c.customer_name || c.full_name, 'full_name')
        const phone = formatCustomerValue(c.customer_phone || c.phone, 'phone')
        return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search)
    })

    async function deleteClient(id: string | null) {
        if (!id) {
            toast.error(lang === 'kk' ? 'Бұл клиентті өшіру мүмкін емес' : 'Невозможно удалить этого клиента')
            return
        }

        if (!confirm(lang === 'kk' ? 'Өшіруді растайсыз ба?' : 'Вы уверены, что хотите удалить?')) return

        try {
            const { error } = await supabase.from('clients').delete().eq('id', id)
            if (!error) {
                setClients(prev => prev.filter(c => c.id !== id))
                setSelectedClient(null)
                toast.success(lang === 'kk' ? 'Сәтті жойылды' : 'Успешно удалено')
            } else {
                toast.error(t(lang, 'error'))
            }
        } catch (err) {
            toast.error(t(lang, 'error'))
        }
    }

    return (
        <div className="flex flex-col min-h-full bg-slate-50/50 dark:bg-slate-950/20">
            {/* Premium Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-30 backdrop-blur-md bg-card/90"
            >
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90 shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl font-black text-foreground uppercase tracking-tighter italic">{lang === 'kk' ? 'Клиенттер' : 'Клиенты'}</h1>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                            <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
                            SYNCED
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{clients.length} {lang === 'kk' ? 'пайдаланушы' : 'пользователей'}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={lang === 'kk' ? 'Аты немесе телефоны бойынша іздеу...' : 'Поиск по имени или телефону...'}
                        className="w-full bg-secondary/50 border-2 border-transparent focus:border-primary/20 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/40"
                    />
                </div>
            </motion.div>

            <div className="flex-1 p-4">
                <motion.div 
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.length === 0 ? (
                            <p className="col-span-full text-center text-muted-foreground text-sm py-20 font-medium">{t(lang, 'noData')}</p>
                        ) : (
                            filtered.map((c, idx) => (
                                <motion.div
                                    key={c.id || c.customer_phone}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.3) }}
                                    onClick={() => setSelectedClient(c)}
                                    className="group bg-card rounded-[2rem] border-2 border-transparent hover:border-primary/20 p-5 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-black text-foreground truncate uppercase tracking-tighter italic">
                                              {formatCustomerValue(c.customer_name || c.full_name, 'full_name')}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Phone className="w-3 h-3 text-muted-foreground" />
                                                <p className="text-[11px] font-bold text-muted-foreground">{formatCustomerValue(c.customer_phone || c.phone, 'phone')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{lang === 'kk' ? 'Тапсырыстар' : 'Заказы'}</span>
                                            <span className="text-sm font-black text-primary">{c.total_orders || 0}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{lang === 'kk' ? 'Бонустар' : 'Бонусы'}</span>
                                            <span className="text-sm font-black text-amber-500">{(c.loyalty_points || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {c.total_spent > 0 && (
                                      <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp className="w-10 h-10" />
                                      </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Client Detail Modal */}
            <AnimatePresence>
                {selectedClient && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedClient(null)}
                          className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-md bg-card rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-8 max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">Клиент профилі</h2>
                                <button onClick={() => setSelectedClient(null)} className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center gap-3">
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner">
                                    <User className="w-12 h-12 text-primary" />
                                </div>
                                <div>
                                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">{formatCustomerValue(selectedClient.customer_name || selectedClient.full_name, 'full_name')}</h3>
                                  <p className="text-sm font-bold text-muted-foreground mt-1">{formatCustomerValue(selectedClient.customer_phone || selectedClient.phone, 'phone')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-secondary/30 rounded-3xl p-5 border border-border/50">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                      <ShoppingBag className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Заказы</span>
                                    </div>
                                    <p className="text-2xl font-black text-foreground tracking-tighter">{selectedClient.total_orders || 0}</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-900/50">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-600">
                                      <TrendingUp className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Сумма</span>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-600 tracking-tighter">{(selectedClient.total_spent || 0).toLocaleString()} <span className="text-xs opacity-60">₸</span></p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-3xl p-5 border border-amber-100 dark:border-amber-900/50 col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2 text-amber-600">
                                        <Wallet className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Бонус балансы</span>
                                      </div>
                                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    </div>
                                    <p className="text-3xl font-black text-amber-600 tracking-tighter">{(selectedClient.loyalty_points || 0).toLocaleString()} <span className="text-sm opacity-60">₸</span></p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 bg-secondary/20 p-5 rounded-[2rem] border border-border/50">
                                    <MapPin className="w-5 h-5 text-primary mt-1 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Соңғы мекенжай</p>
                                        <p className="text-sm font-bold text-foreground mt-1 leading-relaxed">{formatCustomerValue(selectedClient.last_address || selectedClient.address, 'address') || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => deleteClient(selectedClient.id)}
                                className="w-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 rounded-[2rem] py-5 text-xs font-black uppercase tracking-[0.2em] shadow-sm hover:bg-rose-500 hover:text-white transition-all active:scale-[0.98]"
                            >
                                <Trash2 className="w-4 h-4 inline-block mr-2" /> Клиентті жою
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
