import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Star, Download, ArrowLeft, Package } from 'lucide-react'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { formatPrice, formatDate, imgUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { add } = useCart()
  const { user } = useAuth()

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${slug}`).then(setProduct).catch(() => {}).finally(() => setLoading(false))
  }, [slug])

  const submitReview = async () => {
    setSubmitting(true)
    try {
      await api.post(`/products/${product.id}/reviews`, { rating, comment })
      toast.success('Đánh giá đã được gửi!')
      const updated = await api.get(`/products/${slug}`)
      setProduct(updated)
      setComment('')
    } catch (e) { toast.error(e.error || 'Lỗi gửi đánh giá') }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">😕</p>
      <p className="text-xl font-semibold">Không tìm thấy sản phẩm</p>
      <Link to="/" className="btn-primary mt-4 inline-block">Về trang chủ</Link>
    </div>
  )

  const tags = Array.isArray(product.tags) ? product.tags : []
  const avgRating = product.avg_rating ? Number(product.avg_rating).toFixed(1) : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft size={18} /> Quay lại
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="card overflow-hidden">
          {product.image ? (
            <img src={imgUrl(product.image)} alt={product.name} className="w-full aspect-square object-cover" />
          ) : (
            <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-8xl">📦</div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map(t => (
              <span key={t} className="badge bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">{t}</span>
            ))}
            {product.is_featured ? <span className="badge bg-yellow-100 text-yellow-700">⭐ Nổi bật</span> : null}
            {product.product_type === 'direct' && <span className="badge bg-blue-100 text-blue-700">🎮 Dịch vụ trực tiếp</span>}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            {avgRating ? (
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(Number(avgRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                ))}
                <span className="text-sm text-gray-500 ml-1">{avgRating} ({product.review_count} đánh giá)</span>
              </div>
            ) : <span className="text-sm text-gray-400">Chưa có đánh giá</span>}
          </div>

          <div className="text-3xl font-bold text-primary-600 mb-4">{formatPrice(product.price)}</div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Package size={16} />
            <span>{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : <span className="text-red-500 font-medium">Hết hàng</span>}</span>
          </div>

          {product.description && (
            <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-wrap">
              {product.description}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { add(product); toast.success('Đã thêm vào giỏ!') }}
              disabled={product.stock === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
            {product.file_path && (
              <a href={imgUrl(product.file_path)} download className="btn-secondary flex items-center gap-2">
                <Download size={18} /> Tải file
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Đánh giá sản phẩm</h2>

        {user && (
          <div className="card p-5 mb-6">
            <h3 className="font-semibold mb-3">Viết đánh giá</h3>
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star size={24} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Nhận xét của bạn..."
              className="input mb-3 h-24 resize-none"
            />
            <button onClick={submitReview} disabled={submitting} className="btn-primary">
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        )}

        {product.reviews?.length === 0 && <p className="text-gray-400 text-center py-8">Chưa có đánh giá nào</p>}

        <div className="space-y-4">
          {product.reviews?.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                  {r.user_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{r.user_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
                </div>
                <div className="flex gap-0.5 ml-auto">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}
                </div>
              </div>
              {r.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
