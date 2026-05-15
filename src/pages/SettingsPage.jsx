export default function SettingsPage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
          Configuración
        </h1>

        <p className="mt-3 text-base text-[#64748B]">
          Permisos, usuarios, módulos y configuración general.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Usuarios y roles" description="Gestión de permisos internos." />
        <Card title="Módulos cliente" description="Activar servicios por farmacia." />
        <Card title="Branding" description="Logos, colores y marca." />
      </div>
    </div>
  )
}

function Card({ title, description }) {
  return (
    <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-7 shadow-sm">
      <h2 className="text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-7 text-[#64748B]">
        {description}
      </p>
    </div>
  )
}