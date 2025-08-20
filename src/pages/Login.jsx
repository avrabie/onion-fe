import { useMemo, useState } from 'react'
import { api } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const googleUrl = useMemo(() => api.getOAuthUrl('google'), [])
  const githubUrl = useMemo(() => api.getOAuthUrl('github'), [])
  const loginAction = useMemo(() => api.getLoginUrl(), [])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-6 shadow-card">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
            <p className="text-white/70 text-sm mt-1">Continue with Google or GitHub, or use your account</p>
          </div>

          <a
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors py-2.5 mb-2"
            href={googleUrl}
          >
            <span>Continue with</span>
            <span className="text-lg">🔎 Google</span>
          </a>

          <a
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors py-2.5 mb-4"
            href={githubUrl}
          >
            <span>Continue with</span>
            <span className="text-lg">🐙 GitHub</span>
          </a>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-white/10 flex-1" />
            <div className="text-xs text-white/50">or</div>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Note: We post a standard HTML form to Spring Security's /login to avoid CSRF token issues with fetch */}
          <form action={loginAction} method="POST" className="space-y-3">
            <div>
              <label className="block text-xs text-white/70 mb-1" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs text-white/70">
                <input type="checkbox" name="remember-me" className="accent-emerald-500" />
                Remember me
              </label>
              <span className="text-xs text-white/50">Protected by Spring Security</span>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold"
            >
              Sign in
            </button>
          </form>

          <p className="text-xs text-white/50 mt-4">
            Tip: If your backend runs on a different origin, set VITE_API_BASE in your frontend env so the form posts to the correct backend.
          </p>
          <p className="text-xs text-white/60 mt-2 text-center">
            New here? <a href="/#/register" className="text-white/80 hover:text-white underline">Create an account</a>
          </p>
        </div>
      </div>
    </div>
  )
}
