import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Star, X } from 'lucide-react'
import api from '../../utils/api'
import { formatPrice, imgUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'

const TAGS = ['NEW', 'HOT', 'SALE']

function ProductModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '',
    price: product?.price || '', stock: product?.stock || 0,
    category_id: product?.category_id || '', is_featured: product?.is_featured ? 'true' : 'false',
    tags: Array.isArray(product?.tags) ? product.tags : [],
    product_type: product?.product_type || 'tool',
  })
  const isDirect = form.product_type === 'direct'
  const [imageFile, setImageFile] = useState(null)
  const [dataFile, setDataFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const imgRef = useRef()
  const fileRef = useRef()

  const toggleTag = (t) => setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] }))

  const handleSubmit = async () => {
    if (!form.name || !form.price) return toast.error('Điền tên và giá sản phẩm')
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, k === 'tags' ? JSON.stringify(v) : v))
      if (imageFile) fd.append('image', imageFile)
      if (dataFile) fd.append('file', dataFile)

      if (product) await api.put(`/products/${product.id}`, fd)
      else await api.post('/products', fd)

      toast.success(product ? 'Đã cập nhật!' : 'Đã thêm sản phẩm!')
      onSaved()
    } catch (e) { toast.error(e.error || 'Lỗi') }
    setLoading(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-lg">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Loại sản phẩm *</label>
            <select value={form.product_type} onChange={set('product_type')} className="input">
              <option value="tool">🛠️ Dịch vụ Tools (có file download)</option>
              <option value="direct">🎮 Dịch vụ trực tiếp (khách nhập IP/Port/Tên MC khi mua)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
            <input value={form.name} onChange={set('name')} className="input" placeholder="Tên sản phẩm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Giá (đ) *</label>
              <input type="number" value={form.price} onChange={set('price')} className="input" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tồn kho</label>
              <input type="number" value={form.stock} onChange={set('stock')} className="input" min="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Danh mục</label>
            <select value={form.category_id} onChange={set('category_id')} className="input">
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea value={form.description} onChange={set('description')} className="input h-24 resize-none" placeholder="Mô tả sản phẩm..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex gap-2">
              {TAGS.map(t => (
                <button key={t} type="button" onClick={() => toggleTag(t)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${form.tags.includes(t) ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nổi bật</label>
            <select value={form.is_featured} onChange={set('is_featured')} className="input">
              <option value="false">Không</option>
              <option value="true">⭐ Có</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ảnh sản phẩm</label>
            <input type="file" ref={imgRef} accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="hidden" />
            <button type="button" onClick={() => imgRef.current.click()} className="btn-secondary text-sm w-full">
              {imageFile ? imageFile.name : (product?.image ? '🖼 Đã có ảnh - Bấm để đổi' : '📁 Chọn ảnh')}
            </button>
          </div>
          {isDirect ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              ℹ️ Dịch vụ trực tiếp không cần file download. Khi khách mua, họ sẽ nhập <b>IP server, Port, Tên MC</b> — admin xử lý và duyệt đơn thủ công.
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">File sản phẩm số (tuỳ chọn)</label>
              <input type="file" ref={fileRef} onChange={e => setDataFile(e.target.files[0])} className="hidden" />
              <button type="button" onClick={() => fileRef.current.click()} className="btn-secondary text-sm w-full">
                {dataFile ? dataFile.name : (product?.file_path ? '📦 Đã có file - Bấm để đổi' : '📁 Chọn file')}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Đang lưu...' : (product ? 'Cập nhật' : 'Thêm mới')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | product

  const fetchAll = async () => {
    setLoading(true)
    const [p, c] = await Promise.all([api.get('/products?limit=100'), api.get('/admin/categories')])
    setProducts(p.products)
    setCategories(c)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return
    await api.delete(`/products/${id}`)
    toast.success('Đã xóa sản phẩm')
    fetchAll()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Giá</th>
                  <th className="px-4 py-3">Tồn</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Nổi bật</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {p.image ? <img src={imgUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.category_name || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.product_type === 'direct' ? (
                        <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">🎮 Trực tiếp</span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">🛠️ Tools</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-yellow-500' : 'text-green-600'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(Array.isArray(p.tags) ? p.tags : []).map(t => (
                          <span key={t} className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.is_featured ? <Star size={16} className="text-yellow-400 fill-yellow-400" /> : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(p)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500 transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <p className="text-center text-gray-400 py-12">Chưa có sản phẩm nào</p>}
          </div>
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAll() }}
        />
      )}
    </div>
  )
}
