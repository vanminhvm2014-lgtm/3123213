export const formatPrice = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export const formatDate = (d) =>
  new Date(d).toLocaleString('vi-VN')

export const imgUrl = (file) =>
  file ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/uploads/${file}` : null

export const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Hoàn tiền', color: 'bg-purple-100 text-purple-800' },
}
