import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthBrandHeader from '../components/auth/AuthBrandHeader'
import AuthCard from '../components/auth/AuthCard'
import SignupRequestModal from '../components/auth/SignupRequestModal'

export default function LoginPage({ statusMessage = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signupRequestOpen, setSignupRequestOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('No se pudo iniciar sesión.')
    }

    setLoading(false)
  }

  return (
    <div className="login-brand-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="login-halo login-halo-1" />
      <div className="login-halo login-halo-2" />
      <div className="login-halo login-halo-3" />

      <div className="relative z-10 w-full max-w-sm space-y-5">
        <AuthBrandHeader />
        <AuthCard
          title="Iniciar sesión"
          description="Te damos la bienvenida al portal de Viteka."
          footer={(
            <div className="space-y-2">
              <p>© 2026 Viteka.</p>
              <p>Acceso reservado para usuarios autorizados.</p>
              <p>¿Necesitas ayuda? Contacta con el equipo de soporte de Viteka.</p>
            </div>
          )}
        >
          {statusMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {statusMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="label">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Correo electrónico"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Contraseña"
                  className="input pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-2 my-auto rounded-lg px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <Link
                to="/forgot-password"
                className="font-semibold text-teal-700 underline decoration-teal-700/30 underline-offset-4 transition hover:text-teal-800"
              >
                ¿Has olvidado tu contraseña?
              </Link>

              <button
                type="button"
                onClick={() => setSignupRequestOpen(true)}
                className="btn-secondary w-full"
              >
                ¿Quieres darte de alta? Solicitar acceso
              </button>
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </AuthCard>
      </div>

      <SignupRequestModal open={signupRequestOpen} onClose={() => setSignupRequestOpen(false)} />
    </div>
  )
}
