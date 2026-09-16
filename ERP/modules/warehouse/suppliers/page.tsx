import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuppliersClient from './suppliers-client'

export const metadata = { title: 'Жеткізушілер / Поставщики' }

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <SuppliersClient />
}
