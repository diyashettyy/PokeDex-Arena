import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") || ""
  if (!idsParam) return Response.json([], { status: 200 })
  const ids = idsParam
    .split(",")
    .map((s) => Number.parseInt(s, 10))
    .filter(Boolean)
    .slice(0, 24)

  const results = await Promise.all(
    ids.map(async (id) => {
      const [pkRes, spRes] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
      ])
      const pk = await pkRes.json()
      const sp = await spRes.json()

      // Filter abilities to show only hidden ability
      const abilities = (pk.abilities || [])
        .filter((ability: any) => ability.is_hidden)
        .map((ability: any) => ({
          is_hidden: ability.is_hidden,
          slot: ability.slot,
          ability: {
            name: ability.ability.name,
            url: ability.ability.url,
          },
        }))

      // Get base_experience from species if not in pokemon data
      const base_experience = pk.base_experience || 0

      // Keep cries as is
      const cries = pk.cries

      // Get forms
      const forms = pk.forms

      // Filter game_indices to show only the last entry
      const game_indices = pk.game_indices?.slice(-1) || []

      // Get height
      const height = pk.height

      // Get held_items with version_details limited to one
      const held_items = (pk.held_items || []).map((item: any) => ({
        item: item.item,
        version_details: item.version_details?.slice(0, 1) || [],
      })).slice(0, 1)

      // Get id
      const pokemonId = pk.id

      // Get is_default
      const is_default = pk.is_default

      // Get location_area_encounters
      const location_area_encounters = pk.location_area_encounters

      // Filter moves to show a few examples with version_group_details
      // The example shows razor-wind and swords-dance, but let's create a simple version
      const moves = (pk.moves || [])
        .slice(0, 2) // Limit to first 2 moves
        .map((move: any) => ({
          move: {
            name: move.move.name,
            url: move.move.url,
          },
          version_group_details: (move.version_group_details || [])
            .slice(0, 2) // Limit version details per move
            .map((vgd: any) => ({
              level_learned_at: vgd.level_learned_at,
              move_learn_method: {
                name: vgd.move_learn_method.name,
                url: vgd.move_learn_method.url,
              },
              order: vgd.order || null, // Include order back in
              version_group: {
                name: vgd.version_group.name,
                url: vgd.version_group.url,
              },
            })),
        }))

      // Get name
      const name = pk.name

      // Get order
      const order = sp.order || 0

      // Get weight
      const weight = pk.weight

      // Full sprites object
      const sprites = pk.sprites

      // Filter stats to show only speed stat (matching the example which shows only speed)
      const stats = pk.stats?.filter((stat: any) => stat.stat.name === "speed") || []

      // Get types
      const types = pk.types

      // Empty past_types and past_abilities for simplicity
      const past_types: any[] = []
      const past_abilities: any[] = []

      // Get species
      const species = pk.species

      return {
        id: pokemonId,
        name,
        base_experience,
        height,
        is_default,
        order,
        weight,
        abilities,
        forms,
        game_indices,
        held_items,
        location_area_encounters,
        moves,
        cries,
        stats,
        types,
        sprites,
        species,
        past_types,
        past_abilities,
      }
    }),
  )

  return Response.json(results)
}
