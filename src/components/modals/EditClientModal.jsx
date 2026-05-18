import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSpanishLocations } from '../../hooks/useSpanishLocations';

const PRODUCT_CATEGORIES = [
  { label: 'ERP',                    key: 'erp',          options: ['Nixfarma', 'Farmatic', 'Unycop', 'Kroll', 'Farmatools', 'Otros'] },
  { label: 'Caja de cobro',          key: 'caja',         options: ['Cashlogy', 'Glory', 'Crane', 'Suzohapp', 'Otros'] },
  { label: 'Etiquetas electrónicas', key: 'etiquetas',    options: ['Hanshow', 'SES-imagotag', 'Pricer', 'Otros'] },
  { label: 'Báscula',                key: 'bascula',      options: ['Epelsa', 'Radwag', 'Kern', 'Otros'] },
  { label: 'Arcos antihurto',        key: 'arcos',        options: ['Checkpoint', 'Sensormatic', 'Otros'] },
  { label: 'Consultoría',            key: 'consultoria',  options: ['Consultoría Viteka', 'Otros'] },
  { label: 'Equipos informáticos',   key: 'equipos',      options: ['Ordenadores', 'Periféricos', 'Servidores', 'Otros'] },
  { label: 'Robot',                  key: 'robot',        options: ['Rowa', 'BD Rowa', 'Apostore', 'Otros'] },
  { label: 'Cruz',                   key: 'cruz',         options: ['Rótulos LED', 'Cruz luminosa', 'Otros'] },
  { label: 'Turnos',                 key: 'turnos',       options: ['Sistema de turnos', 'Otros'] },
  { label: 'SPD',                    key: 'spd',          options: ['Sistema SPD', 'Otros'] },
  { label: 'Pantallas',              key: 'pantallas',    options: ['Pantalla mostrador', 'Pantalla escaparate', 'Otros'] },
  { label: 'Frigorífico',            key: 'frigorifico',  options: ['Frigorífico farmacia', 'Otros'] },
];

const emptyProducts = () =>
  Object.fromEntries(PRODUCT_CATEGORIES.map((c) => [c.key, { active: false, brand: '' }]));

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

function Field({ label, children }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

export default function EditClientModal({ isOpen, client, onClose, onSave }) {
  if (!isOpen || !client) return null;
  return createPortal(
    <EditClientForm client={client} onClose={onClose} onSave={onSave} />,
    document.body
  );
}

function EditClientForm({ client, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [legalType, setLegalType] = useState(client.legal_type || 'autonomo');
  const [expanded, setExpanded] = useState({});
  const [products, setProducts] = useState(
    client.products ? { ...emptyProducts(), ...client.products } : emptyProducts()
  );
  const { provinces, getTowns } = useSpanishLocations();
  const [autonomo, setAutonomo] = useState({
    pharmacy_name: client.pharmacy_name     || '',
    owner_name:    client.pharmacist_owner  || '',
    nif:           client.nif_cif           || '',
    colegiado:     client.collegiate_number || '',
    soe:           client.soe_number        || '',
    phone:         client.contact_phone     || '',
    email:         client.contact_email     || '',
    address:       client.address           || '',
    province:      client.province          || '',
    city:          client.city              || '',
    postal_code:   client.postal_code       || '',
    schedule:      client.schedule          || '',
    guards:        client.has_guards != null ? String(client.has_guards) : '',
    notes:         client.observations      || '',
  });
  const [cb, setCb] = useState({
    pharmacy_name: client.pharmacy_name  || '',
    razon_social:  client.razon_social   || '',
    cif:           client.nif_cif        || '',
    phone:         client.contact_phone  || '',
    email:         client.contact_email  || '',
    address:       client.address        || '',
    province:      client.province       || '',
    city:          client.city           || '',
    postal_code:   client.postal_code    || '',
    soe:           client.soe_number     || '',
    schedule:      client.schedule       || '',
    guards:        client.has_guards != null ? String(client.has_guards) : '',
    notes:         client.observations   || '',
    owners: Array.isArray(client.cb_owners) && client.cb_owners.length > 0
      ? client.cb_owners
      : [{ name: '', nif: '', colegiado: '' }],
  });
  const [sl, setSl] = useState({
    pharmacy_name: client.pharmacy_name  || '',
    razon_social:  client.razon_social   || '',
    cif:           client.nif_cif        || '',
    phone:         client.contact_phone  || '',
    email:         client.contact_email  || '',
  });

  const townsAuto = getTowns(autonomo.province);
  const townsCb   = getTowns(cb.province);

  const pharmacyName =
    legalType === 'autonomo' ? autonomo.pharmacy_name
    : legalType === 'cb'     ? cb.pharmacy_name
    : sl.pharmacy_name;

  const toggleExpanded = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));
  const addCbOwner = () => setCb((p) => ({ ...p, owners: [...p.owners, { name: '', nif: '', colegiado: '' }] }));
  const updateCbOwner = (i, f, v) => setCb((p) => ({ ...p, owners: p.owners.map((o, idx) => idx === i ? { ...o, [f]: v } : o) }));
  const removeCbOwner = (i) => setCb((p) => ({ ...p, owners: p.owners.filter((_, idx) => idx !== i) }));

  const handleSave = () => {
    let payload = { legal_type: legalType, products };
    if (legalType === 'autonomo') payload = { ...payload, ...autonomo };
    if (legalType === 'cb')       payload = { ...payload, ...cb, cb_owners: cb.owners };
    if (legalType === 'sl')       payload = { ...payload, ...sl };
    onSave(client.id, payload);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '42rem',
          backgroundColor: '#fff',
          borderRadius: '1rem 1rem 0 0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid #f1f5f9', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Editar Farmacia</h2>
            {pharmacyName && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#0d9488', fontWeight: 600 }}>{pharmacyName}</p>}
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{step === 1 ? 'Datos del titular / empresa' : 'Productos instalados'}</p>
          </div>
          <button type="button" onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PROGRESO */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: '0.75rem 1.25rem' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ flex: 1, height: 6, borderRadius: 9999, backgroundColor: s <= step ? '#0d9488' : '#e5e7eb', transition: 'background-color 0.3s' }} />
          ))}
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div style={{ flex: '1 1 0', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.5rem 1.25rem' }}>
          {step === 1 ? (
            <div className="space-y-5 pb-4">
              <div>
                <p className={labelCls}>Tipo jurídico</p>
                <div className="flex gap-2">
                  {[['autonomo', 'Autónomo'], ['cb', 'C.B.'], ['sl', 'S.L.']].map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => setLegalType(val)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        legalType === val ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>{lbl}</button>
                  ))}
                </div>
              </div>

              <Field label="Nombre de la farmacia *">
                <input className={inputCls} value={pharmacyName}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (legalType === 'autonomo') setAutonomo((p) => ({ ...p, pharmacy_name: v }));
                    else if (legalType === 'cb')  setCb((p) => ({ ...p, pharmacy_name: v }));
                    else                          setSl((p) => ({ ...p, pharmacy_name: v }));
                  }} />
              </Field>

              {legalType === 'autonomo' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Titular *"><input className={inputCls} value={autonomo.owner_name} onChange={(e) => setAutonomo((p) => ({ ...p, owner_name: e.target.value }))} /></Field>
                    <Field label="NIF"><input className={inputCls} value={autonomo.nif} onChange={(e) => setAutonomo((p) => ({ ...p, nif: e.target.value }))} /></Field>
                    <Field label="Nº Colegiado"><input className={inputCls} value={autonomo.colegiado} onChange={(e) => setAutonomo((p) => ({ ...p, colegiado: e.target.value }))} /></Field>
                    <Field label="SOE"><input className={inputCls} value={autonomo.soe} onChange={(e) => setAutonomo((p) => ({ ...p, soe: e.target.value }))} /></Field>
                    <Field label="Teléfono"><input className={inputCls} type="tel" value={autonomo.phone} onChange={(e) => setAutonomo((p) => ({ ...p, phone: e.target.value }))} /></Field>
                    <Field label="Email"><input className={inputCls} type="email" value={autonomo.email} onChange={(e) => setAutonomo((p) => ({ ...p, email: e.target.value }))} /></Field>
                  </div>
                  <Field label="Dirección"><input className={inputCls} value={autonomo.address} onChange={(e) => setAutonomo((p) => ({ ...p, address: e.target.value }))} /></Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Provincia">
                      <select className={inputCls} value={autonomo.province} onChange={(e) => setAutonomo((p) => ({ ...p, province: e.target.value, city: '' }))}>
                        <option value="">Provincia...</option>
                        {provinces.map((p) => <option key={p.code} value={p.label}>{p.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Población">
                      <select className={inputCls} value={autonomo.city} onChange={(e) => setAutonomo((p) => ({ ...p, city: e.target.value }))} disabled={!townsAuto.length}>
                        <option value="">{townsAuto.length ? 'Población...' : 'Elige provincia'}</option>
                        {townsAuto.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="C.P."><input className={inputCls} value={autonomo.postal_code} onChange={(e) => setAutonomo((p) => ({ ...p, postal_code: e.target.value }))} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Horario"><input className={inputCls} value={autonomo.schedule} onChange={(e) => setAutonomo((p) => ({ ...p, schedule: e.target.value }))} /></Field>
                    <Field label="Guardias"><input className={inputCls} value={autonomo.guards} onChange={(e) => setAutonomo((p) => ({ ...p, guards: e.target.value }))} /></Field>
                  </div>
                  <Field label="Observaciones"><textarea rows={3} className={inputCls} value={autonomo.notes} onChange={(e) => setAutonomo((p) => ({ ...p, notes: e.target.value }))} /></Field>
                </div>
              )}

              {legalType === 'cb' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Razón social"><input className={inputCls} value={cb.razon_social} onChange={(e) => setCb((p) => ({ ...p, razon_social: e.target.value }))} /></Field>
                    <Field label="CIF"><input className={inputCls} value={cb.cif} onChange={(e) => setCb((p) => ({ ...p, cif: e.target.value }))} /></Field>
                    <Field label="Teléfono"><input className={inputCls} type="tel" value={cb.phone} onChange={(e) => setCb((p) => ({ ...p, phone: e.target.value }))} /></Field>
                    <Field label="Email"><input className={inputCls} type="email" value={cb.email} onChange={(e) => setCb((p) => ({ ...p, email: e.target.value }))} /></Field>
                  </div>
                  <Field label="Dirección"><input className={inputCls} value={cb.address} onChange={(e) => setCb((p) => ({ ...p, address: e.target.value }))} /></Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Provincia">
                      <select className={inputCls} value={cb.province} onChange={(e) => setCb((p) => ({ ...p, province: e.target.value, city: '' }))}>
                        <option value="">Provincia...</option>
                        {provinces.map((p) => <option key={p.code} value={p.label}>{p.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Población">
                      <select className={inputCls} value={cb.city} onChange={(e) => setCb((p) => ({ ...p, city: e.target.value }))} disabled={!townsCb.length}>
                        <option value="">{townsCb.length ? 'Población...' : 'Elige provincia'}</option>
                        {townsCb.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="C.P."><input className={inputCls} value={cb.postal_code} onChange={(e) => setCb((p) => ({ ...p, postal_code: e.target.value }))} /></Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="SOE"><input className={inputCls} value={cb.soe} onChange={(e) => setCb((p) => ({ ...p, soe: e.target.value }))} /></Field>
                    <Field label="Horario"><input className={inputCls} value={cb.schedule} onChange={(e) => setCb((p) => ({ ...p, schedule: e.target.value }))} /></Field>
                    <Field label="Guardias"><input className={inputCls} value={cb.guards} onChange={(e) => setCb((p) => ({ ...p, guards: e.target.value }))} /></Field>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Titulares de la C.B.</p>
                    {cb.owners.map((owner, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">Titular {i + 1}</span>
                          {cb.owners.length > 1 && <button type="button" onClick={() => removeCbOwner(i)} className="text-red-400 text-xs">Eliminar</button>}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div><label className={labelCls}>Nombre</label><input className={inputCls} value={owner.name} onChange={(e) => updateCbOwner(i, 'name', e.target.value)} /></div>
                          <div><label className={labelCls}>NIF</label><input className={inputCls} value={owner.nif} onChange={(e) => updateCbOwner(i, 'nif', e.target.value)} /></div>
                          <div><label className={labelCls}>Colegiado</label><input className={inputCls} value={owner.colegiado} onChange={(e) => updateCbOwner(i, 'colegiado', e.target.value)} /></div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addCbOwner} className="text-teal-600 text-sm font-medium">+ Añadir titular</button>
                  </div>
                  <Field label="Observaciones"><textarea rows={3} className={inputCls} value={cb.notes} onChange={(e) => setCb((p) => ({ ...p, notes: e.target.value }))} /></Field>
                </div>
              )}

              {legalType === 'sl' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Razón social"><input className={inputCls} value={sl.razon_social} onChange={(e) => setSl((p) => ({ ...p, razon_social: e.target.value }))} /></Field>
                    <Field label="CIF"><input className={inputCls} value={sl.cif} onChange={(e) => setSl((p) => ({ ...p, cif: e.target.value }))} /></Field>
                    <Field label="Teléfono"><input className={inputCls} type="tel" value={sl.phone} onChange={(e) => setSl((p) => ({ ...p, phone: e.target.value }))} /></Field>
                    <Field label="Email"><input className={inputCls} type="email" value={sl.email} onChange={(e) => setSl((p) => ({ ...p, email: e.target.value }))} /></Field>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {PRODUCT_CATEGORIES.map(({ label, key, options }) => (
                <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => toggleExpanded(key)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={products[key]?.active || false}
                        onChange={(e) => { e.stopPropagation(); setProducts((prev) => ({ ...prev, [key]: { ...prev[key], active: e.target.checked } })); }}
                        onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-teal-600" />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded[key] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expanded[key] && (
                    <div className="px-4 py-3">
                      <label className={labelCls}>Marca / Modelo</label>
                      <select className={inputCls} value={products[key]?.brand || ''}
                        onChange={(e) => setProducts((prev) => ({ ...prev, [key]: { ...prev[key], brand: e.target.value } }))}>
                        <option value="">Seleccionar...</option>
                        {options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ flexShrink: 0, borderTop: '1px solid #f1f5f9', padding: '1rem 1.25rem', display: 'flex', gap: 12, backgroundColor: '#fff' }}>
          <button type="button" onClick={step === 1 ? onClose : () => setStep(1)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            {step === 1 ? 'Cancelar' : '← Atrás'}
          </button>
          <button type="button" onClick={step === 1 ? () => setStep(2) : handleSave}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#0d9488', color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            {step === 1 ? 'Siguiente →' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
