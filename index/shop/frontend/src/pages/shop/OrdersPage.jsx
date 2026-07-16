// OrdersPage
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { formatPrice, formatDate, STATUS_MAP } from '../../utils/helpers'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/my').then(setOrders).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>Bạn chưa có đơn hàng nào</p>
          <Link to="/" className="btn-primary mt-4 inline-block">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const s = STATUS_MAP[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-700' }
            return (
              <Link key={o.id} to={`/orders/${o.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium">#{o.id}</span>
                    <span className={`badge ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(o.created_at)}</p>
                  {o.products && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{o.products}</p>}
                </div>
                <span className="font-bold text-primary-600">{formatPrice(o.total)}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
