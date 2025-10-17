"use client"

// Simple localStorage hook with SSR safety
import { useEffect, useState } from "react"

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) setValue(JSON.parse(raw))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])

  return [value, setValue] as const
}
