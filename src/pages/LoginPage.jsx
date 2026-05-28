import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="login-brand-bg relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <div className="login-halo login-halo-1" />
      <div className="login-halo login-halo-2" />
      <div className="login-halo login-halo-3" />

      <div className="relative z-10 w-full max-w-sm">
        <form onSubmit={handleSubmit} className="login-panel bg-white rounded-2xl overflow-hidden">
          <div className="flex justify-center items-center py-8 px-8 border-b border-gray-100 bg-gray-50">
            <img
              src="/brand/logo-full-color.svg"
              alt="Viteka"
              className="h-14 w-auto max-w-[190px] object-contain"
            />
          </div>

          <div className="p-8 space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Accediendo...' : 'Acceder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
