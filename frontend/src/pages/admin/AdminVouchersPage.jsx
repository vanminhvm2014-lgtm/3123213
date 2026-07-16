import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import api from '../../utils/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', discount_type: 'percent', discount_value: '', min_order: 0, max_uses: '', expires_at: '' })
  const [loading, setLoading] = useState(false)

  const fetch = () => api.get('/vouchers').then(setVouchers).catch(() => {})
  useEffect(() => { fetch() }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) return toast.error('Điền code và giá trị giảm')
    setLoading(true)
    try {
      await api.post('/vouchers', { ...form, max_uses: form.max_uses || null, expires_at: form.expires_at || null })
      toast.success('Tạo voucher thành công!')
      setShowForm(false)
      setForm({ code: '', discount_type: 'percent', discount_value: '', min_order: 0, max_uses: '', expires_at: '' })
      fetch()
    } catch (e) { toast.error(e.error) }
    setLoading(false)
  }

  const handleDelete = async (id, code) => {
    if (!confirm(`Xóa voucher ${code}?`)) return
    await api.delete(`/vouchers/${id}`)
    toast.success('Đã xóa')
    fetch()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Voucher</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Tạo voucher
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-4">Tạo voucher mới</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Mã voucher</label>
              <input value={form.code} onChange={set('code')} className="input" placeholder="VD: SALE10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại giảm</label>
              <select value={form.discount_type} onChange={set('discount_type')} className="input">
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Cố định (đ)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giá trị giảm</label>
              <input type="number" value={form.discount_value} onChange={set('discount_value')} className="input" placeholder={form.discount_type === 'percent' ? '10 = 10%' : '50000'} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đơn tối thiểu (đ)</label>
              <input type="number" value={form.min_order} onChange={set('min_order')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giới hạn lượt dùng</label>
              <input type="number" value={form.max_uses} onChange={set('max_uses')} className="input" placeholder="Để trống = không giới hạn" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày hết hạn</label>
              <input type="datetime-local" value={form.expires_at} onChange={set('expires_at')} className="input" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Hủy</button>
            <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1">{loading ? 'Đang tạo...' : 'Tạo voucher'}</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Giảm</th>
                <th className="px-4 py-3">Đơn tối thiểu</th>
                <th className="px-4 py-3">Đã dùng</th>
                <th className="px-4 py-3">Hết hạn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {vouchers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Chưa có voucher</td></tr>
              ) : vouchers.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono font-bold text-primary-600">{v.code}</td>
                  <td className="px-4 py-3 font-semibold">
                    {v.discount_type === 'percent' ? `${v.discount_value}%` : formatPrice(v.discount_value)}
                  </td>
                  <td className="px-4 py-3">{v.min_order > 0 ? formatPrice(v.min_order) : '—'}</td>
                  <td className="px-4 py-3">{v.used_count} {v.max_uses ? `/ ${v.max_uses}` : ''}</td>
                  <td className="px-4 py-3 text-gray-400">{v.expires_at ? formatDate(v.expires_at) : '∞'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {v.is_active ? 'Hoạt động' : 'Đã xóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(v.id, v.code)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
