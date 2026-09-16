import { getCurrentRestaurantId } from '@/lib/db'
import ReservationsClient from './reservations-client'

export default async function ReservationsPage() {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return null

    return <ReservationsClient restaurantId={restaurantId} />
}
