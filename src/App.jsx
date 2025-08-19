import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { api, saveAppUserId } from './api'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CartPage from './pages/CartPage.jsx'
import About from './pages/About.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Login from './pages/Login.jsx'
import Logout from './pages/Logout.jsx'
import UserProfile from './pages/UserProfile.jsx'
import Register from './pages/Register.jsx'

function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white/5 border border-white/10 rounded-xl p-8">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
        <p className="text-white/70 mb-6">Thank you for your purchase. Your onions are on their way!</p>
        <Link to="/" className="inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500">Back to shop</Link>
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
        <Link to="/" className="inline-block px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500">Back to shop</Link>
      </div>
    </div>
  )
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='))
    ?.split('=')[1]
}

function LogoutButton() {
  const action = api.getLogoutUrl()
  const csrf = getCookie('XSRF-TOKEN') || getCookie('X-CSRF-TOKEN') || getCookie('csrfToken')
  return (
    <form action={action} method="POST">
      {csrf && <input type="hidden" name="_csrf" value={decodeURIComponent(csrf)} />}
      <button type="submit" className="hover:text-white">Logout</button>
    </form>
  )
}

// ----- Guest cart helpers -----
function readGuestCart() {
  try {
    const raw = localStorage.getItem('onion.guestCart')
    return raw ? JSON.parse(raw) : { items: [], totalPrice: 0 }
  } catch (_) {
    return { items: [], totalPrice: 0 }
  }
}
function writeGuestCart(cart) {
  try {
    localStorage.setItem('onion.guestCart', JSON.stringify(cart))
  } catch (_) {}
}
function computeCartTotals(cart, products) {
  const priceById = new Map(products.map(p => [p.id, Number(p.price) || 0]))
  const items = (cart?.items || []).map(it => ({ ...it }))
  let total = 0
  for (const it of items) {
    const q = Number(it.quantity) || 0
    const price = priceById.get(it.productId) ?? 0
    total += q * price
  }
  return { items, totalPrice: Number(total.toFixed(2)) }
}

// Normalize server cart (CartResponse) to UI-friendly shape
function normalizeCart(serverCart, products) {
  if (!serverCart || typeof serverCart !== 'object') {
    return { items: [], totalPrice: 0 }
  }
  const items = Array.isArray(serverCart.items) ? serverCart.items.map((it) => ({
    productId: it.productId,
    quantity: it.quantity,
    // keep optional price/totalPrice if provided by backend for display accuracy
    price: it.price,
    totalPrice: it.totalPrice,
  })) : []
  // Prefer backend totalPrice if it is a finite number; otherwise compute from products catalog
  const backendTotal = Number(serverCart.totalPrice)
  const totalPrice = Number.isFinite(backendTotal) ? backendTotal : computeCartTotals({ items }, products).totalPrice
  return { items, totalPrice }
}

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState({ products: false, cart: false, action: false })
  const [error, setError] = useState(null)

  // Auth state
  const [currentUser, setCurrentUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  // App user id resolved in backend DB (used for cart)
  const [userId, setUserId] = useState(() => {
    const v = localStorage.getItem('onion.appUserId');
    return v ? Number(v) : null;
  })

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
      if (!userId) {
        // guest cart from localStorage
        const guest = readGuestCart()
        const computed = computeCartTotals(guest, products)
        setCart(computed)
      } else {
        const c = await api.getCart(userId)
        const normalized = normalizeCart(c, products)
        setCart(normalized)
      }
    } catch (e) {
      setCart({ items: [], totalPrice: 0 })
    } finally {
      setLoading((s) => ({ ...s, cart: false }))
    }
  }

  useEffect(() => {
    loadProducts()
    // Check auth status once on mount and ensure app user exists
    api.getCurrentUser()
      .then(async (u) => {
        setCurrentUser(u)
        if (u) {
          try {
            const appUser = await api.ensureAppUserFromMe()
            if (appUser && appUser.id != null) {
              setUserId(appUser.id)
              saveAppUserId(appUser.id)
            }
          } catch (e) {
            console.warn('Failed to ensure app user:', e)
          }
        } else {
          // Not authenticated, clear local user state
          setUserId(null)
          saveAppUserId(null)
        }
      })
      .finally(() => setAuthChecked(true))
  }, [])

  // React to local changes of onion.appUserId (same-tab) and common lifecycle events
  useEffect(() => {
    function readId() {
      try {
        const v = localStorage.getItem('onion.appUserId')
        const parsed = v ? Number(v) : null
        setUserId((prev) => (prev !== parsed ? parsed : prev))
      } catch (_) {}
    }
    function onChange() { readId() }
    window.addEventListener('appUserIdChanged', onChange)
    window.addEventListener('focus', onChange)
    window.addEventListener('hashchange', onChange)
    return () => {
      window.removeEventListener('appUserIdChanged', onChange)
      window.removeEventListener('focus', onChange)
      window.removeEventListener('hashchange', onChange)
    }
  }, [])

  // Load or recompute cart when userId or products change; merge guest cart into user cart upon login
  useEffect(() => {
    async function sync() {
      if (userId) {
        // If there is a guest cart, merge it once
        const guest = readGuestCart()
        const items = Array.isArray(guest.items) ? guest.items : []
        if (items.length > 0) {
          try {
            for (const it of items) {
              if (it?.productId && it?.quantity) {
                await api.addToCart(userId, { productId: it.productId, quantity: it.quantity })
              }
            }
          } catch (e) {
            console.warn('Failed merging guest cart:', e)
          } finally {
            writeGuestCart({ items: [], totalPrice: 0 })
          }
        }
      }
      await loadCart()
    }
    sync()
  }, [userId, products])

  const inCartCount = useMemo(() => (cart?.items?.reduce((acc, it) => Number(acc) + (Number(it?.quantity) || 0), 0)) || 0, [cart])

  async function handleAdd(product) {
    setLoading((s) => ({ ...s, action: true }))
    setError(null)
    try {
      if (!userId) {
        const guest = readGuestCart()
        const items = Array.isArray(guest.items) ? [...guest.items] : []
        const idx = items.findIndex(it => it.productId === product.id)
        if (idx >= 0) items[idx] = { ...items[idx], quantity: (items[idx].quantity || 0) + 1 }
        else items.push({ productId: product.id, quantity: 1 })
        const updated = computeCartTotals({ items }, products)
        writeGuestCart(updated)
        setCart(updated)
      } else {
        await api.addToCart(userId, { productId: product.id, quantity: 1 })
        await loadCart()
      }
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
      if (!userId) {
        const guest = readGuestCart()
        const items = (guest.items || []).filter(it => it.productId !== productId)
        const updated = computeCartTotals({ items }, products)
        writeGuestCart(updated)
        setCart(updated)
      } else {
        await api.removeFromCart(userId, { productId })
        await loadCart()
      }
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
      if (!userId) {
        const updated = { items: [], totalPrice: 0 }
        writeGuestCart(updated)
        setCart(updated)
      } else {
        await api.emptyCart(userId)
        await loadCart()
      }
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
      if (!userId) {
        const guest = readGuestCart()
        const items = Array.isArray(guest.items) ? [...guest.items] : []
        const idx = items.findIndex(it => it.productId === productId)
        if (idx >= 0) items[idx] = { ...items[idx], quantity: (items[idx].quantity || 0) + 1 }
        else items.push({ productId, quantity: 1 })
        const updated = computeCartTotals({ items }, products)
        writeGuestCart(updated)
        setCart(updated)
      } else {
        await api.addToCart(userId, { productId, quantity: 1 })
        await loadCart()
      }
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
      if (!userId) {
        const guest = readGuestCart()
        const items = Array.isArray(guest.items) ? [...guest.items] : []
        const idx = items.findIndex(it => it.productId === productId)
        if (idx === -1) {
          setLoading((s) => ({ ...s, action: false }))
          return
        }
        const qty = (items[idx].quantity || 0) - 1
        if (qty > 0) items[idx] = { ...items[idx], quantity: qty }
        else items.splice(idx, 1)
        const updated = computeCartTotals({ items }, products)
        writeGuestCart(updated)
        setCart(updated)
      } else {
        const item = cart?.items?.find((it) => it.productId === productId)
        if (!item) return
        if ((item.quantity || 0) > 1) {
          await api.addToCart(userId, { productId, quantity: -1 })
        } else {
          await api.removeFromCart(userId, { productId })
        }
        await loadCart()
      }
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
    if (!userId) {
      setError('Please log in before checking out.')
      return
    }
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
      const successUrl = absoluteUrl('/#/checkout/success')
      const cancelUrl = absoluteUrl('/#/checkout/cancel')
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
    <HashRouter>
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
              {authChecked && (
                currentUser ? (
                  <div className="flex items-center gap-3">
                    <Link className="text-sm text-white/70 hidden sm:inline hover:text-white" to="/me">{currentUser.name || currentUser.username || currentUser.email}</Link>
                    <LogoutButton />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link className="hover:text-white" to="/login">Login</Link>
                    <Link className="hover:text-white" to="/register">Register</Link>
                  </div>
                )
              )}
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/me" element={<UserProfile />} />
          </Routes>
        </main>

        <footer className="mt-8 border-t border-white/10 py-8 text-center text-white/60">
          <p className="text-sm">Fresh onions. Local backend. Have a tear-free day.</p>
        </footer>
      </div>
    </HashRouter>
  )
}

export default App
