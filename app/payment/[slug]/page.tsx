'use client'

import { use } from 'react'
import { PaymentForm } from '@/components/customer/payment-form'

type PaymentPageProps = {
  params: Promise<{ slug: string }>
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { slug } = use(params)

  // PaymentForm handles "empty cart" state internally
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <main className="mx-auto w-full max-w-3xl px-6">
        <PaymentForm restaurantSlug={slug} />
      </main>
    </div>
  )
}
