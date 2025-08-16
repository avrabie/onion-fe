import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api } from './api'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CartPage from './pages/CartPage.jsx'
import About from './pages/About.jsx'
import ProductDetails from './pages/ProductDetails.jsx'

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

  async function handleIncrease(productId) {
    setLoading((s) => ({ ...s, action: true }))
    setError(null)
    try {
      await api.addToCart(userId, { productId, quantity: 1 })
      await loadCart()
    } catch (e) {
      setError(`Failed to increase quantity: ${e.message}`)
    } finally {
      setLoading((s) => ({ ...s, action: false }))
    }
  }

  async function handleDecrease(productId) {
    setLoading((s) => ({ ...s, action: true }))
    setError(null)
    try {
      const item = cart?.items?.find((it) => it.productId === productId)
      if (!item) return
      if ((item.quantity || 0) > 1) {
        // Prefer decrementing by 1; backend should adjust quantity
        await api.addToCart(userId, { productId, quantity: -1 })
      } else {
        await api.removeFromCart(userId, { productId })
      }
      await loadCart()
    } catch (e) {
      setError(`Failed to decrease quantity: ${e.message}`)
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
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
          <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
            <Link to="/" className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="text-2xl">🧅</span>
              <span>Onion Shop</span>
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6 text-white/80">
              <Link className="hover:text-white" to="/">Home</Link>
              <Link className="hover:text-white" to="/about">About</Link>
              <Link className="relative inline-flex items-center hover:text-white" to="/cart" aria-label="Cart">
                <span className="text-white/80">🧺</span>
                <span className="absolute -top-2 -right-2 text-[10px] bg-emerald-600 rounded-full px-1.5 py-0.5 border border-emerald-400/30 shadow">
                  {inCartCount}
                </span>
              </Link>
              <span className="text-xs sm:text-sm text-white/60 hidden sm:inline">
                {loading.products ? 'Loading onions…' : `${products.length} products`}
              </span>
            </nav>
          </div>
        </header>

        <main>
          <Routes>
            <Route
              path="/"
              element={<Home products={products} onAdd={handleAdd} loading={loading.products} error={error} />}
            />
            <Route
              path="/cart"
              element={<CartPage cart={cart} products={products} onRemove={handleRemove} onEmpty={handleEmpty} onCheckout={handleCheckout} loadingAction={loading.action} onIncrease={handleIncrease} onDecrease={handleDecrease} />}
            />
            <Route path="/about" element={<About />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/checkout/success" element={<SuccessPage />} />
            <Route path="/checkout/cancel" element={<CancelPage />} />
          </Routes>
        </main>

        <footer className="mt-8 border-t border-white/10 py-8 text-center text-white/60">
          <p className="text-sm">Fresh onions. Local backend. Have a tear-free day.</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
