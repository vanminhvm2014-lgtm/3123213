import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(form.email, form.password)
      toast.success(`Chào mừng, ${data.user.name}!`)
      navigate(data.user.role === 'admin' ? '/admin' : '/')
    } catch (err) { toast.error(err.error || 'Đăng nhập thất bại') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600">
            <Store size={28} /> {settings.shop_name || 'MyShop'}
          </Link>
          <h1 className="text-xl font-bold mt-4">Đăng nhập</h1>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="email@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mật khẩu</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Chưa có tài khoản? <Link to="/register" className="text-primary-600 font-medium hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
