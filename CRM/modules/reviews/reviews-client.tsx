'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Star, Send, User, Reply, X, Check } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { Review, Restaurant } from '@/lib/db'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Props {
    initialReviews: Review[]
    restaurant: Restaurant | null
}

export default function ReviewsClient({ initialReviews, restaurant }: Props) {
    const { lang } = useApp()
    const [reviews, setReviews] = useState<Review[]>(initialReviews)
    const [replyingTo, setReplyingTo] = useState<Review | null>(null)
    const [replyText, setReplyText] = useState('')

    const supabase = createClient()

    useEffect(() => {
        if (!restaurant?.id) return

        const channel = supabase
            .channel(`reviews-realtime-${restaurant.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'reviews',
                filter: `cafe_id=eq.${restaurant.id}`
            }, (payload) => {
                console.log('[Reviews] New review detected:', payload.new.id)
                setReviews((prev) => [payload.new as Review, ...prev])
                toast.success(lang === 'kk' ? 'Жаңа пікір!' : 'Новый отзыв!')
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurant?.id])

    async function sendReply() {
        if (!replyingTo || !replyText.trim()) return
        const now = new Date().toISOString()
        const { error } = await supabase
            .from('reviews')
            .update({
                reply: replyText,
                replied_at: now,
            })
            .eq('id', replyingTo.id)

        if (!error) {
            setReviews((prev) =>
                prev.map((r) =>
                    r.id === replyingTo.id ? { ...r, reply: replyText, replied_at: now } : r
                )
            )
            setReplyingTo(null)
            setReplyText('')
            toast.success(t(lang, 'save'))
        } else {
            toast.error(t(lang, 'error'))
        }
    }

    function getTimeAgo(dateStr: string) {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ru })
        } catch {
            return ''
        }
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="bg-card px-4 pt-4 md:pt-12 pb-3 border-b border-border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/management" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground flex-1">{t(lang, 'reviews')}</h1>
                </div>
            </div>

            <div className="flex-1 px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-10">{t(lang, 'noData')}</p>
                ) : (
                    reviews.map((r) => (
                        <div key={r.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {r.customer_avatar ? (
                                            <img src={r.customer_avatar} alt={r.customer_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground leading-none">{r.customer_name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">{getTimeAgo(r.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-lg items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{r.rating}</span>
                                </div>
                            </div>

                            <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>

                            {r.reply ? (
                                <div className="bg-secondary/50 rounded-xl p-3 border-l-4 border-primary/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Reply className="w-3 h-3 text-primary rotate-180" />
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-tight">Ваш ответ</span>
                                    </div>
                                    <p className="text-sm text-foreground/80 italic">"{r.reply}"</p>
                                    <button
                                        onClick={() => {
                                            setReplyingTo(r)
                                            setReplyText(r.reply)
                                        }}
                                        className="text-[10px] text-primary font-medium mt-2"
                                    >
                                        {t(lang, 'edit')}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setReplyingTo(r)}
                                    className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-xl active:scale-95 transition-all"
                                >
                                    <Reply className="w-3.5 h-3.5" />
                                    {t(lang, 'reply')}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Reply Modal */}
            {replyingTo && (
                <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setReplyingTo(null)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md bg-card rounded-t-3xl p-5 space-y-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">
                                {replyingTo.reply ? t(lang, 'edit') : t(lang, 'reply')}
                            </h2>
                            <button onClick={() => setReplyingTo(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-secondary/30 rounded-xl p-3 mb-2">
                            <p className="text-xs text-muted-foreground mb-1 font-medium">{replyingTo.customer_name}</p>
                            <p className="text-sm text-foreground line-clamp-2 italic">"{replyingTo.comment}"</p>
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block font-medium">{t(lang, 'replyPlaceholder')}</label>
                            <textarea
                                autoFocus
                                rows={4}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={t(lang, 'replyPlaceholder')}
                                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm text-foreground outline-none border border-transparent focus:border-primary/50 resize-none shadow-inner"
                            />
                        </div>

                        <button
                            onClick={sendReply}
                            disabled={!replyText.trim()}
                            className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg"
                        >
                            <Send className="w-4 h-4" /> {t(lang, 'send')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
