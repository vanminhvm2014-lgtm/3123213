import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Wallet, Settings, LogOut, Store, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'

const NAV = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: <Package size={18} />, label: 'Sản phẩm' },
  { to: '/admin/orders', icon: <ShoppingBag size={18} />, label: 'Đơn hàng' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'Người dùng' },
  { to: '/admin/vouchers', icon: <Tag size={18} />, label: 'Voucher' },
  { to: '/admin/topup', icon: <Wallet size={18} />, label: 'Nạp tiền' },
  { to: '/admin/settings', icon: <Settings size={18} />, label: 'Cài đặt' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 font-bold text-lg text-primary-600">
          <Store size={22} />{settings.shop_name || 'MyShop'}
        </div>
        <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`
            }>
            {n.icon}{n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="px-3 py-2 text-sm">
          <p className="font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1">
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => setOpen(true)} className="p-1"><Menu size={22} /></button>
          <span className="font-semibold">Admin</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
