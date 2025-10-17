"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSound } from "@/hooks/use-sound"

// Battle sounds
function useBattleSounds() {
  const { playClick } = useSound()
  return {
    attack: playClick,
    hit: playClick,
    victory: playClick,
    miss: playClick,
  }
}

// Pokemon Battle Interface
interface Pokemon {
  id: number
  name: string
  sprites: {
    front_default: string
    other?: {
      "official-artwork"?: {
        front_default: string
      }
    }
  }
  types?: Array<{
    type: {
      name: string
    }
  }>
}

// Battle Pokemon with stats
interface BattlePokemon extends Pokemon {
  health: number
  maxHealth: number
  level: number
  xp: number
  moves: string[]
}

// Battle State
interface BattleState {
  playerPokemon: BattlePokemon | null
  opponentPokemon: BattlePokemon | null
  battleMode: 'reaction' | 'strategy'
  currentTurn: 'player' | 'opponent'
  battlePhase: 'intro' | 'gesture-phase' | 'type-select' | 'charge-attack' | 'attack-animation' | 'results' | 'victory' | 'defeat'
  selectedType: 'fire' | 'water' | 'electric' | 'grass' | null
  chargeLevel: number // 0-100
  timingZone: 'weak' | 'good' | 'perfect' | null
  xpGained: number
  winner: 'player' | 'opponent' | null
}

// Type advantages
const typeAdvantages = {
  'fire': ['grass', 'ice'],
  'water': ['fire', 'ground'],
  'grass': ['water', 'ground'],
  'electric': ['water', 'flying'],
  'ice': ['grass', 'ground', 'flying'],
  'ground': ['fire', 'electric'],
  'flying': ['grass', 'fighting'],
  'fighting': ['normal', 'ice'],
  'normal': [],
}

// Elemental icons - removed emojis
const elementalIcons = {
  fire: 'Fire',
  water: 'Water',
  grass: 'Grass',
  electric: 'Electric',
  ice: 'Ice',
  air: 'Air',
  earth: 'Earth',
  spirit: 'Spirit'
}

export default function PokemonBattleArena() {
  const [battleState, setBattleState] = useState<BattleState>({
    playerPokemon: null,
    opponentPokemon: null,
    battleMode: 'reaction',
    currentTurn: 'player',
    battlePhase: 'intro',
    selectedType: null,
    chargeLevel: 0,
    timingZone: null,
    xpGained: 0,
    winner: null
  })

  // Circular selector state
  const [selectedSegment, setSelectedSegment] = useState<number>(0)
  const segments = [
    { type: 'fire', label: 'Fire', color: 'warm-amber', gradient: 'from-orange-500/60 to-red-600/40' },
    { type: 'water', label: 'Water', color: 'cool-cyan', gradient: 'from-cyan-400/60 to-blue-500/40' },
    { type: 'electric', label: 'Electric', color: 'soft-gold', gradient: 'from-yellow-400/60 to-orange-400/40' },
    { type: 'grass', label: 'Grass', color: 'muted-jade', gradient: 'from-emerald-400/60 to-green-500/40' }
  ]
  const [caughtPokemon, setCaughtPokemon] = useState<BattlePokemon[]>([])
  const [displayPokemon, setDisplayPokemon] = useState<BattlePokemon[]>([])
  const [xpGained, setXpGained] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const sounds = useBattleSounds()

  // Load caught Pokemon from localStorage
  useEffect(() => {
    const caught = localStorage.getItem("caught-pokemon") || "[]"
    const caughtIds = JSON.parse(caught) as number[]

    if (caughtIds.length > 0) {
      // Load detailed Pokemon data
      fetch(`/api/pokemon?ids=${caughtIds.join(",")}`)
        .then(res => res.json())
        .then(pokemons => {
          const battlePokemons: BattlePokemon[] = pokemons.map((p: Pokemon) => ({
            ...p,
            health: 100 + Math.floor(Math.random() * 50), // 100-150 HP
            maxHealth: 100 + Math.floor(Math.random() * 50),
            level: Math.floor(Math.random() * 10) + 1, // Level 1-10
            xp: Math.floor(Math.random() * 100),
            moves: ['Tackle', 'Growl', 'Leech Seed', 'Razor Leaf'] // Simplified moves
          }))
          setCaughtPokemon(battlePokemons)
          setDisplayPokemon(battlePokemons) // Initialize display with all Pokemon
        })
    }
  }, [])

  // Shuffle Pokemon selection - random order AND different Pokemon set
  const shufflePokemon = () => {
    // Create a new set of random Pokemon IDs different from currently caught ones
    const caughtIds = caughtPokemon.map(p => p.id)
    const availableIds = []

    // Generate IDs from 1-151 excluding already caught ones (limit search to avoid huge arrays)
    for (let i = 1; i <= 151; i++) {
      if (!caughtIds.includes(i)) {
        availableIds.push(i)
      }
    }

    // Randomly select same number of Pokemon as currently displayed
    const numToShow = displayPokemon.length
    const randomIds = []
    for (let i = 0; i < Math.min(numToShow, availableIds.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableIds.length)
      randomIds.push(availableIds.splice(randomIndex, 1)[0])
    }

    // If we don't have enough new Pokemon, fill with current ones
    while (randomIds.length < numToShow) {
      const randomCaughtPokemon = caughtPokemon[Math.floor(Math.random() * caughtPokemon.length)]
      randomIds.push(randomCaughtPokemon.id)
    }

    // Fetch and display new Pokemon
    fetch(`/api/pokemon?ids=${randomIds.join(",")}`)
      .then(res => res.json())
      .then(pokemons => {
        const battlePokemons: BattlePokemon[] = pokemons.map((p: Pokemon) => ({
          ...p,
          health: 100 + Math.floor(Math.random() * 50),
          maxHealth: 100 + Math.floor(Math.random() * 50),
          level: Math.floor(Math.random() * 10) + 1,
          xp: Math.floor(Math.random() * 100),
          moves: ['Tackle', 'Growl', 'Leech Seed', 'Razor Leaf']
        }))
        setDisplayPokemon(battlePokemons)
      })
      .catch(err => {
        console.error('Failed to shuffle Pokemon:', err)
        // Fallback to shuffling current Pokemon order only
        setDisplayPokemon(prev => [...prev].sort(() => Math.random() - 0.5))
      })
  }

  // Start new battle
  const startBattle = async (playerPokemon: BattlePokemon) => {
    // Generate opponent
    const opponentIds = []
    for (let i = 0; i < 10; i++) {
      opponentIds.push(Math.floor(Math.random() * 151) + 1)
    }

    try {
      const response = await fetch(`/api/pokemon?ids=${opponentIds.join(",")}`)
      const opponents = await response.json()
      const opponent = opponents[Math.floor(Math.random() * opponents.length)]

      const opponentPokemon: BattlePokemon = {
        ...opponent,
        health: 80 + Math.floor(Math.random() * 40),
        maxHealth: 80 + Math.floor(Math.random() * 40),
        level: playerPokemon.level + Math.floor(Math.random() * 3) - 1,
        xp: 0,
        moves: ['Scratch', 'Bite', 'Ember', 'Bubble']
      }

      setBattleState({
        playerPokemon,
        opponentPokemon,
        battleMode: 'strategy',
        currentTurn: 'player',
        battlePhase: 'gesture-phase',
        selectedType: null,
        chargeLevel: 0,
        timingZone: null,
        xpGained: 0,
        winner: null
      })
    } catch (error) {
      console.error('Failed to start battle:', error)
    }
  }

  // Start type selection phase
  const startTypeSelection = () => {
    setBattleState(prev => ({
      ...prev,
      battlePhase: 'type-select',
      selectedType: null,
      chargeLevel: 0,
      timingZone: null
    }))
  }

  // Handle type selection
  const handleTypeSelect = (type: 'fire' | 'water' | 'electric' | 'grass') => {
    if (battleState.battlePhase !== 'type-select') return

    sounds.attack()
    setBattleState(prev => ({
      ...prev,
      selectedType: type,
      battlePhase: 'charge-attack'
    }))

    startChargeAttack(type)
  }

  // Start charge attack
  const startChargeAttack = (type: 'fire' | 'water' | 'electric' | 'grass') => {
    setBattleState(prev => ({
      ...prev,
      chargeLevel: 0,
      timingZone: null
    }))
  }

  // Release attack based on timing
  const releaseAttack = (charge: number) => {
    if (!battleState.playerPokemon || !battleState.opponentPokemon || !battleState.selectedType) return

    // Determine timing zone based on charge level (0-100)
    const timingZone = charge >= 80 ? 'perfect' : charge >= 50 ? 'good' : 'weak'
    
    // Calculate damage: charge-based + timing multiplier
    const baseDamage = Math.floor((charge / 100) * 30) // 0-30 damage based on charge
    const timingMultiplier = timingZone === 'perfect' ? 1.5 : timingZone === 'good' ? 1.0 : 0.5
    let finalDamage = Math.floor(baseDamage * timingMultiplier)

    // Apply type advantages
    const selectedType = battleState.selectedType
    const opponentType = battleState.opponentPokemon.types?.[0]?.type?.name || 'normal'
    const typeMultiplier = getTypeMultiplier(selectedType, opponentType)
    finalDamage = Math.floor(finalDamage * typeMultiplier)

    sounds.hit()
    triggerAttack(finalDamage, timingZone, typeMultiplier > 1)
  }

  // Get type damage multiplier
  const getTypeMultiplier = (attackType: 'fire' | 'water' | 'electric' | 'grass', defenderType: string): number => {
    const advantages = typeAdvantages[attackType]
    if (!advantages) return 1

    const defenderAdvantages = (typeAdvantages as any)[defenderType] || []
    return advantages.includes(defenderType) ? 1.5 :
           defenderAdvantages.includes(attackType) ? 0.5 : 1
  }

  // Trigger player attack
  const triggerAttack = (damage: number, timingZone?: string, isTypeAdvantage?: boolean) => {
    if (!battleState.opponentPokemon) return

    const newOpponentHealth = Math.max(0, battleState.opponentPokemon.health - damage)

    setBattleState(prev => ({
      ...prev,
      opponentPokemon: prev.opponentPokemon ? { ...prev.opponentPokemon, health: newOpponentHealth } : null,
      battlePhase: 'attack-animation',
      timingZone: timingZone as 'weak' | 'good' | 'perfect' | null
    }))

    // Check battle outcome after attack animation
    setTimeout(() => {
      if (newOpponentHealth <= 0) {
        handleVictory()
      } else {
        // Switch to opponent's turn
        setBattleState(prev => ({ ...prev, currentTurn: 'opponent' }))
        // Trigger opponent attack after a 1.5 second delay
        setTimeout(() => {
          opponentAttack(1.0)
        }, 1500)
      }
    }, 1500)
  }

  // Opponent attack - now properly handles turn-based flow
  const opponentAttack = (damageMultiplier: number) => {
    if (!battleState.playerPokemon) return

    const damage = Math.floor((8 + Math.random() * 12) * damageMultiplier)
    const newHealth = Math.max(0, battleState.playerPokemon.health - damage)

    setBattleState(prev => ({
      ...prev,
      playerPokemon: prev.playerPokemon ? { ...prev.playerPokemon, health: newHealth } : null,
      battlePhase: 'attack-animation'
    }))

    setTimeout(() => {
      if (newHealth <= 0) {
        handleDefeat()
      } else {
        // Switch back to player's turn
        setBattleState(prev => ({
          ...prev,
          currentTurn: 'player',
          battlePhase: 'gesture-phase'
        }))
      }
    }, 1500)
  }

  // Handle victory
  const handleVictory = () => {
    sounds.victory()
    const xpGain = 10 + Math.floor(Math.random() * 15)
    setXpGained(xpGain)

    if (battleState.playerPokemon) {
      const updatedPokemon = {
        ...battleState.playerPokemon,
        xp: battleState.playerPokemon.xp + xpGain
      }

      // Check level up
      if (updatedPokemon.xp >= updatedPokemon.level * 10) {
        updatedPokemon.level += 1
        updatedPokemon.xp = updatedPokemon.xp % (updatedPokemon.level * 10)
        updatedPokemon.maxHealth += 10
        updatedPokemon.health = updatedPokemon.maxHealth
      }

      // Update caught Pokemon list
      setCaughtPokemon(prev =>
        prev.map(p => p.id === updatedPokemon.id ? updatedPokemon : p)
      )
    }

    setBattleState(prev => ({
      ...prev,
      winner: 'player',
      battlePhase: 'victory'
    }))
  }

  // Handle defeat
  const handleDefeat = () => {
    setBattleState(prev => ({
      ...prev,
      winner: 'opponent',
      battlePhase: 'defeat'
    }))
  }

  // Keyboard controls state
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set())
  const [isCharging, setIsCharging] = useState(false)
  const [chargeTimeout, setChargeTimeout] = useState<NodeJS.Timeout | null>(null)

  // Keyboard-based charge system - declare functions first
  const releaseKeyboardCharge = () => {
    if (!isCharging) return

    setIsCharging(false)
    if (chargeTimeout) {
      clearTimeout(chargeTimeout)
      setChargeTimeout(null)
    }

    const chargeLevel = battleState.chargeLevel || 0
    releaseAttack(chargeLevel)
  }

  const startKeyboardCharge = (attackType: 'fire' | 'water' | 'electric' | 'grass') => {
    setIsCharging(true)
    setBattleState(prev => ({ ...prev, chargeLevel: 0 }))

    // Auto-charge with keyboard - faster for better interactivity
    const interval = setInterval(() => {
      setBattleState(prev => ({
        ...prev,
        chargeLevel: Math.min(100, prev.chargeLevel + 3) // Faster charging
      }))
    }, 20) // Faster updates

    // Auto-release after 3.3 seconds if no spacebar pressed
    const timeout = setTimeout(() => {
      releaseKeyboardCharge()
      clearInterval(interval)
    }, 3333)

    setChargeTimeout(timeout)
  }

  // Keyboard event handlers - Updated for circular selector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const battlePhase = battleState.battlePhase

      // Only allow player inputs when it's their turn
      if (battleState.currentTurn !== 'player') return

      // Handle arrow key navigation in gesture phase
      if (battlePhase === 'gesture-phase') {
        if (key === 'arrowup') {
          e.preventDefault()
          setSelectedSegment(0) // Fire (Top)
        } else if (key === 'arrowright') {
          e.preventDefault()
          setSelectedSegment(1) // Water (Right)
        } else if (key === 'arrowdown') {
          e.preventDefault()
          setSelectedSegment(2) // Electric (Bottom)
        } else if (key === 'arrowleft') {
          e.preventDefault()
          setSelectedSegment(3) // Grass (Left)
        }
        // Confirm with Spacebar or Enter
        else if (key === ' ' || key === 'enter') {
          e.preventDefault()
          const selectedType = segments[selectedSegment].type as 'fire' | 'water' | 'electric' | 'grass'
          setBattleState(prev => ({ ...prev, selectedType, battlePhase: 'charge-attack' }))
          sounds.attack()
          startKeyboardCharge(selectedType)
        }
      }
      // Handle charge/release in charge-attack phase
      else if (battlePhase === 'charge-attack') {
        if (key === ' ' || key === 'enter') { // Spacebar or Enter to release attack
          e.preventDefault()
          releaseKeyboardCharge()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const battlePhase = battleState.battlePhase

      if (battlePhase === 'charge-attack' && key === ' ') {
        // Spacebar released - release attack
        releaseKeyboardCharge()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [battleState.battlePhase, battleState.currentTurn, sounds, selectedSegment, segments])

  if (caughtPokemon.length === 0) {
    return (
      <div className="fixed inset-0 w-screen h-screen relative overflow-hidden" style={{
        background: "radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--bg-start) 60%, transparent) 0%, var(--bg-end) 70%), linear-gradient(180deg, var(--bg-start) 0%, var(--bg-end) 100%)",
      }}>
        {/* Subtle background glowing orbs */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, rgba(0,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
              boxShadow: "0 0 20px rgba(0,255,255,0.2)",
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, 0],
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="relative"
            >
              {/* Pulsing light aura behind title */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-24 md:w-96 md:h-32 rounded-full opacity-20 animate-pulse"
                     style={{
                       background: "radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, rgba(0,255,255,0.5) 50%, transparent 70%)",
                       boxShadow: "0 0 60px rgba(0,255,255,0.3)"
                     }}
                />
              </div>

              {/* Title */}
              <motion.h1
                className="text-6xl md:text-7xl font-bold tracking-wider relative z-10"
                style={{ color: "var(--color-text)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                POKÉMON
              </motion.h1>

              {/* Subtitle */}
              <motion.h2
                className="text-3xl md:text-4xl font-semibold tracking-wide relative z-10"
                style={{ color: "var(--color-text)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Battle Arena
              </motion.h2>
            </motion.div>

            <motion.p
              className="text-lg md:text-xl max-w-md mx-auto leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Welcome to the ultimate Pokémon battle experience!
              <br /><br />
              Start by catching some Pokémon from the Orbit page to begin your journey as a trainer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <Link href="/">
                <Button className="mt-8 px-10 py-4 text-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-white">
                  Choose Starter Pokémon
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-screen h-screen relative overflow-hidden" style={{
      background: "radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--bg-start) 60%, transparent) 0%, var(--bg-end) 70%), linear-gradient(180deg, var(--bg-start) 0%, var(--bg-end) 100%)",
    }}>
      {/* Floating energy particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: ['#00ffff', '#ffa500', '#ff00ff', '#ffff00'][Math.floor(Math.random() * 4)],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-15, 15, -15],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Header */}
      <header className="z-20 w-full max-w-6xl mx-auto px-4 pt-6 md:pt-10 flex items-center justify-between">
        <div>
          <h1 className="text-pretty font-sans font-semibold tracking-tight text-2xl md:text-4xl" style={{ color: "var(--color-text-strong)" }}>
            Battle Arena
          </h1>
          <p className="text-sm md:text-base font-sans" style={{ color: "var(--color-text-muted)" }}>
            Choose your fighter!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" style={{ color: "var(--color-text)" }}>
              ← Back to Orbit
            </Button>
          </Link>
        </div>
      </header>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
              animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-9xl md:text-[12rem] font-bold tracking-widest"
              style={{
                fontFamily: '"Courier New", Consolas, monospace',
                color: "#00ffff",
                textShadow: "0 0 20px #00ffff, 0 0 40px #00ffff"
              }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}


      </AnimatePresence>

      {/* Pokemon Selection */}
      {battleState.battlePhase === 'intro' && (
        <div className="fixed inset-0 w-screen h-screen relative overflow-hidden" style={{
          background: "radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--bg-start) 60%, transparent) 0%, var(--bg-end) 70%), linear-gradient(180deg, var(--bg-start) 0%, var(--bg-end) 100%)",
        }}>
          {/* Subtle background glowing orbs */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `radial-gradient(circle, rgba(0,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                boxShadow: "0 0 20px rgba(0,255,255,0.2)",
              }}
              animate={{
                x: [0, Math.random() * 200 - 100, 0],
                y: [0, Math.random() * 200 - 100, 0],
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="flex flex-col items-center justify-center max-h-full overflow-y-auto w-full"
            >
              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-12 text-center leading-tight"
                style={{ color: "var(--color-text)" }}
              >
                Choose Your Champion
              </motion.h2>

              {/* Pokemon Grid */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-5xl w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-12"
              >
                {displayPokemon.map((pokemon, index) => (
                  <motion.button
                    key={`${pokemon.id}-${index}`}
                    onClick={() => {
                      // Start countdown before battle
                      setCountdown(3)
                      setTimeout(() => setCountdown(2), 1000)
                      setTimeout(() => setCountdown(1), 2000)
                      setTimeout(() => {
                        setCountdown(0)
                        setTimeout(() => setCountdown(null), 500)
                        startBattle(pokemon)
                      }, 3000)
                    }}
                    className="relative p-5 md:p-6 rounded-3xl bg-[oklch(0.17_0_0_/_0.8)] border border-white/20 backdrop-blur hover:border-white/50 transition-all duration-300 group"
                    whileHover={{
                      scale: 1.08,
                      boxShadow: "0 0 40px color-mix(in oklab, var(--theme-color) 40%, transparent)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: { delay: 0.1 * index, duration: 0.3 }
                    }}
                  >
                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                         style={{
                           background: "radial-gradient(circle, rgba(0,255,255,0.15) 0%, transparent 70%)",
                           boxShadow: "inset 0 0 30px rgba(0,255,255,0.3)"
                         }}
                    />

                    <div className="flex flex-col items-center space-y-4 relative z-10">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        <Image
                          src={pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default}
                          alt={pokemon.name}
                          width={100}
                          height={100}
                          className="object-contain drop-shadow-lg"
                        />
                      </motion.div>

                      <div className="text-center space-y-1">
                        <h3 className="font-bold capitalize text-base md:text-lg" style={{ color: "var(--color-text)" }}>
                          {pokemon.name}
                        </h3>
                        <div className="text-sm md:text-base font-medium" style={{ color: "var(--color-text-muted)" }}>
                          Lv. {pokemon.level} • {pokemon.health}/{pokemon.maxHealth} HP
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* Battle Ready Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/20 backdrop-blur-sm max-w-md text-center"
                style={{
                  boxShadow: "0 0 20px rgba(0,255,255,0.1)"
                }}
              >
                <div className="font-bold text-base md:text-lg mb-1" style={{ color: "var(--color-text)" }}>
                  Battle Ready!
                </div>
                <div className="text-sm md:text-base" style={{ color: "var(--color-text-muted)" }}>
                  Choose your warrior and unleash your strategy!
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Battle Scene */}
      {battleState.battlePhase !== 'intro' && battleState.playerPokemon && battleState.opponentPokemon && (
        <div className="flex flex-col items-center h-full px-4 overflow-y-auto">
          {/* Opponents Side by Side */}
          <motion.div
            className="flex items-center justify-center gap-12 mt-16 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Opponent */}
            <motion.div
              className="p-6 rounded-2xl bg-[oklch(0.17_0_0_/_0.6)] border border-white/20 backdrop-blur relative"
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Type-based glow aura */}
              <div
                className="absolute inset-0 rounded-2xl opacity-30"
                style={{
                  background: `radial-gradient(circle, ${
                    battleState.opponentPokemon?.types?.[0]?.type?.name === 'electric' ? '#ffff00' :
                    battleState.opponentPokemon?.types?.[0]?.type?.name === 'fire' ? '#ff6600' :
                    battleState.opponentPokemon?.types?.[0]?.type?.name === 'water' ? '#0066ff' :
                    battleState.opponentPokemon?.types?.[0]?.type?.name === 'grass' ? '#00cc66' :
                    battleState.opponentPokemon?.types?.[0]?.type?.name === 'ghost' ? '#663399' :
                    '#00ffff'
                  } 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                }}
              />

              <div className="flex items-center space-x-4 relative z-10">
                <Image
                  src={battleState.opponentPokemon.sprites.other?.["official-artwork"]?.front_default || battleState.opponentPokemon.sprites.front_default}
                  alt={battleState.opponentPokemon.name}
                  width={120}
                  height={120}
                  className="object-contain drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
                  }}
                />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold capitalize" style={{ color: "var(--color-text)" }}>
                    {battleState.opponentPokemon.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      Lv. {battleState.opponentPokemon.level}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      HP
                    </div>
                    <div className="w-32 h-3 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${battleState.opponentPokemon.health > 50 ? 'bg-green-500' : battleState.opponentPokemon.health > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        initial={{ width: `${(battleState.opponentPokemon.health / battleState.opponentPokemon.maxHealth) * 100}%` }}
                        animate={{ width: `${(battleState.opponentPokemon.health / battleState.opponentPokemon.maxHealth) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {battleState.opponentPokemon.health}/{battleState.opponentPokemon.maxHealth}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* VS */}
            <motion.div
              className="text-5xl font-bold px-4"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
              style={{ color: "var(--color-text)" }}
            >
              VS
            </motion.div>

            {/* Player */}
            <motion.div
              className="p-6 rounded-2xl bg-[oklch(0.17_0_0_/_0.6)] border border-white/20 backdrop-blur relative"
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Type-based glow aura */}
              <div
                className="absolute inset-0 rounded-2xl opacity-30"
                style={{
                  background: `radial-gradient(circle, ${
                    battleState.playerPokemon?.types?.[0]?.type?.name === 'electric' ? '#ffff00' :
                    battleState.playerPokemon?.types?.[0]?.type?.name === 'fire' ? '#ff6600' :
                    battleState.playerPokemon?.types?.[0]?.type?.name === 'water' ? '#0066ff' :
                    battleState.playerPokemon?.types?.[0]?.type?.name === 'grass' ? '#00cc66' :
                    battleState.playerPokemon?.types?.[0]?.type?.name === 'ghost' ? '#663399' :
                    '#00ffff'
                  } 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                }}
              />

              <div className="flex items-center space-x-4 relative z-10">
                <div className="space-y-2 text-right">
                  <h3 className="text-xl font-bold capitalize" style={{ color: "var(--color-text)" }}>
                    {battleState.playerPokemon.name}
                  </h3>
                  <div className="flex items-center space-x-2 justify-end">
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      Lv. {battleState.playerPokemon.level}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      HP
                    </div>
                    <div className="w-32 h-3 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${battleState.playerPokemon.health > 50 ? 'bg-green-500' : battleState.playerPokemon.health > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        initial={{ width: `${(battleState.playerPokemon.health / battleState.playerPokemon.maxHealth) * 100}%` }}
                        animate={{ width: `${(battleState.playerPokemon.health / battleState.playerPokemon.maxHealth) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {battleState.playerPokemon.health}/{battleState.playerPokemon.maxHealth}
                    </div>
                  </div>
                </div>
                <Image
                  src={battleState.playerPokemon.sprites.other?.["official-artwork"]?.front_default || battleState.playerPokemon.sprites.front_default}
                  alt={battleState.playerPokemon.name}
                  width={120}
                  height={120}
                  className="object-contain drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Gesture Attack Area */}
          <AnimatePresence>
            {battleState.battlePhase === 'attack-animation' && battleState.currentTurn === 'opponent' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-8 flex flex-col items-center space-y-6"
              >
                {/* Opponent Turn Indicator */}
                <motion.div
                  className="uppercase text-2xl md:text-3xl font-bold tracking-wider"
                  style={{
                    color: "var(--color-text)",
                    textShadow: "0 0 20px rgba(255,140,0,0.8)"
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    textShadow: ["0 0 20px rgba(255,140,0,0.8)", "0 0 30px rgba(255,140,0,0.9)", "0 0 20px rgba(255,140,0,0.8)"]
                  }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                >
                  Opponent Move
                </motion.div>
              </motion.div>
            )}

            {battleState.battlePhase === 'gesture-phase' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-8 flex flex-col items-center space-y-6"
              >
                {/* Turn Indicator */}
                <motion.div
                  className="uppercase text-2xl md:text-3xl font-bold tracking-wider"
                  style={{
                    color: "var(--color-text)",
                    textShadow: battleState.currentTurn === 'player' ? "0 0 20px rgba(0,255,255,0.8)" : "0 0 20px rgba(255,140,0,0.8)"
                  }}
                  animate={{
                    scale: battleState.currentTurn === 'player' ? [1, 1.05, 1] : [1, 1.05, 1],
                    textShadow: battleState.currentTurn === 'player'
                      ? ["0 0 20px rgba(0,255,255,0.8)", "0 0 30px rgba(0,255,255,0.9)", "0 0 20px rgba(0,255,255,0.8)"]
                      : ["0 0 20px rgba(255,140,0,0.8)", "0 0 30px rgba(255,140,0,0.9)", "0 0 20px rgba(255,140,0,0.8)"]
                  }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                >
                  {battleState.currentTurn === 'opponent' ? 'Opponent Move' : 'Your move'}
                </motion.div>

                {/* Minimalist Element Selection */}
                <motion.div
                  className="grid grid-cols-2 gap-4 max-w-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {[
                    { type: 'fire', label: 'FIRE', arrow: '↑', glowColor: 'rgba(255, 140, 0, 0.6)', hoverGlow: 'rgba(255, 140, 0, 0.9)' },
                    { type: 'water', label: 'WATER', arrow: '→', glowColor: 'rgba(0, 255, 255, 0.6)', hoverGlow: 'rgba(0, 255, 255, 0.9)' },
                    { type: 'electric', label: 'ELECTRIC', arrow: '↓', glowColor: 'rgba(255, 255, 0, 0.6)', hoverGlow: 'rgba(255, 255, 0, 0.9)' },
                    { type: 'grass', label: 'GRASS', arrow: '←', glowColor: 'rgba(0, 200, 150, 0.6)', hoverGlow: 'rgba(0, 200, 150, 0.9)' }
                  ].map((element, index) => (
                    <motion.button
                      key={element.type}
                      onClick={() => {
                        const selectedType = element.type as 'fire' | 'water' | 'electric' | 'grass'
                        setBattleState(prev => ({ ...prev, selectedType, battlePhase: 'charge-attack' }))
                        sounds.attack()
                        startKeyboardCharge(selectedType)
                      }}
                      className="relative px-6 py-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 group"
                      whileHover={{
                        scale: 1.05,
                        boxShadow: [`0 0 10px ${element.glowColor}`, `0 0 25px ${element.hoverGlow}`]
                      }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                    >
                      {/* Subtle inner shadow */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-black/10 via-transparent to-black/20" />

                      {/* Hover glow effect */}
                      <div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle at center, ${element.glowColor} 0%, transparent 70%)`,
                          filter: 'blur(8px)',
                        }}
                      />

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-white font-medium tracking-wide uppercase"
                              style={{ textShadow: "0 0 8px rgba(255,255,255,0.3)" }}>
                          {element.label}
                        </span>
                        <span className="text-white text-xl font-light" style={{ textShadow: "0 0 8px rgba(255,255,255,0.3)" }}>
                          {element.arrow}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Confirmation Instruction */}
                <motion.div
                  className="text-center mt-6 px-6 py-3 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 max-w-sm mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  style={{
                    boxShadow: "0 0 15px rgba(0,255,255,0.1)"
                  }}
                >
                  <p className="text-sm font-medium tracking-wide uppercase opacity-80"
                     style={{ color: "rgba(255, 255, 255, 0.9)", textShadow: "0 0 8px rgba(0,0,0,0.7)" }}>
                    Press SPACEBAR or ENTER to confirm your move
                  </p>
                </motion.div>

              </motion.div>
            )}

            {/* Charge Attack Interface */}
            {battleState.battlePhase === 'charge-attack' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="charge-container mt-8 flex flex-col items-center space-y-6 cursor-pointer select-none"
                onMouseDown={(e) => {
                  e.preventDefault()
                  let isMousedown = true
                  let chargeLevel = 0
                  const interval = setInterval(() => {
                    if (chargeLevel < 100 && isMousedown) {
                      chargeLevel += 2
                      setBattleState(prev => ({
                        ...prev,
                        chargeLevel: Math.min(100, chargeLevel)
                      }))
                    }
                  }, 16)

                  const handleMouseup = () => {
                    if (isMousedown) {
                      clearInterval(interval)
                      isMousedown = false
                      // Calculate timing zone and damage
                      const timingZone = chargeLevel >= 80 ? 'perfect' : chargeLevel >= 50 ? 'good' : 'weak'
                      const baseDamage = Math.floor((chargeLevel / 100) * 30)
                      const timingMultiplier = timingZone === 'perfect' ? 1.5 : timingZone === 'good' ? 1.0 : 0.5
                      let finalDamage = Math.floor(baseDamage * timingMultiplier)

                      // Apply type advantages
                      const selectedType = battleState.selectedType
                      const opponentType = battleState.opponentPokemon?.types?.[0]?.type?.name || 'normal'
                      const typeMultiplier = selectedType ? getTypeMultiplier(selectedType, opponentType) : 1
                      finalDamage = Math.floor(finalDamage * typeMultiplier)

                      sounds.hit()
                      triggerAttack(finalDamage, timingZone, typeMultiplier > 1)

                      // Show feedback
                      setTimeout(() => {
                        setBattleState(prev => ({
                          ...prev,
                          timingZone: timingZone
                        }))
                      }, 500)
                    }
                  }

                  document.addEventListener('mouseup', handleMouseup, { once: true })
                }}
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {battleState.selectedType === 'fire' && 'Fire Attack'}
                    {battleState.selectedType === 'water' && 'Water Attack'}
                    {battleState.selectedType === 'grass' && 'Grass Attack'}
                    {battleState.selectedType === 'electric' && 'Electric Attack'}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Hold and release to charge power!
                  </p>
                </div>

                {/* Charge Bar */}
                <div className="relative w-80 h-6 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${battleState.chargeLevel}%` }}
                    transition={{ duration: 0.1 }}
                    style={{
                      boxShadow: "0 0 20px rgba(251, 191, 36, 0.5)"
                    }}
                  />

                  {/* Timing Zones */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Weak Zone (0-49%) - Red */}
                    <div className="absolute left-0 w-1/2 h-full bg-red-500/20" />
                    {/* Good Zone (50-79%) - Yellow */}
                    <div className="absolute left-1/2 w-[30%] h-full bg-yellow-500/20" />
                    {/* Perfect Zone (80-100%) - Green */}
                    <div className="absolute right-0 w-1/5 h-full bg-green-500/20" />
                  </div>
                </div>

                {/* Zone Labels */}
                <div className="flex justify-between w-80 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span>Weak</span>
                  <span>Good</span>
                  <span>Perfect</span>
                </div>

                {/* Attack Feedback */}
                <AnimatePresence>
                  {battleState.timingZone && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center space-y-2"
                    >
                      <div className={`text-2xl font-bold ${
                        battleState.timingZone === 'perfect' ? 'text-green-400' :
                        battleState.timingZone === 'good' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {battleState.timingZone === 'perfect' ? 'Perfect Hit!' :
                         battleState.timingZone === 'good' ? 'Good Hit!' : 'Weak Hit!'}
                      </div>

                      {/* Type Effectiveness Feedback */}
                      {battleState.selectedType && (() => {
                        const opponentType = battleState.opponentPokemon?.types?.[0]?.type?.name || 'normal'
                        const multiplier = getTypeMultiplier(battleState.selectedType, opponentType)
                        return multiplier > 1 ? (
                          <div className="text-lg text-blue-400 font-semibold">
                            Super Effective!
                          </div>
                        ) : multiplier < 1 ? (
                          <div className="text-sm text-gray-400">
                            Not Very Effective...
                          </div>
                        ) : null
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {(battleState.battlePhase === 'victory' || battleState.battlePhase === 'defeat') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70"
              >
                <motion.div
                  className="bg-black p-8 rounded-3xl border-2 border-teal-400 text-center max-w-md"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl font-bold text-teal-400 mb-4">
                    {battleState.winner === 'player' ? 'You won' : 'You lost'}
                  </h2>
                  {battleState.winner === 'player' && battleState.playerPokemon && (
                    <div className="space-y-2 mb-6">
                      <div className="text-lg text-teal-300">
                        +{xpGained} XP Gained!
                      </div>
                      {battleState.playerPokemon.xp >= battleState.playerPokemon.level * 10 && (
                        <div className="text-xl text-green-300 font-bold">
                      Level Up! {battleState.playerPokemon.level} → {battleState.playerPokemon.level + 1}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => setBattleState({
                        playerPokemon: null,
                        opponentPokemon: null,
                        battleMode: 'strategy',
                        currentTurn: 'player',
                        battlePhase: 'intro',
                        selectedType: null,
                        chargeLevel: 0,
                        timingZone: null,
                        xpGained: 0,
                        winner: null
                      })}
                      className="bg-teal-500 text-white hover:bg-teal-600"
                    >
                      Battle Again
                    </Button>
                    <Link href="/">
                      <Button variant="outline" className="border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-black">
                        Return to Orbit
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
