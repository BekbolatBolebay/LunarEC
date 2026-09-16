'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, Calendar as CalendarIcon, MapPin, Search, Edit2, X, Save, Download } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useApp } from '@/lib/app-context'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getAttendanceAction, updateAttendanceAction } from '@/lib/actions'

const getAlmatyDateString = (date = new Date()) => {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Almaty',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(date);
    } catch (e) {
        return date.toISOString().split('T')[0];
    }
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

export default function AttendanceClient({ cafeId }: { cafeId: string | null }) {
    const { lang } = useApp()
    const [attendance, setAttendance] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<string>(getAlmatyDateString())
    const [cafeLocation, setCafeLocation] = useState<{lat: number, lng: number} | null>(null)
    const [mounted, setMounted] = useState(false)
    
    // Edit state
    const [editRecord, setEditRecord] = useState<any>(null)
    const [editCheckIn, setEditCheckIn] = useState('')
    const [editCheckOut, setEditCheckOut] = useState('')
    const [saving, setSaving] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])
    
    // For QR Code
    const qrUrl = cafeId ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://staff.mazirapp.kz/qr?c=${cafeId}`)}` : ''

    const downloadQr = async () => {
        if (!qrUrl) return;
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'attendance-qr.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('QR download error:', error);
            alert('Қате шықты');
        }
    }

    const fetchAttendance = async (silent = false) => {
        if (!cafeId) return
        if (!silent) setLoading(true)
        const res = await getAttendanceAction(cafeId, selectedDate)
        if (res.success) {
            setAttendance(res.data)
        }
        if (!silent) setLoading(false)
    }

    useEffect(() => {
        if (cafeId) {
            fetchAttendance()

            const fetchCafeLocation = async () => {
                const { data: cafe } = await supabase
                    .from('restaurants')
                    .select('latitude, longitude')
                    .eq('id', cafeId)
                    .single()
                if (cafe && cafe.latitude && cafe.longitude) {
                    setCafeLocation({ lat: Number(cafe.latitude), lng: Number(cafe.longitude) })
                }
            }
            fetchCafeLocation()

            const channel = supabase.channel('attendance_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'staff_attendance'
                }, () => {
                    fetchAttendance(true) // Silent reload for smooth realtime
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'staff_profiles'
                }, () => {
                    fetchAttendance(true) // Silent reload for smooth realtime
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [cafeId, selectedDate])

    const renderLocationPill = (loc: any, type: 'in' | 'out') => {
        if (!loc || !loc.lat || !loc.lng) return null;
        
        let distanceText = '';
        let isInside = false;
        let distance = 0;
        
        if (cafeLocation) {
            distance = calculateDistance(loc.lat, loc.lng, cafeLocation.lat, cafeLocation.lng);
            isInside = distance <= 100;
            distanceText = distance > 1000 
                ? `${(distance / 1000).toFixed(1)} км` 
                : `${Math.round(distance)} м`;
        } else {
            distanceText = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
        }
        
        const label = type === 'in' 
            ? (lang === 'kk' ? 'Келу:' : 'Приход:') 
            : (lang === 'kk' ? 'Кету:' : 'Уход:');
            
        const insideLabel = isInside 
            ? (lang === 'kk' ? 'Жұмыс орнынан' : 'С раб. места')
            : (lang === 'kk' ? 'Сырттан' : 'Вне раб. места');

        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;

        return (
            <a 
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all hover:scale-105 active:scale-95 ${
                    isInside 
                        ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' 
                        : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                }`}
                title={lang === 'kk' ? 'Картадан көру' : 'Посмотреть на карте'}
            >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{label} {distanceText} ({insideLabel})</span>
            </a>
        );
    }

    const openEditModal = (record: any) => {
        setEditRecord(record)
        // Format to HH:mm for time input
        const inDate = record.check_in_time ? new Date(record.check_in_time) : null
        const outDate = record.check_out_time ? new Date(record.check_out_time) : null
        
        setEditCheckIn(inDate ? format(inDate, 'HH:mm') : '')
        setEditCheckOut(outDate ? format(outDate, 'HH:mm') : '')
    }

    const saveEdit = async () => {
        if (!editRecord) return
        setSaving(true)
        
        try {
            // Reconstruct ISO strings
            const baseDate = editRecord.date // YYYY-MM-DD
            
            const newCheckIn = editCheckIn ? new Date(`${baseDate}T${editCheckIn}:00`).toISOString() : null
            const newCheckOut = editCheckOut ? new Date(`${baseDate}T${editCheckOut}:00`).toISOString() : null

            const res = await updateAttendanceAction(editRecord.id, newCheckIn, newCheckOut)
            if (!res.success) throw new Error(res.error)
            
            setEditRecord(null)
            fetchAttendance()
        } catch (error) {
            console.error(error)
            alert('Қате шықты')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col min-h-full bg-slate-50/50 dark:bg-slate-950/20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-30 backdrop-blur-md bg-card/90"
            >
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/workers"
                        className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90 shadow-sm shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-foreground uppercase tracking-tighter italic">
                            {lang === 'kk' ? 'Келіп-кету тарихы' : 'Журнал посещаемости'}
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            {lang === 'kk' ? 'Күнді таңдау:' : 'Выберите дату:'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-secondary/50 rounded-xl px-4 py-2 text-sm font-bold border-2 border-transparent focus:border-primary/30 outline-none text-foreground"
                    />
                </div>
            </motion.div>

            <div className="p-4 grid md:grid-cols-3 gap-6">
                {/* QR Code Section */}
                <div className="md:col-span-1">
                    <div className="bg-card p-6 rounded-3xl shadow-sm border text-center sticky top-24">
                        <h2 className="text-lg font-bold mb-2 text-foreground">{lang === 'kk' ? 'QR Код (Жұмысқа келу)' : 'QR Код (Приход на работу)'}</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            {lang === 'kk' ? 'Осы кодты басып шығарып, есіктің ауызына іліп қойыңыз.' : 'Распечатайте этот код и повесьте у входа.'}
                        </p>
                        
                        {cafeId ? (
                            <div className="flex flex-col gap-3">
                                <div className="bg-secondary/20 p-4 rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
                                </div>
                                <button 
                                    onClick={downloadQr}
                                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    {lang === 'kk' ? 'Жүктеп алу' : 'Скачать'}
                                </button>
                            </div>
                        ) : (
                            <div className="w-48 h-48 mx-auto bg-secondary/35 rounded-2xl flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">Loading...</p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-4">staff.mazirapp.kz сілтемесіне кіріп сканерлейді</p>
                    </div>
                </div>

                {/* Attendance List */}
                <div className="md:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">Жүктелуде...</div>
                    ) : attendance.length === 0 ? (
                        <div className="bg-card p-10 rounded-3xl text-center border">
                            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-muted-foreground">{lang === 'kk' ? 'Жазбалар табылған жоқ' : 'Записей не найдено'}</h3>
                            <p className="text-sm text-muted-foreground/60">{lang === 'kk' ? 'Таңдалған күнге тіркелген қызметкерлер жоқ' : 'Нет зарегистрированных сотрудников на выбранную дату'}</p>
                        </div>
                    ) : (
                        attendance.map((record) => (
                            <div key={record.id} className="bg-card p-5 rounded-2xl border shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg">
                                        {record.staff_profiles?.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">
                                            {(record.staff_profiles?.full_name && 
                                              record.staff_profiles.full_name !== 'Unknown' && 
                                              record.staff_profiles.full_name.trim() !== '')
                                                ? record.staff_profiles.full_name
                                                : <span className="text-amber-600 dark:text-amber-400">⚠ {lang === 'kk' ? 'Аты жоқ' : 'Без имени'}</span>
                                            }
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">{record.staff_profiles?.role || 'Staff'}</p>
                                        <div className="flex flex-col gap-1 mt-1.5">
                                            {renderLocationPill(record.check_in_location, 'in')}
                                            {renderLocationPill(record.check_out_location, 'out')}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {mounted && record.check_in_time ? format(new Date(record.check_in_time), 'HH:mm', { locale: ru }) : '--:--'}
                                        </p>
                                    </div>
                                    {record.check_out_time ? (
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {mounted && record.check_out_time ? format(new Date(record.check_out_time), 'HH:mm', { locale: ru }) : '--:--'}
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                                            {lang === 'kk' ? 'Жұмыста' : 'На работе'}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => openEditModal(record)}
                                    className="ml-4 p-2 rounded-xl bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                    title={lang === 'kk' ? 'Уақытты өзгерту' : 'Изменить время'}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-foreground">{lang === 'kk' ? 'Уақытты өзгерту' : 'Изменить время'}</h3>
                            <button onClick={() => setEditRecord(null)} className="p-2 bg-secondary rounded-xl cursor-pointer"><X className="w-4 h-4 text-foreground"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase">{lang === 'kk' ? 'Келген уақыты' : 'Время прихода'}</label>
                                <input 
                                    type="time" 
                                    value={editCheckIn}
                                    onChange={(e) => setEditCheckIn(e.target.value)}
                                    className="w-full mt-1 bg-secondary/50 p-3 rounded-xl outline-none focus:ring-2 ring-primary/20 text-foreground"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase">{lang === 'kk' ? 'Кеткен уақыты' : 'Время ухода'}</label>
                                <input 
                                    type="time" 
                                    value={editCheckOut}
                                    onChange={(e) => setEditCheckOut(e.target.value)}
                                    className="w-full mt-1 bg-secondary/50 p-3 rounded-xl outline-none focus:ring-2 ring-primary/20 text-foreground"
                                />
                            </div>

                            <button 
                                onClick={saveEdit}
                                disabled={saving}
                                className="w-full mt-4 bg-primary text-primary-foreground p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all cursor-pointer shadow-md"
                            >
                                {saving ? (lang === 'kk' ? 'Сақталуда...' : 'Сохранение...') : <><Save className="w-5 h-5"/> {lang === 'kk' ? 'Сақтау' : 'Сохранить'}</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
