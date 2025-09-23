import { notFound } from 'next/navigation'

import { PaymentForm } from '@/components/customer/payment-form'
import { demoCustomerRestaurants } from '@/lib/demo-restaurants'

type PaymentPageProps = {
  params: { slug: string }
}

export function generateStaticParams() {
  return demoCustomerRestaurants.map((restaurant) => ({ slug: restaurant.slug }))
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const restaurantExists = demoCustomerRestaurants.some(
    (restaurant) => restaurant.slug === params.slug,
  )

  if (!restaurantExists) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <main className="mx-auto w-full max-w-3xl px-6">
        <PaymentForm restaurantSlug={params.slug} />
      </main>
    </div>
  )
}
