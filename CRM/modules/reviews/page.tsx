import { getReviews, getCafeSettings } from '@/lib/db'
import ReviewsClient from './reviews-client'

export default async function ReviewsPage() {
    const [reviews, restaurant] = await Promise.all([
        getReviews(),
        getCafeSettings()
    ])

    return (
        <ReviewsClient initialReviews={reviews} restaurant={restaurant} />
    )
}
