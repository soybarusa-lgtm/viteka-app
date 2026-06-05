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

async function resolveEmailByTarget(admin: ReturnType<typeof createServiceClient>, payload: any) {
  if (payload?.email) return String(payload.email)

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
    const email = String(payload.email || '').trim().toLowerCase()
    const fullName = String(payload.full_name || '').trim()
    const role = String(payload.role || 'cliente_user').trim()
    const targetType = String(payload.target_type || 'client')
    const pharmacyId = payload.pharmacy_id || null
    const personId = payload.person_id || null

    if (!email) return json({ error: 'Email required' }, 400)

    const invite = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        role,
        target_type: targetType,
        pharmacy_id: pharmacyId,
        person_id: personId,
      },
    })

    const userId = invite.data?.user?.id || crypto.randomUUID()
    const profilePayload = {
      id: userId,
      auth_user_id: userId,
      full_name: fullName || email,
      role,
      pharmacy_id: pharmacyId,
      person_id: personId,
      is_active: true,
      must_change_password: payload.must_change_password !== false,
      updated_at: new Date().toISOString(),
    }

    await admin.from('profiles').upsert(profilePayload, { onConflict: 'id' })

    let savedAccess = null
    if (targetType === 'client') {
      const accessPayload = {
        auth_user_id: userId,
        profile_id: userId,
        pharmacy_id: pharmacyId,
        person_id: personId,
        email,
        full_name: fullName || email,
        role,
        is_active: payload.is_active !== false,
        must_change_password: payload.must_change_password !== false,
        invite_sent_at: new Date().toISOString(),
      }

      const { data: existingAccess } = await admin.from('client_portal_access').select('id').eq('email', email).eq('pharmacy_id', pharmacyId).maybeSingle()
      if (existingAccess?.id) {
        const { data } = await admin.from('client_portal_access').update(accessPayload).eq('id', existingAccess.id).select('*').single()
        savedAccess = data
      } else {
        const { data } = await admin.from('client_portal_access').insert(accessPayload).select('*').single()
        savedAccess = data
      }
    }

    return json({ ok: true, user: invite.data?.user || null, access: savedAccess })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
