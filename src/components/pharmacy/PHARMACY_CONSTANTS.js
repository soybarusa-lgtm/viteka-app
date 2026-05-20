// ── Provincias ────────────────────────────────────────────────────────────────
export const PROVINCES = [
  { value: 'almeria', label: 'Almería' }, { value: 'cadiz',   label: 'Cádiz' },
  { value: 'cordoba', label: 'Córdoba' }, { value: 'granada', label: 'Granada' },
  { value: 'huelva',  label: 'Huelva'  }, { value: 'jaen',    label: 'Jaén'  },
  { value: 'malaga',  label: 'Málaga'  }, { value: 'sevilla', label: 'Sevilla' },
]

// ── ERP ───────────────────────────────────────────────────────────────────────
export const ERP_OPTIONS = ['Nixfarma','Farmatic','Unycop Next','Farmanager','Unicop Win','vGaleno','Compufarma','Otro']
// Marcas ERP que activan el checkbox "Viteka es distribuidor"
export const ERP_VITEKA_BRANDS = ['Nixfarma']

// ── Caja de cobro ─────────────────────────────────────────────────────────────
export const CAJA_OPTIONS = [
  { value: 'NO',           label: 'No tiene',     modelos: [] },
  { value: 'Cashlogy',     label: 'Cashlogy',     modelos: ['1000','1500','2023','Maximate','Safe','MaxiSafe','Otro'] },
  { value: 'Cashinfinity', label: 'Cashinfinity', modelos: ['CI-5','CI-10X','CI-100X','Otro'] },
  { value: 'Cashkeeper',   label: 'Cashkeeper',   modelos: ['Compacto','Modular','Otro'] },
  { value: 'CashDro',      label: 'CashDro',      modelos: ['CashDro S','CashDro 4+','CashDro 5','CashDro 7','Otro'] },
  { value: 'CashProtect',  label: 'CashProtect',  modelos: ['CashProtect 400 AS','CashProtect Pro AS','CashProtect PJ','CashProtect POS','CashProtect 1000','Otro'] },
  { value: 'Otro',         label: 'Otro',         modelos: [] },
]
// Marcas caja que activan el checkbox "Viteka es distribuidor"
export const CAJA_VITEKA_BRANDS = ['Cashlogy']

// ── ESL ───────────────────────────────────────────────────────────────────────
export const ESL_OPTIONS = [
  { value: 'NO',          label: 'No tiene'    },
  { value: 'Hanshow',     label: 'Hanshow'     },
  { value: 'Pricer',      label: 'Pricer'      },
  { value: 'Expofarm',    label: 'Expofarm'    },
  { value: 'Farmaconnet', label: 'Farmaconnet' },
  { value: 'Otro',        label: 'Otro'        },
]
// Marcas ESL que activan el checkbox "Viteka es distribuidor"
export const ESL_VITEKA_BRANDS = ['Hanshow', 'Pricer']

// ── Báscula ───────────────────────────────────────────────────────────────────
export const BASCULA_OPTIONS   = ['NO','Pondus','Keito','Otro']
export const BASCULA_VITEKA_BRANDS = ['Pondus']

// ── Antihurto ─────────────────────────────────────────────────────────────────
export const ANTIHURTO_OPTIONS = ['NO','Checkpoint','Otro']
export const ANTIHURTO_VITEKA_BRANDS = ['Checkpoint']

// ── Frigorífico ───────────────────────────────────────────────────────────────
export const FRIGORIFICO_OPTIONS = ['Liebherr','Kirsch','Fagor','Otro']
export const FRIGORIFICO_VITEKA_BRANDS = ['Liebherr']

// ── Consultoría ── Viteka Pro Gestión siempre es viteka=true (implícito) ───────
export const CONSULTORIA_OPTIONS = ['NO','Viteka Pro Gestión','Avantia Plus Gestión','Otro']
export const CONSULTORIA_VITEKA_IMPLICIT = ['Viteka Pro Gestión']

// ── Resto ─────────────────────────────────────────────────────────────────────
export const ROBOT_OPTIONS = ['NO','BD Rowa','Gollmann','Meditech','Willach','Fablox','Luse','KLS','Tecnyfarma','Otro']
export const CRUZ_OPTIONS  = ['NO','SI','Puede ampliar']
export const YEARS  = Array.from({ length: 31 }, (_, i) => 2026 - i)
export const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Equipamiento informático ──────────────────────────────────────────────────
export const IT_TYPES = [
  { value: 'servidor',             label: 'Servidor'                    },
  { value: 'estacion',             label: 'Estación de trabajo'         },
  { value: 'impresora_documentos', label: 'Impresora documentos'        },
  { value: 'impresora_tickets',    label: 'Impresora tickets'           },
  { value: 'impresora_etiquetas',  label: 'Impresora etiquetas'         },
  { value: 'sai',                  label: 'SAI / UPS'                   },
  { value: 'router',               label: 'Router'                      },
  { value: 'switch',               label: 'Switch'                      },
]
export const CONNECTION_OPTIONS = ['Ethernet','USB','Serie','Bluetooth','WiFi','Otro']
export const MONITOR_CONN       = ['HDMI','VGA','DVI','DisplayPort','Otro']
export const DISK_TYPES         = ['SSD','HDD','NVMe']
export const CAPA_OPTIONS       = ['1ª','2ª','3ª','4ª','5ª']

// ── Personas ──────────────────────────────────────────────────────────────────
export const PERSON_ROLES = ['Titular','Adjunto','Gestor','Técnico','Auxiliar','Otro']
export const RESPONSIBILITY_AREAS = ['Gestión','Compras','Ventas','Almacén','RRHH','Informática','Equipamiento','Categoría']

// ── Documentos ────────────────────────────────────────────────────────────────
export const DOC_CATEGORIES = ['Contratos','Informes','Presupuestos','Facturas','Otros']

// ── Helper: crea un contacto vacío o hidratado ────────────────────────────────
export const mkContact = (key, data = {}) => ({
  __key:        key,
  phone:        data.phone        || data.contact_phone  || '',
  email:        data.email        || data.contact_email  || '',
  address:      data.address      || '',
  province:     data.province     || '',
  city:         data.city         || '',
  postal_code:  data.postal_code  || '',
  soe:          data.soe          || data.soe_number     || '',
  schedule:     data.schedule     || '',
  has_guards:   data.has_guards   || false,
  observations: data.observations || '',
})
