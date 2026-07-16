import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, Wallet, Gamepad2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../utils/helpers'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [voucherCode, setVoucherCode] = useState('')
  const [voucher, setVoucher] = useState(null)
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const directItems = items.filter(i => i.product_type === 'direct')
  const [directInfo, setDirectInfo] = useState({}) // { [productId]: { server_ip, server_port, mc_name } }

  const setDirectField = (id, field, value) =>
    setDirectInfo(d => ({ ...d, [id]: { ...d[id], [field]: value } }))

  const checkVoucher = async () => {
    try {
      const data = await api.post('/vouchers/check', { code: voucherCode, total })
      setVoucher(data.voucher)
      setVoucherDiscount(data.discount)
      toast.success(`Voucher hợp lệ! Giảm ${formatPrice(data.discount)}`)
    } catch (e) { toast.error(e.error); setVoucher(null); setVoucherDiscount(0) }
  }

  const finalTotal = Math.max(total - voucherDiscount, 0)

  const handleOrder = async () => {
    if (user.balance < finalTotal) return toast.error('Số dư không đủ, vui lòng nạp thêm tiền')

    // Validate thông tin dịch vụ trực tiếp
    for (const item of directItems) {
      const info = directInfo[item.id]
      if (!info?.server_ip || !info?.server_port || !info?.mc_name) {
        return toast.error(`Vui lòng nhập đầy đủ IP, Port, Tên MC cho "${item.name}"`)
      }
    }

    setLoading(true)
    try {
      const data = await api.post('/orders', {
        items: items.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
          ...(i.product_type === 'direct' ? {
            server_ip: directInfo[i.id]?.server_ip,
            server_port: directInfo[i.id]?.server_port,
            mc_name: directInfo[i.id]?.mc_name,
          } : {})
        })),
        voucher_code: voucher?.code || null,
        note
      })
      clear()
      await refreshUser()
      toast.success('Đặt hàng thành công!')
      navigate(`/orders/${data.order_id}`)
    } catch (e) { toast.error(e.error || 'Lỗi đặt hàng') }
    setLoading(false)
  }

  if (items.length === 0) { navigate('/cart'); return null }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      {/* Balance */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <Wallet className="text-green-500" />
        <div>
          <p className="text-sm text-gray-500">Số dư ví</p>
          <p className="font-bold text-green-600 text-lg">{formatPrice(user?.balance || 0)}</p>
        </div>
        {user?.balance < finalTotal && (
          <span className="ml-auto text-red-500 text-sm font-medium">Không đủ tiền</span>
        )}
      </div>

      {/* Products summary */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold mb-3">Sản phẩm ({items.length})</h2>
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{i.name} x{i.quantity}</span>
              <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Direct service info */}
      {directItems.length > 0 && (
        <div className="card p-4 mb-4 border-blue-200 dark:border-blue-900">
          <label className="block text-sm font-medium mb-3 flex items-center gap-2 text-blue-600">
            <Gamepad2 size={16} /> Thông tin dịch vụ trực tiếp
          </label>
          <div className="space-y-4">
            {directItems.map(item => (
              <div key={item.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="font-medium text-sm mb-2">{item.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    placeholder="IP server (crack)"
                    value={directInfo[item.id]?.server_ip || ''}
                    onChange={e => setDirectField(item.id, 'server_ip', e.target.value)}
                    className="input text-sm"
                  />
                  <input
                    placeholder="Port"
                    value={directInfo[item.id]?.server_port || ''}
                    onChange={e => setDirectField(item.id, 'server_port', e.target.value)}
                    className="input text-sm"
                  />
                  <input
                    placeholder="Tên MC (username)"
                    value={directInfo[item.id]?.mc_name || ''}
                    onChange={e => setDirectField(item.id, 'mc_name', e.target.value)}
                    className="input text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">⚠️ Đơn hàng dịch vụ trực tiếp cần admin xử lý và duyệt thủ công.</p>
        </div>
      )}

      {/* Voucher */}
      <div className="card p-4 mb-4">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Tag size={16} /> Mã giảm giá</label>
        <div className="flex gap-2">
          <input value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="Nhập mã voucher" className="input flex-1" />
          <button onClick={checkVoucher} className="btn-secondary px-4">Áp dụng</button>
        </div>
        {voucher && <p className="text-green-600 text-sm mt-2">✅ Giảm {formatPrice(voucherDiscount)}</p>}
      </div>

      {/* Note */}
      <div className="card p-4 mb-4">
        <label className="block text-sm font-medium mb-2">Ghi chú</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} className="input resize-none h-20" placeholder="Ghi chú đơn hàng..." />
      </div>

      {/* Total */}
      <div className="card p-4 mb-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(total)}</span></div>
          {voucherDiscount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatPrice(voucherDiscount)}</span></div>}
          <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2">
            <span>Tổng thanh toán</span><span className="text-primary-600">{formatPrice(finalTotal)}</span>
          </div>
        </div>
      </div>

      <button onClick={handleOrder} disabled={loading || user?.balance < finalTotal} className="btn-primary w-full text-lg py-3">
        {loading ? 'Đang xử lý...' : `Xác nhận thanh toán ${formatPrice(finalTotal)}`}
      </button>
    </div>
  )
}
