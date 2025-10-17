export type PokemonFull = {
  id: number
  name: string
  types: { slot: number; type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  cries?: { latest?: string }
  flavor?: string
}

// Map types → brand-appropriate colors (using tokens where possible)
const TYPE_COLORS: Record<string, string> = {
  normal: "#C5C6C7",
  fire: "#ff6b6b",
  water: "#54a0ff",
  electric: "#feca57",
  grass: "#1dd1a1",
  ice: "#48dbfb",
  fighting: "#ee5253",
  poison: "#a29bfe",
  ground: "#c8d6e5",
  flying: "#74b9ff",
  psychic: "#ff9ff3",
  bug: "#55efc4",
  rock: "#b2bec3",
  ghost: "#a29bfe",
  dragon: "#74b9ff",
  dark: "#576574",
  steel: "#8395a7",
  fairy: "#f78fb3",
}

export function getTypeThemeColor(type?: string) {
  return type ? (TYPE_COLORS[type] ?? "var(--color-accent)") : "var(--color-accent)"
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

import useSWR from "swr"

export function usePokemonList(ids: number[]) {
  // Fetch all in parallel with SWR by joining ids into key
  const key = ids.join(",")
  return useSWR<PokemonFull[]>(key ? `/api/pokemon?ids=${encodeURIComponent(key)}` : null, (url) => fetcher(url), {
    revalidateOnFocus: false,
  })
}

export function useEvolutionChain(id: number) {
  return useSWR<{ id: number; name: string }[]>(id ? `/api/evolution?id=${id}` : null, (url) => fetcher(url), {
    revalidateOnFocus: false,
  })
}

export function shuffleIds(count: number) {
  // Pick 12 random IDs from 1..151 for nostalgia
  const pool = Array.from({ length: 151 }, (_, i) => i + 1)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
