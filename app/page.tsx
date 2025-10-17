"use client"

import { useMemo, useState, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PokemonOrbit } from "@/components/pokemon-orbit"
import { PokemonDetail } from "@/components/pokemon-detail"
import { getTypeThemeColor, usePokemonList, shuffleIds } from "@/lib/pokeapi"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useSound } from "@/hooks/use-sound"
import { cn } from "@/lib/utils"

// Simple fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Page() {
  // Choose 12 Pokémon ids initially
  const [ids, setIds] = useState<number[]>(() => Array.from({ length: 12 }, (_, i) => i + 1))
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [caught, setCaught] = useLocalStorage<number[]>("caught-pokemon", [])
  const { data: pokemon, isLoading } = usePokemonList(ids)
  const router = useRouter()

  const selected = useMemo(() => pokemon?.find((p) => p.id === selectedId) ?? null, [pokemon, selectedId])

  // Sounds
  const { playClick, playCry, muted, toggleMute } = useSound()

  const onSelect = useCallback(
    (id: number) => {
      setSelectedId(id)
      // Try to play cry if available; else click
      const pk = pokemon?.find((p) => p.id === id)
      if (pk?.cries?.latest) playCry(pk.cries.latest)
      else playClick()
    },
    [pokemon, playClick, playCry],
  )

  const onBack = useCallback(() => {
    setSelectedId(null)
    playClick()
  }, [playClick])

  const theme = useMemo(() => {
    if (!selected) return undefined
    const primaryType = selected.types?.[0]?.type?.name as string | undefined
    return getTypeThemeColor(primaryType)
  }, [selected])

  const onCatch = useCallback(() => {
    if (!selectedId) return
    setCaught((prev) => (prev.includes(selectedId) ? prev : [...prev, selectedId]))
    playClick()
  }, [selectedId, setCaught, playClick])

  const onRelease = useCallback(() => {
    if (!selectedId) return
    setCaught((prev) => prev.filter((id) => id !== selectedId))
    playClick()
  }, [selectedId, setCaught, playClick])

  const caughtCount = caught.length

  const onShuffle = useCallback(() => {
    setIds((prev) => shuffleIds(prev.length))
    setSelectedId(null)
    playClick()
  }, [playClick])

  return (
    <main
      className={cn("min-h-dvh relative overflow-hidden", "flex flex-col items-center justify-start md:justify-center")}
      style={{
        // Dynamic theme by Pokémon type
        // fallback to accent token to stay on theme when no selection
        ["--theme-color" as any]: theme ?? "var(--color-accent)",
      }}
    >
      {/* Background gradient and watermark ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--theme-color) 14%, transparent) 0%, transparent 70%), linear-gradient(180deg, var(--bg-start) 0%, var(--bg-end) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage: "radial-gradient(40% 40% at 50% 50%, rgba(0,0,0,0.2) 0%, transparent 60%)",
          WebkitMaskImage: "radial-gradient(40% 40% at 50% 50%, rgba(0,0,0,0.2) 0%, transparent 60%)",
          borderRadius: "9999px",
        }}
      />

      <header className="z-10 w-full max-w-5xl mx-auto px-4 pt-6 md:pt-10 flex items-center justify-between">
        <h1
          className="text-pretty font-sans font-semibold tracking-tight text-2xl md:text-4xl"
          style={{ color: "var(--color-text-strong)" }}
        >
          Pokémon Orbit
        </h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/catch')} className="font-sans bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
            Play Game
          </Button>
          <Button variant="secondary" onClick={onShuffle} className="font-sans">
            Shuffle
          </Button>
          <Button variant="outline" onClick={toggleMute} className="font-sans bg-transparent">
            {muted ? "Unmute" : "Mute"}
          </Button>
        </div>
      </header>

      <section className="z-10 w-full max-w-5xl mx-auto px-4 mt-4 md:mt-8">
        <div className="flex items-center justify-between">
          <p className="text-sm md:text-base font-sans" style={{ color: "var(--color-text-muted)" }}>
            Pokédex Counter: {caughtCount} / {ids.length}
          </p>
        </div>
      </section>

      <section className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-4 md:pt-8 pb-8 md:pb-12 -mt-4 md:-mt-6">
        <div className="relative w-full aspect-square max-h-[72vh] mx-auto">
          <PokemonOrbit pokemon={pokemon ?? []} loading={isLoading} selectedId={selectedId} onSelect={onSelect} />
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <PokemonDetail
            key={selected.id}
            pokemon={selected}
            onBack={onBack}
            onCatch={onCatch}
            onRelease={onRelease}
            isCaught={caught.includes(selected.id)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
