import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Order } from '../domain/order/types'

type OrderState = {
  /** Orders confirmed during this session, newest first. */
  placedOrders: Order[]
  addOrder: (order: Order) => void
  findOrder: (orderId: string) => Order | undefined
}

const OrderContext = createContext<OrderState | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [placedOrders, setPlacedOrders] = useState<Order[]>([])

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
