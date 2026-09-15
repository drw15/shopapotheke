import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Order } from '../domain/order/types'

type OrderState = {
  /** Orders confirmed during this session, newest first. */
  placedOrders: Order[]
  addOrder: (order: Order) => void
  findOrder: (orderId: string) => Order | undefined
}

const OrderContext = createContext<OrderState | null>(null)

const STORAGE_KEY = 'sa-demo-placed-orders'

/**
 * Orders are mirrored into sessionStorage so a reload does not empty the list.
 *
 * A reviewer who places an order and then refreshes, or opens the confirmation
 * link in a new tab, would otherwise find their order gone while the seeded
 * demo orders remained - reading as a bug in the prototype. sessionStorage
 * rather than localStorage keeps each demo run clean: close the tab and the
 * shop is back to its seeded state.
 */
function readStoredOrders(): Order[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    // Private mode or blocked storage: fall back to in-memory only.
    return []
  }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [placedOrders, setPlacedOrders] = useState<Order[]>(readStoredOrders)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(placedOrders))
    } catch {
      // Persistence is a convenience; never break the demo over it.
    }
  }, [placedOrders])

  const value = useMemo<OrderState>(
    () => ({
      placedOrders,
      addOrder: (order) => setPlacedOrders((current) => [order, ...current]),
      findOrder: (orderId) => placedOrders.find((order) => order.id === orderId),
    }),
    [placedOrders],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders(): OrderState {
  const context = useContext(OrderContext)
  if (!context) throw new Error('useOrders must be used inside an OrderProvider')
  return context
}
