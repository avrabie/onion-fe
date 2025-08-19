import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, saveAppUserId } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pictureUrl, setPictureUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [googleInfo, setGoogleInfo] = useState(null)

  const googleUrl = useMemo(() => api.getOAuthUrl('google'), [])

  useEffect(() => {
    let cancelled = false
    async function loadGoogleInfo() {
      try {
        const me = await api.getCurrentUser()
        if (!cancelled && me) {
          setGoogleInfo(me)
          // Prefill fields from Google info when available
          if (me.email && !email) setEmail(me.email)
          const inferredUsername = me.name || (me.email ? me.email.split('@')[0] : '')
          if (inferredUsername && !username) setUsername(inferredUsername)
          if (me.picture && !pictureUrl) setPictureUrl(me.picture)
        }
      } catch (_) {
        // ignore
      }
    }
    loadGoogleInfo()
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.createUser({ username, email, password, pictureUrl })
      // After successful registration, if already authenticated via Google, ensure app user and go to profile; else go to login
      try {
        const ensured = await api.ensureAppUserFromMe()
        if (ensured && ensured.id != null) {
          navigate('/me')
          return
        }
      } catch (_) { /* not logged in with Google or ensure failed, fall through */ }
      navigate('/login')
    } catch (e) {
      setError(e.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateFromGoogle() {
    setError(null)
    setLoading(true)
    try {
      // Try ensure first
      const ensured = await api.ensureAppUserFromMe()
      if (ensured && ensured.id != null) {
        navigate('/me')
        return
      }
      // Fallback: create via POST /users using Google info
      const created = await api.createUserFromGoogle()
      if (created && created.id != null) {
        saveAppUserId(created.id)
        navigate('/me')
      } else {
        setError('Could not create account from Google session')
      }
    } catch (e) {
      // Fallback path if ensure failed
      try {
        const created = await api.createUserFromGoogle()
        if (created && created.id != null) {
          saveAppUserId(created.id)
          navigate('/me')
        } else {
          setError('Could not create account from Google session')
        }
      } catch (e2) {
        setError(e2.message || e.message || 'Could not create account from Google session')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-6 shadow-card">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🧑‍💻</div>
            <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
            <p className="text-white/70 text-sm mt-1">Use Google or fill in the form below</p>
          </div>

          <a
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors py-2.5 mb-4"
            href={googleUrl}
          >
            <span>Continue with</span>
            <span className="text-lg">🔎 Google</span>
          </a>

          {googleInfo && (
            <div className="mb-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-200 flex items-center gap-3">
              {googleInfo.picture && (
                <img src={googleInfo.picture} alt="Google avatar" className="w-8 h-8 rounded-full" />
              )}
              <div className="flex-1">
                <div>Signed in with Google as <span className="font-semibold">{googleInfo.email || googleInfo.name}</span></div>
                <div className="text-emerald-200/80">We prefilled the form for you.</div>
              </div>
              <button
                type="button"
                onClick={handleCreateFromGoogle}
                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={loading}
              >
                Create account from Google
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-white/10 flex-1" />
            <div className="text-xs text-white/50">or</div>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-white/70 mb-1" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="yourname"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1" htmlFor="pictureUrl">Profile picture URL (optional)</label>
              <input
                id="pictureUrl"
                type="url"
                value={pictureUrl}
                onChange={(e) => setPictureUrl(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="https://..."
              />
            </div>

            {error && (
              <div className="text-red-300 text-sm">{error}</div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-white/50 mt-4 text-center">
            Already have an account? <Link to="/login" className="text-white/80 hover:text-white underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
