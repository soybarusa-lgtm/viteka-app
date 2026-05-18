import { useState } from 'react';
import { useSpanishLocations } from '../../hooks/useSpanishLocations';

const PRODUCT_CATEGORIES = [
  {
    label: 'ERP',
    key: 'erp',
    options: ['Nixfarma', 'Farmatic', 'Unycop', 'Kroll', 'Farmatools', 'Otros'],
  },
  {
    label: 'Caja de cobro',
    key: 'caja',
    options: ['Cashlogy', 'Glory', 'Crane', 'Suzohapp', 'Otros'],
  },
  {
    label: 'Etiquetas electrónicas',
    key: 'etiquetas',
    options: ['Hanshow', 'SES-imagotag', 'Pricer', 'Otros'],
  },
  {
    label: 'Báscula',
    key: 'bascula',
    options: ['Epelsa', 'Radwag', 'Kern', 'Otros'],
  },
  {
    label: 'Arcos antihurto',
    key: 'arcos',
    options: ['Checkpoint', 'Sensormatic', 'Otros'],
  },
  {
    label: 'Consultoría',
    key: 'consultoria',
    options: ['Consultoría Viteka', 'Otros'],
  },
  {
    label: 'Equipos informáticos',
    key: 'equipos',
    options: ['Ordenadores', 'Periféricos', 'Servidores', 'Otros'],
  },
  {
    label: 'Robot',
    key: 'robot',
    options: ['Rowa', 'BD Rowa', 'Apostore', 'Otros'],
  },
  {
    label: 'Cruz',
    key: 'cruz',
    options: ['Rótulos LED', 'Cruz luminosa', 'Otros'],
  },
  {
    label: 'Turnos',
    key: 'turnos',
    options: ['Sistema de turnos', 'Otros'],
  },
  {
    label: 'SPD',
    key: 'spd',
    options: ['Sistema SPD', 'Otros'],
  },
  {
    label: 'Pantallas',
    key: 'pantallas',
    options: ['Pantalla mostrador', 'Pantalla escaparate', 'Otros'],
  },
  {
    label: 'Frigorífico',
    key: 'frigorifico',
    options: ['Frigorifico farmacia', 'Otros'],
  },
];

const STEP_LABELS = ['Datos del titular / empresa', 'Productos instalados'];

const emptyProducts = () =>
  Object.fromEntries(PRODUCT_CATEGORIES.map((c) => [c.key, { active: false, brand: '' }]));

export default function CreateClientModal({ onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [legalType, setLegalType] = useState('autonomo');
  const [expanded, setExpanded] = useState({});

  const { provinces, getTowns } = useSpanishLocations();

  // ── Autónomo ──────────────────────────────────────────────
  const [autonomo, setAutonomo] = useState({
    pharmacy_name: '',
    owner_name: '',
    nif: '',
    colegiado: '',
    soe: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    city: '',
    postal_code: '',
    schedule: '',
    guards: '',
    notes: '',
  });

  // ── C.B. ──────────────────────────────────────────────────
  const [cb, setCb] = useState({
    pharmacy_name: '',
    razon_social: '',
    cif: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    city: '',
    postal_code: '',
    soe: '',
    schedule: '',
    guards: '',
    notes: '',
    owners: [{ name: '', nif: '', colegiado: '' }],
  });

  // ── S.L. ──────────────────────────────────────────────────
  const [sl, setSl] = useState({
    pharmacy_name: '',
    razon_social: '',
    cif: '',
    phone: '',
    email: '',
  });

  const [products, setProducts] = useState(emptyProducts());

  // ── helpers ───────────────────────────────────────────────
  const townsAuto = getTowns(autonomo.province);
  const townsCb   = getTowns(cb.province);

  const toggleExpanded = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const addCbOwner = () =>
    setCb((prev) => ({
      ...prev,
      owners: [...prev.owners, { name: '', nif: '', colegiado: '' }],
    }));

  const updateCbOwner = (i, field, value) =>
    setCb((prev) => {
      const owners = prev.owners.map((o, idx) =>
        idx === i ? { ...o, [field]: value } : o
      );
      return { ...prev, owners };
    });

  const removeCbOwner = (i) =>
    setCb((prev) => ({
      ...prev,
      owners: prev.owners.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = () => {
    let payload = { legal_type: legalType, products };
    if (legalType === 'autonomo') payload = { ...payload, ...autonomo };
    if (legalType === 'cb')       payload = { ...payload, ...cb };
    if (legalType === 'sl')       payload = { ...payload, ...sl };
    onCreate(payload);
  };

  // ── UI helpers ────────────────────────────────────────────
  const inputCls =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
  const sectionCls = 'space-y-4';

  const Field = ({ label, children }) => (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );

  const ProvinceSelect = ({ value, onChange }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">Selecciona provincia…</option>
      {provinces.map((p) => (
        <option key={p.code} value={p.label}>{p.label}</option>
      ))}
    </select>
  );

  const CitySelect = ({ towns, value, onChange }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} disabled={!towns.length}>
      <option value="">{towns.length ? 'Selecciona población…' : 'Elige provincia primero'}</option>
      {towns.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );

  // ── STEP 1 ────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Tipo jurídico */}
      <div>
        <p className={labelCls}>Tipo jurídico</p>
        <div className="flex gap-2">
          {[['autonomo', 'Autónomo'], ['cb', 'C.B.'], ['sl', 'S.L.']].map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => setLegalType(val)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                legalType === val
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Nombre farmacia — siempre visible */}
      <Field label="Nombre de la farmacia *">
        <input
          className={inputCls}
          value={legalType === 'autonomo' ? autonomo.pharmacy_name : legalType === 'cb' ? cb.pharmacy_name : sl.pharmacy_name}
          onChange={(e) => {
            const v = e.target.value;
            if (legalType === 'autonomo') setAutonomo((p) => ({ ...p, pharmacy_name: v }));
            else if (legalType === 'cb')  setCb((p) => ({ ...p, pharmacy_name: v }));
            else                           setSl((p) => ({ ...p, pharmacy_name: v }));
          }}
          placeholder="Farmacia Ejemplo"
        />
      </Field>

      {/* ── AUTÓNOMO ── */}
      {legalType === 'autonomo' && (
        <div className={sectionCls}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Titular *">
              <input className={inputCls} value={autonomo.owner_name} onChange={(e) => setAutonomo((p) => ({ ...p, owner_name: e.target.value }))} placeholder="Nombre completo" />
            </Field>
            <Field label="NIF">
              <input className={inputCls} value={autonomo.nif} onChange={(e) => setAutonomo((p) => ({ ...p, nif: e.target.value }))} placeholder="12345678A" />
            </Field>
            <Field label="Nº Colegiado">
              <input className={inputCls} value={autonomo.colegiado} onChange={(e) => setAutonomo((p) => ({ ...p, colegiado: e.target.value }))} />
            </Field>
            <Field label="SOE">
              <input className={inputCls} value={autonomo.soe} onChange={(e) => setAutonomo((p) => ({ ...p, soe: e.target.value }))} />
            </Field>
            <Field label="Teléfono">
              <input className={inputCls} value={autonomo.phone} onChange={(e) => setAutonomo((p) => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={autonomo.email} onChange={(e) => setAutonomo((p) => ({ ...p, email: e.target.value }))} type="email" />
            </Field>
          </div>
          <Field label="Dirección">
            <input className={inputCls} value={autonomo.address} onChange={(e) => setAutonomo((p) => ({ ...p, address: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Provincia">
              <ProvinceSelect
                value={autonomo.province}
                onChange={(v) => setAutonomo((p) => ({ ...p, province: v, city: '' }))}
              />
            </Field>
            <Field label="Población">
              <CitySelect
                towns={townsAuto}
                value={autonomo.city}
                onChange={(v) => setAutonomo((p) => ({ ...p, city: v }))}
              />
            </Field>
            <Field label="C.P.">
              <input className={inputCls} value={autonomo.postal_code} onChange={(e) => setAutonomo((p) => ({ ...p, postal_code: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Horario">
              <input className={inputCls} value={autonomo.schedule} onChange={(e) => setAutonomo((p) => ({ ...p, schedule: e.target.value }))} />
            </Field>
            <Field label="Guardias">
              <input className={inputCls} value={autonomo.guards} onChange={(e) => setAutonomo((p) => ({ ...p, guards: e.target.value }))} />
            </Field>
          </div>
          <Field label="Observaciones">
            <textarea rows={3} className={inputCls} value={autonomo.notes} onChange={(e) => setAutonomo((p) => ({ ...p, notes: e.target.value }))} />
          </Field>
        </div>
      )}

      {/* ── C.B. ── */}
      {legalType === 'cb' && (
        <div className={sectionCls}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Razón social">
              <input className={inputCls} value={cb.razon_social} onChange={(e) => setCb((p) => ({ ...p, razon_social: e.target.value }))} />
            </Field>
            <Field label="CIF">
              <input className={inputCls} value={cb.cif} onChange={(e) => setCb((p) => ({ ...p, cif: e.target.value }))} />
            </Field>
            <Field label="Teléfono">
              <input className={inputCls} value={cb.phone} onChange={(e) => setCb((p) => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={cb.email} onChange={(e) => setCb((p) => ({ ...p, email: e.target.value }))} type="email" />
            </Field>
          </div>
          <Field label="Dirección">
            <input className={inputCls} value={cb.address} onChange={(e) => setCb((p) => ({ ...p, address: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Provincia">
              <ProvinceSelect
                value={cb.province}
                onChange={(v) => setCb((p) => ({ ...p, province: v, city: '' }))}
              />
            </Field>
            <Field label="Población">
              <CitySelect
                towns={townsCb}
                value={cb.city}
                onChange={(v) => setCb((p) => ({ ...p, city: v }))}
              />
            </Field>
            <Field label="C.P.">
              <input className={inputCls} value={cb.postal_code} onChange={(e) => setCb((p) => ({ ...p, postal_code: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SOE">
              <input className={inputCls} value={cb.soe} onChange={(e) => setCb((p) => ({ ...p, soe: e.target.value }))} />
            </Field>
            <Field label="Horario">
              <input className={inputCls} value={cb.schedule} onChange={(e) => setCb((p) => ({ ...p, schedule: e.target.value }))} />
            </Field>
            <Field label="Guardias">
              <input className={inputCls} value={cb.guards} onChange={(e) => setCb((p) => ({ ...p, guards: e.target.value }))} />
            </Field>
          </div>
          {/* Titulares */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Titulares de la C.B.</p>
            {cb.owners.map((owner, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Titular {i + 1}</span>
                  {cb.owners.length > 1 && (
                    <button type="button" onClick={() => removeCbOwner(i)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Nombre</label>
                    <input className={inputCls} value={owner.name} onChange={(e) => updateCbOwner(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>NIF</label>
                    <input className={inputCls} value={owner.nif} onChange={(e) => updateCbOwner(i, 'nif', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Nº Colegiado</label>
                    <input className={inputCls} value={owner.colegiado} onChange={(e) => updateCbOwner(i, 'colegiado', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addCbOwner} className="text-teal-600 hover:text-teal-800 text-sm font-medium">+ Añadir titular</button>
          </div>
          <Field label="Observaciones">
            <textarea rows={3} className={inputCls} value={cb.notes} onChange={(e) => setCb((p) => ({ ...p, notes: e.target.value }))} />
          </Field>
        </div>
      )}

      {/* ── S.L. ── */}
      {legalType === 'sl' && (
        <div className={sectionCls}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Razón social">
              <input className={inputCls} value={sl.razon_social} onChange={(e) => setSl((p) => ({ ...p, razon_social: e.target.value }))} />
            </Field>
            <Field label="CIF">
              <input className={inputCls} value={sl.cif} onChange={(e) => setSl((p) => ({ ...p, cif: e.target.value }))} />
            </Field>
            <Field label="Teléfono">
              <input className={inputCls} value={sl.phone} onChange={(e) => setSl((p) => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={sl.email} onChange={(e) => setSl((p) => ({ ...p, email: e.target.value }))} type="email" />
            </Field>
          </div>
        </div>
      )}
    </div>
  );

  // ── STEP 2 ────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-3">
      {PRODUCT_CATEGORIES.map(({ label, key, options }) => (
        <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleExpanded(key)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={products[key].active}
                onChange={(e) => {
                  e.stopPropagation();
                  setProducts((prev) => ({ ...prev, [key]: { ...prev[key], active: e.target.checked } }));
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 accent-teal-600"
              />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded[key] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {expanded[key] && (
            <div className="px-4 py-3 bg-white">
              <label className={labelCls}>Marca / Modelo</label>
              <select
                className={inputCls}
                value={products[key].brand}
                onChange={(e) => setProducts((prev) => ({ ...prev, [key]: { ...prev[key], brand: e.target.value } }))}
              >
                <option value="">Seleccionar…</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nueva Farmacia</h2>
            <p className="text-xs text-gray-400 mt-0.5">{STEP_LABELS[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center px-6 py-3 gap-2">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-teal-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 1 ? renderStep1() : renderStep2()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          <button
            type="button"
            onClick={step === 1 ? () => setStep(2) : handleSubmit}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {step === 1 ? 'Siguiente' : 'Guardar farmacia'}
          </button>
        </div>
      </div>
    </div>
  );
}
