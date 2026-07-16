import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, ShoppingBag, TrendingUp, Package, Clock, AlertCircle } from 'lucide-react'
import api from '../../utils/api'
import { formatPrice, formatDate, STATUS_MAP } from '../../utils/helpers'

function StatCard({ icon, label, value, color, to }) {
  const card = (
    <div className={`card p-5 flex items-center gap-4 ${to ? 'hover:shadow-md transition-shadow' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => { api.get('/admin/stats').then(setStats).catch(() => {}) }, [])

  if (!stats) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Users size={24} className="text-blue-600" />} label="Người dùng" value={stats.total_users} color="bg-blue-100 dark:bg-blue-900/30" to="/admin/users" />
        <StatCard icon={<ShoppingBag size={24} className="text-orange-600" />} label="Tổng đơn" value={stats.total_orders} color="bg-orange-100 dark:bg-orange-900/30" to="/admin/orders" />
        <StatCard icon={<TrendingUp size={24} className="text-green-600" />} label="Doanh thu" value={formatPrice(stats.total_revenue)} color="bg-green-100 dark:bg-green-900/30" />
        <StatCard icon={<Package size={24} className="text-purple-600" />} label="Sản phẩm" value={stats.total_products} color="bg-purple-100 dark:bg-purple-900/30" to="/admin/products" />
        <StatCard icon={<Clock size={24} className="text-yellow-600" />} label="Chờ xác nhận" value={stats.pending_orders} color="bg-yellow-100 dark:bg-yellow-900/30" to="/admin/orders" />
        <StatCard icon={<AlertCircle size={24} className="text-red-500" />} label="Nạp tiền chờ" value={stats.pending_topups} color="bg-red-100 dark:bg-red-900/30" to="/admin/topup" />
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-lg mb-4">Đơn hàng gần đây</h2>
        {stats.recent_orders?.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Chưa có đơn hàng</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3">Mã đơn</th>
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3">Tổng tiền</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {stats.recent_orders.map(o => {
                  const s = STATUS_MAP[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 font-mono">#{o.id}</td>
                      <td className="py-3">{o.user_name}</td>
                      <td className="py-3 font-semibold text-primary-600">{formatPrice(o.total)}</td>
                      <td className="py-3"><span className={`badge ${s.color}`}>{s.label}</span></td>
                      <td className="py-3 text-gray-400">{formatDate(o.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Link to="/admin/orders" className="mt-4 block text-center text-sm text-primary-600 hover:underline">Xem tất cả đơn hàng →</Link>
      </div>
    </div>
  )
}
