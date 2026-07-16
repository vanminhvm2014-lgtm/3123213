import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import api from '../../utils/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function AdminTopupPage() {
  const [tab, setTab] = useState('qr')
  const [qrTxs, setQrTxs] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    const [txs, cardList] = await Promise.all([
      api.get('/topup/all?type=topup_qr&status=pending'),
      api.get('/topup/card/pending')
    ])
    setQrTxs(txs)
    setCards(cardList)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const approveQR = async (id, status) => {
    try {
      await api.post('/topup/qr/approve', { transaction_id: id, status })
      toast.success(status === 'success' ? 'Đã duyệt!' : 'Đã từ chối!')
      fetchAll()
    } catch (e) { toast.error(e.error) }
  }

  const approveCard = async (id, status) => {
    try {
      await api.post(`/topup/card/${id}/approve`, { status })
      toast.success(status === 'approved' ? 'Đã duyệt thẻ!' : 'Đã từ chối thẻ!')
      fetchAll()
    } catch (e) { toast.error(e.error) }
  }

  const ActionBtns = ({ onApprove, onReject }) => (
    <div className="flex gap-2">
      <button onClick={onApprove} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors" title="Duyệt"><CheckCircle size={18} /></button>
      <button onClick={onReject} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors" title="Từ chối"><XCircle size={18} /></button>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý nạp tiền</h1>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'qr', label: `Chuyển khoản QR (${qrTxs.length})` },
          { id: 'card', label: `Thẻ cào (${cards.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === t.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div> : (

        tab === 'qr' ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Số tiền</th>
                    <th className="px-4 py-3">Mã tham chiếu</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {qrTxs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">Không có yêu cầu nào</td></tr>
                  ) : qrTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{tx.user_name}</p>
                        <p className="text-xs text-gray-400">{tx.email}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600">{formatPrice(tx.amount)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary-600">{tx.ref_code}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(tx.created_at)}</td>
                      <td className="px-4 py-3"><ActionBtns onApprove={() => approveQR(tx.id, 'success')} onReject={() => approveQR(tx.id, 'failed')} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Nhà mạng</th>
                    <th className="px-4 py-3">Serial</th>
                    <th className="px-4 py-3">Mã thẻ</th>
                    <th className="px-4 py-3">Mệnh giá</th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {cards.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Không có yêu cầu nào</td></tr>
                  ) : cards.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.user_name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{c.telco}</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.serial}</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.pin}</td>
                      <td className="px-4 py-3 font-bold text-green-600">{formatPrice(c.amount)}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3"><ActionBtns onApprove={() => approveCard(c.id, 'approved')} onReject={() => approveCard(c.id, 'rejected')} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}
