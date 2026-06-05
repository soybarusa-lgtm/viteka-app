import { useMemo, useState } from 'react'
import { CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline'
import ConfigCard from '../../components/configuracion/ConfigCard'
import { useAppSettings } from '../../hooks/useAppSettings'
import { useToast } from '../../context/ToastContext'

function SettingPreview({ value }) {
  const entries = Object.entries(value || {})
  if (!entries.length) return <p className="text-xs text-slate-400">Sin parametros configurados.</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.slice(0, 6).map(([key, item]) => (
        <span key={key} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
          {key}: {typeof item === 'boolean' ? (item ? 'Si' : 'No') : Array.isArray(item) ? item.length : String(item)}
        </span>
      ))}
    </div>
  )
}

export default function ConfigGeneralPage() {
  const { settings, loading, error, usingMocks, updateSetting, reload } = useAppSettings()
  const toast = useToast()
  const [showChanges, setShowChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({})

  const cards = useMemo(() => settings.map(setting => ({
    ...setting,
    value: draft[setting.key] || setting.value,
  })), [draft, settings])

  const changedCount = Object.keys(draft).length

  async function handleSave() {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(draft)) {
        await updateSetting(key, value)
      }
      setDraft({})
      toast('Configuracion guardada', 'success')
    } catch (saveError) {
      toast(saveError.message || 'No se pudo guardar la configuracion', 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleSetting(setting, field) {
    const current = draft[setting.key] || setting.value || {}
    setDraft(prev => ({
      ...prev,
      [setting.key]: { ...current, [field]: !current[field] },
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">Ajustes generales</h2>
          <p className="text-sm text-slate-500">{usingMocks ? 'Modo demostracion hasta aplicar la migracion.' : 'Configuracion conectada a Supabase.'}</p>
          {error && <p className="mt-1 text-xs text-amber-600">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowChanges(value => !value)} className="btn-secondary">
            <EyeIcon className="h-4 w-4" /> Ver cambios ({changedCount})
          </button>
          <button type="button" onClick={reload} className="btn-ghost">Recargar</button>
          <button type="button" onClick={handleSave} disabled={!changedCount || saving} className="btn-primary">
            <CheckCircleIcon className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {showChanges && (
        <div className="rounded-2xl border border-teal-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
          {changedCount ? Object.keys(draft).join(', ') : 'No hay cambios pendientes.'}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Cargando configuracion...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {cards.map(setting => (
            <ConfigCard key={setting.key} title={setting.title} description={setting.description} badge={draft[setting.key] ? 'Editado' : 'Activo'}>
              <div className="space-y-3">
                <SettingPreview value={setting.value} />
                <div className="flex flex-wrap gap-2">
                  {Object.entries(setting.value || {}).filter(([, value]) => typeof value === 'boolean').slice(0, 4).map(([field, value]) => (
                    <button key={field} type="button" onClick={() => toggleSetting(setting, field)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${value ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-500'}`}>
                      {field}: {value ? 'Activo' : 'Inactivo'}
                    </button>
                  ))}
                </div>
              </div>
            </ConfigCard>
          ))}
        </div>
      )}
    </div>
  )
}
