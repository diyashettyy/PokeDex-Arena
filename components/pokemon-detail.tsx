"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { type PokemonFull, getTypeThemeColor, useEvolutionChain } from "@/lib/pokeapi"

type Props = {
  pokemon: PokemonFull
  onBack: () => void
  onCatch: () => void
  onRelease: () => void
  isCaught: boolean
}

export function PokemonDetail({ pokemon, onBack, onCatch, onRelease, isCaught }: Props) {
  const theme = getTypeThemeColor(pokemon.types?.[0]?.type?.name)
  const { data: evo, isLoading } = useEvolutionChain(pokemon.id)

  return (
    <motion.aside
      className="fixed inset-x-0 bottom-0 md:inset-0 z-50 md:grid md:place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${pokemon.name} details`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onBack} />

      <motion.div
        className="relative z-10 w-full md:max-w-3xl md:rounded-2xl border"
        style={{
          background: "linear-gradient(180deg, oklch(0.22 0 0 / 0.7), oklch(0.18 0 0 / 0.7))",
          backdropFilter: "blur(10px)",
          borderColor: "color-mix(in oklab, var(--theme-color) 30%, transparent)",
        }}
        initial={{ y: 40, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold font-sans" style={{ color: "var(--color-text-strong)" }}>
              {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </h2>
            <div className="mt-1 flex gap-2">
              {pokemon.types?.map((t) => (
                <span
                  key={t.type.name}
                  className="text-xs md:text-sm px-2 py-1 rounded-full"
                  style={{
                    background: "color-mix(in oklab, var(--theme-color) 25%, transparent)",
                    color: "var(--color-text)",
                    border: `1px solid color-mix(in oklab, var(--theme-color) 50%, transparent)`,
                  }}
                >
                  {t.type.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCaught ? (
              <Button onClick={onCatch} className="font-sans">
                Catch
              </Button>
            ) : (
              <Button variant="destructive" onClick={onRelease} className="font-sans">
                Release
              </Button>
            )}
            <Button variant="outline" onClick={onBack} className="font-sans bg-transparent">
              Close
            </Button>
          </div>
        </div>

        {/* Artwork and stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--theme-color) 18%, transparent) 0%, transparent 70%)",
              }}
            />
            <div className="relative grid place-items-center py-6">
              <Image
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                alt={pokemon.name}
                width={320}
                height={320}
                className="h-48 w-auto md:h-64 object-contain"
              />
            </div>
            {/* Flavor text */}
            <p className="mt-2 text-sm leading-relaxed font-sans" style={{ color: "var(--color-text)" }}>
              {pokemon.flavor || "A mysterious Pokémon with undisclosed lore..."}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 font-sans" style={{ color: "var(--color-text-strong)" }}>
              Stats
            </h3>
            <div className="space-y-3">
              {pokemon.stats?.map((s) => (
                <StatBar key={s.stat.name} label={s.stat.name} value={s.base_stat} />
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-3 font-sans" style={{ color: "var(--color-text-strong)" }}>
              Evolution Chain
            </h3>
            <div className="flex items-center gap-4 flex-wrap">
              {isLoading && (
                <div className="text-sm" style={{ color: "var(--color-text)" }}>
                  Loading evolution...
                </div>
              )}
              {!isLoading && evo?.length
                ? evo.map((e) => (
                    <div key={e.id} className="flex items-center gap-2">
                      <Image
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${e.id}.png`}
                        alt={e.name}
                        width={64}
                        height={64}
                        className="size-12 object-contain"
                      />
                      <span className="text-sm font-sans" style={{ color: "var(--color-text)" }}>
                        {e.name}
                      </span>
                    </div>
                  ))
                : !isLoading && (
                    <div className="text-sm" style={{ color: "var(--color-text)" }}>
                      No evolution data.
                    </div>
                  )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  )
}

function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round((value / 180) * 100))
  return (
    <div>
      <div
        className="flex items-center justify-between text-xs mb-1 font-sans"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div
        className="h-2 rounded-full w-full bg-[color:var(--track)]"
        style={{
          ["--track" as any]: "oklch(0.28 0 0)",
        }}
        role="progressbar"
        aria-label={`${label} stat`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={180}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--theme-color) 60%, transparent), var(--theme-color))",
            boxShadow: "0 0 12px color-mix(in oklab, var(--theme-color) 30%, transparent)",
          }}
        />
      </div>
    </div>
  )
}
