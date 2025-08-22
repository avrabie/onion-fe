import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

export default function ProductDetails({ onAdd }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const backendSlug = decodeURIComponent(slug)
        const p = await api.getProductBySlug(backendSlug)
        if (mounted) setProduct(p)
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load product')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [slug])

  const price = useMemo(() => {
    const val = product?.price
    return typeof val === 'number' && Number.isFinite(val) ? val.toFixed(2) : val
  }, [product])

  const interestingInfo = useMemo(() => {
    if (!product) return []
    const omit = new Set(['id', 'name', 'description', 'imageUrl', 'price', 'quantity'])
    return Object.entries(product)
      .filter(([k, v]) => !omit.has(k) && v != null)
      .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
  }, [product])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-white/70 hover:text-white">← Back</button>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-4 sm:p-6 shadow-card">
        {loading && (
          <div className="text-white/70">Loading product…</div>
        )}
        {error && (
          <div className="p-3 rounded bg-red-600/20 border border-red-600/40 text-red-200 text-sm">{error}</div>
        )}
        {!loading && !error && product && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-800">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">🧅</div>
              )}
              {product.quantity > 0 ? (
                <span className="absolute left-3 top-3 text-[10px] tracking-wide uppercase px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  In stock
                </span>
              ) : (
                <span className="absolute left-3 top-3 text-[10px] tracking-wide uppercase px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/20">
                  Out of stock
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{product.name}</h1>
              <p className="mt-2 text-white/80">{product.description || 'No description available.'}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl font-bold text-emerald-300">${price}</span>
                <span className="text-xs text-white/50">/ kg</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 p-3">
                  <div className="text-xs text-white/60">Stock</div>
                  <div className="text-white font-semibold">{product.quantity ?? 0}</div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  disabled={(product.quantity ?? 0) <= 0}
                  onClick={() => onAdd?.(product)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${(product.quantity ?? 0) <= 0 ? 'bg-gray-600 cursor-not-allowed text-white/60' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                  aria-label="Add to cart"
                >
                  <span>Add to cart</span>
                  <span>➕</span>
                </button>
              </div>
              {interestingInfo.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold text-white/90 mb-2">More info</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {interestingInfo.map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-white/10 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/50">{k}</div>
                        <div className="text-sm text-white/90 break-words">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
