import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * The prototype's clock.
 *
 * There is no pinned demo date and no hidden clock control: the prototype
 * reads the viewer's real device clock, so it behaves like the shop. A
 * reviewer who wants to see a different scenario - the Friday evening cutoff
 * case in particular - changes their device or browser clock, and the reviewer
 * guide documents which times produce which behaviour.
 *
 * The clock ticks so that a reviewer sitting on the page as 19:00 passes sees
 * the promise move, rather than a stale date frozen at page load.
 *
 * Tests inject a fixed `now` to keep assertions deterministic.
 */
const DemoClockContext = createContext<Date | null>(null)

const TICK_MS = 30_000

export function DemoClockProvider({
  children,
  now,
}: {
  children: ReactNode
  /** Fixed instant for tests. When omitted the real device clock is used. */
  now?: Date
}) {
  const [tick, setTick] = useState(() => now ?? new Date())

  useEffect(() => {
    if (now) return
    const timer = window.setInterval(() => setTick(new Date()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [now])

  const value = useMemo(() => now ?? tick, [now, tick])

  return <DemoClockContext.Provider value={value}>{children}</DemoClockContext.Provider>
}

export function useNow(): Date {
  const now = useContext(DemoClockContext)
  if (!now) throw new Error('useNow must be used inside a DemoClockProvider')
  return now
}
