import { notFound } from 'next/navigation'

import { PaymentForm } from '@/components/customer/payment-form'
import { demoCustomerRestaurants } from '@/lib/demo-restaurants'

type PaymentPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return demoCustomerRestaurants.map((restaurant) => ({ slug: restaurant.slug }))
}

export default async function PaymentPage({ params }: PaymentPageProps) {
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
        <PaymentForm restaurantSlug={slug} />
      </main>
    </div>
  )
}
