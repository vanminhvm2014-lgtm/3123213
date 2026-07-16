import { useState, useEffect } from 'react'
import { QrCode, CreditCard, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatPrice, formatDate } from '../../utils/helpers'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const TELCOS = ['Viettel', 'Mobifone', 'Vinaphone', 'Vietnamobile', 'Gmobile']
const CARD_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000]

export default function TopupPage() {
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState('qr')
  const [amount, setAmount] = useState(50000)
  const [qrData, setQrData] = useState(null)
  const [card, setCard] = useState({ telco: 'Viettel', serial: '', pin: '', amount: 50000 })
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    api.get('/topup/history').then(setHistory).catch(() => {})
  }, [])

  const handleQR = async () => {
    setLoading(true)
    try {
      const data = await api.post('/topup/qr', { amount })
      setQrData(data)
    } catch (e) { toast.error(e.error) }
    setLoading(false)
  }

  const handleCard = async () => {
    if (!card.serial || !card.pin) return toast.error('Nhập đầy đủ thông tin thẻ')
    setLoading(true)
    try {
      await api.post('/topup/card', card)
      toast.success('Đã gửi yêu cầu nạp thẻ!')
      setCard(c => ({ ...c, serial: '', pin: '' }))
      const h = await api.get('/topup/history')
      setHistory(h)
    } catch (e) { toast.error(e.error) }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Nạp tiền</h1>
      <p className="text-gray-500 mb-6">Số dư hiện tại: <span className="font-bold text-green-600">{formatPrice(user?.balance || 0)}</span></p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'qr', icon: <QrCode size={18} />, label: 'Chuyển khoản QR' },
          { id: 'card', icon: <CreditCard size={18} />, label: 'Thẻ cào' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${tab === t.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'qr' && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-4">Nạp tiền qua QR chuyển khoản</h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[50000, 100000, 200000, 500000, 1000000, 2000000].map(v => (
              <button key={v} onClick={() => setAmount(v)}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${amount === v ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}>
                {formatPrice(v)}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Số tiền khác</label>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="input" min="10000" step="1000" />
          </div>
          <button onClick={handleQR} disabled={loading} className="btn-primary w-full">{loading ? 'Đang tạo...' : 'Tạo mã QR'}</button>

          {qrData && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-semibold mb-2">Thông tin chuyển khoản</p>
              <div className="space-y-1 text-sm">
                <p>Ngân hàng: <b>{qrData.bank_name}</b></p>
                <p>STK: <b>{qrData.bank_account}</b></p>
                <p>Tên: <b>{qrData.bank_owner}</b></p>
                <p>Số tiền: <b className="text-green-600">{formatPrice(qrData.amount)}</b></p>
                <p className="text-primary-600">Nội dung: <b>{qrData.ref_code}</b></p>
              </div>
              <p className="text-xs text-orange-600 mt-3">⚠️ Nhập chính xác nội dung chuyển khoản để được duyệt tự động</p>
            </div>
          )}
        </div>
      )}

      {tab === 'card' && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-4">Nạp tiền qua thẻ cào</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nhà mạng</label>
              <select value={card.telco} onChange={e => setCard(c => ({ ...c, telco: e.target.value }))} className="input">
                {TELCOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mệnh giá</label>
              <div className="grid grid-cols-3 gap-2">
                {CARD_AMOUNTS.map(v => (
                  <button key={v} onClick={() => setCard(c => ({ ...c, amount: v }))}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${card.amount === v ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-gray-700'}`}>
                    {formatPrice(v)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số serial</label>
              <input value={card.serial} onChange={e => setCard(c => ({ ...c, serial: e.target.value }))} className="input" placeholder="Nhập serial thẻ" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mã thẻ (PIN)</label>
              <input value={card.pin} onChange={e => setCard(c => ({ ...c, pin: e.target.value }))} className="input" placeholder="Nhập mã thẻ" />
            </div>
            <button onClick={handleCard} disabled={loading} className="btn-primary w-full">{loading ? 'Đang gửi...' : 'Nạp thẻ'}</button>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Thẻ sẽ được duyệt thủ công trong vòng 15 phút</p>
        </div>
      )}

      {/* History */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Clock size={18} /> Lịch sử giao dịch</h2>
        {history.length === 0 ? (
          <p className="text-center text-gray-400 py-4">Chưa có giao dịch nào</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 20).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{tx.note || tx.type}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'purchase' ? 'text-red-500' : 'text-green-600'}`}>
                    {tx.type === 'purchase' ? '-' : '+'}{formatPrice(tx.amount)}
                  </p>
                  <span className={`text-xs ${tx.status === 'success' || tx.status === 'approved' ? 'text-green-500' : tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {tx.status === 'success' || tx.status === 'approved' ? '✓ Thành công' : tx.status === 'pending' ? '⏳ Chờ duyệt' : '✗ Thất bại'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
