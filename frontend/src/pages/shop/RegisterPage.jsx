import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Mật khẩu không khớp')
    if (form.password.length < 6) return toast.error('Mật khẩu ít nhất 6 ký tự')
    setLoading(true)
    try {
      const data = await register(form.name, form.email, form.password)
      toast.success(`Chào mừng, ${data.user.name}!`)
      navigate('/')
    } catch (err) { toast.error(err.error || 'Đăng ký thất bại') }
    setLoading(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600">
            <Store size={28} /> {settings.shop_name || 'MyShop'}
          </Link>
          <h1 className="text-xl font-bold mt-4">Tạo tài khoản</h1>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Họ tên</label>
              <input value={form.name} onChange={set('name')} className="input" placeholder="Nguyễn Văn A" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="input" placeholder="email@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mật khẩu</label>
              <input type="password" value={form.password} onChange={set('password')} className="input" placeholder="Ít nhất 6 ký tự" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
              <input type="password" value={form.confirm} onChange={set('confirm')} className="input" placeholder="Nhập lại mật khẩu" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Đã có tài khoản? <Link to="/login" className="text-primary-600 font-medium hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
