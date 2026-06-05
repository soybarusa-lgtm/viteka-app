import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INTERNAL_ROLES = new Set(['owner', 'administrador', 'soporte', 'administracion'])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) throw new Error('Missing Supabase environment variables.')
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

function createUserClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) throw new Error('Missing Supabase environment variables.')
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function getCallerProfile(req: Request, admin: ReturnType<typeof createServiceClient>) {
  const token = req.headers.get('Authorization') || ''
  const userClient = createUserClient()
  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  if (userError || !userData.user) return null

  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', userData.user.id)
    .maybeSingle()

  return profile || null
}

async function resolveEmail(admin: ReturnType<typeof createServiceClient>, payload: any) {
  if (payload?.email) return String(payload.email).trim().toLowerCase()

  if (payload?.id) {
    const { data: access } = await admin.from('client_portal_access').select('email').eq('id', payload.id).maybeSingle()
    if (access?.email) return access.email
    const { data: user } = await admin.auth.admin.getUserById(String(payload.id))
    if (user?.user?.email) return user.user.email
  }

  return ''
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const admin = createServiceClient()
    const caller = await getCallerProfile(req, admin)
    if (!caller || !INTERNAL_ROLES.has(String(caller.role || '').toLowerCase())) {
      return json({ error: 'Forbidden' }, 403)
    }

    const payload = await req.json().catch(() => ({}))
    const email = await resolveEmail(admin, payload)
    if (!email) return json({ error: 'Email required' }, 400)

    const action = String(payload.action || 'reset_password')
    const response = action === 'resend_invite'
      ? await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: payload.full_name || '', role: payload.role || 'cliente_user' } })
      : await admin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: payload.redirectTo || undefined,
            data: { full_name: payload.full_name || '', role: payload.role || 'cliente_user' },
          },
        })

    const mustChangePassword = payload.force_change === true || action === 'resend_invite'
    if (payload.id) {
      await admin.from('client_portal_access').update({
        must_change_password: mustChangePassword,
        updated_at: new Date().toISOString(),
      }).eq('id', payload.id)
    }

    return json({
      ok: true,
      action,
      email,
      data: response.data || null,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
