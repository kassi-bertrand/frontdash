'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useLogoutRedirect() {
  const router = useRouter()

  return useCallback(() => {
    router.push('/')
    // TODO: replace with real auth sign-out once backend is wired up.
    // Example:
    // await authClient.signOut();
    // router.push('/');
  }, [router])
}
