import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type BasketLine = { productId: string; quantity: number }

type ShopState = {
  postcode: string | null
  setPostcode: (postcode: string | null) => void
  basket: BasketLine[]
  addToBasket: (productId: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeFromBasket: (productId: string) => void
  clearBasket: () => void
}

const ShopContext = createContext<ShopState | null>(null)

export function ShopProvider({
  children,
  initialPostcode = null,
  initialBasket = [],
}: {
  children: ReactNode
  initialPostcode?: string | null
  initialBasket?: BasketLine[]
}) {
  const [postcode, setPostcode] = useState<string | null>(initialPostcode)
  const [basket, setBasket] = useState<BasketLine[]>(initialBasket)

  const value = useMemo<ShopState>(
    () => ({
      postcode,
      setPostcode,
      basket,
      addToBasket: (productId, quantity = 1) =>
        setBasket((lines) => {
          const existing = lines.find((line) => line.productId === productId)
          if (existing) {
            return lines.map((line) =>
              line.productId === productId
                ? { ...line, quantity: line.quantity + quantity }
                : line,
            )
          }
          return [...lines, { productId, quantity }]
        }),
      setQuantity: (productId, quantity) =>
        setBasket((lines) =>
          quantity <= 0
            ? lines.filter((line) => line.productId !== productId)
            : lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
        ),
      removeFromBasket: (productId) =>
        setBasket((lines) => lines.filter((line) => line.productId !== productId)),
      clearBasket: () => setBasket([]),
    }),
    [postcode, basket],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopState {
  const context = useContext(ShopContext)
  if (!context) throw new Error('useShop must be used inside a ShopProvider')
  return context
}
