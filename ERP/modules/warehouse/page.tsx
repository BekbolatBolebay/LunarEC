import { getCurrentRestaurantId } from '@/lib/db'
import { redirect } from 'next/navigation'
import WarehouseClient from './warehouse-client'

export const metadata = {
  title: 'Қойма / Склад',
}

export default async function WarehousePage() {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) redirect('/login')

  return <WarehouseClient cafeId={restaurantId} />
}
