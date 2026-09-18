'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Award, PieChart as PieIcon,
  BarChart3, Sparkles, Clock, Download, RefreshCw, Layers,
  Utensils, Box, ShieldCheck, Activity, Flame, CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '@/lib/store';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';

// Data sets for different timeframes
const weeklyRevenueData = [
  { label: 'Дүй', revenue: 420000, cogs: 145000, profit: 275000, margin: 65.5, orders: 74 },
  { label: 'Сей', revenue: 380000, cogs: 130000, profit: 250000, margin: 65.8, orders: 68 },
  { label: 'Сәр', revenue: 510000, cogs: 180000, profit: 330000, margin: 64.7, orders: 89 },
  { label: 'Бей', revenue: 490000, cogs: 165000, profit: 325000, margin: 66.3, orders: 85 },
  { label: 'Жұм', revenue: 780000, cogs: 260000, profit: 520000, margin: 66.7, orders: 135 },
  { label: 'Сен', revenue: 920000, cogs: 310000, profit: 610000, margin: 66.3, orders: 160 },
  { label: 'Жек', revenue: 850000, cogs: 290000, profit: 560000, margin: 65.9, orders: 148 },
];

const monthlyRevenueData = [
  { label: '1-апта', revenue: 2850000, cogs: 970000, profit: 1880000, margin: 66.0, orders: 510 },
  { label: '2-апта', revenue: 3100000, cogs: 1050000, profit: 2050000, margin: 66.1, orders: 545 },
  { label: '3-апта', revenue: 3450000, cogs: 1180000, profit: 2270000, margin: 65.8, orders: 612 },
  { label: '4-апта', revenue: 4350000, cogs: 1480000, profit: 2870000, margin: 66.0, orders: 759 },
];

const aiForecastData = [
  { hour: '10:00', actual: 45000, predicted: 42000, upper: 48000, lower: 36000 },
  { hour: '11:00', actual: 85000, predicted: 80000, upper: 92000, lower: 68000 },
  { hour: '12:00', actual: 210000, predicted: 195000, upper: 230000, lower: 160000 },
  { hour: '13:00', actual: 285000, predicted: 270000, upper: 310000, lower: 230000 },
  { hour: '14:00', actual: 190000, predicted: 185000, upper: 215000, lower: 155000 },
  { hour: '15:00', actual: 95000, predicted: 100000, upper: 120000, lower: 80000 },
  { hour: '16:00', actual: 120000, predicted: 115000, upper: 135000, lower: 95000 },
  { hour: '17:00', actual: 175000, predicted: 180000, upper: 205000, lower: 155000 },
  { hour: '18:00', actual: 310000, predicted: 300000, upper: 345000, lower: 255000 },
  { hour: '19:00', actual: 390000, predicted: 380000, upper: 430000, lower: 330000 },
  { hour: '20:00', actual: 340000, predicted: 350000, upper: 395000, lower: 305000 },
  { hour: '21:00', actual: 180000, predicted: 190000, upper: 220000, lower: 160000 },
  { hour: '22:00', actual: null, predicted: 95000, upper: 115000, lower: 75000 },
  { hour: '23:00', actual: null, predicted: 45000, upper: 60000, lower: 30000 },
];

const stockCategoryData = [
  { name: 'Ет өнімдері (Beef/Chicken)', value: 1850000, color: '#F43F5E' },
  { name: 'Сүт және ірімшік', value: 890000, color: '#3B82F6' },
  { name: 'Сусындар мен Кофе', value: 720000, color: '#10B981' },
  { name: 'Бакалея мен Соустар', value: 640000, color: '#F59E0B' },
  { name: 'Қаптамалар (Boxes/Cups)', value: 340000, color: '#8B5CF6' },
];

const bcgMenuItems = [
  {
    name: 'Mazir Black Angus Бургер',
    category: 'Star',
    icon: '⭐',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    volume: 184,
    price: 3600,
    cogs: 1200,
    marginPct: 66.7,
    totalProfit: 441600,
    strategy: 'Негізгі хит. Сапа стандартын қатаң сақтау қажет.'
  },
  {
    name: 'Классикалық Чизбургер',
    category: 'Plowhorse',
    icon: '🐎',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    volume: 210,
    price: 2800,
    cogs: 1100,
    marginPct: 60.7,
    totalProfit: 357000,
    strategy: 'Сұранысы өте жоғары. Өзіндік құнын 5%-ға төмендету ұсынылады.'
  },
  {
    name: 'Truffle Ribeye Стейк',
    category: 'Puzzle',
    icon: '🧩',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    volume: 38,
    price: 8900,
    cogs: 2900,
    marginPct: 67.4,
    totalProfit: 228000,
    strategy: 'Маржасы өте жоғары. Мәзірдің басты бетіне шығарып жарнамалау керек.'
  },
  {
    name: 'Жай көкөніс салаты',
    category: 'Dog',
    icon: '🐕',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    volume: 24,
    price: 1500,
    cogs: 750,
    marginPct: 50.0,
    totalProfit: 18000,
    strategy: 'Сұранысы да маржасы да төмен. Рецептурасын жаңарту ұсынылады.'
  }
];

export function OdooAnalyticsView() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'forecast' | 'stock' | 'bcg'>('revenue');
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isLiveActive, setIsLiveActive] = useState(false);

  const activeRevenueData = timeframe === 'week' ? weeklyRevenueData : monthlyRevenueData;

  const totalRevenue = useMemo(() => activeRevenueData.reduce((acc, d) => acc + d.revenue, 0), [activeRevenueData]);
  const totalCogs = useMemo(() => activeRevenueData.reduce((acc, d) => acc + d.cogs, 0), [activeRevenueData]);
  const totalProfit = totalRevenue - totalCogs;
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  const handleExportReport = () => {
    toast.success('📊 Аналитикалық есеп сәтті экспортталды (PDF/Excel)', {
      description: `Кезең: ${timeframe === 'week' ? 'Соңғы 7 күн' : 'Соңғы 30 күн'} | Барлық филиалдар`
    });
  };

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#F8F9FA] overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Filters & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-odoo-purple/10 text-odoo-purple">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                LunarEC Кәсіпорын Аналитикасы
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" /> Live Polyglot Stream
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              TypeScript UI • Rust FIFO/LIFO Core • Go POS Gateway • Python AI Demand Forecasting
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Branch Selector */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              aria-label="Филиал таңдау"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-odoo-purple"
            >
              <option value="all">🏢 Барлық Филиалдар (3)</option>
              <option value="main">📍 Бас Мейрамхана (Алматы)</option>
              <option value="dostyk">📍 Dostyk Plaza нүктесі</option>
              <option value="mega">📍 Mega Park нүктесі</option>
            </select>

            {/* Live Toggle */}
            <button
              onClick={() => {
                setIsLiveActive(!isLiveActive);
                toast(isLiveActive ? 'Live ағын тоқтатылды' : '🟢 Live нақты уақыт ағыны қосылды');
              }}
              className={`text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors border ${
                isLiveActive 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-spin' : ''}`} />
              {isLiveActive ? 'Live Ағын Қосулы' : 'Live Бақылау'}
            </button>

            {/* Export Report */}
            <button
              onClick={handleExportReport}
              className="text-xs px-3 py-2 rounded-lg font-semibold bg-odoo-purple text-white hover:bg-odoo-purple-hover flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Есеп Жүктеу
            </button>
          </div>
        </div>

        {/* Top KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Жалпы Түсім (Revenue)
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(totalRevenue)}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +14.2%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {timeframe === 'week' ? 'Апталық кезең бойынша' : 'Айлық кезең бойынша'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                COGS (Шикізат Құны)
              </span>
              <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(totalCogs)}
              </span>
              <span className="text-xs font-bold text-slate-500">
                ({(100 - Number(avgMargin)).toFixed(1)}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Rust FIFO қойма есебінен</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Таза Маржа (Gross Profit)
              </span>
              <span className="w-8 h-8 rounded-lg bg-odoo-purple/10 text-odoo-purple flex items-center justify-center">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-odoo-purple font-mono">
                {formatCurrency(totalProfit)}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> {avgMargin}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Мейрамхана таза пайдасы</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Орташа Чек және Тапсырыс
              </span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(6850)}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> 635 чек
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Go POS Gateway ағыны</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'revenue'
                  ? 'bg-odoo-purple text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              1. Түсім мен Шығын Динамикасы
            </button>

            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'forecast'
                  ? 'bg-odoo-purple text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              2. Python AI Сұраныс Болжамы
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'stock'
                  ? 'bg-odoo-purple text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3. Rust Қойма Бағалауы
            </button>

            <button
              onClick={() => setActiveTab('bcg')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'bcg'
                  ? 'bg-odoo-purple text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              4. ABC / BCG Мәзір Матрицасы
            </button>
          </div>

          {activeTab === 'revenue' && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setTimeframe('week')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                  timeframe === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Күн
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                  timeframe === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Күн
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: Revenue vs COGS Main Dynamic Charts */}
        {activeTab === 'revenue' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>Күнделікті Түсім және Өзіндік Құн (COGS)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      Маржа: {avgMargin}%
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Жалпы кассалық түсім (Жасыл) мен шикізат шығынының (Қызыл) салыстырмалы динамикасы
                  </p>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis 
                      stroke="#64748B" 
                      fontSize={12} 
                      tickLine={false} 
                      tickFormatter={(val) => `${val / 1000}k ₸`} 
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="revenue" name="Жалпы Түсім (Revenue)" fill="#00A09D" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="cogs" name="Өзіндік құн (COGS)" fill="#F43F5E" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="profit" name="Таза пайда (Gross Profit)" fill="#714B67" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit Margin Area Chart */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  Таза Маржа Тренді (%)
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Мейрамхана маржинальділігінің тұрақтылығы
                </p>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeRevenueData}>
                      <defs>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#714B67" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#714B67" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis domain={[50, 80]} stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        formatter={(val: any) => [`${val}%`, 'Маржа']}
                        contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="margin" stroke="#714B67" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Орташа маржа:</span>
                  <span className="font-bold text-slate-900">{avgMargin}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Ең жоғарғы күн:</span>
                  <span className="font-bold text-emerald-600">Жұма (66.7%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI Demand Forecasting & Rush Hours */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-odoo-purple" />
                    <span>Python AI Сағаттық Сатылым Болжамы (Demand Forecast)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                      Confidence 95%
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Уақыт қатары (Time-Series ARIMA/Prophet) моделі нақты түсім мен кешкі қарбалас уақытын дәл болжайды
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    <span className="text-slate-600">Нақты Сатылым</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-odoo-purple border border-dashed border-odoo-purple"></span>
                    <span className="text-slate-600">AI Болжамы</span>
                  </div>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={aiForecastData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="hour" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(val) => `${val / 1000}k ₸`} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [formatCurrency(Number(value)), name === 'actual' ? 'Нақты түсім' : 'AI болжамы']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="actual" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} name="actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#714B67" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} name="predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Actionable Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Кешкі Қарбалас Шағы (Peak Hour)
                </div>
                <p className="text-xl font-extrabold text-amber-950 mt-1">19:00 — 20:30</p>
                <p className="text-xs text-amber-700 mt-1">
                  Болжамды жүктеме: сағатына 390 000 ₸. Асүйге қосымша 1 аспаз шығару ұсынылады.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Шикізат Дайындығы
                </div>
                <p className="text-xl font-extrabold text-emerald-950 mt-1">100% Қамтылған</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Rust Stock Engine қоймадағы ет, ірімшік және тоқаш қорының кешкі сұранысқа толық жететінін растады.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Орташа Дайындау Уақыты (KDS)
                </div>
                <p className="text-xl font-extrabold text-blue-950 mt-1">6 мин 40 сек</p>
                <p className="text-xs text-blue-700 mt-1">
                  Go POS Gateway арқылы касса мен ас үй маршрутизаторы синхронды жұмыс істеуде.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Rust Stock Engine Valuation & Category Breakdown */}
        {activeTab === 'stock' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Box className="w-4 h-4 text-rose-500" />
                  <span>Қойма Құрылымы және Қалдық Бағалауы (Rust Valuation Engine)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Қоймадағы жалпы қор құны: <strong>4 440 000 ₸</strong> (FIFO әдісімен есептелген)
                </p>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stockCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Қор сомасы']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 mb-2">
                Санаттар бойынша бөлініс
              </h4>
              
              {stockCategoryData.map((cat, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-xs font-semibold text-slate-700">{cat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {formatCurrency(cat.value)}
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>Қойма айналым жылдамдығы:</span>
                <span className="font-bold text-emerald-600">4.2 күн (Өте жылдам)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ABC / BCG Menu Engineering Matrix */}
        {activeTab === 'bcg' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <h4 className="font-bold text-sm text-slate-900 mb-1">
                BCG / Kasavana-Smith Мәзір Инжинирингі Матрицасы
              </h4>
              <p className="text-xs text-slate-500">
                Әрбір мәзір позициясы Сұраныс көлемі (Volume) мен Таза маржинальділік (Margin) бойынша автоматты сараланады:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bcgMenuItems.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900">{item.name}</h5>
                        <span className="text-[11px] text-slate-500">Сатылым: {item.volume} дана</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.badgeClass}`}>
                      {item.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Бағасы</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">{formatCurrency(item.price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Маржа</span>
                      <span className="text-xs font-bold text-emerald-600">{item.marginPct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Жалпы Пайда</span>
                      <span className="text-xs font-bold text-odoo-purple font-mono">{formatCurrency(item.totalProfit)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50/50 p-2 rounded border border-slate-100 italic">
                    💡 <strong>Стратегия:</strong> {item.strategy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
