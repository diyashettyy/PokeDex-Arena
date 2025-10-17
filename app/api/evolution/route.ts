import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get("id")
  const id = idParam ? Number.parseInt(idParam, 10) : 0
  if (!id) return Response.json([], { status: 200 })

  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
  const species = await speciesRes.json()
  const chainUrl = species?.evolution_chain?.url
  if (!chainUrl) return Response.json([], { status: 200 })

  const chainRes = await fetch(chainUrl)
  const chain = await chainRes.json()

  function flattenChain(node: any, acc: any[] = []): any[] {
    if (!node) return acc
    const name = node.species?.name
    const url: string | undefined = node.species?.url
    // Extract id from species URL: .../pokemon-species/{id}/
    const idMatch = url?.match(/\/pokemon-species\/(\d+)\//)
    const nodeId = idMatch ? Number.parseInt(idMatch[1], 10) : undefined
    if (name && nodeId) acc.push({ id: nodeId, name })
    if (node.evolves_to?.length) {
      node.evolves_to.forEach((child: any) => flattenChain(child, acc))
    }
    return acc
  }

  const flat = flattenChain(chain?.chain)
  return Response.json(flat)
}
