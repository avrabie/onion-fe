import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api } from './api'
import ProductCard from './components/ProductCard.jsx'
import Cart from './components/Cart.jsx'

function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white/5 border border-white/10 rounded-xl p-8">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
        <p className="text-white/70 mb-6">Thank you for your purchase. Your onions are on their way!</p>
        <a href="/" className="inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500">Back to shop</a>
      </div>
    </div>
  )
}

function CancelPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white/5 border border-white/10 rounded-xl p-8">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Payment canceled</h1>
        <p className="text-white/70 mb-6">Your payment was canceled. You can continue shopping and try again.</p>
        <a href="/" className="inline-block px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500">Back to shop</a>
      </div>
    </div>
  )
}

function App() {
  // Simple path-based routing without extra deps
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (path === '/checkout/success') return <SuccessPage />
  if (path === '/checkout/cancel') return <CancelPage />

  // For dev purposes, a fixed userId. In a real app, this would come from auth.
  const userId = 1

  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState({ products: false, cart: false, action: false })
  const [error, setError] = useState(null)

  async function loadProducts() {
    setLoading((s) => ({ ...s, products: true }))
    setError(null)
    try {
      const list = await api.getProducts()
      // The spec returns a schema of Product; if backend returns an array, use directly
      setProducts(Array.isArray(list) ? list : (list?.content || []))
    } catch (e) {
      setError(`Failed to load products: ${e.message}`)
    } finally {
      setLoading((s) => ({ ...s, products: false }))
    }
  }

  async function loadCart() {
    setLoading((s) => ({ ...s, cart: true }))
    try {
      const c = await api.getCart(userId)
      setCart(c)
    } catch (e) {
      // If cart for new user doesn't exist, backend might create on first add; ignore 404 gracefully
      setCart({ items: [], totalPrice: 0 })
    } finally {
      setLoading((s) => ({ ...s, cart: false }))
    }
  }

  useEffect(() => {
    loadProducts()
    loadCart()
  }, [])

  const inCartCount = useMemo(() => cart?.items?.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0, [cart])

  async function handleAdd(product) {
    setLoading((s) => ({ ...s, action: true }))
    setError(null)
    try {
      await api.addToCart(userId, { productId: product.id, quantity: 1 })
      await loadCart()
    } catch (e) {
      setError(`Failed to add to cart: ${e.message}`)
    } finally {
      setLoading((s) => ({ ...s, action: false }))
    }
  }

  async function handleRemove(productId) {
    setLoading((s) => ({ ...s, action: true }))
    setError(null)
    try {
      await api.removeFromCart(userId, { productId })
      await loadCart()
    } catch (e) {
      setError(`Failed to remove item: ${e.message}`)
    } finally {
      setLoading((s) => ({ ...s, action: false }))
    }
  }

  async function handleEmpty() {
    setLoading((s) => ({ ...s, action: true }))
    setError(null)
    try {
      await api.emptyCart(userId)
      await loadCart()
    } catch (e) {
      setError(`Failed to empty cart: ${e.message}`)
    } finally {
      setLoading((s) => ({ ...s, action: false }))
    }
  }

  function absoluteUrl(path) {
    return `${window.location.origin}${path}`
  }

  async function handleCheckout() {
    setLoading((s) => ({ ...s, action: true }))
    setError(null)
    try {
      // 1) Create the order from cart
      const order = await api.checkout(userId)
      const orderId = order?.id
      if (!orderId) {
        throw new Error('Order was created but no orderId was returned by the backend')
      }

      // 2) Ask backend to create checkout session with fully qualified URLs
      const successUrl = absoluteUrl('/checkout/success')
      const cancelUrl = absoluteUrl('/checkout/cancel')
      const session = await api.createCheckout({ orderId, successUrl, cancelUrl })
      const checkoutUrl = session?.checkoutUrl
      if (!checkoutUrl) {
        throw new Error('No checkoutUrl returned from payments endpoint')
      }

      // 3) Redirect user to Stripe Checkout
      window.location.assign(checkoutUrl)
    } catch (e) {
      setError(`Failed to checkout: ${e.message}`)
    } finally {
      setLoading((s) => ({ ...s, action: false }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-white/10 bg-slate-900/70 sticky top-0 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">🧅 Onion Shop</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70">{loading.products ? 'Loading onions…' : `${products.length} products`}</span>
            <span className="relative inline-flex items-center">
              <span className="text-white/80">🧺</span>
              <span className="absolute -top-2 -right-2 text-xs bg-emerald-600 rounded-full px-1.5 py-0.5">{inCartCount}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2">
          {error && (
            <div className="mb-4 p-3 rounded bg-red-600/20 border border-red-600/40 text-red-200 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading.products && products.length === 0 && (
              <div className="col-span-full text-white/70">Loading products…</div>
            )}
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={handleAdd} />
            ))}
          </div>
        </section>
        <aside className="md:col-span-1">
          <Cart
            cart={cart}
            onRemove={handleRemove}
            onEmpty={handleEmpty}
            onCheckout={handleCheckout}
            loadingAction={loading.action}
          />
        </aside>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-white/50">
        Fresh onions. Local backend. Have a tear-free day.
      </footer>
    </div>
  )
}

export default App
