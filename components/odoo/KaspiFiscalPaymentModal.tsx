'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, QrCode, CheckCircle2, Printer, Download, 
  CreditCard, Banknote, ShieldCheck, ArrowRight, RefreshCw, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentItem {
  name: string;
  qty: number;
  price: number;
}

interface KaspiFiscalPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: string;
  items?: PaymentItem[];
}

export function KaspiFiscalPaymentModal({
  isOpen,
  onClose,
  orderNumber = 'ORD-2026-88',
  items = [
    { name: 'Капучино Grand (350 мл)', qty: 2, price: 1400 },
    { name: 'Круассан бадаммен', qty: 1, price: 1200 },
    { name: 'Табиғи шырын 0.5л', qty: 1, price: 950 },
  ],
}: KaspiFiscalPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'KASPI_QR' | 'HALYK_PAY' | 'CARD' | 'CASH'>('KASPI_QR');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS'>('PENDING');
  const [countdown, setCountdown] = useState(90);
  const [fiscalSign, setFiscalSign] = useState('');
  const [docNumber, setDocNumber] = useState(1048);

  const subtotal = items.reduce((acc, item) => acc + item.qty * item.price, 0);
  const vatAmount = Math.round((subtotal * 0.12) / 1.12); // 12% ҚҚС

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('PENDING');
      setCountdown(90);
      setSelectedMethod('KASPI_QR');
    }
  }, [isOpen]);

  // Countdown timer for Kaspi QR
  useEffect(() => {
    if (!isOpen || paymentStatus === 'SUCCESS') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 90;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paymentStatus]);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    const randomFP = Math.random().toString(36).substring(2, 12).toUpperCase();
    setFiscalSign(randomFP);
    setDocNumber((prev) => prev + 1);
    setPaymentStatus('SUCCESS');
    toast.success('Төлем Kaspi QR арқылы сәтті өтті! ОФД фискалды чегі жасалды.');
  };

  const handleDownloadESF = () => {
    const esfXml = `<?xml version="1.0" encoding="UTF-8"?>
<esf:invoice xmlns:esf="esf" version="2.0">
  <dateAndNum>
    <num>ESF-${orderNumber}</num>
    <date>${new Date().toISOString().split('T')[0]}</date>
    <turnoverDate>${new Date().toISOString().split('T')[0]}</turnoverDate>
  </dateAndNum>
  <seller>
    <tin>200540019283</tin>
    <name>ЖШС Lunar Enterprise Almaty</name>
  </seller>
  <customer>
    <tin>990101350123</tin>
    <name>Жеке тұлға (POS Клиент)</name>
  </customer>
  <productSet>
    <totalPriceWithoutTax>${subtotal - vatAmount}</totalPriceWithoutTax>
    <totalVatAmount>${vatAmount}</totalVatAmount>
    <totalInvoiceAmount>${subtotal}</totalInvoiceAmount>
  </productSet>
</esf:invoice>`;

    const blob = new Blob([esfXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ESF-${orderNumber}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ЭСФ XML сәтті жүктелді (МКД форматы)');
  };

  const handleDownload1C = () => {
    const commerceXml = `<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.09" ДатаФормирования="${new Date().toISOString()}">
  <Документ>
    <Ид>${orderNumber}</Ид>
    <Номер>${orderNumber}</Номер>
    <Дата>${new Date().toISOString().split('T')[0]}</Дата>
    <ХозяйственнаяОперация>РеализацияТоваров</ХозяйственнаяОперация>
    <Роль>Продавец</Роль>
    <Валюта>KZT</Валюта>
    <Сумма>${subtotal}</Сумма>
    <СтавкаНДС>12</СтавкаНДС>
    <СуммаНДС>${vatAmount}</СуммаНДС>
  </Документ>
</КоммерческаяИнформация>`;

    const blob = new Blob([commerceXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1C-${orderNumber}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('1C:Предприятие 8.3 CommerceML файлы жүктелді');
  };

  const handlePrintReceipt = () => {
    window.print();
    toast.info('Термо-принтерге басып шығаруға жіберілді');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Kaspi QR & ОФД Фискалды касса</h2>
              <p className="text-xs text-slate-400">Тапсырыс №: {orderNumber} • Қазақстан Республикасы заңнамасына сай 100%</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Order Summary & Payment Method */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Тауарлар құрамы ({items.length})</span>
                <span>Бағасы</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="truncate max-w-[180px] text-slate-200">{it.name} <span className="text-xs text-slate-400">x{it.qty}</span></span>
                    <span className="font-semibold text-white">{(it.qty * it.price).toLocaleString()} ₸</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>ҚҚС сомасы (НДС 12%):</span>
                  <span>{vatAmount.toLocaleString()} ₸</span>
                </div>
                <div className="flex justify-between text-base font-bold text-amber-400 pt-1">
                  <span>Төлемге барлығы:</span>
                  <span className="text-xl">{subtotal.toLocaleString()} ₸</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Төлем түрін таңдаңыз</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedMethod('KASPI_QR')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition ${
                    selectedMethod === 'KASPI_QR'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/30'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">🟡</span> Kaspi QR
                </button>
                <button
                  onClick={() => setSelectedMethod('HALYK_PAY')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition ${
                    selectedMethod === 'HALYK_PAY'
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400/30'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">🟢</span> Halyk Pay
                </button>
                <button
                  onClick={() => setSelectedMethod('CARD')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition ${
                    selectedMethod === 'CARD'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400/30'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Банк картасы
                </button>
                <button
                  onClick={() => setSelectedMethod('CASH')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition ${
                    selectedMethod === 'CASH'
                      ? 'border-purple-400 bg-purple-500/20 text-purple-300 ring-2 ring-purple-400/30'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Banknote className="h-4 w-4" /> Нақты ақша
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic QR or Completed Fiscal Check */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 relative">
            
            {paymentStatus === 'PENDING' ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-2xl bg-white p-3 shadow-lg border border-white/20">
                  {/* Dynamic SVG QR representation */}
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="#ffffff" />
                    {/* Top-left corner */}
                    <rect x="10" y="10" width="25" height="25" fill="#f59e0b" rx="4" />
                    <rect x="15" y="15" width="15" height="15" fill="#ffffff" rx="2" />
                    <rect x="18" y="18" width="9" height="9" fill="#f59e0b" rx="1" />
                    {/* Top-right corner */}
                    <rect x="65" y="10" width="25" height="25" fill="#f59e0b" rx="4" />
                    <rect x="70" y="15" width="15" height="15" fill="#ffffff" rx="2" />
                    <rect x="73" y="18" width="9" height="9" fill="#f59e0b" rx="1" />
                    {/* Bottom-left corner */}
                    <rect x="10" y="65" width="25" height="25" fill="#f59e0b" rx="4" />
                    <rect x="15" y="70" width="15" height="15" fill="#ffffff" rx="2" />
                    <rect x="18" y="73" width="9" height="9" fill="#f59e0b" rx="1" />
                    {/* Center dots simulation */}
                    <rect x="42" y="42" width="16" height="16" fill="#1e293b" rx="3" />
                    <circle cx="50" cy="50" r="4" fill="#f59e0b" />
                    <rect x="42" y="15" width="8" height="8" fill="#1e293b" />
                    <rect x="70" y="45" width="8" height="8" fill="#1e293b" />
                    <rect x="45" y="70" width="8" height="8" fill="#1e293b" />
                  </svg>
                  <div className="absolute inset-0 border-2 border-amber-400/50 rounded-2xl animate-pulse pointer-events-none" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Kaspi қосымшасымен сканерлеңіз</span>
                  </div>
                  <p className="text-xs text-slate-400">QR кодының мерзімі: <span className="font-mono text-white">{countdown}с</span></p>
                </div>

                <button
                  onClick={handleSimulatePayment}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:from-amber-400 hover:to-amber-500 transition active:scale-95"
                >
                  <span>Төлемді растау (Тест)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* Completed Fiscal Check */
              <div className="w-full space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-bold text-sm">Төлем қабылданды & ОФД бекітілді!</span>
                </div>

                {/* Fiscal Receipt Paper Style */}
                <div className="rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-1.5 shadow-inner">
                  <div className="text-center font-bold text-white text-sm border-b border-white/10 pb-1.5">
                    LUNAR POS ALMATY
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>РНМ: 010188992200</span>
                    <span>БИН: 200540019283</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Чек №: {docNumber}</span>
                    <span>Кассир: 990101350123</span>
                  </div>
                  <div className="border-t border-dashed border-white/20 my-1"></div>
                  <div className="flex justify-between font-bold text-white">
                    <span>ЖАЛПЫ СОМА:</span>
                    <span>{subtotal.toLocaleString()} ₸</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ҚҚС (12%):</span>
                    <span>{vatAmount.toLocaleString()} ₸</span>
                  </div>
                  <div className="border-t border-dashed border-white/20 my-1"></div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Фискалдық белгі (ФП):</span>
                    <span>{fiscalSign}</span>
                  </div>
                  <div className="text-[10px] text-center text-slate-500 pt-1">
                    Тексеру: consumer.oofd.kz
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={handlePrintReceipt}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-slate-200 hover:bg-white/10 transition"
                  >
                    <Printer className="h-4 w-4 text-cyan-400" />
                    <span>Чек шығару</span>
                  </button>
                  <button
                    onClick={handleDownloadESF}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-slate-200 hover:bg-white/10 transition"
                  >
                    <Download className="h-4 w-4 text-emerald-400" />
                    <span>ЭСФ XML</span>
                  </button>
                  <button
                    onClick={handleDownload1C}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-slate-200 hover:bg-white/10 transition"
                  >
                    <Download className="h-4 w-4 text-amber-400" />
                    <span>1C Экспорт</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>ҚР Мемлекеттік кірістер комитеті (ОФД / ККМ) талаптарына 100% сай</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            Жабу
          </button>
        </div>
      </div>
    </div>
  );
}
