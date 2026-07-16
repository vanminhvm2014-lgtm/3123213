import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { formatPrice, formatDate, STATUS_MAP } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, Gamepad2 } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled', 'refunded']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null) // order id đang mở
  const [orderDetail, setOrderDetail] = useState(null)

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); setOrderDetail(null); return }
    setExpanded(id)
    const data = await api.get(`/orders/${id}`)
    setOrderDetail(data)
  }

  const fetch = () => {
    setLoading(true)
    api.get(`/orders${filter ? `?status=${filter}` : ''}`).then(setOrders).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [filter])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status })
      toast.success('Cập nhật trạng thái!')
      fetch()
    } catch (e) { toast.error(e.error) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-44">
          <option value="">Tất cả</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_MAP[s]?.label || s}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Tổng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Cập nhật</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Không có đơn hàng</td></tr>
              ) : orders.map(o => {
                const s = STATUS_MAP[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-700' }
                const isOpen = expanded === o.id
                return (
                  <>
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-mono font-medium">#{o.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.user_name}</p>
                        <p className="text-xs text-gray-400">{o.user_email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3"><span className={`badge ${s.color}`}>{s.label}</span></td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800">
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_MAP[s]?.label || s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleExpand(o.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={7} className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/30">
                          {!orderDetail ? (
                            <p className="text-sm text-gray-400 py-2">Đang tải...</p>
                          ) : (
                            <div className="space-y-2 py-2">
                              {orderDetail.items?.map(item => (
                                <div key={item.id} className="flex items-center gap-3 text-sm bg-white dark:bg-gray-900 rounded-lg p-3">
                                  <span className="font-medium flex-1">{item.product_name} x{item.quantity}</span>
                                  {item.product_type === 'direct' && (
                                    <div className="flex items-center gap-3 text-xs text-blue-600 dark:text-blue-400">
                                      <Gamepad2 size={14} />
                                      <span>IP: <b>{item.server_ip}</b></span>
                                      <span>Port: <b>{item.server_port}</b></span>
                                      <span>MC: <b>{item.mc_name}</b></span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {orderDetail.note && <p className="text-xs text-gray-500 px-1">Ghi chú: {orderDetail.note}</p>}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
