import { useState } from 'react'
import { supabase } from '../lib/supabase'

const gradientStyle = {
  background: 'linear-gradient(-45deg, #f0fdf4, #dcfce7, #d1fae5, #ecfdf5)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 12s ease infinite',
}

const keyframes = `
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <>
      <style>{keyframes}</style>
      <div className="min-h-screen flex items-center justify-center" style={gradientStyle}>
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">

            {/* Cabecera con logo */}
            <div className="flex justify-center items-center py-8 px-8 border-b border-gray-100">
              <img
                src="/brand/logo-full-color.svg"
                alt="Viteka"
                className="h-14 w-auto"
              />
            </div>

            {/* Campos del formulario */}
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Accediendo...' : 'Acceder'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}
