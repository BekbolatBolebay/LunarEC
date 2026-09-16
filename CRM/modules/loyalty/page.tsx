import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoyaltyClient from './loyalty-client'

export const metadata = { title: 'Loyalty / Бонусная программа' }

export default async function LoyaltyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <LoyaltyClient />
}
