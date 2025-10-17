"use client"

import { useCallback, useMemo } from "react"
import { Howl } from "howler"
import { useLocalStorage } from "./use-local-storage"

export function useSound() {
  const [muted, setMuted] = useLocalStorage<boolean>("sound-muted", false)

  const click = useMemo(
    () =>
      new Howl({
        src: ["https://upload.wikimedia.org/wikipedia/commons/4/43/Beep-09.ogg"],
        volume: 0.08,
        html5: true,
        preload: true,
        mute: muted,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muted],
  )

  const playClick = useCallback(() => {
    if (muted) return
    try {
      click.play()
    } catch {}
  }, [click, muted])

  const playCry = useCallback(
    (url: string) => {
      if (muted) return
      try {
        const cry = new Howl({ src: [url], volume: 0.12, html5: true, preload: true })
        cry.play()
      } catch {
        playClick()
      }
    },
    [muted, playClick],
  )

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [setMuted])

  return { playClick, playCry, muted, toggleMute }
}
