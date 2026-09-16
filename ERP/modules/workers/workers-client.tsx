'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Search, Plus, Users, X, Link as LinkIcon, UserPlus, UserCheck, Shield, Copy, QrCode, Download, Smartphone, Scan, CheckCircle2, Check, HelpCircle, Sparkles, Trash2, Clock, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'
import { getWorkersAction, createWorkerAction, getMonthlyAttendanceAction, deleteWorkerAction } from '@/lib/actions'

interface Role {
  id: string
  label_ru: string
  label_kk: string
}

const ROLES: Role[] = [
  { id: 'all', label_ru: 'Все', label_kk: 'Барлығы' },
  { id: 'cook', label_ru: 'Повар', label_kk: 'Аспаз' },
  { id: 'cashier', label_ru: 'Кассир', label_kk: 'Кассир' },
  { id: 'courier', label_ru: 'Курьер', label_kk: 'Курьер' },
  { id: 'waiter', label_ru: 'Официант', label_kk: 'Даяшы' },
]

type ModalStep = 'main' | 'create_role' | 'create_worker' | 'worker_link' | 'worker_manual'

export default function WorkersClient({ initialWorkers = [], cafeId }: { initialWorkers?: any[], cafeId?: string | null }) {
  const { lang } = useApp()
  const [workers, setWorkers] = useState<any[]>(initialWorkers)
  const [search, setSearch] = useState('')
  const [activeRole, setActiveRole] = useState('all')

  // Tab State
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list')

  // Monthly Attendance State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([])
  const [loadingMonthly, setLoadingMonthly] = useState(false)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState<ModalStep>('main')

  // Form Inputs State
  const [roleNameRu, setRoleNameRu] = useState('')
  const [roleNameKk, setRoleNameKk] = useState('')
  const [workerName, setWorkerName] = useState('')
  const [workerPhone, setWorkerPhone] = useState('')
  const [workerRole, setWorkerRole] = useState('cook')
  const [workerEmail, setWorkerEmail] = useState('')
  const [workerPassword, setWorkerPassword] = useState('')
  const [workerLoading, setWorkerLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [showQrModal, setShowQrModal] = useState(false)
  const qrRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!cafeId) return;
    const supabase = createClient();
    
    const fetchWorkers = async () => {
        const res = await getWorkersAction(cafeId)
        if (res.success) {
            setWorkers(res.data)
        }
    }

    const channel = supabase.channel('workers_changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'staff_profiles',
            filter: `cafe_id=eq.${cafeId}`
        }, () => {
            fetchWorkers()
        })
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
  }, [cafeId])

  useEffect(() => {
    if (!cafeId || activeTab !== 'calendar') return;
    
    const fetchMonthly = async () => {
      setLoadingMonthly(true)
      const res = await getMonthlyAttendanceAction(cafeId, selectedYear, selectedMonth)
      if (res.success) {
        setMonthlyAttendance(res.data)
      }
      setLoadingMonthly(false)
    }
    
    fetchMonthly()
  }, [cafeId, selectedYear, selectedMonth, activeTab])

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm(lang === 'kk' ? 'Бұл қызметкерді өшіргіңіз келе ме?' : 'Вы действительно хотите удалить этого сотрудника?')) {
      return
    }
    try {
      const res = await deleteWorkerAction(workerId)
      if (res.success) {
        toast.success(lang === 'kk' ? 'Қызметкер өшірілді!' : 'Сотрудник удален!')
        setWorkers(prev => prev.filter(w => w.id !== workerId))
      } else {
        toast.error(lang === 'kk' ? `Өшіру қатесі: ${res.error}` : `Ошибка удаления: ${res.error}`)
      }
    } catch (err: any) {
      toast.error(lang === 'kk' ? `Жүйелік қате: ${err.message}` : `Системная ошибка: ${err.message}`)
    }
  }

  const drawAttendancePoster = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    qrImage: HTMLImageElement
  ) => {
    // Premium Corporate Dark Indigo Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#0f172a')
    grad.addColorStop(0.4, '#1e293b')
    grad.addColorStop(1, '#020617')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Glowing Cyber Blue Borders
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 6
    ctx.strokeRect(40, 40, width - 80, height - 80)
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 2
    ctx.strokeRect(50, 50, width - 100, height - 100)

    // Poster Header text
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'italic 900 42px sans-serif'
    ctx.fillText(lang === 'kk' ? 'ҚЫЗМЕТКЕРЛЕРДІ ТІРКЕУ' : 'РЕГИСТРАЦИЯ СОТРУДНИКОВ', width / 2, 140)

    ctx.fillStyle = '#38bdf8'
    ctx.font = '800 20px sans-serif'
    ctx.fillText(lang === 'kk' ? 'ЖҰМЫСҚА КЕЛУ ЖӘНЕ КЕТУ ЖҮЙЕСІ' : 'СИСТЕМА УЧЕТА РАБОЧЕГО ВРЕМЕНИ', width / 2, 190)

    // Instructions Container Box
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 30
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.roundRect(80, 240, width - 160, 280, 30)
    ctx.fill()
    ctx.shadowBlur = 0 // reset shadow

    // Steps list rendering
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'

    // Step 1
    ctx.fillStyle = '#38bdf8'
    ctx.font = 'italic 900 24px sans-serif'
    ctx.fillText('1', 120, 305)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '800 18px sans-serif'
    ctx.fillText(lang === 'kk' ? 'Staff сілтемесін ашыңыз (staff.mazirapp.kz)' : 'Открыть ссылку (staff.mazirapp.kz)', 160, 300)

    // Step 2
    ctx.fillStyle = '#38bdf8'
    ctx.font = 'italic 900 24px sans-serif'
    ctx.fillText('2', 120, 385)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '800 18px sans-serif'
    ctx.fillText(lang === 'kk' ? 'Камерамен осы QR-кодты сканерлеңіз' : 'Отсканировать данный QR-код камерой', 160, 380)

    // Step 3
    ctx.fillStyle = '#38bdf8'
    ctx.font = 'italic 900 24px sans-serif'
    ctx.fillText('3', 120, 465)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '800 18px sans-serif'
    ctx.fillText(lang === 'kk' ? 'Келуді немесе кетуді растаңыз' : 'Подтвердить начало или конец смены', 160, 460)

    // Draw QR Container Box
    const qrSize = 380
    const qrX = (width - qrSize) / 2
    const qrY = 580

    ctx.shadowColor = 'rgba(56, 189, 248, 0.25)'
    ctx.shadowBlur = 45
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60, 45)
    ctx.fill()
    ctx.shadowBlur = 0 // reset shadow

    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

    // Footer Info
    ctx.textAlign = 'center'
    ctx.fillStyle = '#94a3b8'
    ctx.font = '600 16px sans-serif'
    ctx.fillText('Məzirapp Staff Attendance System', width / 2, 1080)

    ctx.fillStyle = '#38bdf8'
    ctx.font = '900 24px sans-serif'
    ctx.fillText('mazirapp.kz', width / 2, 1130)
  }

  function downloadQr() {
    if (!qrRef.current) return
    const svg = qrRef.current
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 1200
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      drawAttendancePoster(ctx, canvas.width, canvas.height, img)
      
      const a = document.createElement('a')
      a.download = 'cafe-attendance-checkin-board.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
      toast.success(lang === 'kk' ? 'Қызметкерлер тіркеу тақтасы жүктелді!' : 'Постер регистрации сотрудников успешно скачан!')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  function downloadRawQrOnly() {
    if (!qrRef.current) return
    const svg = qrRef.current
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const a = document.createElement('a')
      a.download = 'cafe-attendance-qr-only.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
      toast.success(lang === 'kk' ? 'Тек QR-код жүктелді!' : 'Скачан только QR-код!')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // Helper to open modal
  function openAddModal() {
    setModalStep('main')
    setModalOpen(true)
  }

  // Helper to copy invitation link
  function copyLink(link: string) {
    navigator.clipboard.writeText(link).then(() => {
      toast.success(lang === 'kk' ? 'Сілтеме көшірілді!' : 'Ссылка скопирована!')
    }).catch(() => {
      toast.error(lang === 'kk' ? 'Қате кетті' : 'Произошла ошибка')
    })
  }

  // Helper to generate registration link
  function generateInviteLink() {
    const link = `https://staff.mazirapp.kz/qr?c=${cafeId}`
    setGeneratedLink(link)
    setModalStep('worker_link')
  }

  // Helper to handle role submission
  function handleSaveRole() {
    if (!roleNameRu.trim()) {
      toast.error(lang === 'kk' ? 'Рөл атауын енгізіңіз' : 'Введите название роли')
      return
    }
    toast.success(lang === 'kk' ? 'Рөл сәтті жасалды!' : 'Роль успешно создана!')
    // Reset and close
    setRoleNameRu('')
    setRoleNameKk('')
    setModalOpen(false)
  }

  // Helper to handle manual worker submission
  async function handleSaveWorkerManual() {
    if (!cafeId) {
      toast.error(lang === 'kk' ? 'Мейрамхана табылмады' : 'Ресторан не найден')
      return
    }
    if (!workerName.trim() || !workerPhone.trim() || !workerEmail.trim() || !workerPassword.trim()) {
      toast.error(lang === 'kk' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля')
      return
    }
    if (workerPassword.length < 6) {
      toast.error(lang === 'kk' ? 'Құпия сөз кемінде 6 таңбадан тұруы керек' : 'Пароль должен состоять минимум из 6 символов')
      return
    }

    setWorkerLoading(true)
    try {
      const res = await createWorkerAction(
        cafeId,
        workerEmail.trim(),
        workerPassword,
        workerName.trim(),
        workerPhone.trim(),
        workerRole
      )

      if (res.success) {
        toast.success(lang === 'kk' ? 'Қызметкер сәтті қосылды!' : 'Сотрудник успешно создан!')
        // Reset and close
        setWorkerName('')
        setWorkerPhone('')
        setWorkerEmail('')
        setWorkerPassword('')
        setWorkerRole('cook')
        setModalOpen(false)
        
        // Refresh workers list
        const updated = await getWorkersAction(cafeId)
        if (updated.success) {
          setWorkers(updated.data)
        }
      } else {
        toast.error(lang === 'kk' ? `Қате: ${res.error}` : `Ошибка: ${res.error}`)
      }
    } catch (err: any) {
      toast.error(lang === 'kk' ? `Жүйелік қате: ${err.message}` : `Системная ошибка: ${err.message}`)
    } finally {
      setWorkerLoading(false)
    }
  }

  // Back navigation map
  const handleBack = () => {
    if (modalStep === 'worker_link' || modalStep === 'worker_manual') {
      setModalStep('create_worker')
    } else {
      setModalStep('main')
    }
  }

  // Construct Monthly Attendance mapping
  const attendanceMap = new Map<string, Map<string, any>>()
  monthlyAttendance.forEach(rec => {
    const workerId = rec.staff_id
    const dateStr = rec.date // YYYY-MM-DD
    if (!attendanceMap.has(workerId)) {
      attendanceMap.set(workerId, new Map())
    }
    attendanceMap.get(workerId)!.set(dateStr, rec)
  })

  // Filter and search workers
  const filteredWorkers = workers.filter(w => 
    (activeRole === 'all' || w.role === activeRole) && 
    ((w.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
     (w.email || '').toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col min-h-full bg-slate-50/50 dark:bg-slate-950/20">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-30 backdrop-blur-md bg-card/90"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/management"
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90 shadow-sm shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-foreground uppercase tracking-tighter italic">
                {lang === 'kk' ? 'Қызметкерлер' : 'Работники'}
              </h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {lang === 'kk' ? 'Қызметкерлер мен рөлдер' : 'Персонал и роли'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!cafeId) {
                  toast.error(lang === 'kk' ? 'Мейрамхана табылмады' : 'Ресторан не найден')
                  return
                }
                setShowQrModal(true)
              }}
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all shadow-sm shrink-0 cursor-pointer"
              aria-label="Show QR"
            >
              <QrCode className="w-5 h-5 text-foreground" />
            </button>
            <Link
              href="/workers/attendance"
              className="px-4 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs uppercase flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
            >
              {lang === 'kk' ? 'Келіп-кету' : 'Журнал'}
            </Link>
            <button
              onClick={openAddModal}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0 cursor-pointer"
              aria-label="Add worker"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              "px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
              activeTab === 'list' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {lang === 'kk' ? 'Қызметкерлер тізімі' : 'Список сотрудников'}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "px-5 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
              activeTab === 'calendar' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {lang === 'kk' ? 'Айлық келіп-кету кестесі' : 'Месячный табель'}
          </button>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="flex-1 p-4">
        {activeTab === 'list' ? (
          <div className="space-y-4">
            {/* Search & Filter controls */}
            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === 'kk' ? 'Қызметкерлерді іздеу...' : 'Поиск сотрудников...'}
                  className="w-full bg-card border-2 border-border/40 focus:border-primary/20 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/40 shadow-sm"
                />
              </div>

              {/* Scrolling role chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setActiveRole(role.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0 border-2 shadow-sm cursor-pointer",
                      activeRole === role.id
                        ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
                        : "bg-card text-muted-foreground border-transparent hover:border-muted"
                    )}
                  >
                    {lang === 'kk' ? role.label_kk : role.label_ru}
                  </button>
                ))}
              </div>
            </div>

            {filteredWorkers.length > 0 ? (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-hidden bg-card border border-border rounded-[2rem] shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">{lang === 'kk' ? 'Қызметкер' : 'Сотрудник'}</th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">{lang === 'kk' ? 'Лауазымы' : 'Должность'}</th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">{lang === 'kk' ? 'Телефон' : 'Телефон'}</th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">{lang === 'kk' ? 'Жүйеге қосылды' : 'Дата добавления'}</th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-right">{lang === 'kk' ? 'Әрекет' : 'Действие'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((worker) => (
                        <tr key={worker.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                {worker.avatar_url ? (
                                  <img src={worker.avatar_url} alt={worker.full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span className="font-bold text-sm text-muted-foreground">
                                    {worker.full_name?.charAt(0) || worker.email?.charAt(0) || '?'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-foreground">{worker.full_name || 'Атауы жоқ'}</h3>
                                <p className="text-xs text-muted-foreground">{worker.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg">
                              {ROLES.find(r => r.id === worker.role)?.label_kk || worker.role || 'Staff'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-semibold text-foreground">{worker.phone || '—'}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-muted-foreground">
                              {worker.created_at ? new Date(worker.created_at).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-RU') : '—'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteWorker(worker.id)}
                              className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 active:scale-95 transition-all cursor-pointer"
                              title={lang === 'kk' ? 'Өшіру' : 'Удалить'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="grid gap-4 md:hidden">
                  {filteredWorkers.map((worker) => (
                    <motion.div
                      key={worker.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border p-4 rounded-3xl flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          {worker.avatar_url ? (
                            <img src={worker.avatar_url} alt={worker.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="font-bold text-base text-muted-foreground">
                              {worker.full_name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate">{worker.full_name || 'Атауы жоқ'}</h3>
                          <p className="text-xs text-muted-foreground truncate">{worker.email}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider rounded-md">
                              {ROLES.find(r => r.id === worker.role)?.label_kk || worker.role || 'Staff'}
                            </span>
                            {worker.phone && <span className="text-[10px] text-muted-foreground font-semibold">{worker.phone}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteWorker(worker.id)}
                        className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 active:scale-90 transition-all cursor-pointer shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full pt-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-border/60 rounded-[2.5rem] p-8 text-center bg-card/30"
                >
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground/40 mb-4 shadow-inner">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {lang === 'kk' ? 'Қызметкерлер тізімі бос' : 'Список сотрудников пуст'}
                  </h3>
                  <p className="text-xs text-muted-foreground/60 mt-2 max-w-[240px] leading-relaxed">
                    {lang === 'kk'
                      ? 'Жаңа қызметкерлерді қосу үшін жоғарғы оң жақтағы "+" батырмасын басыңыз'
                      : 'Нажмите кнопку "+" вверху справа, чтобы добавить сотрудников'}
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Monthly Selector Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
                  {lang === 'kk' ? 'Айлық келіп-кету тарихы' : 'Ежемесячный табель'}
                </h3>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="flex-1 sm:flex-initial bg-secondary rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider border border-transparent focus:border-primary/20 outline-none text-foreground cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2020, m - 1, 1).toLocaleString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', { month: 'long' })}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-secondary rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider border border-transparent focus:border-primary/20 outline-none text-foreground cursor-pointer"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Attendance Calendar Sheet Grid */}
            <div className="overflow-x-auto rounded-[2rem] border border-border shadow-sm max-w-full bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="p-4 font-black uppercase tracking-wider text-muted-foreground sticky left-0 bg-card border-r border-border/80 min-w-[150px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      {lang === 'kk' ? 'Қызметкер' : 'Сотрудник'}
                    </th>
                    {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map((day) => {
                      const dateObj = new Date(selectedYear, selectedMonth - 1, day)
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
                      return (
                        <th
                          key={day}
                          className={cn(
                            "p-2 text-center font-bold min-w-[40px] border-r border-border/40",
                            isWeekend && "bg-slate-100/50 dark:bg-slate-900/50 text-red-500"
                          )}
                        >
                          {day}
                        </th>
                      )
                    })}
                    <th className="p-4 font-black uppercase tracking-wider text-muted-foreground text-center min-w-[70px]">
                      {lang === 'kk' ? 'Күндер' : 'Дней'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMonthly ? (
                    <tr>
                      <td colSpan={new Date(selectedYear, selectedMonth, 0).getDate() + 2} className="p-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span>{lang === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={new Date(selectedYear, selectedMonth, 0).getDate() + 2} className="p-8 text-center text-muted-foreground">
                        {lang === 'kk' ? 'Қызметкерлер табылған жоқ' : 'Сотрудники не найдены'}
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((worker) => {
                      let presentDaysCount = 0
                      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
                      return (
                        <tr key={worker.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="p-3 sticky left-0 bg-card border-r border-border/80 font-bold text-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 min-w-[150px]">
                            <div className="truncate max-w-[140px]" title={worker.full_name}>
                              {worker.full_name || 'Атауы жоқ'}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                              {ROLES.find(r => r.id === worker.role)?.label_kk || worker.role || 'Staff'}
                            </div>
                          </td>
                          
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const record = attendanceMap.get(worker.id)?.get(dateStr)
                            const dateObj = new Date(selectedYear, selectedMonth - 1, day)
                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
                            
                            let checkInTimeStr = ''
                            let checkOutTimeStr = ''
                            if (record) {
                              presentDaysCount++
                              if (record.check_in_time) {
                                checkInTimeStr = new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                              if (record.check_out_time) {
                                checkOutTimeStr = new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                            }
                            
                            return (
                              <td
                                key={day}
                                className={cn(
                                  "p-1.5 text-center border-r border-border/40 relative group/cell",
                                  isWeekend && "bg-slate-100/20 dark:bg-slate-900/10"
                                )}
                              >
                                {record ? (
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 flex items-center justify-center font-bold text-[9px] shadow-sm select-none">
                                      ✓
                                    </div>
                                    
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:flex flex-col bg-slate-950 text-slate-100 text-[10px] p-2.5 rounded-xl shadow-xl z-20 pointer-events-none whitespace-nowrap gap-1">
                                      <div className="font-bold border-b border-slate-800 pb-1 text-sky-400">
                                        {dateStr}
                                      </div>
                                      <div>
                                        🟢 {lang === 'kk' ? 'Келу:' : 'Приход:'} {checkInTimeStr || '--:--'}
                                      </div>
                                      <div>
                                        🔴 {lang === 'kk' ? 'Кету:' : 'Уход:'} {checkOutTimeStr || '--:--'}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/30 font-light select-none">—</span>
                                )}
                              </td>
                            )
                          })}
                          
                          <td className="p-3 text-center font-black text-xs text-foreground bg-primary/5">
                            {presentDaysCount}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Multi-step Dialog/Modal Drawer */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-card rounded-t-[3rem] sm:rounded-[3rem] p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Screens transition wrapper */}
              <AnimatePresence mode="wait">
                {/* 1. Main Menu Step */}
                {modalStep === 'main' && (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">
                        {lang === 'kk' ? 'Қосу' : 'Добавить'}
                      </h2>
                      <button
                        onClick={() => setModalOpen(false)}
                        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all"
                      >
                        <X className="w-5 h-5 text-foreground" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => setModalStep('create_worker')}
                        className="w-full text-left group p-5 bg-secondary/40 rounded-3xl border-2 border-transparent hover:border-primary/20 cursor-pointer flex items-center gap-4 transition-all active:scale-[0.98]"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <UserPlus className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black uppercase tracking-tight italic text-foreground">
                            {lang === 'kk' ? 'Қызметкерді қосу' : 'Создать работника'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {lang === 'kk'
                              ? 'Қызметкерді сілтеме арқылы немесе қолмен қосу'
                              : 'Добавить сотрудника через ссылку или вручную'}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setModalStep('create_role')}
                        className="w-full text-left group p-5 bg-secondary/40 rounded-3xl border-2 border-transparent hover:border-primary/20 cursor-pointer flex items-center gap-4 transition-all active:scale-[0.98]"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black uppercase tracking-tight italic text-foreground">
                            {lang === 'kk' ? 'Рөлді жасау' : 'Создать роль'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {lang === 'kk'
                              ? 'Міндеттерді бөлу үшін жаңа рөл жасау'
                              : 'Создать новую роль для распределения обязанностей'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 2. Create Role Step */}
                {modalStep === 'create_role' && (
                  <motion.div
                    key="create_role"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleBack}
                          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90"
                        >
                          <ArrowLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">
                          {lang === 'kk' ? 'Рөлді жасау' : 'Создать роль'}
                        </h2>
                      </div>
                      <button
                        onClick={() => setModalOpen(false)}
                        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all"
                      >
                        <X className="w-5 h-5 text-foreground" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">
                          {lang === 'kk' ? 'Рөл атауы (RU)' : 'Название роли (RU)'}
                        </label>
                        <input
                          type="text"
                          value={roleNameRu}
                          onChange={(e) => setRoleNameRu(e.target.value)}
                          placeholder="например, Администратор"
                          className="w-full bg-secondary/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">
                          {lang === 'kk' ? 'Рөл атауы (KK)' : 'Название роли (KK)'}
                        </label>
                        <input
                          type="text"
                          value={roleNameKk}
                          onChange={(e) => setRoleNameKk(e.target.value)}
                          placeholder="мысалы, Әкімші"
                          className="w-full bg-secondary/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleBack}
                        className="flex-1 bg-secondary text-foreground rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        {lang === 'kk' ? 'Бас тарту' : 'Отмена'}
                      </button>
                      <button
                        onClick={handleSaveRole}
                        className="flex-1 bg-primary text-primary-foreground rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        {lang === 'kk' ? 'Сақтау' : 'Сохранить'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. Create Worker Menu Step */}
                {modalStep === 'create_worker' && (
                  <motion.div
                    key="create_worker"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleBack}
                          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90"
                        >
                          <ArrowLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tighter italic">
                          {lang === 'kk' ? 'Қызметкерді қосу' : 'Создать работника'}
                        </h2>
                      </div>
                      <button
                        onClick={() => setModalOpen(false)}
                        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all"
                      >
                        <X className="w-5 h-5 text-foreground" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={generateInviteLink}
                        className="w-full text-left group p-5 bg-secondary/40 rounded-3xl border-2 border-transparent hover:border-primary/20 cursor-pointer flex items-center gap-4 transition-all active:scale-[0.98]"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <LinkIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black uppercase tracking-tight italic text-foreground">
                            {lang === 'kk' ? 'Сілтеме жасау (токенмен)' : 'Создать ссылку (с токеном)'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {lang === 'kk'
                              ? 'Қызметкерді тіркеуге арналған бірегей сілтеме жасайды'
                              : 'Генерирует ссылку приглашения для сотрудника'}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setModalStep('worker_manual')}
                        className="w-full text-left group p-5 bg-secondary/40 rounded-3xl border-2 border-transparent hover:border-primary/20 cursor-pointer flex items-center gap-4 transition-all active:scale-[0.98]"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black uppercase tracking-tight italic text-foreground">
                            {lang === 'kk' ? 'Қолмен қосу' : 'Создать вручную'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {lang === 'kk'
                              ? 'Қызметкердің жеке деректерін тікелей толтыру'
                              : 'Ручное заполнение анкеты сотрудника'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 4. Worker Link Invite Display Step */}
                {modalStep === 'worker_link' && (
                  <motion.div
                    key="worker_link"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleBack}
                          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90"
                        >
                          <ArrowLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tighter italic">
                          {lang === 'kk' ? 'Шақыру сілтемесі' : 'Ссылка-приглашение'}
                        </h2>
                      </div>
                      <button
                        onClick={() => setModalOpen(false)}
                        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all"
                      >
                        <X className="w-5 h-5 text-foreground" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed px-2">
                        {lang === 'kk'
                          ? 'Сілтемені қызметкерге жіберіңіз. Осы сілтеме бойынша өткенде ол жүйеге тіркеліп, сіздің мекемеңізге қосыла алады.'
                          : 'Отправьте эту ссылку сотруднику. Перейдя по ней, он сможет зарегистрироваться в системе и автоматически прикрепиться к вашему заведению.'}
                      </p>

                      <div className="bg-secondary/40 p-4 rounded-2xl border border-border flex items-center justify-between gap-3">
                        <span className="text-xs font-mono text-foreground select-all break-all overflow-hidden truncate flex-1 pr-2">
                          {generatedLink}
                        </span>
                        <button
                          onClick={() => copyLink(generatedLink)}
                          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setModalOpen(false)}
                      className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer text-center"
                    >
                      {lang === 'kk' ? 'Дайын' : 'Готово'}
                    </button>
                  </motion.div>
                )}

                {/* 5. Worker Manual Creation Form Step */}
                {modalStep === 'worker_manual' && (
                  <motion.div
                    key="worker_manual"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleBack}
                          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90"
                        >
                          <ArrowLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tighter italic">
                          {lang === 'kk' ? 'Қолмен қосу' : 'Создать вручную'}
                        </h2>
                      </div>
                      <button
                        onClick={() => setModalOpen(false)}
                        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all"
                      >
                        <X className="w-5 h-5 text-foreground" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Name input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">
                          {lang === 'kk' ? 'Аты-жөні' : 'ФИО'}
                        </label>
                        <input
                          type="text"
                          value={workerName}
                          onChange={(e) => setWorkerName(e.target.value)}
                          placeholder="Иван Иванов"
                          disabled={workerLoading}
                          className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30 transition-all disabled:opacity-50"
                        />
                      </div>

                      {/* Phone input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">
                          {lang === 'kk' ? 'Телефон нөмірі' : 'Номер телефона'}
                        </label>
                        <input
                          type="text"
                          value={workerPhone}
                          onChange={(e) => setWorkerPhone(e.target.value)}
                          placeholder="+7 707 123 45 67"
                          disabled={workerLoading}
                          className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30 transition-all disabled:opacity-50"
                        />
                      </div>

                      {/* Email input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={workerEmail}
                          onChange={(e) => setWorkerEmail(e.target.value)}
                          placeholder="worker@mazirapp.kz"
                          disabled={workerLoading}
                          className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30 transition-all disabled:opacity-50"
                        />
                      </div>

                      {/* Password input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">
                          {lang === 'kk' ? 'Құпия сөз' : 'Пароль'}
                        </label>
                        <input
                          type="password"
                          value={workerPassword}
                          onChange={(e) => setWorkerPassword(e.target.value)}
                          placeholder="••••••"
                          disabled={workerLoading}
                          className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm font-bold text-foreground outline-none border-2 border-transparent focus:border-primary/30 transition-all disabled:opacity-50"
                        />
                      </div>

                      {/* Role selection dropdown */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">
                          {lang === 'kk' ? 'Қызмет рөлі' : 'Должность'}
                        </label>
                        <select
                          value={workerRole}
                          onChange={(e) => setWorkerRole(e.target.value)}
                          disabled={workerLoading}
                          className="w-full bg-secondary/50 rounded-2xl px-4 py-4 text-sm font-black text-foreground outline-none border-2 border-transparent focus:border-primary/30 disabled:opacity-50"
                        >
                          <option value="cook">{lang === 'kk' ? 'Аспаз' : 'Повар'}</option>
                          <option value="cashier">{lang === 'kk' ? 'Кассир' : 'Кассир'}</option>
                          <option value="courier">{lang === 'kk' ? 'Курьер' : 'Курьер'}</option>
                          <option value="waiter">{lang === 'kk' ? 'Даяшы' : 'Официант'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleBack}
                        disabled={workerLoading}
                        className="flex-1 bg-secondary text-foreground rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all cursor-pointer text-center disabled:opacity-50"
                      >
                        {lang === 'kk' ? 'Артқа' : 'Назад'}
                      </button>
                      <button
                        onClick={handleSaveWorkerManual}
                        disabled={workerLoading}
                        className="flex-1 bg-primary text-primary-foreground rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {workerLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          lang === 'kk' ? 'Қосу' : 'Добавить'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal - Premium Office Check-In Board */}
      <AnimatePresence>
        {showQrModal && cafeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-card rounded-[40px] p-6 md:p-8 space-y-6 shadow-2xl border border-border flex flex-col md:flex-row gap-8 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all z-10"
              >
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>

              {/* LEFT COLUMN: LIVE MOCKUP PREVIEW */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 flex items-center gap-1.5 self-start">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  {lang === 'kk' ? 'Баспаға Дайын Үлгі' : 'Макет для Печати'}
                </h4>

                {/* Premium Corporate Check-in Board CSS Mockup */}
                <div className="w-full max-w-[300px] aspect-[2/3] border-4 border-sky-400 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#020617] text-white rounded-[2.5rem] p-5 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl shadow-sky-500/10">
                  {/* Decorative mesh */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl" />
                  
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">
                      {lang === 'kk' ? 'ҚЫЗМЕТКЕРЛЕРДІ ТІРКЕУ' : 'РЕГИСТРАЦИЯ СОТРУДНИКОВ'}
                    </h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-sky-400 mt-1">
                      {lang === 'kk' ? 'ЖҰМЫСҚА КЕЛУ ЖӘНЕ КЕТУ' : 'УЧЕТ РАБОЧЕГО ВРЕМЕНИ'}
                    </p>
                  </div>

                  {/* Steps List */}
                  <div className="w-full bg-slate-900/60 rounded-2xl p-3 text-left space-y-2 border border-slate-800">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-black mt-0.5">1</div>
                      <span className="text-[9px] font-bold text-slate-300">
                        {lang === 'kk' ? 'Staff сілтемесін ашыңыз' : 'Открыть staff.mazirapp.kz'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-black mt-0.5">2</div>
                      <span className="text-[9px] font-bold text-slate-300">
                        {lang === 'kk' ? 'QR-кодты сканерлеңіз' : 'Отсканировать этот QR'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-black mt-0.5">3</div>
                      <span className="text-[9px] font-bold text-slate-300">
                        {lang === 'kk' ? 'Келуді/Кетуді растаңыз' : 'Подтвердить приход/уход'}
                      </span>
                    </div>
                  </div>

                  {/* QR Image Frame */}
                  <div className="p-3 bg-white rounded-3xl shadow-lg border border-black/5 hover:scale-105 transition-transform duration-300">
                    <QRCodeSVG
                      value={`https://staff.mazirapp.kz/qr?c=${cafeId}`}
                      size={140}
                      level="H"
                      includeMargin={true}
                      className="rounded-xl"
                      ref={qrRef}
                      fgColor="#0f172a"
                      imageSettings={{
                        src: '/apple-touch-icon.png',
                        x: undefined,
                        y: undefined,
                        height: 28,
                        width: 28,
                        excavate: true,
                      }}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      MƏZIRAPP SYSTEM
                    </span>
                    <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">mazirapp.kz</p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ACTIONS & INSTRUCTIONS */}
              <div className="flex-1 flex flex-col justify-between space-y-6 pt-4 md:pt-0">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2 text-foreground">
                    <QrCode className="w-5 h-5 text-primary" />
                    {lang === 'kk' ? 'Қызметкерлер Тақтасы' : 'Информационное Табло'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {lang === 'kk' 
                      ? 'Қызметкерлер осы QR-кодты сканерлеп, жұмыс орнын бекіте алады және жұмысқа келіп-кетуін тіркейді.'
                      : 'Сотрудники могут отсканировать этот QR-код, чтобы привязаться к рабочему месту и отмечать приход/уход.'}
                  </p>
                </div>

                <div className="bg-secondary/40 border border-border/80 rounded-3xl p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary italic">
                    {lang === 'kk' ? 'Нұсқаулық' : 'Как это работает'}
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-2.5">
                    <li className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>{lang === 'kk' ? 'Қызметкерлер жұмыс орнынан тіркеледі' : 'Работники регистрируются на рабочем месте'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Scan className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>{lang === 'kk' ? '100 метр қашықтық бақыланады (Geofence)' : 'Контролируется расстояние 100 метров'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>{lang === 'kk' ? 'Құрылғы бірден аккаунтқа бұғатталады (1 Device lock)' : 'Устройство сразу привязывается к аккаунту'}</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={downloadQr}
                    className="w-full inline-flex items-center justify-center bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase tracking-widest h-14 rounded-2xl gap-2 active:scale-98 transition-all shadow-xl shadow-primary/20"
                  >
                    <Download className="w-5 h-5" />
                    {lang === 'kk' ? 'Тіркеу Тақтасын Жүктеу (PNG)' : 'Скачать Табло Регистрации (PNG)'}
                  </button>
                  <button
                    onClick={downloadRawQrOnly}
                    className="w-full inline-flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs uppercase tracking-widest h-12 rounded-2xl gap-2 active:scale-95 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    {lang === 'kk' ? 'Тек QR-кодты жүктеу (PNG)' : 'Скачать только QR-код (PNG)'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
