"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getTypeThemeColor, type PokemonFull } from "@/lib/pokeapi"

type Props = {
  pokemon: PokemonFull[]
  loading?: boolean
  selectedId: number | null
  onSelect: (id: number) => void
}

export function PokemonOrbit({ pokemon, loading, selectedId, onSelect }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [rotation, setRotation] = useState(0)

  const items = useMemo(() => {
    // Ensure we have 12 placeholders when loading
    const count = 12
    const filled = Array.from({ length: count }, (_, i) => pokemon[i])
    return filled
  }, [pokemon])

  const radius = 42 // in percentage of container
  const duration = 50 // rotation duration

  // Get the hovered Pokemon details
  const hoveredPokemon = useMemo(() => {
    if (hovered === null) return null
    return items.find(p => (p?.id ?? items.indexOf(p) + 1) === hovered)
  }, [hovered, items])

  if (loading) {
    return (
      <div className="h-full w-full grid place-items-center">
        {/* Pokéball spinner loader */}
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full border-4 border-[color:var(--color-accent)] border-t-transparent animate-spin" />
          <div className="absolute inset-[30%] rounded-full bg-[color:var(--bg-end)]" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex items-center justify-center relative">
      {/* Tip box at bottom left */}
      <div className="absolute bottom-2 -left-20 z-40 px-4 py-3 rounded-lg bg-[oklch(0.17_0_0_/_0.8)] backdrop-blur-md border border-[color:var(--theme-color)]"
        style={{
          boxShadow: "0 0 15px color-mix(in oklab, var(--theme-color) 20%, transparent)",
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--color-text)" }}>Tip:</span> Hover to pause orbit. Click a Pokémon to inspect.
        </p>
      </div>

      {/* Centered name display box */}
      {hoveredPokemon?.name && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 rounded-full bg-[oklch(0.17_0_0_/_0.8)] backdrop-blur-md border border-[color:var(--theme-color)]"
          style={{
            boxShadow: "0 0 20px color-mix(in oklab, var(--theme-color) 30%, transparent)",
          }}
        >
          <span className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            {hoveredPokemon.name.charAt(0).toUpperCase() + hoveredPokemon.name.slice(1)}
          </span>
        </motion.div>
      )}

      <motion.div
        className="relative aspect-square w-full max-w-[min(90vw,75vh)]"
        animate={{ rotate: hovered ? 0 : 360 }}
        transition={{ repeat: Number.POSITIVE_INFINITY, ease: "linear", duration }}
        onUpdate={(latest) => {
          if (typeof latest.rotate === 'number') {
            setRotation(latest.rotate)
          }
        }}
      >
        {/* Orbit line - smaller circle */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            border: "1px dashed color-mix(in oklab, var(--theme-color) 35%, transparent)",
            boxShadow: "0 0 24px color-mix(in oklab, var(--theme-color) 20%, transparent)",
            inset: '8%',
          }}
        />

      {items.map((p, i) => {
        const angle = (i / items.length) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        const id = p?.id ?? i + 1
        const isSelected = selectedId === id
        const isHovered = hovered === id

        // Type glow color
        const typeName = p?.types?.[0]?.type?.name
        const glow = getTypeThemeColor(typeName) ?? "var(--theme-color)"

        // Official artwork src
        const src = p
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
          : `/placeholder.svg?height=160&width=160&query=pokemon%20placeholder%20artwork`

        return (
          <motion.button
            key={id}
            className={cn(
              "group absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--theme-color)]",
            )}
            style={{ left: `calc(50% + ${x}%)`, top: `calc(50% + ${y}%)` }}
            onFocus={() => setHovered(id)}
            onBlur={() => setHovered((h) => (h === id ? null : h))}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered((h) => (h === id ? null : h))}
            onClick={() => onSelect(id)}
            aria-label={p?.name ? `View ${p.name}` : `View Pokémon #${id}`}
          >
            <motion.div
              className="rounded-full p-3 bg-[oklch(0.17_0_0_/_0.4)] backdrop-blur flex items-center justify-center aspect-square"
              style={{
                boxShadow: isHovered ? `0 0 24px ${glow}` : `0 0 10px color-mix(in oklab, ${glow} 35%, transparent)`,
                width: '100px',
                height: '100px',
              }}
              animate={{
                scale: isHovered ? 1.2 : 1,
                opacity: isSelected ? 0.25 : 1,
                rotate: -rotation, // Counter-rotate to keep images upright
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Image
                src={src || "/placeholder.svg"}
                alt={p?.name ?? `Pokémon #${id}`}
                width={80}
                height={80}
                className="block object-contain"
                style={{ width: '80px', height: '80px' }}
              />
            </motion.div>
          </motion.button>
        )
      })}
      </motion.div>
    </div>
  )
}
