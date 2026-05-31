import { supabase } from './supabase'

const AUTO_OWNER_PREFIX = '__VITEKA_AUTO_OWNER__:'

function normalizeName(value = '') {
  return String(value).trim().toLocaleLowerCase('es')
}

function parseAutoOwnerKey(observations = '') {
  const raw = String(observations || '')
  return raw.startsWith(AUTO_OWNER_PREFIX) ? raw.slice(AUTO_OWNER_PREFIX.length) : ''
}

function buildOwners(ownerName, cbOwners = []) {
  const owners = [
    { key: 'autonomo', name: String(ownerName || '').trim() },
    ...(Array.isArray(cbOwners) ? cbOwners : []).map((owner, index) => ({
      key: `cb-${index}`,
      name: String(owner?.name || '').trim(),
    })),
  ].filter(owner => owner.name)

  return owners.filter((owner, index) => (
    owners.findIndex(candidate => normalizeName(candidate.name) === normalizeName(owner.name)) === index
  ))
}

export async function syncPharmacyOwnersAsPersons({
  pharmacyId,
  companyId,
  ownerName,
  cbOwners,
  phone = '',
  email = '',
}) {
  if (!pharmacyId || !companyId) return

  const desiredOwners = buildOwners(ownerName, cbOwners)
  const { data: existing, error } = await supabase
    .from('pharmacy_persons')
    .select('id, name, role, observations')
    .eq('pharmacy_id', pharmacyId)
    .eq('role', 'Titular')

  if (error) throw error

  const existingOwners = existing || []
  const manualNames = new Set(
    existingOwners
      .filter(person => !parseAutoOwnerKey(person.observations))
      .map(person => normalizeName(person.name))
  )
  const generatedByKey = new Map(
    existingOwners
      .filter(person => parseAutoOwnerKey(person.observations))
      .map(person => [parseAutoOwnerKey(person.observations), person])
  )
  const retainedGeneratedIds = new Set()

  for (const owner of desiredOwners) {
    if (manualNames.has(normalizeName(owner.name))) continue

    const generated = generatedByKey.get(owner.key)
    const payload = {
      pharmacy_id: pharmacyId,
      company_id: companyId,
      name: owner.name,
      phone,
      email,
      role: 'Titular',
      observations: `${AUTO_OWNER_PREFIX}${owner.key}`,
    }

    if (generated) {
      retainedGeneratedIds.add(generated.id)
      const { error: updateError } = await supabase
        .from('pharmacy_persons')
        .update(payload)
        .eq('id', generated.id)
      if (updateError) throw updateError
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('pharmacy_persons')
        .insert(payload)
        .select('id')
        .single()
      if (insertError) throw insertError
      retainedGeneratedIds.add(inserted.id)
    }
  }

  const staleIds = existingOwners
    .filter(person => parseAutoOwnerKey(person.observations) && !retainedGeneratedIds.has(person.id))
    .map(person => person.id)

  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('pharmacy_persons')
      .delete()
      .in('id', staleIds)
    if (deleteError) throw deleteError
  }
}
