// STORY-C004 order review route: renders the cart summary once the customer
// chooses to review their selections.
'use client'

import { use } from 'react'
import { OrderReview } from '@/components/customer/order-review'

type CheckoutPageProps = {
  params: Promise<{ slug: string }>
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = use(params)

  // OrderReview handles "empty cart" state internally - shows message + redirect links
  return <OrderReview restaurantSlug={slug} />
}
