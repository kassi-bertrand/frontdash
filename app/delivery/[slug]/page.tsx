import { notFound } from 'next/navigation'

import { DeliveryForm } from '@/components/customer/delivery-form'
import { demoCustomerRestaurants } from '@/lib/demo-restaurants'

type DeliveryPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return demoCustomerRestaurants.map((restaurant) => ({ slug: restaurant.slug }))
}

export default async function DeliveryPage({ params }: DeliveryPageProps) {
  const { slug } = await params
  const restaurantExists = demoCustomerRestaurants.some(
    (restaurant) => restaurant.slug === slug,
  )

  if (!restaurantExists) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <main className="mx-auto w-full max-w-3xl px-6">
        <DeliveryForm restaurantSlug={slug} />
      </main>
    </div>
  )
}
