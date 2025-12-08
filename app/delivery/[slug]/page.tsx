'use client'

import { use } from 'react'
import { DeliveryForm } from '@/components/customer/delivery-form'

type DeliveryPageProps = {
  params: Promise<{ slug: string }>
}

export default function DeliveryPage({ params }: DeliveryPageProps) {
  const { slug } = use(params)

  // DeliveryForm handles "empty cart" state internally
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <main className="mx-auto w-full max-w-3xl px-6">
        <DeliveryForm restaurantSlug={slug} />
      </main>
    </div>
  )
}
