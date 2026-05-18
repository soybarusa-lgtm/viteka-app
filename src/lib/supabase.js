import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Limpiar sesión automáticamente si el refresh token no es válido
    // Evita el bucle de errores "Invalid Refresh Token"
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Listener global: si el token expira o es inválido, limpiar storage y recargar
supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') return
  if (event === 'SIGNED_OUT') {
    // Limpiar cualquier dato residual de Supabase en localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key)
    })
  }
})
