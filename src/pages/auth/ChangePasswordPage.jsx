import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AuthBrandHeader from '../../components/auth/AuthBrandHeader'
import AuthCard from '../../components/auth/AuthCard'
import { getPostLoginPath } from '../../lib/authRouting'

export default function ChangePasswordPage({ profile, onProfileRefresh }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
      setError('No se pudo cambiar la contraseña.')
      setSaving(false)
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id

    if (userId) {
      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', userId)

      if (onProfileRefresh) {
        await onProfileRefresh()
      }
    }

    setMessage('Contraseña actualizada correctamente.')
    navigate(getPostLoginPath({ ...profile, must_change_password: false }), { replace: true })
  }

  return (
    <div className="login-brand-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="login-halo login-halo-1" />
      <div className="login-halo login-halo-2" />
      <div className="login-halo login-halo-3" />

      <div className="relative z-10 w-full max-w-sm space-y-5">
        <AuthBrandHeader />
        <AuthCard
          title="Cambio obligatorio de contraseña"
          description="Debes definir una contraseña nueva para continuar utilizando la plataforma."
          footer="Este cambio se aplica antes de acceder a cualquier portal."
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="label">
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="label">
                Confirmar contraseña
              </label>
              <input
                id="confirm-new-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la contraseña"
                className="input"
              />
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        </AuthCard>
      </div>
    </div>
  )
}
