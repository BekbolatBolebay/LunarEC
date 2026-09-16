'use client'

import { useApp } from '@/lib/app-context'
import { t } from '@/lib/i18n'
import { ArrowLeft, CreditCard, CheckCircle2, AlertTriangle, Crown, Star } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionClient({ cafe }: { cafe: any }) {
  const { lang } = useApp()

  const isTrial = cafe?.subscription_status === 'trialing'
  const isExpired = cafe?.subscription_status === 'expired' || (cafe?.subscription_ends_at && new Date(cafe.subscription_ends_at) < new Date())
  const isActive = cafe?.subscription_status === 'active' && !isExpired

  const trialEnds = new Date(cafe?.trial_ends_at || Date.now())
  const subEnds = new Date(cafe?.subscription_ends_at || Date.now())

  return (
    <div className="flex flex-col min-h-full bg-muted/20">
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/management" className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{lang === 'kk' ? 'Жазылым' : 'Подписка'}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isExpired ? 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/50' : 'bg-card border-border'}`}>
          <div className="flex items-center gap-3 mb-4">
            {isTrial ? (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
            ) : isActive ? (
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold">
                {isTrial ? (lang === 'kk' ? 'Сынақ мерзімі (Trial)' : 'Тестовый период (Trial)') :
                 isActive ? (lang === 'kk' ? 'Белсенді жазылым' : 'Активная подписка') :
                 (lang === 'kk' ? 'Жазылым аяқталды' : 'Подписка истекла')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === 'kk' ? cafe?.name_kk : cafe?.name_ru}
              </p>
            </div>
          </div>

          <div className="bg-background/50 rounded-xl p-4">
            <p className="text-sm font-medium">
              {lang === 'kk' ? 'Аяқталу уақыты:' : 'Действует до:'} <span className="font-bold">{isTrial ? trialEnds.toLocaleDateString() : subEnds.toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Pricing Table Mock */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-500" />
            {lang === 'kk' ? 'Тарифтер' : 'Тарифы'}
          </h3>
          <div className="space-y-4">
            <div className={`p-4 border rounded-xl ${cafe?.pricing_plan === 'basic' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex justify-between items-center">
                <div className="font-bold text-lg">PRO Tariff</div>
                <div className="text-primary font-black">25,000 ₸ / ай</div>
              </div>
              <ul className="text-sm mt-3 space-y-1 text-muted-foreground">
                <li>• {lang === 'kk' ? 'Odoo ERP синхронизациясы' : 'Синхронизация с Odoo ERP'}</li>
                <li>• {lang === 'kk' ? 'Онлайн тапсырыс қабылдау' : 'Прием онлайн заказов'}</li>
                <li>• {lang === 'kk' ? 'POS терминал қосымшасы' : 'Приложение POS терминала'}</li>
              </ul>
              <div className="flex flex-col gap-2 mt-5">
                <a 
                  href={`https://wa.me/777565587158?text=Сәлеметсіз бе! Мен ${cafe?.name_kk || cafe?.name_ru} кафесі үшін жазылымды ұзартқым келеді.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#1ebc59] text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {lang === 'kk' ? 'WhatsApp арқылы ұзарту' : 'Продлить через WhatsApp'}
                </a>
                
                <button 
                  onClick={async () => {
                    const { createClient } = await import('@/lib/supabase/client');
                    const supabase = createClient();
                    const newDate = new Date();
                    newDate.setMonth(newDate.getMonth() + 1);
                    await supabase.from('restaurants').update({
                      subscription_status: 'active',
                      subscription_ends_at: newDate.toISOString(),
                      pricing_plan: 'pro'
                    }).eq('id', cafe.id);
                    window.location.reload();
                  }}
                  className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg font-bold hover:bg-secondary/80 active:scale-95 transition-all text-xs border border-border"
                >
                  {lang === 'kk' ? 'Төлемді тест ретінде растау (DEV)' : 'Тестовая оплата (DEV)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
