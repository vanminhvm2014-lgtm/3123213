import { useState, useEffect, useRef } from 'react'
import api from '../../utils/api'
import { imgUrl } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [form, setForm] = useState({})
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(false)
  const logoRef = useRef(); const bannerRef = useRef(); const qrRef = useRef()

  useEffect(() => {
    api.get('/admin/settings').then(setForm).catch(() => {})
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ''))
      if (files.logo) fd.append('logo', files.logo)
      if (files.banner) fd.append('banner', files.banner)
      if (files.bank_qr) fd.append('bank_qr', files.bank_qr)
      await api.put('/admin/settings', fd)
      toast.success('Đã lưu cài đặt!')
    } catch (e) { toast.error('Lỗi lưu cài đặt') }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Cài đặt</h1>

      <div className="space-y-5">
        {/* Shop info */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Thông tin shop</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tên shop</label>
              <input value={form.shop_name || ''} onChange={set('shop_name')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email liên hệ</label>
              <input value={form.shop_email || ''} onChange={set('shop_email')} className="input" type="email" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Hình ảnh</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Logo</label>
              {form.shop_logo && <img src={imgUrl(form.shop_logo)} alt="Logo" className="h-16 mb-2 rounded" />}
              <input type="file" ref={logoRef} accept="image/*" onChange={e => setFiles(f => ({ ...f, logo: e.target.files[0] }))} className="hidden" />
              <button onClick={() => logoRef.current.click()} className="btn-secondary text-sm">
                {files.logo ? files.logo.name : 'Chọn logo'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Banner trang chủ</label>
              {form.shop_banner && <img src={imgUrl(form.shop_banner)} alt="Banner" className="h-24 w-full object-cover rounded mb-2" />}
              <input type="file" ref={bannerRef} accept="image/*" onChange={e => setFiles(f => ({ ...f, banner: e.target.files[0] }))} className="hidden" />
              <button onClick={() => bannerRef.current.click()} className="btn-secondary text-sm">
                {files.banner ? files.banner.name : 'Chọn banner'}
              </button>
            </div>
          </div>
        </div>

        {/* Bank info */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Thông tin chuyển khoản</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ngân hàng</label>
              <input value={form.bank_name || ''} onChange={set('bank_name')} className="input" placeholder="Vietcombank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số tài khoản</label>
              <input value={form.bank_account || ''} onChange={set('bank_account')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chủ tài khoản</label>
              <input value={form.bank_owner || ''} onChange={set('bank_owner')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">QR chuyển khoản</label>
              {form.bank_qr && <img src={imgUrl(form.bank_qr)} alt="QR" className="h-32 mb-2 rounded border" />}
              <input type="file" ref={qrRef} accept="image/*" onChange={e => setFiles(f => ({ ...f, bank_qr: e.target.files[0] }))} className="hidden" />
              <button onClick={() => qrRef.current.click()} className="btn-secondary text-sm">
                {files.bank_qr ? files.bank_qr.name : 'Chọn ảnh QR'}
              </button>
            </div>
          </div>
        </div>

        {/* Auto approve card topup */}
        <div className="card p-5">
          <h2 className="font-semibold mb-2">Nạp thẻ cào</h2>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.auto_approve_card === '1'}
              onChange={e => setForm(f => ({ ...f, auto_approve_card: e.target.checked ? '1' : '0' }))}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-sm">Tự động duyệt thẻ cào</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                ⚠️ Rủi ro: hệ thống chưa tích hợp API kiểm tra thẻ thật, bật tùy chọn này nghĩa là <b>tin tưởng hoàn toàn</b> thông tin
                serial/mã thẻ người dùng nhập vào, mà không xác minh thẻ có hợp lệ hay còn tiền không. Có thể bị lợi dụng nạp thẻ giả/đã dùng.
              </p>
            </div>
          </label>
        </div>

        <button onClick={handleSave} disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? 'Đang lưu...' : 'Lưu tất cả cài đặt'}
        </button>
      </div>
    </div>
  )
}
