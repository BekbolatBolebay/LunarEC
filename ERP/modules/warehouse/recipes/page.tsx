import { getCurrentRestaurantId } from '@/lib/db'
import { redirect } from 'next/navigation'
import RecipesClient from './recipes-client'

export const metadata = {
  title: 'Тех-карталар / Рецепты',
}

export default async function RecipesPage() {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) redirect('/login')

  return <RecipesClient cafeId={restaurantId} />
}
