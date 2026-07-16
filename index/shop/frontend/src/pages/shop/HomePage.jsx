import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, ShoppingCart, Zap } from 'lucide-react'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'
import { useSettings } from '../../context/SettingsContext'
import { formatPrice, imgUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'

const TAGS = ['NEW', 'HOT', 'SALE']

const TAG_COLORS = {
  NEW: 'bg-blue-500',
  HOT: 'bg-red-500',
  SALE: 'bg-green-500',
}

function ProductCard({ product }) {
  const { add } = useCart()
  const tags = Array.isArray(product.tags) ? product.tags : []

  return (
    <div className="card overflow-hidden group hover:shadow-md transition-shadow">
      <Link to={`/product/${product.slug}`} className="block relative">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {product.image ? (
            <img src={imgUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
          )}
        </div>
        {/* Tags */}
        {tags.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {tags.map(tag => (
              <span key={tag} className={`${TAG_COLORS[tag] || 'bg-gray-500'} text-white text-xs px-2 py-0.5 rounded font-bold`}>{tag}</span>
            ))}
          </div>
        )}
        {product.is_featured ? (
          <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded font-bold">⭐ Nổi bật</span>
        ) : null}
        {product.product_type === 'direct' && (
          <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-bold">🎮 Trực tiếp</span>
        )}
      </Link>

      <div className="p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.category_name || 'Chưa phân loại'}</p>
        <Link to={`/product/${product.slug}`} className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-primary-600 transition-colors">
          {product.name}
        </Link>

        <div className="flex items-center gap-1 mt-1">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-500">{product.avg_rating ? Number(product.avg_rating).toFixed(1) : 'Chưa có'}</span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-primary-600 text-lg">{formatPrice(product.price)}</span>
          <button
            onClick={() => { add(product); toast.success('Đã thêm vào giỏ!') }}
            disabled={product.stock === 0}
            className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <ShoppingCart size={14} />
            {product.stock === 0 ? 'Hết' : 'Thêm'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Còn {product.stock} sản phẩm</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { settings } = useSettings()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 12 })
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (tag) params.set('tag', tag)
      const data = await api.get(`/products?${params}`)
      setProducts(data.products)
      setTotalPages(data.totalPages)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { api.get('/admin/categories').then(setCategories).catch(() => {}) }, [])
  useEffect(() => { fetchProducts() }, [search, category, tag, page])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Banner */}
      {settings.shop_banner && (
        <div className="mb-8 rounded-2xl overflow-hidden">
          <img src={imgUrl(settings.shop_banner)} alt="Banner" className="w-full h-48 md:h-64 object-cover" />
        </div>
      )}

      {/* Hero */}
      {!settings.shop_banner && (
        <div className="mb-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-2 mb-2"><Zap size={20} /><span className="text-sm font-medium opacity-80">Chào mừng đến với</span></div>
          <h1 className="text-3xl md:text-4xl font-bold">{settings.shop_name || 'MyShop'}</h1>
          <p className="mt-2 opacity-80">Mua sắm dễ dàng, thanh toán nhanh chóng</p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input pl-10"
          />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }} className="input sm:w-48">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={tag} onChange={e => { setTag(e.target.value); setPage(1) }} className="input sm:w-36">
          <option value="">Tất cả tag</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200 dark:bg-gray-800" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">Không tìm thấy sản phẩm</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
