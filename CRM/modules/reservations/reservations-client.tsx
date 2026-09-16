'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/app-context'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, Users, Phone, CheckCircle, XCircle, Loader2, RefreshCw, User, Utensils, Hash, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getBulkPII } from '@/lib/vps'

const STATUS_TABS = ['all', 'pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed'] as const
type StatusTab = typeof STATUS_TABS[number]

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200',
    awaiting_payment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
}

const statusLabels: Record<string, Record<string, string>> = {
    kk: {
        all: 'Барлығы',
        pending: 'Күтуде',
        awaiting_payment: 'Төлем күтуде',
        confirmed: 'Расталған',
        cancelled: 'Бас тартылған',
        completed: 'Аяқталған',
    },
    ru: {
        all: 'Все',
        pending: 'Ожидает',
        awaiting_payment: 'Ожидает оплату',
        confirmed: 'Подтверждено',
        cancelled: 'Отменено',
        completed: 'Завершено',
    }
}

const parseCustomerInfo = (reservation: any) => {
  let name = reservation.customer_name || '';
  let phone = reservation.customer_phone || '';

  const parseDbString = (str: string) => {
    if (!str) return;
    const s = String(str);
    if (s.toLowerCase().startsWith('db:{') || s.startsWith('{')) {
      try {
        const jsonStr = s.replace(/^db:/i, '');
        const parsed = JSON.parse(jsonStr);
        if (parsed.full_name) name = parsed.full_name;
        if (parsed.FULL_NAME) name = parsed.FULL_NAME;
        if (parsed.phone) phone = parsed.phone;
        if (parsed.PHONE) phone = parsed.PHONE;
      } catch (e) {}
    }
  };

  parseDbString(reservation.customer_name);
  parseDbString(reservation.customer_phone);

  if (name && (name.toLowerCase().startsWith('db:') || name.startsWith('{'))) name = '';
  if (phone && (phone.toLowerCase().startsWith('db:') || phone.startsWith('{'))) phone = '';

  if (!name) name = 'Customer';
  if (!phone) phone = '—';

  return { name, phone };
};

interface ReservationsClientProps {
    restaurantId: string
}

export default function ReservationsClient({ restaurantId }: ReservationsClientProps) {
    const { lang } = useApp()
    const supabase = createClient()
    const [reservations, setReservations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<StatusTab>('all')
    const [refreshing, setRefreshing] = useState(false)

    const labels = statusLabels[lang] || statusLabels.ru

    const fetchReservations = useCallback(async () => {
        setRefreshing(true)
        let query = supabase
            .from('reservations')
            .select('*, reservation_items(*)')
            .eq('cafe_id', restaurantId)
            .order('created_at', { ascending: false })

        if (activeTab !== 'all') {
            query = query.eq('status', activeTab)
        }

        const { data, error } = await query
        if (!error && data) {
            // Hydrate PII
            const piiIds = data
                .map(r => r.customer_name)
                .filter(id => id && id.length === 15 && !id.includes(' '))
            
            if (piiIds.length > 0) {
                const profiles = await getBulkPII('profiles', piiIds)
                const profileMap = new Map(profiles.map(p => [p.id, p]))
                
                data.forEach(r => {
                    const p = profileMap.get(r.customer_name)
                    if (p) {
                        r.customer_name = p.full_name
                        r.customer_phone = p.phone
                    }
                })
            }
            setReservations(data)
        }
        setLoading(false)
        setRefreshing(false)
    }, [restaurantId, activeTab])

    useEffect(() => {
        fetchReservations()
        // Realtime subscription
        const channel = supabase
            .channel(`reservations-${restaurantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reservations',
                filter: `cafe_id=eq.${restaurantId}`
            }, () => fetchReservations())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [fetchReservations, restaurantId])

    async function updateStatus(id: string, status: string) {
        const { error } = await supabase
            .from('reservations')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
        if (error) {
            toast.error(lang === 'kk' ? 'Қате туындады' : 'Ошибка при обновлении')
        } else {
            toast.success(lang === 'kk' ? 'Статус жаңартылды' : 'Статус обновлён')
            fetchReservations()
        }
    }

    const filtered = reservations.filter(r =>
        activeTab === 'all' || r.status === activeTab
    )

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {lang === 'kk' ? 'Броньдар' : 'Бронирования'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {lang === 'kk'
                                ? `Жалпы: ${reservations.length} брондау`
                                : `Всего: ${reservations.length} броней`}
                        </p>
                    </div>
                    <button
                        onClick={fetchReservations}
                        className="p-2.5 rounded-xl bg-secondary text-foreground active:scale-95 transition-all"
                    >
                        <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="px-4 py-3 bg-card border-b border-border overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                activeTab === tab
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {labels[tab]}
                            {tab !== 'all' && (
                                <span className="ml-1.5 opacity-70">
                                    {reservations.filter(r => r.status === tab).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Calendar className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-bold text-sm">
                            {lang === 'kk' ? 'Броньдар жоқ' : 'Броней нет'}
                        </p>
                    </div>
                ) : (
                    filtered.map(reservation => (
                        <div
                            key={reservation.id}
                            className="bg-card rounded-2xl border border-border p-4 space-y-3"
                        >
                            {/* Top: Name + Status */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">{parseCustomerInfo(reservation).name}</p>
                                        {parseCustomerInfo(reservation).phone !== '—' && (
                                            <a
                                                href={`tel:${parseCustomerInfo(reservation).phone}`}
                                                className="text-xs text-primary flex items-center gap-1"
                                            >
                                                <Phone className="w-3 h-3" />
                                                {parseCustomerInfo(reservation).phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-3 py-1 rounded-xl text-[10px] font-bold uppercase border shrink-0",
                                    statusColors[reservation.status] || "bg-secondary text-muted-foreground border-border"
                                )}>
                                    {labels[reservation.status] || reservation.status}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-bold">{reservation.date || '—'}</p>
                                </div>
                                <div className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-bold">{reservation.time?.slice(0, 5) || '—'}</p>
                                </div>
                                <div className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-3">
                                    <Users className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-bold">{reservation.guests_count || '—'}</p>
                                </div>
                                <div className="bg-primary/10 rounded-xl p-2.5 flex items-center gap-3 border border-primary/20">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-black text-primary">{(reservation.total_amount || 0).toLocaleString()} ₸</p>
                                </div>
                            </div>

                            {/* Food Items */}
                            {reservation.reservation_items && reservation.reservation_items.length > 0 && (
                                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Utensils className="w-4 h-4 text-primary" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
                                            {lang === 'kk' ? 'Таңдалған тағамдар' : 'Выбранные блюда'}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        {reservation.reservation_items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center text-xs">
                                                <p className="font-bold text-foreground/80">
                                                    <span className="text-primary mr-2">{item.quantity}x</span>
                                                    {lang === 'kk' ? item.name_kk : item.name_ru}
                                                </p>
                                                <p className="font-black text-foreground">{(item.price * item.quantity).toLocaleString()} ₸</p>
                                            </div>
                                        ))}
                                        {reservation.booking_fee > 0 && (
                                            <div className="flex justify-between items-center text-xs pt-2 border-t border-primary/10">
                                                <p className="font-medium text-muted-foreground uppercase tracking-tighter">
                                                    {lang === 'kk' ? 'Брондау ақысы' : 'Сбор за бронь'}
                                                </p>
                                                <p className="font-bold text-primary">{(reservation.booking_fee).toLocaleString()} ₸</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {reservation.notes && (
                                <p className="text-xs text-muted-foreground bg-secondary rounded-xl px-3 py-2">
                                    💬 {reservation.notes}
                                </p>
                            )}

                            {/* Actions */}
                            {reservation.status === 'pending' && (
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => updateStatus(reservation.id, 'confirmed')}
                                        className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {lang === 'kk' ? 'Растау' : 'Подтвердить'}
                                    </button>
                                    <button
                                        onClick={() => updateStatus(reservation.id, 'cancelled')}
                                        className="flex-1 bg-red-500/10 text-red-500 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all border border-red-500/20"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        {lang === 'kk' ? 'Бас тарту' : 'Отклонить'}
                                    </button>
                                </div>
                            )}
                            {reservation.status === 'confirmed' && (
                                <button
                                    onClick={() => updateStatus(reservation.id, 'completed')}
                                    className="w-full bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {lang === 'kk' ? 'Аяқталды' : 'Завершить'}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
