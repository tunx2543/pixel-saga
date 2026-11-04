import { GameLoader } from '@/components/game/game-loader'

export default function Page() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-background">
      <h1 className="sr-only">Pixel Quest - เกม RPG พิกเซล</h1>
      <GameLoader />
    </main>
  )
}
