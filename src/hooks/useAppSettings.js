import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { settingsMock } from '../lib/configurationMockData'
import { logAuditEvent } from '../lib/auditLog'

function normalizeSettings(rows) {
  return rows.map(row => ({
    key: row.key,
    title: row.title || row.key,
    description: row.description || '',
    value: row.value || {},
    updated_at: row.updated_at || null,
  }))
}

export function useAppSettings() {
  const [settings, setSettings] = useState(settingsMock)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingMocks, setUsingMocks] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: settingsError } = await supabase
      .from('app_settings')
      .select('key, title, description, value, updated_at')
      .order('sort_order', { ascending: true })

    if (settingsError) {
      setSettings(settingsMock)
      setUsingMocks(true)
      setError(settingsError.message)
      setLoading(false)
      return
    }

    setSettings(data?.length ? normalizeSettings(data) : settingsMock)
    setUsingMocks(!data?.length)
    setLoading(false)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- reload sincroniza el hook con Supabase al montar. */
  useEffect(() => {
    reload()
  }, [reload])
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateSetting = useCallback(async (key, value) => {
    const previous = settings.find(setting => setting.key === key)
    const next = settings.map(setting => setting.key === key ? { ...setting, value, updated_at: new Date().toISOString() } : setting)
    setSettings(next)

    if (!usingMocks) {
      const payload = {
        key,
        title: previous?.title || key,
        description: previous?.description || '',
        value,
        updated_at: new Date().toISOString(),
      }
      const { error: upsertError } = await supabase.from('app_settings').upsert(payload, { onConflict: 'key' })
      if (upsertError) {
        setSettings(settings)
        throw upsertError
      }
    }

    await logAuditEvent('config.update', 'app_settings', key, previous?.value || null, value)
  }, [settings, usingMocks])

  const settingsByKey = useMemo(() => Object.fromEntries(settings.map(setting => [setting.key, setting])), [settings])

  return { settings, settingsByKey, loading, error, usingMocks, updateSetting, reload }
}
