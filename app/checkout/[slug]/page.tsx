// STORY-C004 order review route: renders the cart summary once the customer
// chooses to review their selections.
import { notFound } from 'next/navigation'

import { OrderReview } from '@/components/customer/order-review'
import { demoCustomerRestaurants } from '@/lib/demo-restaurants'

type CheckoutPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return demoCustomerRestaurants.map((restaurant) => ({ slug: restaurant.slug }))
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params
  const restaurantExists = demoCustomerRestaurants.some((item) => item.slug === slug)

  if (!restaurantExists) {
    notFound()
  }

  return <OrderReview restaurantSlug={slug} />
}
