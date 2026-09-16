import { getCurrentRestaurantId } from '@/lib/db'
import AttendanceClient from './attendance-client'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
    const cafeId = await getCurrentRestaurantId()
    return <AttendanceClient cafeId={cafeId} />
}
