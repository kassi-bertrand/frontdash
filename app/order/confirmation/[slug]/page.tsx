import { notFound } from 'next/navigation'

import { OrderConfirmation } from '@/components/customer/order-confirmation'
import { demoCustomerRestaurants } from '@/lib/demo-restaurants'

type ConfirmationPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return demoCustomerRestaurants.map((restaurant) => ({ slug: restaurant.slug }))
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { slug } = await params
  const restaurantExists = demoCustomerRestaurants.some(
    (restaurant) => restaurant.slug === slug,
  )

  if (!restaurantExists) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <main className="mx-auto w-full max-w-5xl px-6">
        <OrderConfirmation restaurantSlug={slug} />
      </main>
    </div>
  )
}
