import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Shop pages
import HomePage from './pages/shop/HomePage'
import ProductPage from './pages/shop/ProductPage'
import CartPage from './pages/shop/CartPage'
import CheckoutPage from './pages/shop/CheckoutPage'
import OrdersPage from './pages/shop/OrdersPage'
import OrderDetailPage from './pages/shop/OrderDetailPage'
import ProfilePage from './pages/shop/ProfilePage'
import TopupPage from './pages/shop/TopupPage'
import LoginPage from './pages/shop/LoginPage'
import RegisterPage from './pages/shop/RegisterPage'

// Admin pages
import AdminLayout from './components/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminVouchersPage from './pages/admin/AdminVouchersPage'
import AdminTopupPage from './pages/admin/AdminTopupPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

// Layout
import ShopLayout from './components/shop/ShopLayout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'admin') return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Shop */}
      <Route element={<ShopLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/topup" element={<PrivateRoute><TopupPage /></PrivateRoute>} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="vouchers" element={<AdminVouchersPage />} />
        <Route path="topup" element={<AdminTopupPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  )
}
