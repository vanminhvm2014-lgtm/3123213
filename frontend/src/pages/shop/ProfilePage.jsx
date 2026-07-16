import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../utils/helpers'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/auth/me', { name, password: password || undefined, newPassword: newPassword || undefined })
      await refreshUser()
      toast.success('Cập nhật thành công!')
      setPassword(''); setNewPassword('')
    } catch (e) { toast.error(e.error || 'Lỗi') }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tài khoản</h1>

      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Số dư ví</span>
          <span className="font-bold text-green-600">{formatPrice(user?.balance || 0)}</span>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4">Thông tin cá nhân</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={user?.email} disabled className="input opacity-50" />
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <p className="text-sm font-medium text-gray-500">Đổi mật khẩu (để trống nếu không đổi)</p>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" />
          </div>
          <button onClick={handleSave} disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}
