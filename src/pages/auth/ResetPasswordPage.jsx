import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AuthBrandHeader from '../../components/auth/AuthBrandHeader'
import AuthCard from '../../components/auth/AuthCard'
import { getPostLoginPath, isProfileActive } from '../../lib/authRouting'

function getPasswordStrengthHint(password) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return ''
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('No se pudo actualizar la contraseña.')
      setSaving(false)
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const currentSession = sessionData.session ?? session

    if (currentSession?.user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, active, is_active, must_change_password')
        .eq('id', currentSession.user.id)
        .maybeSingle()

      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', profile.id)
      }

      setMessage('Contraseña actualizada correctamente.')
      navigate(getPostLoginPath({ ...profile, must_change_password: false }), { replace: true })
      return
    }

    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="login-brand-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="login-halo login-halo-1" />
      <div className="login-halo login-halo-2" />
      <div className="login-halo login-halo-3" />

      <div className="relative z-10 w-full max-w-sm space-y-5">
        <AuthBrandHeader />
        <AuthCard
          title="Crear nueva contraseña"
          description="Define una contraseña nueva para continuar con tu acceso."
          footer="Tu sesión debe mantenerse activa para completar este cambio."
        >
          {loading ? (
            <p className="text-sm text-gray-500">Comprobando enlace seguro...</p>
          ) : null}

          {!loading && !session ? (
            <p className="text-sm text-red-600">
              El enlace de recuperación no es válido o ha caducado.{' '}
              <Link to="/forgot-password" className="font-semibold underline underline-offset-4">
                Solicita uno nuevo
              </Link>
              .
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-password" className="label">
                Nueva contraseña
              </label>
              <input
                id="reset-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="input"
              />
              <p className="mt-2 text-xs text-gray-500">
                {getPasswordStrengthHint(password) || 'Recomendado: mayúscula, minúscula y número.'}
              </p>
            </div>

            <div>
              <label htmlFor="reset-password-confirm" className="label">
                Confirmar contraseña
              </label>
              <input
                id="reset-password-confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la nueva contraseña"
                className="input"
              />
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

            <button
              type="submit"
              disabled={saving || loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Actualizar contraseña'}
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
