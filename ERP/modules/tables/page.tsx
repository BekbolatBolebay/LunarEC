import { getTables, getCurrentRestaurantId } from '@/lib/db'
import TablesClient from './tables-client'

export default async function TablesPage() {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return null

    const tables = await getTables(restaurantId)
    const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://mazirapp.kz'

    return <TablesClient
        initialTables={tables}
        restaurantId={restaurantId}
        clientUrl={clientUrl}
    />
}
