import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../utils/api'
import { formatPrice, formatDate, imgUrl, STATUS_MAP } from '../../utils/helpers'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}`).then(setOrder).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>
  if (!order) return <div className="text-center py-20">Không tìm thấy đơn hàng</div>

  const s = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={18} /> Đơn hàng của tôi
      </Link>

      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Đơn hàng #{order.id}</h1>
          <span className={`badge ${s.color} text-sm px-3 py-1`}>{s.label}</span>
        </div>
        <p className="text-sm text-gray-400">Đặt lúc: {formatDate(order.created_at)}</p>
        {order.note && <p className="text-sm text-gray-500 mt-2">Ghi chú: {order.note}</p>}
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">Sản phẩm</h2>
        <div className="space-y-3">
          {order.items?.map(item => (
            <div key={item.id} className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? <img src={imgUrl(item.image)} alt={item.product_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">📦</div>}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.product_name}</p>
                <p className="text-xs text-gray-400">x{item.quantity} × {formatPrice(item.price)}</p>
                {item.product_type === 'direct' && (
                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 space-x-3">
                    <span>IP: {item.server_ip}</span>
                    <span>Port: {item.server_port}</span>
                    <span>MC: {item.mc_name}</span>
                  </div>
                )}
              </div>
              <span className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Thanh toán</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatPrice(order.total + (order.discount || 0))}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá ({order.voucher_code})</span><span>-{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2">
            <span>Tổng</span><span className="text-primary-600">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
