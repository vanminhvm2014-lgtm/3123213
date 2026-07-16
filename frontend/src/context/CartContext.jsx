import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const add = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
      return [...prev, { ...product, quantity }]
    })
  }

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const updateQty = (id, quantity) => {
    if (quantity <= 0) return remove(id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }

  const clear = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
