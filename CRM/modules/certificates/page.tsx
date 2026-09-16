import { getCurrentRestaurantId } from '@/lib/db'
import CertificatesClient from './certificates-client'

export default async function CertificatesPage() {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return null

    return <CertificatesClient restaurantId={restaurantId} />
}
