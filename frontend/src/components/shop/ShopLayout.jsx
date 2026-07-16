import { Outlet, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Sun, Moon, Store, LogOut, Package, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useSettings } from '../../context/SettingsContext'
import { formatPrice } from '../../utils/helpers'
import { useState } from 'react'

export default function ShopLayout() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const { settings, dark, toggleDark } = useSettings()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <Store size={24} />
            <span>{settings.shop_name || 'MyShop'}</span>
          </Link>

          <div className="flex-1" />

          {/* Actions */}
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(m => !m)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <User size={18} />
                <span className="text-sm font-medium hidden sm:block">{user.name}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-56 card shadow-lg z-50 py-1" onClick={() => setMenuOpen(false)}>
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-green-600 font-semibold">{formatPrice(user.balance)}</p>
                  </div>
                  <Link to="/topup" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><Wallet size={16} /> Nạp tiền</Link>
                  <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><Package size={16} /> Đơn hàng</Link>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><User size={16} /> Tài khoản</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800">⚙️ Admin</Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-secondary text-sm">Đăng nhập</Link>
              <Link to="/register" className="btn-primary text-sm hidden sm:block">Đăng ký</Link>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p className="font-bold text-white text-lg mb-1">{settings.shop_name || 'MyShop'}</p>
          <p>{settings.shop_email}</p>
          <p className="mt-4 text-xs">© {new Date().getFullYear()} {settings.shop_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
