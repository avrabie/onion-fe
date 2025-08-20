import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, buildUrl, saveAppUserId } from '../api'

export default function UserProfile() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [provider, setProvider] = useState(null)
  const [appUser, setAppUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  // Orders state
  const [orders, setOrders] = useState([])
  const [orderItems, setOrderItems] = useState({}) // { [orderId]: items[] }
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)

  // Products for displaying product names in orders
  const [products, setProducts] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const current = await api.getCurrentUser()
        if (!current) {
          // Not authenticated: redirect to login
          navigate('/login')
          return
        }
        if (!mounted) return
        setMe(current)

        // Load current authentication provider
        try {
          const prov = await api.getAuthProvider()
          if (mounted) setProvider(prov?.provider || null)
        } catch (_) {
          if (mounted) setProvider(null)
        }

        // Resolve application user id for the current principal and keep it in sync
        let id
        try {
          const idRaw = localStorage.getItem('onion.appUserId')
          id = idRaw ? Number(idRaw) : null
        } catch (_) {
          id = null
        }

        // Always ensure/link the app user from current principal to avoid stale localStorage ids
        try {
          const ensured = await api.ensureAppUserFromMe()
          if (ensured && ensured.id != null) {
            id = ensured.id
            saveAppUserId(id)
            if (mounted) setAppUser(ensured)
          }
        } catch (_) {
          // ignore; we may still be able to fetch later
        }

        // If we have an id but appUser not set yet, fetch details
        if (id && !appUser) {
          try {
            const res = await fetch(buildUrl(`/users/${encodeURIComponent(id)}`), { credentials: 'include' })
            if (res.ok) {
              const text = await res.text()
              let data = null
              if (text) {
                const ct = (res.headers.get('content-type') || '').toLowerCase()
                if (ct.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
                  try { data = JSON.parse(text) } catch (_) { data = null }
                } else {
                  data = null
                }
              }
              if (mounted) setAppUser(data)
            }
          } catch (_) {
            // ignore, keep appUser null
          }
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load user profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [navigate])

  // Load orders once we know the application user id
  useEffect(() => {
    let active = true
    async function loadOrders() {
      if (!appUser?.id) return
      setOrdersLoading(true)
      setOrdersError(null)
      try {
        const res = await api.getOrdersByUser(appUser.id)
        // Some backends may return a single order object instead of array
        const listRaw = Array.isArray(res) ? res : (res ? [res] : [])
        const list = listRaw.filter((o) => o && typeof o === 'object' && o.id != null)
        if (!active) return
        setOrders(list)
        // Fetch items for each order; load in parallel
        const entries = await Promise.all(list.map(async (o) => {
          try {
            const itemsRes = await api.getOrderItems(o.id)
            const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes ? [itemsRes] : [])
            return [o.id, items]
          } catch (_e) {
            return [o.id, []]
          }
        }))
        if (!active) return
        setOrderItems(Object.fromEntries(entries))
      } catch (e) {
        if (active) setOrdersError(e?.message || 'Failed to load your orders')
      } finally {
        if (active) setOrdersLoading(false)
      }
    }
    loadOrders()
    return () => { active = false }
  }, [appUser?.id])

  // Load products once (to resolve product names by id)
  useEffect(() => {
    let active = true
    async function loadProducts() {
      try {
        const list = await api.getProducts()
        const arr = Array.isArray(list) ? list : (list?.content || [])
        if (active) setProducts(arr)
      } catch (_) {
        // ignore, we can still render IDs without names
      }
    }
    loadProducts()
    return () => { active = false }
  }, [])

  const productNameById = useMemo(() => new Map((products || []).map((p) => [p.id, p.name])), [products])

  const displayName = useMemo(() => me?.name || me?.login || me?.username || me?.email || 'User', [me])
  const avatarUrl = useMemo(() => me?.picture || me?.avatarUrl || null, [me])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
        <div className="text-white/70">Loading profile…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-red-200">
        <div className="p-3 rounded bg-red-600/20 border border-red-600/40 text-sm">{error}</div>
      </div>
    )
  }

  if (!me) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-white/70 hover:text-white">← Back</button>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-6 shadow-card">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-24 h-24 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight">{displayName}</h1>
            <p className="text-white/70 text-sm mt-1">This is your profile. Below you can see information provided by your identity provider and your app account.</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 p-4">
                <h2 className="text-sm font-semibold text-white/90 mb-3">
                  Identity provider {provider ? (<span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 uppercase text-[10px] tracking-wide">{provider}</span>) : null}
                </h2>
                {/* Provider-specific details */}
                {provider === 'github' ? (
                  <dl className="text-sm text-white/80 space-y-1">
                    {me.login && (<div><dt className="inline text-white/60">Login:</dt> <dd className="inline ml-1">{me.login}</dd></div>)}
                    {me.name && (<div><dt className="inline text-white/60">Name:</dt> <dd className="inline ml-1">{me.name}</dd></div>)}
                    {me.email && (<div><dt className="inline text-white/60">Email:</dt> <dd className="inline ml-1">{me.email}</dd></div>)}
                    {me.htmlUrl && (<div><dt className="inline text-white/60">Profile:</dt> <dd className="inline ml-1"><a href={me.htmlUrl} target="_blank" rel="noreferrer" className="underline">{me.htmlUrl}</a></dd></div>)}
                    {me.company && (<div><dt className="inline text-white/60">Company:</dt> <dd className="inline ml-1">{me.company}</dd></div>)}
                    {me.blog && (<div><dt className="inline text-white/60">Blog:</dt> <dd className="inline ml-1"><a href={me.blog} target="_blank" rel="noreferrer" className="underline break-all">{me.blog}</a></dd></div>)}
                    {me.location && (<div><dt className="inline text-white/60">Location:</dt> <dd className="inline ml-1">{me.location}</dd></div>)}
                    {me.bio && (<div><dt className="inline text-white/60">Bio:</dt> <dd className="inline ml-1">{me.bio}</dd></div>)}
                    {typeof me.publicRepos === 'number' && (<div><dt className="inline text-white/60">Public repos:</dt> <dd className="inline ml-1">{me.publicRepos}</dd></div>)}
                    {typeof me.followers === 'number' && (<div><dt className="inline text-white/60">Followers:</dt> <dd className="inline ml-1">{me.followers}</dd></div>)}
                    {typeof me.following === 'number' && (<div><dt className="inline text-white/60">Following:</dt> <dd className="inline ml-1">{me.following}</dd></div>)}
                    {me.createdAt && (<div><dt className="inline text-white/60">Created at:</dt> <dd className="inline ml-1">{new Date(me.createdAt).toLocaleString()}</dd></div>)}
                    {me.updatedAt && (<div><dt className="inline text-white/60">Updated at:</dt> <dd className="inline ml-1">{new Date(me.updatedAt).toLocaleString()}</dd></div>)}
                    {Array.isArray(me.scopes) && me.scopes.length > 0 && (
                      <div>
                        <dt className="block text-white/60">Scopes:</dt>
                        <dd className="mt-1 flex flex-wrap gap-2">
                          {me.scopes.map((s) => (
                            <span key={s} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{s}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <dl className="text-sm text-white/80 space-y-1">
                    {me.email && (<div><dt className="inline text-white/60">Email:</dt> <dd className="inline ml-1">{me.email}</dd></div>)}
                    {me.username && (<div><dt className="inline text-white/60">Username:</dt> <dd className="inline ml-1">{me.username}</dd></div>)}
                    {me.givenName && (<div><dt className="inline text-white/60">Given name:</dt> <dd className="inline ml-1">{me.givenName}</dd></div>)}
                    {me.familyName && (<div><dt className="inline text-white/60">Family name:</dt> <dd className="inline ml-1">{me.familyName}</dd></div>)}
                    {me.locale && (<div><dt className="inline text-white/60">Locale:</dt> <dd className="inline ml-1">{me.locale}</dd></div>)}
                    {typeof me.emailVerified === 'boolean' && (<div><dt className="inline text-white/60">Email verified:</dt> <dd className="inline ml-1">{String(me.emailVerified)}</dd></div>)}
                    {me.subject && (<div><dt className="inline text-white/60">Subject:</dt> <dd className="inline ml-1 break-all">{me.subject}</dd></div>)}
                    {Array.isArray(me.scopes) && me.scopes.length > 0 && (
                      <div>
                        <dt className="block text-white/60">Scopes:</dt>
                        <dd className="mt-1 flex flex-wrap gap-2">
                          {me.scopes.map((s) => (
                            <span key={s} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 border border-white/10">{s}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>

              <div className="rounded-xl border border-white/10 p-4">
                <h2 className="text-sm font-semibold text-white/90 mb-3">Application user</h2>
                {appUser ? (
                  <dl className="text-sm text-white/80 space-y-1">
                    <div><dt className="inline text-white/60">ID:</dt> <dd className="inline ml-1">{appUser.id}</dd></div>
                    {appUser.username && (<div><dt className="inline text-white/60">Username:</dt> <dd className="inline ml-1">{appUser.username}</dd></div>)}
                    {appUser.email && (<div><dt className="inline text-white/60">Email:</dt> <dd className="inline ml-1">{appUser.email}</dd></div>)}
                    {appUser.createdAt && (<div><dt className="inline text-white/60">Created:</dt> <dd className="inline ml-1">{new Date(appUser.createdAt).toLocaleString()}</dd></div>)}
                  </dl>
                ) : (
                  <div className="text-white/60 text-sm space-y-3">
                    <div>
                      No application user details found. If you just logged in, try refreshing. The app usually creates or links an account automatically on first login.
                    </div>
                    {createError && (
                      <div className="text-red-300">{createError}</div>
                    )}
                    <button
                      type="button"
                      disabled={creating}
                      onClick={async () => {
                        setCreateError(null)
                        setCreating(true)
                        try {
                          // First try the ensure endpoint
                          const ensured = await api.ensureAppUserFromMe()
                          if (ensured && ensured.id != null) {
                            saveAppUserId(ensured.id)
                            setAppUser(ensured)
                          } else {
                              // Fallback: create via POST /users using current OAuth session info
                              const created = await api.createUserFromGoogle()
                              if (created && created.id != null) {
                              saveAppUserId(created.id)
                              setAppUser(created)
                              } else {
                              setCreateError('Could not create account from your session.')
                              }
                          }
                        } catch (e) {
                          // If ensure failed (e.g., not found), try to create via POST /users
                          try {
                            const created = await api.createUserFromGoogle()
                            if (created && created.id != null) {
                              saveAppUserId(created.id)
                              setAppUser(created)
                            } else {
                              setCreateError('Could not create account from your Google session.')
                            }
                          } catch (e2) {
                            setCreateError(e2?.message || e?.message || 'Could not create account from your session.')
                          }
                        } finally {
                          setCreating(false)
                        }
                      }}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
                    >
                      {creating ? 'Creating…' : 'Create account from your session'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Orders section */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold mb-2">My Orders</h2>

          {ordersLoading && (
            <div className="text-white/70 text-sm">Loading your orders…</div>
          )}
          {ordersError && (
            <div className="text-red-300 text-sm mb-3">{ordersError}</div>
          )}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <div className="text-white/60 text-sm">You have no orders yet.</div>
          )}

          <div className="space-y-4">
            {orders.map((order) => {
              const items = orderItems[order.id] || []
              return (
                <div key={order.id} className="rounded-xl border border-white/10 p-4 bg-white/[0.03]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-sm text-white/80">
                      <div><span className="text-white/60">Order #</span> {order.id}</div>
                      <div><span className="text-white/60">Date:</span> {order.orderDate ? new Date(order.orderDate).toLocaleString() : '—'}</div>
                    </div>
                    <div className="text-sm">
                      <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/10">
                        {order.status || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-white/80">
                    <div className="mb-2"><span className="text-white/60">Total:</span> {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : order.totalAmount}</div>
                    <div className="text-white/90 font-semibold mb-1">Items</div>
                    {items.length === 0 ? (
                      <div className="text-white/60">No items available</div>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {items.map((it, idx) => (
                          <li key={it.id || idx}>
                            <span className="text-white/60">Product:</span> {productNameById.get(it.productId) || 'Unknown'} <span className="text-white/60">(ID:</span> {it.productId}<span className="text-white/60">)</span> · <span className="text-white/60">Qty:</span> {it.quantity} · <span className="text-white/60">Price:</span> {typeof it.price === 'number' ? it.price.toFixed(2) : it.price}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
