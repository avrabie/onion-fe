import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='))
    ?.split('=')[1]
}

export default function Logout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const action = useMemo(() => api.getLogoutUrl(), [])
  const csrf = getCookie('XSRF-TOKEN') || getCookie('X-CSRF-TOKEN') || getCookie('csrfToken')

  useEffect(() => {
    let mounted = true
    api.getCurrentUser()
      .then((u) => { if (mounted) setUser(u) })
      .finally(() => { if (mounted) setAuthChecked(true) })
    return () => { mounted = false }
  }, [])

  const displayName = user?.name || user?.username || user?.email || 'User'

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
        <div className="text-white/70">Loading…</div>
      </div>
    )
  }

  if (!user) {
    // If not logged in, redirect to login page
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-6 shadow-card text-center">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Logout</h1>
          <p className="text-white/70 text-sm mb-6">You are signed in as <span className="font-semibold text-white/90">{displayName}</span>.</p>
          <form action={action} method="POST" className="space-y-3">
            {csrf && <input type="hidden" name="_csrf" value={decodeURIComponent(csrf)} />}
            <button
              type="submit"
              className="w-full rounded-lg bg-rose-600 hover:bg-rose-500 py-2.5 font-semibold"
            >
              Logout now
            </button>
          </form>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 text-white/70 hover:text-white text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
