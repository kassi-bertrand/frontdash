'use client'

import { use } from 'react'
import { OrderConfirmation } from '@/components/customer/order-confirmation'

type ConfirmationPageProps = {
  params: Promise<{ slug: string }>
}

export default function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { slug } = use(params)

  // OrderConfirmation handles order submission and empty cart state internally
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <main className="mx-auto w-full max-w-5xl px-6">
        <OrderConfirmation restaurantSlug={slug} />
      </main>
    </div>
  )
}
