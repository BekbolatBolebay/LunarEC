import { getWorkers, getCurrentRestaurantId } from '@/lib/db'
import WorkersClient from './workers-client'

export const dynamic = 'force-dynamic'

export default async function WorkersPage() {
  const workers = await getWorkers()
  const cafeId = await getCurrentRestaurantId()
  return <WorkersClient initialWorkers={workers} cafeId={cafeId} />
}
