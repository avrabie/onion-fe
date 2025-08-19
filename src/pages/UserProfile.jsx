import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, buildUrl, saveAppUserId } from '../api'

export default function UserProfile() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [appUser, setAppUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

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

        // Try to determine or create the application user
        let id
        try {
          const idRaw = localStorage.getItem('onion.appUserId')
          id = idRaw ? Number(idRaw) : null
        } catch (_) {
          id = null
        }

        // If we don't have an id yet, ask backend to ensure/link the app user from current principal
        if (!id) {
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
        }

        // If we have an id but appUser not set yet, fetch details
        if (id && !appUser) {
          try {
            const res = await fetch(buildUrl(`/users/${encodeURIComponent(id)}`), { credentials: 'include' })
            if (res.ok) {
              const text = await res.text()
              const data = text ? JSON.parse(text) : null
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

  const displayName = useMemo(() => me?.name || me?.username || me?.email || 'User', [me])

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
            {me.picture ? (
              <img src={me.picture} alt={displayName} className="w-24 h-24 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight">{displayName}</h1>
            <p className="text-white/70 text-sm mt-1">This is your profile. Below you can see information provided by your identity provider and your app account.</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 p-4">
                <h2 className="text-sm font-semibold text-white/90 mb-3">Identity provider (users/me)</h2>
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
                            // Fallback: create via POST /users using Google info
                            const created = await api.createUserFromGoogle()
                            if (created && created.id != null) {
                              saveAppUserId(created.id)
                              setAppUser(created)
                            } else {
                              setCreateError('Could not create account from your Google session.')
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
                            setCreateError(e2?.message || e?.message || 'Could not create account from your Google session.')
                          }
                        } finally {
                          setCreating(false)
                        }
                      }}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
                    >
                      {creating ? 'Creating…' : 'Create account from Google'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
