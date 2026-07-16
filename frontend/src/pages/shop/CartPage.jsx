// CartPage.jsx
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatPrice, imgUrl } from '../../utils/helpers'

export function CartPage() {
  const { items, remove, updateQty, total } = useCart()

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
      <h2 className="text-xl font-bold mb-2">Giỏ hàng trống</h2>
      <p className="text-gray-400 mb-6">Hãy thêm sản phẩm vào giỏ hàng</p>
      <Link to="/" className="btn-primary">Tiếp tục mua sắm</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Giỏ hàng ({items.length} sản phẩm)</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex gap-4 items-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? <img src={imgUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-primary-600 font-bold">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600 transition-colors ml-2">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="card p-5 h-fit">
          <h2 className="font-bold text-lg mb-4">Tóm tắt đơn</h2>
          <div className="space-y-2 text-sm mb-4">
            {items.map(i => (
              <div key={i.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                <span className="truncate pr-2">{i.name} x{i.quantity}</span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-bold text-lg mb-4">
            <span>Tổng</span><span className="text-primary-600">{formatPrice(total)}</span>
          </div>
          <Link to="/checkout" className="btn-primary w-full text-center block">Thanh toán</Link>
          <Link to="/" className="btn-secondary w-full text-center block mt-2">Tiếp tục mua</Link>
        </div>
      </div>
    </div>
  )
}

export default CartPage
