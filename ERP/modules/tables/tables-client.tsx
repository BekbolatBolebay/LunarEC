'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import { t, translations } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { Reservation } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Calendar, Clock, Users, Phone, ChefHat, CheckCircle, XCircle, Loader2, ShoppingCart, QrCode, Download, Printer, Sparkles, Palette, Image as ImageIcon, Sliders, Check } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { addTable, updateTable, deleteTable } from '@/lib/actions'
import type { RestaurantTable } from '@/lib/db'
import { QRCodeCanvas } from 'qrcode.react'

const STATUS_TABS = ['all', 'pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed'] as const
const MAIN_TABS = ['reservations', 'tables'] as const

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    awaiting_payment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
}

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
}

const statusLabels: Record<string, keyof typeof translations.ru> = {
    pending: 'statusNew',
    awaiting_payment: 'statusAwaitingPayment',
    confirmed: 'statusAccepted',
    cancelled: 'statusCancelled',
    completed: 'statusCompleted',
    all: 'all',
}

async function updateReservationStatus(id: string, status: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id)
    return { error }
}

async function updateReservationPaymentStatus(id: string, payment_status: string, payment_url?: string) {
    const supabase = createClient()
    const update: any = { payment_status }
    if (payment_url) {
        update.payment_url = payment_url
        update.status = 'awaiting_payment'
    }
    const { error } = await supabase
        .from('reservations')
        .update(update)
        .eq('id', id)
    return { error }
}

export default function TablesClient({ initialTables, restaurantId, clientUrl }: { initialTables: RestaurantTable[], restaurantId: string, clientUrl: string }) {
    const { lang } = useApp()
    const [tables, setTables] = useState<RestaurantTable[]>(initialTables)
    const [showAddTable, setShowAddTable] = useState(false)
    const [newTable, setNewTable] = useState({ table_number: '', capacity: 4 })
    const [selectedQRTable, setSelectedQRTable] = useState<RestaurantTable | null>(null)

    // Interactive QR Styling states
    const [qrColor, setQrColor] = useState('#0f172a') // Slate-900 default
    const [includeLogo, setIncludeLogo] = useState(true)
    const [cardTheme, setCardTheme] = useState('classic') // 'classic', 'gold', 'emerald', 'neon'

    const colorPresets = [
        { label: 'Slate', value: '#0f172a', bg: 'bg-slate-900' },
        { label: 'Indigo', value: '#312e81', bg: 'bg-indigo-900' },
        { label: 'Emerald', value: '#064e3b', bg: 'bg-emerald-900' },
        { label: 'Burgundy', value: '#4c0519', bg: 'bg-rose-950' },
        { label: 'Bronze', value: '#451a03', bg: 'bg-amber-950' }
    ]

    const themes = [
        { id: 'classic', kk: 'Классикалық', ru: 'Классика', style: 'border-slate-300 bg-stone-50 text-slate-900' },
        { id: 'gold', kk: 'Премиум Алтын', ru: 'Премиум Золото', style: 'border-amber-600 bg-zinc-950 text-amber-400' },
        { id: 'emerald', kk: 'Изумруд', ru: 'Изумруд', style: 'border-emerald-500 bg-emerald-950 text-emerald-300' },
        { id: 'neon', kk: 'Неон', ru: 'Неон', style: 'border-pink-500 bg-purple-950 text-pink-300' }
    ]

    async function handleAddTable() {
        if (!newTable.table_number) return
        const { error, data } = await addTable(newTable, restaurantId)
        if (error) toast.error(t(lang, 'updateError'))
        else {
            setTables(prev => [...prev, data])
            setShowAddTable(false)
            setNewTable({ table_number: '', capacity: 4 })
            toast.success(t(lang, 'tableAdded'))
        }
    }

    async function handleDelete(id: string) {
        if (!confirm(t(lang, 'confirmDelete' as any))) return
        const { error } = await deleteTable(id)
        if (error) toast.error(t(lang, 'error'))
        else {
            setTables(prev => prev.filter(t => t.id !== id))
            toast.success(t(lang, 'deleted' as any))
        }
    }

    // Canvas drawing routine for exporting 800x1200px premium card PNGs
    const drawTabletopCard = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        tableNumber: string,
        qrImage: HTMLImageElement
    ) => {
        if (cardTheme === 'classic') {
            // Background
            ctx.fillStyle = '#fafaf9'
            ctx.fillRect(0, 0, width, height)

            // Inner border
            ctx.strokeStyle = '#0f172a'
            ctx.lineWidth = 4
            ctx.strokeRect(40, 40, width - 80, height - 80)
            ctx.lineWidth = 1.5
            ctx.strokeRect(50, 50, width - 100, height - 100)

            // Brand Header
            ctx.textAlign = 'center'
            ctx.fillStyle = '#0f172a'
            ctx.font = 'italic 900 48px sans-serif'
            ctx.fillText('MAZIR MENU', width / 2, 160)

            // Divider Line
            ctx.beginPath()
            ctx.moveTo(width / 2 - 120, 195)
            ctx.lineTo(width / 2 + 120, 195)
            ctx.strokeStyle = '#0f172a'
            ctx.lineWidth = 2
            ctx.stroke()

            // Subtitle instructions
            ctx.fillStyle = '#475569'
            ctx.font = '800 22px sans-serif'
            ctx.fillText(lang === 'kk' ? 'МӘЗІРДІ КӨРУ ҮШІН СКАНИРЛЕҢІЗ' : 'СКАНИРУЙТЕ ДЛЯ ПРОСМОТРА МЕНЮ', width / 2, 260)

            // Draw QR Box
            const qrSize = 360
            const qrX = (width - qrSize) / 2
            const qrY = 360

            ctx.shadowColor = 'rgba(0,0,0,0.08)'
            ctx.shadowBlur = 35
            ctx.shadowOffsetY = 15
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 40)
            ctx.fill()
            ctx.shadowBlur = 0 // reset shadow
            ctx.shadowOffsetY = 0

            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

            // Footer / Table Info
            ctx.fillStyle = '#64748b'
            ctx.font = '900 24px sans-serif'
            ctx.fillText(lang === 'kk' ? 'ҮСТЕЛ' : 'СТОЛ', width / 2, 910)

            ctx.fillStyle = '#0f172a'
            ctx.font = '900 130px sans-serif'
            ctx.fillText(`№${tableNumber}`, width / 2, 1040)

            ctx.fillStyle = '#94a3b8'
            ctx.font = '600 16px sans-serif'
            ctx.fillText('mazirapp.kz', width / 2, 1140)

        } else if (cardTheme === 'gold') {
            // Dark Gold style background gradient
            const grad = ctx.createLinearGradient(0, 0, 0, height)
            grad.addColorStop(0, '#09090b')
            grad.addColorStop(0.5, '#18181b')
            grad.addColorStop(1, '#020617')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, width, height)

            // Gold Frame
            ctx.strokeStyle = '#d97706'
            ctx.lineWidth = 5
            ctx.strokeRect(40, 40, width - 80, height - 80)
            ctx.strokeStyle = '#fef08a'
            ctx.lineWidth = 1.5
            ctx.strokeRect(50, 50, width - 100, height - 100)

            // Header Text
            ctx.textAlign = 'center'
            ctx.fillStyle = '#fef08a'
            ctx.font = 'italic 900 48px sans-serif'
            ctx.fillText('MAZIR MENU', width / 2, 160)

            ctx.fillStyle = '#d97706'
            ctx.font = 'bold 24px sans-serif'
            ctx.fillText('✦ ✦ ✦ PREMIUM ✦ ✦ ✦', width / 2, 205)

            // Subtitle
            ctx.fillStyle = '#d4d4d8'
            ctx.font = '800 22px sans-serif'
            ctx.fillText(lang === 'kk' ? 'МӘЗІРДІ КӨРУ ҮШІН СКАНИРЛЕҢІЗ' : 'СКАНИРУЙТЕ ДЛЯ ПРОСМОТРА МЕНЮ', width / 2, 260)

            // Draw QR Code
            const qrSize = 360
            const qrX = (width - qrSize) / 2
            const qrY = 360

            ctx.shadowColor = 'rgba(217, 119, 6, 0.25)'
            ctx.shadowBlur = 40
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 40)
            ctx.fill()
            ctx.shadowBlur = 0 // reset shadow

            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

            // Footer
            ctx.fillStyle = '#a1a1aa'
            ctx.font = '900 24px sans-serif'
            ctx.fillText(lang === 'kk' ? 'ҮСТЕЛ' : 'СТОЛ', width / 2, 910)

            ctx.fillStyle = '#fef08a'
            ctx.font = '900 130px sans-serif'
            ctx.fillText(`№${tableNumber}`, width / 2, 1040)

            ctx.fillStyle = '#71717a'
            ctx.font = '600 16px sans-serif'
            ctx.fillText('mazirapp.kz', width / 2, 1140)

        } else if (cardTheme === 'emerald') {
            // Emerald Botanical style gradient
            const grad = ctx.createLinearGradient(0, 0, 0, height)
            grad.addColorStop(0, '#022c22')
            grad.addColorStop(1, '#064e3b')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, width, height)

            // Frame
            ctx.strokeStyle = '#a7f3d0'
            ctx.lineWidth = 4
            ctx.strokeRect(40, 40, width - 80, height - 80)

            // Header Text
            ctx.textAlign = 'center'
            ctx.fillStyle = '#f0fdf4'
            ctx.font = 'italic 900 48px sans-serif'
            ctx.fillText('MAZIR MENU', width / 2, 160)

            ctx.fillStyle = '#fbbf24'
            ctx.font = 'bold 20px sans-serif'
            ctx.fillText('🌿 BOTANICAL GOURMET 🌿', width / 2, 205)

            // Subtitle
            ctx.fillStyle = '#a7f3d0'
            ctx.font = '800 22px sans-serif'
            ctx.fillText(lang === 'kk' ? 'МӘЗІРДІ КӨРУ ҮШІН СКАНИРЛЕҢІЗ' : 'СКАНИРУЙТЕ ДЛЯ ПРОСМОТРА МЕНЮ', width / 2, 260)

            // Draw QR Code
            const qrSize = 360
            const qrX = (width - qrSize) / 2
            const qrY = 360

            ctx.shadowColor = 'rgba(167, 243, 208, 0.15)'
            ctx.shadowBlur = 40
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 40)
            ctx.fill()
            ctx.shadowBlur = 0 // reset shadow

            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

            // Footer
            ctx.fillStyle = '#a7f3d0'
            ctx.font = '900 24px sans-serif'
            ctx.fillText(lang === 'kk' ? 'ҮСТЕЛ' : 'СТОЛ', width / 2, 910)

            ctx.fillStyle = '#fbbf24'
            ctx.font = '900 130px sans-serif'
            ctx.fillText(`№${tableNumber}`, width / 2, 1040)

            ctx.fillStyle = '#34d399'
            ctx.font = '600 16px sans-serif'
            ctx.fillText('mazirapp.kz', width / 2, 1140)

        } else if (cardTheme === 'neon') {
            // Neon space background gradient
            const grad = ctx.createLinearGradient(0, 0, 0, height)
            grad.addColorStop(0, '#0c0a09')
            grad.addColorStop(0.5, '#1e1b4b')
            grad.addColorStop(1, '#2e1065')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, width, height)

            // Double Neon glowing frames
            ctx.strokeStyle = '#ec4899'
            ctx.lineWidth = 6
            ctx.strokeRect(40, 40, width - 80, height - 80)
            ctx.strokeStyle = '#06b6d4'
            ctx.lineWidth = 2
            ctx.strokeRect(48, 48, width - 96, height - 96)

            // Header Text
            ctx.textAlign = 'center'
            ctx.fillStyle = '#ffffff'
            ctx.font = 'italic 900 48px sans-serif'
            ctx.fillText('MAZIR MENU', width / 2, 160)

            ctx.fillStyle = '#ec4899'
            ctx.font = 'bold 20px sans-serif'
            ctx.fillText('⚡️ SCAN & ORDER NOW ⚡️', width / 2, 205)

            // Subtitle
            ctx.fillStyle = '#06b6d4'
            ctx.font = '800 22px sans-serif'
            ctx.fillText(lang === 'kk' ? 'МӘЗІРДІ КӨРУ ҮШІН СКАНИРЛЕҢІЗ' : 'СКАНИРУЙТЕ ДЛЯ ПРОСМОТРА МЕНЮ', width / 2, 260)

            // Draw QR Code
            const qrSize = 360
            const qrX = (width - qrSize) / 2
            const qrY = 360

            ctx.shadowColor = 'rgba(236, 72, 153, 0.35)'
            ctx.shadowBlur = 45
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 40)
            ctx.fill()
            ctx.shadowBlur = 0 // reset shadow

            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

            // Footer
            ctx.fillStyle = '#d8b4fe'
            ctx.font = '900 24px sans-serif'
            ctx.fillText(lang === 'kk' ? 'ҮСТЕЛ' : 'СТОЛ', width / 2, 910)

            ctx.fillStyle = '#ec4899'
            ctx.font = '900 130px sans-serif'
            ctx.fillText(`№${tableNumber}`, width / 2, 1040)

            ctx.fillStyle = '#a855f7'
            ctx.font = '600 16px sans-serif'
            ctx.fillText('mazirapp.kz', width / 2, 1140)
        }
    }

    const handleDownloadTabletopCard = () => {
        if (!selectedQRTable) return
        const qrCanvas = document.getElementById('table-qr-canvas') as HTMLCanvasElement
        if (!qrCanvas) {
            toast.error('QR code not rendered yet')
            return
        }

        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 800
            canvas.height = 1200
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            drawTabletopCard(ctx, canvas.width, canvas.height, selectedQRTable.table_number, img)

            const url = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.download = `table-${selectedQRTable.table_number}-${cardTheme}-card.png`
            link.href = url
            link.click()
            toast.success(lang === 'kk' ? 'Жоғары сапалы үстел картасы жүктелді!' : 'Карточка стола скачана в высоком разрешении!')
        }
        img.src = qrCanvas.toDataURL('image/png')
    }

    const handleDownloadRawQR = () => {
        if (!selectedQRTable) return
        const qrCanvas = document.getElementById('table-qr-canvas') as HTMLCanvasElement
        if (!qrCanvas) return
        const url = qrCanvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `table-${selectedQRTable.table_number}-qr-only.png`
        link.href = url
        link.click()
        toast.success(lang === 'kk' ? 'Тек QR-код жүктелді!' : 'Скачан только QR-код!')
    }

    return (
        <>
            <div className="flex flex-col min-h-full print:hidden">
            {/* Header */}
            <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border">
                <h1 className="text-2xl font-bold text-foreground">
                    {t(lang, 'tables')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {lang === 'kk' ? `Жалпы: ${tables.length} үстел` : `Всего: ${tables.length} столов`}
                </p>
            </div>

            <div className="flex-1 px-4 py-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{t(lang, 'tablesManagement' as any)}</h2>
                    <button
                        onClick={() => setShowAddTable(true)}
                        className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl"
                    >
                        + {t(lang, 'addTable' as any)}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {tables.map(table => (
                        <div key={table.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-xl font-bold">
                                    {table.table_number}
                                </div>
                                <div>
                                    <p className="font-bold">№{table.table_number} {t(lang, 'tables')}</p>
                                    <p className="text-xs text-muted-foreground">{table.capacity} {lang === 'kk' ? 'адамдық' : 'чел.'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedQRTable(table)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                                >
                                    <QrCode className="w-5 h-5" />
                                    <span className="hidden sm:inline">{t(lang, 'qr')}</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(table.id)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {showAddTable && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card w-full max-sm rounded-[32px] p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold">{t(lang, 'addTable' as any)}</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">{t(lang, 'tableNumber' as any)}</label>
                                    <input
                                        value={newTable.table_number}
                                        onChange={e => setNewTable(prev => ({ ...prev, table_number: e.target.value }))}
                                        placeholder={lang === 'kk' ? "Мысалы: 5 немесе VIP" : "Например: 5 или VIP"}
                                        className="w-full bg-secondary rounded-2xl px-4 py-3 outline-none mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">{t(lang, 'capacity' as any)}</label>
                                    <div className="flex items-center gap-4 mt-1">
                                        <button
                                            onClick={() => setNewTable(prev => ({ ...prev, capacity: Math.max(1, prev.capacity - 1) }))}
                                            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl font-bold"
                                        >−</button>
                                        <span className="text-xl font-bold">{newTable.capacity}</span>
                                        <button
                                            onClick={() => setNewTable(prev => ({ ...prev, capacity: Math.min(20, prev.capacity + 1) }))}
                                            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl font-bold"
                                        >+</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAddTable(false)}
                                    className="flex-1 bg-secondary text-foreground font-bold py-3 rounded-2xl"
                                >{t(lang, 'cancel')}</button>
                                <button
                                    onClick={handleAddTable}
                                    className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-2xl"
                                >{t(lang, 'add' as any)}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* selectedQRTable Modal - High-End Designer Edition */}
            {selectedQRTable && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-card w-full max-w-4xl rounded-[40px] p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300 shadow-2xl border border-border flex flex-col md:flex-row gap-8 relative">
                        
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedQRTable(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all z-10"
                        >
                            <XCircle className="w-6 h-6 text-muted-foreground hover:text-foreground" />
                        </button>

                        {/* LEFT COLUMN: LIVE MOCKUP PREVIEW */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 flex items-center gap-1.5 self-start">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                {lang === 'kk' ? 'Тікелей Көрініс' : 'Интерактивное Превью'}
                            </h4>
                            
                            {/* Premium Tabletop Card HTML/CSS Preview */}
                            <div className={cn(
                                "w-full max-w-[280px] aspect-[2/3] border-4 rounded-[2.5rem] p-5 flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-500 shadow-2xl",
                                cardTheme === 'classic' && "border-slate-800 bg-[#fafaf9] text-slate-900",
                                cardTheme === 'gold' && "border-amber-600 bg-gradient-to-b from-[#09090b] via-[#18181b] to-[#020617] text-amber-300 shadow-amber-500/10",
                                cardTheme === 'emerald' && "border-emerald-400 bg-gradient-to-b from-[#022c22] to-[#064e3b] text-emerald-200 shadow-emerald-500/10",
                                cardTheme === 'neon' && "border-pink-500 bg-gradient-to-b from-[#0c0a09] via-[#1e1b4b] to-[#2e1065] text-white shadow-pink-500/10"
                            )}>
                                {/* Style accents */}
                                {cardTheme === 'gold' && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />
                                )}
                                {cardTheme === 'neon' && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl" />
                                )}

                                <div>
                                    <h4 className={cn(
                                        "text-sm font-black uppercase tracking-widest italic",
                                        cardTheme === 'classic' && "text-slate-900",
                                        cardTheme === 'gold' && "text-yellow-200",
                                        cardTheme === 'emerald' && "text-emerald-100",
                                        cardTheme === 'neon' && "text-white"
                                    )}>MAZIR MENU</h4>
                                    
                                    <p className={cn(
                                        "text-[9px] font-black uppercase tracking-widest mt-1",
                                        cardTheme === 'classic' && "text-slate-500",
                                        cardTheme === 'gold' && "text-amber-500",
                                        cardTheme === 'emerald' && "text-amber-400",
                                        cardTheme === 'neon' && "text-cyan-400"
                                    )}>
                                        {cardTheme === 'emerald' ? '🌿 botanical gourmet 🌿' : 
                                         cardTheme === 'neon' ? '⚡️ scan & order now ⚡️' :
                                         cardTheme === 'gold' ? '✦ premium ✦' : t(lang, 'scanToViewMenu')}
                                    </p>
                                </div>

                                {/* QR Code Image overlay */}
                                <div className="p-3 bg-white rounded-3xl shadow-lg border border-black/5 hover:scale-105 transition-transform duration-300">
                                    <QRCodeCanvas
                                        id="table-qr-canvas"
                                        value={`${clientUrl}/restaurant/${restaurantId}?table=${selectedQRTable.table_number}`}
                                        size={140}
                                        level="H"
                                        includeMargin={true}
                                        fgColor={qrColor}
                                        imageSettings={includeLogo ? {
                                            src: '/apple-touch-icon.png',
                                            x: undefined,
                                            y: undefined,
                                            height: 28,
                                            width: 28,
                                            excavate: true,
                                        } : undefined}
                                    />
                                </div>

                                <div className="space-y-0.5">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest",
                                        cardTheme === 'classic' && "text-slate-400",
                                        cardTheme === 'gold' && "text-zinc-500",
                                        cardTheme === 'emerald' && "text-emerald-400/70",
                                        cardTheme === 'neon' && "text-purple-300"
                                    )}>
                                        {lang === 'kk' ? 'ҮСТЕЛ' : 'СТОЛ'}
                                    </span>
                                    <h3 className={cn(
                                        "text-3xl font-black tracking-tight",
                                        cardTheme === 'classic' && "text-slate-900",
                                        cardTheme === 'gold' && "text-yellow-400",
                                        cardTheme === 'emerald' && "text-amber-300",
                                        cardTheme === 'neon' && "text-pink-500"
                                    )}>№{selectedQRTable.table_number}</h3>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: CONTROLS */}
                        <div className="flex-1 flex flex-col justify-between space-y-6 pt-4 md:pt-0">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2 text-foreground">
                                    <Palette className="w-5 h-5 text-primary" />
                                    {lang === 'kk' ? 'Дизайн Теңшеуі' : 'Кастомизация QR-кода'}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    {lang === 'kk' 
                                      ? 'Мейрамханаңыздың интерьеріне сәйкес келетін премиум үлгіні таңдап, жоғары сапалы басып шығаруға арналған картаны жүктеңіз.'
                                      : 'Выберите шаблон под интерьер вашего заведения, настройте цвета и скачайте готовую карточку для печати.'}
                                </p>
                            </div>

                            {/* 1. Theme selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Sliders className="w-3.5 h-3.5" />
                                    {lang === 'kk' ? '1. Шаблон таңдау' : '1. Выберите шаблон'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {themes.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setCardTheme(t.id)
                                                // auto-adjust QR colors to match presets beautifully
                                                if (t.id === 'gold') setQrColor('#0f172a')
                                                else if (t.id === 'emerald') setQrColor('#022c22')
                                                else if (t.id === 'neon') setQrColor('#0f172a')
                                                else setQrColor('#0f172a')
                                            }}
                                            className={cn(
                                                "border-2 rounded-2xl p-3 text-xs font-black uppercase tracking-wider text-center cursor-pointer active:scale-98 transition-all flex flex-col gap-1 items-center justify-center",
                                                cardTheme === t.id ? "ring-2 ring-primary border-transparent scale-[1.02]" : "border-border/60 hover:bg-secondary"
                                            )}
                                        >
                                            <span className="font-extrabold">{lang === 'kk' ? t.kk : t.ru}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. QR Code Color */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Palette className="w-3.5 h-3.5" />
                                    {lang === 'kk' ? '2. QR-код түсі' : '2. Цвет QR-кода'}
                                </label>
                                <div className="flex gap-2">
                                    {colorPresets.map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => setQrColor(c.value)}
                                            className={cn(
                                                "w-9 h-9 rounded-full cursor-pointer transition-all flex items-center justify-center border-2 border-white dark:border-zinc-800 shadow-md",
                                                c.bg,
                                                qrColor === c.value ? "scale-110 ring-2 ring-primary ring-offset-2" : "opacity-80 hover:opacity-100"
                                            )}
                                            title={c.label}
                                        >
                                            {qrColor === c.value && <Check className="w-4 h-4 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Toggle logo */}
                            <div className="flex items-center justify-between bg-secondary/50 rounded-2xl p-4">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-foreground uppercase flex items-center gap-1">
                                        <ImageIcon className="w-3.5 h-3.5" />
                                        {lang === 'kk' ? 'Орталық Логотип' : 'Логотип в центре'}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground">
                                        {lang === 'kk' ? 'Mazir логотипін қосу' : 'Поместить логотип Mazir'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIncludeLogo(!includeLogo)}
                                    className={cn(
                                        "w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer flex items-center",
                                        includeLogo ? "bg-primary justify-end" : "bg-muted justify-start"
                                    )}
                                >
                                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                                </button>
                            </div>

                            {/* Download & Print Actions */}
                            <div className="space-y-2 pt-2">
                                <button
                                    onClick={handleDownloadTabletopCard}
                                    className="w-full inline-flex items-center justify-center bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-widest h-14 rounded-2xl gap-2 active:scale-98 transition-all shadow-xl shadow-primary/20"
                                >
                                    <Download className="w-5 h-5" />
                                    {lang === 'kk' ? 'Үстел картасын жүктеу (PNG)' : 'Скачать карточку стола (PNG)'}
                                </button>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleDownloadRawQR}
                                        className="inline-flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground font-black text-[10px] uppercase tracking-widest h-12 rounded-2xl gap-2 active:scale-95 transition-all"
                                    >
                                        <QrCode className="w-4 h-4" />
                                        {lang === 'kk' ? 'Тек QR жүктеу' : 'Скачать только QR'}
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="inline-flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground font-black text-[10px] uppercase tracking-widest h-12 rounded-2xl gap-2 active:scale-95 transition-all"
                                    >
                                        <Printer className="w-4 h-4" />
                                        {t(lang, 'printQR' as any)}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
        
        {/* Dedicated Dynamic Print Layout - Renders selected themes exactly */}
        {selectedQRTable && (
            <div className={cn(
                "hidden print:flex flex-col items-center justify-between h-screen w-screen p-12 text-center border-8 rounded-[4rem] max-w-lg mx-auto my-auto relative overflow-hidden",
                cardTheme === 'classic' && "bg-[#fafaf9] text-slate-900 border-slate-900",
                cardTheme === 'gold' && "bg-black text-amber-300 border-amber-600 shadow-2xl shadow-amber-500/20",
                cardTheme === 'emerald' && "bg-[#022c22] text-emerald-200 border-emerald-400 shadow-2xl",
                cardTheme === 'neon' && "bg-[#0c0a09] text-white border-pink-500"
            )}>
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-widest italic mt-6">MAZIR MENU</h2>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500 mt-2">
                        {cardTheme === 'emerald' ? '🌿 botanical gourmet 🌿' : 
                         cardTheme === 'neon' ? '⚡️ scan & order now ⚡️' :
                         cardTheme === 'gold' ? '✦ premium ✦' : t(lang, 'scanToViewMenu')}
                    </p>
                </div>
                
                <div className="p-6 bg-white border-4 border-slate-100 rounded-[3rem] shadow-xl hover:scale-105 transition-transform duration-300">
                    <QRCodeCanvas
                        value={`${clientUrl}/restaurant/${restaurantId}?table=${selectedQRTable.table_number}`}
                        size={280}
                        level="H"
                        includeMargin={true}
                        fgColor={qrColor}
                        imageSettings={includeLogo ? {
                            src: '/apple-touch-icon.png',
                            x: undefined,
                            y: undefined,
                            height: 52,
                            width: 52,
                            excavate: true,
                        } : undefined}
                    />
                </div>
                
                <div className="mb-8">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {lang === 'kk' ? 'ҮСТЕЛ' : 'СТОЛ'}
                    </span>
                    <h1 className="text-6xl font-black tracking-tight mt-1">№{selectedQRTable.table_number}</h1>
                </div>
            </div>
        )}
    </>
)
}
