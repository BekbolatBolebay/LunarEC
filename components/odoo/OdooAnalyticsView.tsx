'use client';

import React from 'react';
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, 
  ArrowUpRight, ArrowDownRight, Award, PieChart as PieIcon 
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
} from 'recharts';

const revenueData = [
  { day: 'Дүй', revenue: 420000, cogs: 145000, profit: 275000 },
  { day: 'Сей', revenue: 380000, cogs: 130000, profit: 250000 },
  { day: 'Сәр', revenue: 510000, cogs: 180000, profit: 330000 },
  { day: 'Бей', revenue: 490000, cogs: 165000, profit: 325000 },
  { day: 'Жұм', revenue: 780000, cogs: 260000, profit: 520000 },
  { day: 'Сен', revenue: 920000, cogs: 310000, profit: 610000 },
  { day: 'Жек', revenue: 850000, cogs: 290000, profit: 560000 },
];

export function OdooAnalyticsView() {
  return (
    <div className="flex-1 p-6 bg-[#F8F9FA] overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Апталық Түсім
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(4350000)}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +14.2%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Өткен аптамен салыстырғанда</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                COGS (Өзіндік құн шығыны)
              </span>
              <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(1480000)}
              </span>
              <span className="text-xs font-bold text-slate-500">
                (34.0%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Қоймадан шегерілген шикізат</p>
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
                {formatCurrency(2870000)}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> 66.0%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ресторанның таза пайдасы</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Орташа Чек
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
                <ArrowUpRight className="w-3 h-3" /> +5.8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">635 тапсырыс бойынша</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart: Revenue vs COGS */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Күнделікті Түсім және Өзіндік Құн Динамикасы
                </h4>
                <p className="text-xs text-slate-500">
                  Түсім (Жасыл) мен Тағам өзіндік құнының (Қызыл) арақатынасы
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="revenue" name="Түсім (Revenue)" fill="#00A09D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cogs" name="Өзіндік құн (COGS)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CRM Sales Funnel / ABC Analysis */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">
                Ең Көп Сатылатын Тағамдар (ABC)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Кірістілігі мен сұранысы жоғары позициялар
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Mazir Black Angus Бургер</span>
                    <span className="text-[10px] text-slate-500">184 дана сатылды</span>
                  </div>
                  <span className="font-bold text-xs text-slate-900 font-mono">662 400 ₸</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Классикалық Чизбургер</span>
                    <span className="text-[10px] text-slate-500">210 дана сатылды</span>
                  </div>
                  <span className="font-bold text-xs text-slate-900 font-mono">588 000 ₸</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Капучино Grand (350ml)</span>
                    <span className="text-[10px] text-slate-500">340 шыны</span>
                  </div>
                  <span className="font-bold text-xs text-slate-900 font-mono">476 000 ₸</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Картоп фри Aviko</span>
                    <span className="text-[10px] text-slate-500">290 порция</span>
                  </div>
                  <span className="font-bold text-xs text-slate-900 font-mono">348 000 ₸</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Жалпы мәзір маржинальділігі:</span>
              <span className="font-bold text-emerald-700">67.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
