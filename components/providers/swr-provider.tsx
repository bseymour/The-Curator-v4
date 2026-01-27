'use client'

import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'

// Create a stable cache that persists across route navigations
// This is stored in module scope so it survives component unmounts
const globalCache = new Map()

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        provider: () => globalCache,
        // Default SWR options for better caching behavior
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000, // 1 minute deduping
      }}
    >
      {children}
    </SWRConfig>
  )
}
