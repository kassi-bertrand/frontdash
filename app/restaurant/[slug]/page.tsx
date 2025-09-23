// STORY-C002/C003 detail screen: surfaces a single restaurant, menu, and basic
// selection flow until real data is available.
import { notFound } from 'next/navigation'

import { RestaurantDetail } from '@/components/customer/restaurant-detail'
import { demoCustomerRestaurants } from '@/lib/demo-restaurants'

type RestaurantPageProps = {
  params: { slug: string }
}

// Pre-render all mock slugs so the detail route works out of the box.
export function generateStaticParams() {
  return demoCustomerRestaurants.map((restaurant) => ({ slug: restaurant.slug }))
}

/**
 * Route entry point – looks up the restaurant by slug and renders the detail
 * view. Falls back to Next.js 404 if the slug is missing from the mock data.
 */
export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await Promise.resolve(params)
  const restaurant = demoCustomerRestaurants.find((item) => item.slug === slug)

  if (!restaurant) {
    notFound()
  }

  return <RestaurantDetail restaurant={restaurant} />
}
