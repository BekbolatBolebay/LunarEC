import { getAnalytics, getOrders, getMenuItems } from '@/lib/db'
import AnalyticsClient from './analytics-client'

export default async function AnalyticsPage() {
  const [orders, items] = await Promise.all([getOrders(), getMenuItems()])
  return <AnalyticsClient orders={orders} menuItems={items} />
}
