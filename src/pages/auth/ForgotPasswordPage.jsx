import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AuthBrandHeader from '../../components/auth/AuthBrandHeader'
import AuthCard from '../../components/auth/AuthCard'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const redirectTo = `${window.location.origin}/reset-password`
    const { error: submitError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (submitError) {
      setError('No se pudo enviar la recuperación. Inténtalo de nuevo.')
    } else {
      setMessage('Si el correo existe, recibirás instrucciones para restablecer tu contraseña.')
      setEmail('')
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
          title="Recuperar contraseña"
          description="Introduce tu correo electrónico y te enviaremos un enlace seguro para restablecer tu acceso."
          footer="Si necesitas ayuda adicional, contacta con soporte de Viteka."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="label">
                Correo electrónico
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nombre@empresa.com"
                className="input"
              />
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        </AuthCard>

        <div className="text-center text-sm text-white/80">
          <Link to="/login" className="font-semibold text-white underline decoration-white/40 underline-offset-4">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
