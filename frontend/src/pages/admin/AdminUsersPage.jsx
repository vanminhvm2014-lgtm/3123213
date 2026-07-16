import { useState, useEffect } from 'react'
import { Lock, Unlock, Pencil, X } from 'lucide-react'
import api from '../../utils/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

function UserModal({ user, onClose, onSaved }) {
  const [balance, setBalance] = useState(user.balance)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put(`/admin/users/${user.id}`, { balance: parseFloat(balance) })
      toast.success('Đã cập nhật!')
      onSaved()
    } catch (e) { toast.error(e.error) }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold">Chỉnh số dư - {user.name}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-5">
          <label className="block text-sm font-medium mb-2">Số dư mới (đ)</label>
          <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="input mb-4" min="0" />
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button onClick={handleSave} disabled={loading} className="btn-primary flex-1">{loading ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState(null)

  const fetch = () => {
    setLoading(true)
    api.get(`/admin/users${search ? `?search=${search}` : ''}`).then(d => setUsers(d.users)).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [search])

  const toggleLock = async (user) => {
    await api.put(`/admin/users/${user.id}`, { is_locked: !user.is_locked })
    toast.success(user.is_locked ? 'Đã mở khóa!' : 'Đã khóa tài khoản!')
    fetch()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Người dùng</h1>
        <input placeholder="Tìm theo tên, email..." value={search} onChange={e => setSearch(e.target.value)} className="input w-64" />
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Số dư</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.name} {u.role === 'admin' && <span className="badge bg-purple-100 text-purple-700 ml-1">Admin</span>}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-600">{formatPrice(u.balance)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.is_locked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.is_locked ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditUser(u)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500"><Pencil size={15} /></button>
                      {u.role !== 'admin' && (
                        <button onClick={() => toggleLock(u)} className={`p-1.5 rounded transition-colors ${u.is_locked ? 'hover:bg-green-50 text-green-500' : 'hover:bg-red-50 text-red-500'}`}>
                          {u.is_locked ? <Unlock size={15} /> : <Lock size={15} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editUser && <UserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); fetch() }} />}
    </div>
  )
}
