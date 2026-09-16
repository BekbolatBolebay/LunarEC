import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionClient from './subscription-client'

export const metadata = {
  title: 'Жазылым / Подписка',
}

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role, cafe_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.cafe_id) redirect('/login')

  // Fetch restaurant subscription data
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name_kk, name_ru, subscription_status, trial_ends_at, subscription_ends_at, pricing_plan')
    .eq('id', profile.cafe_id)
    .single()

  return <SubscriptionClient cafe={restaurant} />
}
