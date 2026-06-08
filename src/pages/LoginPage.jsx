import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthBrandHeader from '../components/auth/AuthBrandHeader'
import AuthCard from '../components/auth/AuthCard'
import SignupRequestModal from '../components/auth/SignupRequestModal'

const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LerwxMtAAAAACPnlXC6QyMUYVvBg_A35WEY6Jeo'

function getRecaptchaEnterprise() {
  return window.grecaptcha?.enterprise
}

function getRecaptchaToken(action) {
  return new Promise((resolve, reject) => {
    const recaptcha = getRecaptchaEnterprise()
    if (!recaptcha) {
      reject(new Error('No se pudo cargar la protección reCAPTCHA. Recarga la página e inténtalo de nuevo.'))
      return
    }

    recaptcha.ready(async () => {
      try {
        const token = await recaptcha.execute(RECAPTCHA_ENTERPRISE_SITE_KEY, { action })
        resolve(token)
      } catch {
        reject(new Error('No se pudo validar reCAPTCHA. Recarga la página e inténtalo de nuevo.'))
      }
    })
  })
}

function getLoginErrorMessage(error) {
  if (!error) return ''

  if (error.code === 'captcha_failed' || /captcha/i.test(error.message || '')) {
    if (/invalid-input-response/i.test(error.message || '')) {
      return 'Supabase no ha aceptado el token CAPTCHA. Revisa que el proveedor y la clave secreta configurados en Supabase coincidan con el CAPTCHA del login.'
    }

    return 'No se pudo validar la protección anti-bots. Recarga la página e inténtalo de nuevo.'
  }

  if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message || '')) {
    return 'El correo o la contraseña no son correctos.'
  }

  if (/email not confirmed/i.test(error.message || '')) {
    return 'El correo todavía no está confirmado. Revisa el email de confirmación o solicita uno nuevo.'
  }

  return `No se pudo iniciar sesión. ${error.message || ''}`.trim()
}

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

    try {
      const captchaToken = await getRecaptchaToken('LOGIN')
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      })

      if (signInError) {
        setError(getLoginErrorMessage(signInError))
      }
    } catch (loginError) {
      setError(loginError.message || getLoginErrorMessage(loginError))
    } finally {
      setLoading(false)
    }
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
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            <button
              type="button"
              onClick={() => setSignupRequestOpen(true)}
              className="btn-secondary w-full"
            >
              ¿Quieres darte de alta? Solicitar acceso
            </button>
          </form>
        </AuthCard>
      </div>

      <SignupRequestModal open={signupRequestOpen} onClose={() => setSignupRequestOpen(false)} />
    </div>
  )
}
