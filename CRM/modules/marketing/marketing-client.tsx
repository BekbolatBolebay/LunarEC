'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, Plus, Pencil, Trash2, X, Check, Ticket, Image as ImageIcon, 
  Search, ShieldCheck, AlertCircle, Gift, Calendar, Hash, Save as SaveIcon, 
  Loader2, RefreshCw, Sparkles 
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { Promotion, Banner, GiftCertificate } from '@/lib/db'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createGiftCertificateAction } from '@/lib/actions'

interface Props {
    initialPromoCodes: Promotion[]
    initialBanners: Banner[]
    initialCertificates: GiftCertificate[]
}

type Tab = 'promo' | 'banners' | 'certificates'
type EditingPromo = Partial<Promotion> & { isNew?: boolean; temp_discount_type?: 'percent' | 'fixed'; temp_discount_value?: number }
type EditingBanner = Partial<Banner> & { isNew?: boolean }
type EditingCertificate = { code: string; initial_amount: number; expiry_date: string }

const EMPTY_PROMO: EditingPromo = {
    promo_code: '',
    temp_discount_type: 'percent',
    temp_discount_value: 0,
    min_order_amount: 0,
    max_uses: null,
    is_active: true,
    isNew: true,
}

const EMPTY_BANNER: EditingBanner = {
    title_kk: '',
    title_ru: '',
    image_url: '',
    link_url: '',
    sort_order: 0,
    is_active: true,
    isNew: true,
}

export default function MarketingClient({ initialPromoCodes, initialBanners, initialCertificates }: Props) {
    const { lang } = useApp()
    const [activeTab, setActiveTab] = useState<Tab>('promo')
    const [promoCodes, setPromoCodes] = useState<Promotion[]>(initialPromoCodes)
    const [banners, setBanners] = useState<Banner[]>(initialBanners)
    const [certificates, setCertificates] = useState<GiftCertificate[]>(initialCertificates)
    const [editingPromo, setEditingPromo] = useState<EditingPromo | null>(null)
    const [editingBanner, setEditingBanner] = useState<EditingBanner | null>(null)
    const [editingCertificate, setEditingCertificate] = useState<EditingCertificate | null>(null)
    const [isSavingCert, setIsSavingCert] = useState(false)
    const [checkerOpen, setCheckerOpen] = useState(false)
    const [checkCode, setCheckCode] = useState('')
    const [checking, setChecking] = useState(false)
    const [checkResult, setCheckResult] = useState<any>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const supabase = createClient()

    // Real-time polling
    useEffect(() => {
        const poll = async () => {
            setIsRefreshing(true)
            try {
                const { data: p } = await supabase.from('promotions').select('*').order('created_at', { ascending: false })
                const { data: b } = await supabase.from('banners').select('*').order('sort_order')
                const { data: c } = await supabase.from('gift_certificates').select('*').order('created_at', { ascending: false })
                if (p) setPromoCodes(p)
                if (b) setBanners(b)
                if (c) setCertificates(c)
            } catch (e) {
                console.error('[Marketing Polling] Error:', e)
            } finally {
                setTimeout(() => setIsRefreshing(false), 1000)
            }
        }
        const interval = setInterval(poll, 20000) // Poll every 20s
        return () => clearInterval(interval)
    }, [])

    async function savePromo() {
        if (!editingPromo) return
        const dType = editingPromo.temp_discount_type || (editingPromo.discount_percentage ? 'percent' : 'fixed')
        const dValue = editingPromo.temp_discount_value || (dType === 'percent' ? editingPromo.discount_percentage : editingPromo.discount_amount) || 0

        const payload = {
            promo_code: editingPromo.promo_code?.toUpperCase() || '',
            code: editingPromo.promo_code?.toUpperCase() || '', // compatibility
            title_kk: `Жеңілдік ${editingPromo.promo_code}`,
            title_ru: `Скидка ${editingPromo.promo_code}`,
            discount_percentage: dType === 'percent' ? Number(dValue) : null,
            discount_amount: dType === 'fixed' ? Number(dValue) : null,
            min_order_amount: Number(editingPromo.min_order_amount) || 0,
            max_uses: editingPromo.max_uses ? Number(editingPromo.max_uses) : null,
            is_active: editingPromo.is_active ?? true,
            valid_until: editingPromo.valid_until || null,
        }

        if (editingPromo.isNew) {
            const { data, error } = await supabase.from('promotions').insert(payload).select('*').single()
            if (error) { console.error(error); toast.error(t(lang, 'error')); return }
            setPromoCodes((prev) => [data, ...prev])
        } else {
            const { error } = await supabase.from('promotions')
                .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingPromo.id!)
            if (error) { console.error(error); toast.error(t(lang, 'error')); return }
            setPromoCodes((prev) => prev.map((p) => p.id === editingPromo.id ? { ...p, ...payload } : p))
        }
        setEditingPromo(null)
        toast.success(t(lang, 'save'))
    }

    async function deletePromo(id: string) {
        if(!confirm('Delete?')) return
        const { error } = await supabase.from('promotions').delete().eq('id', id)
        if (!error) setPromoCodes((prev) => prev.filter((p) => p.id !== id))
        else toast.error(t(lang, 'error'))
    }

    async function saveBanner() {
        if (!editingBanner) return
        const payload = {
            title_kk: editingBanner.title_kk || '',
            title_ru: editingBanner.title_ru || '',
            image_url: editingBanner.image_url || '',
            link_url: editingBanner.link_url || '',
            sort_order: Number(editingBanner.sort_order) || 0,
            is_active: editingBanner.is_active ?? true,
        }

        if (editingBanner.isNew) {
            const { data, error } = await supabase.from('banners').insert(payload).select('*').single()
            if (error) { toast.error(t(lang, 'error')); return }
            setBanners((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
        } else {
            const { error } = await supabase.from('banners')
                .update({ ...payload }).eq('id', editingBanner.id!)
            if (error) { toast.error(t(lang, 'error')); return }
            setBanners((prev) => prev.map((b) => b.id === editingBanner.id ? { ...b, ...payload } : b).sort((a, b) => a.sort_order - b.sort_order))
        }
        setEditingBanner(null)
        toast.success(t(lang, 'save'))
    }

    async function deleteBanner(id: string) {
        if(!confirm('Delete?')) return
        const { error } = await supabase.from('banners').delete().eq('id', id)
        if (!error) setBanners((prev) => prev.filter((b) => b.id !== id))
        else toast.error(t(lang, 'error'))
    }

    async function saveCertificate() {
        if (!editingCertificate) return
        if (!editingCertificate.code || !editingCertificate.initial_amount) {
            toast.error(lang === 'kk' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля')
            return
        }

        setIsSavingCert(true)
        try {
            const { data, error } = await createGiftCertificateAction({
                code: editingCertificate.code,
                initial_amount: Number(editingCertificate.initial_amount),
                expiry_date: editingCertificate.expiry_date || null
            })
            if (error) throw error
            setCertificates((prev) => [data, ...prev])
            setEditingCertificate(null)
            toast.success(t(lang, 'save'))
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSavingCert(false)
        }
    }

    async function checkCertificate() {
        if (!checkCode) return
        setChecking(true)
        setCheckResult(null)
        try {
            const { data, error } = await supabase
                .from('gift_certificates')
                .select('*')
                .eq('code', checkCode.trim())
                .single()
            
            if (error) {
                setCheckResult({ error: true })
            } else {
                setCheckResult(data)
            }
        } catch (e) {
            setCheckResult({ error: true })
        } finally {
            setChecking(false)
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
                          <h1 className="text-xl font-black text-foreground uppercase tracking-tighter italic">{t(lang, 'marketing')}</h1>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                            <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
                            SYNCED
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{lang === 'kk' ? 'Акциялар мен бонустар' : 'Акции и бонусы'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCheckerOpen(true)}
                            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90"
                            title={lang === 'kk' ? 'Тексеру' : 'Проверить'}
                        >
                            <Search className="w-5 h-5 text-primary" />
                        </button>
                        <button
                            onClick={() => {
                                if (activeTab === 'promo') setEditingPromo(EMPTY_PROMO)
                                else if (activeTab === 'banners') setEditingBanner(EMPTY_BANNER)
                                else setEditingCertificate({ code: 'GIFT-' + Math.random().toString(36).substring(2, 8).toUpperCase(), initial_amount: 5000, expiry_date: '' })
                            }}
                            className="h-10 px-4 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">{lang === 'kk' ? 'Қосу' : 'Добавить'}</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-secondary p-1.5 rounded-2xl border border-border/50">
                    <button
                        onClick={() => setActiveTab('promo')}
                        className={cn(
                            'flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all',
                            activeTab === 'promo' ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {t(lang, 'promoCodes')}
                    </button>
                    <button
                        onClick={() => setActiveTab('banners')}
                        className={cn(
                            'flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all',
                            activeTab === 'banners' ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {t(lang, 'banners')}
                    </button>
                    <button
                        onClick={() => setActiveTab('certificates')}
                        className={cn(
                            'flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all',
                            activeTab === 'certificates' ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {lang === 'kk' ? 'Сертификаттар' : 'Сертификаты'}
                    </button>
                </div>
            </motion.div>

            <div className="flex-1 px-4 py-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'promo' && (
                        <motion.div 
                          key="promo"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {promoCodes.length === 0 ? (
                                <p className="col-span-full text-center text-muted-foreground text-sm py-20 font-medium">{t(lang, 'noData')}</p>
                            ) : (
                                promoCodes.map((p, idx) => (
                                    <motion.div 
                                      key={p.id}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="group bg-card rounded-3xl border-2 border-transparent hover:border-primary/20 p-5 flex items-center gap-4 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-14 h-14 rounded-2xl bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform">
                                            <Ticket className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1 min-w-0 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <p className="text-base font-black text-foreground tracking-tighter uppercase italic">{p.promo_code}</p>
                                                {!p.is_active && (
                                                    <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter">
                                                        {t(lang, 'inactive')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground font-bold mt-1">
                                                {p.discount_percentage ? (
                                                  <span className="text-pink-600 font-black">-{p.discount_percentage}%</span>
                                                ) : (
                                                  <span className="text-pink-600 font-black">-{p.discount_amount} ₸</span>
                                                )}
                                                {p.min_order_amount > 0 && <span className="opacity-40 mx-2">•</span>}
                                                {p.min_order_amount > 0 && <span className="text-[10px] uppercase tracking-tighter italic">Min {p.min_order_amount} ₸</span>}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 relative z-10">
                                            <button onClick={() => setEditingPromo({ ...p, isNew: false })} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                                                <Pencil className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            <button onClick={() => deletePromo(p.id)} className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                <Trash2 className="w-4 h-4 text-rose-500" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'banners' && (
                        <motion.div 
                          key="banners"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {banners.length === 0 ? (
                                <p className="col-span-full text-center text-muted-foreground text-sm py-20 font-medium">{t(lang, 'noData')}</p>
                            ) : (
                                banners.map((b, idx) => (
                                    <motion.div 
                                      key={b.id}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="group bg-card rounded-[2.5rem] border-2 border-transparent hover:border-primary/20 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all"
                                    >
                                        <div className="aspect-[21/9] bg-secondary relative">
                                            {b.image_url ? (
                                                <img src={b.image_url} alt={b.title_ru} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                            {!b.is_active && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                                    <span className="bg-white/90 dark:bg-black/90 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                        {t(lang, 'inactive')}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute bottom-4 left-5 right-5">
                                              <p className="text-white font-black uppercase tracking-tighter text-sm truncate drop-shadow-md">
                                                {lang === 'kk' ? b.title_kk : b.title_ru}
                                              </p>
                                            </div>
                                        </div>
                                        <div className="p-4 flex items-center justify-between gap-4 bg-card">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">{b.link_url || t(lang, 'noLimit')}</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button onClick={() => setEditingBanner({ ...b, isNew: false })} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                                <button onClick={() => deleteBanner(b.id)} className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'certificates' && (
                        <motion.div 
                          key="certs"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {certificates.length === 0 ? (
                                <div className="md:col-span-2 text-center py-20 bg-muted/10 rounded-[3rem] border-2 border-dashed border-muted/30">
                                    <Gift className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                                        {lang === 'kk' ? 'Сатылған сертификаттар жоқ' : 'Проданных сертификатов пока нет'}
                                    </p>
                                </div>
                            ) : (
                                certificates.map((cert, idx) => (
                                    <motion.div 
                                      key={cert.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="group bg-card border-2 border-transparent hover:border-primary/20 rounded-[2.5rem] p-6 space-y-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner group-hover:rotate-12 transition-transform">
                                                    <Gift className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black font-mono tracking-tighter text-foreground italic uppercase">{cert.code}</p>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
                                                        {new Date(cert.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                cert.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : (cert.status === 'fully_used' ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-rose-50 text-rose-600 border border-rose-100")
                                            )}>
                                                {cert.status === 'active' ? (lang === 'kk' ? 'Белсенді' : 'Активен') : (cert.status === 'fully_used' ? (lang === 'kk' ? 'Қолданылды' : 'Использован') : (lang === 'kk' ? 'Мерзімі бітті' : 'Истек'))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50 relative z-10">
                                            <div className="bg-secondary/30 p-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">{lang === 'kk' ? 'Бастапқы' : 'Сумма'}</p>
                                                <p className="text-xl font-black text-foreground tracking-tighter">{Number(cert.initial_amount).toLocaleString()} <span className="text-xs opacity-50">₸</span></p>
                                            </div>
                                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 opacity-80">{lang === 'kk' ? 'Қалдық' : 'Остаток'}</p>
                                                <p className="text-xl font-black text-primary tracking-tighter">{Number(cert.current_balance).toLocaleString()} <span className="text-xs opacity-50">₸</span></p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal Components (Styled similarly with AnimatePresence) */}
            <AnimatePresence>
              {(editingPromo || editingBanner || editingCertificate || checkerOpen) && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => { setEditingPromo(null); setEditingBanner(null); setEditingCertificate(null); setCheckerOpen(false); }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                    />
                    
                    {/* Promo Edit Modal */}
                    {editingPromo && (
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            className="relative w-full max-w-md bg-card rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">
                                    {editingPromo.isNew ? (lang === 'kk' ? 'Жаңа промокод' : 'Новый промокод') : t(lang, 'edit')}
                                </h2>
                                <button onClick={() => setEditingPromo(null)} className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">КОД</label>
                                    <input
                                        value={editingPromo.promo_code || ''}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, promo_code: e.target.value.toUpperCase() })}
                                        placeholder="SALE2024"
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-lg font-black text-foreground outline-none border-2 border-transparent focus:border-primary/30 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">{lang === 'kk' ? 'Түрі' : 'Тип'}</label>
                                        <select
                                            value={editingPromo.temp_discount_type || 'percent'}
                                            onChange={(e) => setEditingPromo({ ...editingPromo, temp_discount_type: e.target.value as any })}
                                            className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30 appearance-none"
                                        >
                                            <option value="percent">Пайыз (%)</option>
                                            <option value="fixed">Сомма (₸)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">{lang === 'kk' ? 'Мөлшері' : 'Скидка'}</label>
                                        <input
                                            type="number"
                                            value={editingPromo.temp_discount_value || ''}
                                            onChange={(e) => setEditingPromo({ ...editingPromo, temp_discount_value: Number(e.target.value) })}
                                            className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-lg font-black text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">{t(lang, 'minOrder')} (₸)</label>
                                    <input
                                        type="number"
                                        value={editingPromo.min_order_amount || ''}
                                        onChange={(e) => setEditingPromo({ ...editingPromo, min_order_amount: Number(e.target.value) })}
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-secondary/50 rounded-2xl px-5 py-4 border-2 border-transparent">
                                    <span className="text-sm font-black uppercase tracking-widest text-foreground">{t(lang, 'active')}</span>
                                    <button
                                        onClick={() => setEditingPromo({ ...editingPromo, is_active: !editingPromo.is_active })}
                                        className={cn('w-12 h-6 rounded-full transition-all relative', editingPromo.is_active ? 'bg-primary' : 'bg-muted')}
                                    >
                                        <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md', editingPromo.is_active ? 'right-1' : 'left-1')} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={savePromo}
                                className="w-full bg-primary text-primary-foreground rounded-[2rem] py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" /> {t(lang, 'save')}
                            </button>
                        </motion.div>
                    )}

                    {/* Banner Edit Modal */}
                    {editingBanner && (
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            className="relative w-full max-w-md bg-card rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">
                                    {editingBanner.isNew ? (lang === 'kk' ? 'Жаңа баннер' : 'Новый баннер') : t(lang, 'edit')}
                                </h2>
                                <button onClick={() => setEditingBanner(null)} className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">{t(lang, 'name')} (RU)</label>
                                    <input
                                        value={editingBanner.title_ru || ''}
                                        onChange={(e) => setEditingBanner({ ...editingBanner, title_ru: e.target.value })}
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">{t(lang, 'name')} (KK)</label>
                                    <input
                                        value={editingBanner.title_kk || ''}
                                        onChange={(e) => setEditingBanner({ ...editingBanner, title_kk: e.target.value })}
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">IMAGE URL</label>
                                    <input
                                        value={editingBanner.image_url || ''}
                                        onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-sm font-medium text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">LINK (HREF)</label>
                                    <input
                                        value={editingBanner.link_url || ''}
                                        onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                                        placeholder="/menu?cat=..."
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-sm font-medium text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={saveBanner}
                                className="w-full bg-primary text-primary-foreground rounded-[2rem] py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" /> {t(lang, 'save')}
                            </button>
                        </motion.div>
                    )}

                    {/* Certificate Create Modal */}
                    {editingCertificate && (
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            className="relative w-full max-w-md bg-card rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">
                                    {lang === 'kk' ? 'Жаңа сертификат' : 'Новый сертификат'}
                                </h2>
                                <button onClick={() => setEditingCertificate(null)} className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-2">
                                        <Hash className="w-3 h-3" /> {lang === 'kk' ? 'Код' : 'Код'}
                                    </label>
                                    <input
                                        value={editingCertificate.code}
                                        onChange={(e) => setEditingCertificate({ ...editingCertificate, code: e.target.value.toUpperCase() })}
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-lg font-black text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                        placeholder="GIFT-XXXX"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-2">
                                        <Ticket className="w-3 h-3" /> {lang === 'kk' ? 'Сомма (₸)' : 'Сумма (₸)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={editingCertificate.initial_amount || ''}
                                        onChange={(e) => setEditingCertificate({ ...editingCertificate, initial_amount: Number(e.target.value) })}
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-xl font-black text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> {lang === 'kk' ? 'Мерзімі' : 'Срок'}
                                    </label>
                                    <input
                                        type="date"
                                        value={editingCertificate.expiry_date}
                                        onChange={(e) => setEditingCertificate({ ...editingCertificate, expiry_date: e.target.value })}
                                        className="w-full bg-secondary/50 rounded-2xl px-5 py-4 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={saveCertificate}
                                disabled={isSavingCert}
                                className="w-full bg-primary text-primary-foreground rounded-[2rem] py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSavingCert ? <Loader2 className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                                {t(lang, 'save')}
                            </button>
                        </motion.div>
                    )}

                    {/* Certificate Checker Modal */}
                    {checkerOpen && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-card rounded-[3rem] p-10 space-y-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center space-y-2">
                                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-4">
                                  <ShieldCheck className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                                    {lang === 'kk' ? 'Тексеру' : 'Проверка'}
                                </h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                    {lang === 'kk' ? 'Сертификат кодын енгізіңіз' : 'Введите код сертификата'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    value={checkCode}
                                    onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                                    placeholder="GIFT-XXXX"
                                    className="w-full bg-secondary border-none rounded-2xl px-6 py-5 text-2xl font-black text-center outline-none ring-4 ring-transparent focus:ring-primary/10 transition-all placeholder:text-muted-foreground/10 italic"
                                    autoFocus
                                />

                                <button
                                    onClick={checkCertificate}
                                    disabled={checking || !checkCode}
                                    className="w-full bg-primary text-primary-foreground rounded-2xl py-5 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {checking ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (lang === 'kk' ? 'Тексеру' : 'Проверить')}
                                </button>
                            </div>

                            {checkResult && !checkResult.error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-primary/20 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{lang === 'kk' ? 'Статус' : 'Статус'}</span>
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                            checkResult.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                        )}>
                                            {checkResult.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{lang === 'kk' ? 'Қалдық' : 'Остаток'}</span>
                                        <span className="text-2xl font-black text-primary tracking-tighter">{checkResult.current_balance} ₸</span>
                                    </div>
                                    {checkResult.expiry_date && (
                                        <div className="flex items-center justify-between pt-3 border-t border-border">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{lang === 'kk' ? 'Мерзімі' : 'Срок'}</span>
                                            <span className="text-xs font-bold">{new Date(checkResult.expiry_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                            
                            {checkResult?.error && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-6 bg-rose-50 dark:bg-rose-950/20 rounded-3xl border-2 border-rose-500/20 text-center"
                                >
                                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                                    <p className="text-sm font-black text-rose-500 uppercase tracking-widest">{lang === 'kk' ? 'Табылмады!' : 'Не найден!'}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </div>
              )}
            </AnimatePresence>
        </div>
    )
}
