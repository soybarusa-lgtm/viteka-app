import { useMemo } from 'react'

export default function ClientPortalPage({
  currentPage,
}) {
  if (currentPage === 'client-categories') {
    return <CategoriesModule />
  }

  if (currentPage === 'client-protocols') {
    return <ProtocolsModule />
  }

  if (currentPage === 'client-roi') {
    return <ROIModule />
  }

  if (currentPage === 'client-categorizer') {
    return <CategorizerModule />
  }

  if (currentPage === 'client-documents') {
    return <DocumentsModule />
  }

  return <ClientDashboard />
}

function ClientDashboard() {
  const metrics = useMemo(() => {
    return {
      categories: 128,
      protocols: 24,
      documents: 63,
      roi: '+18%',
    }
  }, [])

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
          Portal cliente
        </h1>

        <p className="mt-3 text-base text-[#64748B]">
          Herramientas y recursos operativos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <MetricCard
          title="Familias categorizadas"
          value={metrics.categories}
          icon="◎"
        />

        <MetricCard
          title="Protocolos activos"
          value={metrics.protocols}
          icon="▣"
        />

        <MetricCard
          title="Documentos"
          value={metrics.documents}
          icon="≣"
        />

        <MetricCard
          title="ROI estimado"
          value={metrics.roi}
          icon="↗"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_420px]">
        <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <h2 className="text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
                Actividad reciente
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                Últimos movimientos del sistema.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <ActivityItem
              title="Nueva categorización completada"
              subtitle="Familia: Productos refrigerados"
              time="Hace 2h"
            />

            <ActivityItem
              title="Protocolo actualizado"
              subtitle="Recepción de mercancía"
              time="Hace 5h"
            />

            <ActivityItem
              title="Nuevo documento disponible"
              subtitle="Guía operativa"
              time="Ayer"
            />

            <ActivityItem
              title="Análisis ROI recalculado"
              subtitle="Optimización logística"
              time="Hace 2 días"
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <h2 className="text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
            Accesos rápidos
          </h2>

          <div className="mt-7 space-y-4">
            <QuickAction
              title="Abrir categorizador IA"
              icon="✦"
            />

            <QuickAction
              title="Consultar protocolos"
              icon="▣"
            />

            <QuickAction
              title="Ver documentación"
              icon="≣"
            />

            <QuickAction
              title="Calcular ROI"
              icon="↗"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoriesModule() {
  return (
    <ModuleContainer
      title="Familias y categorías"
      description="Gestión y consulta de categorizaciones."
    />
  )
}

function ProtocolsModule() {
  return (
    <ModuleContainer
      title="Protocolos normalizados"
      description="Procedimientos operativos disponibles."
    />
  )
}

function ROIModule() {
  return (
    <ModuleContainer
      title="Calculadora ROI"
      description="Análisis de retorno de inversión."
    />
  )
}

function CategorizerModule() {
  return (
    <ModuleContainer
      title="Categorizador IA"
      description="Asistente inteligente de categorización."
    />
  )
}

function DocumentsModule() {
  return (
    <ModuleContainer
      title="Documentación"
      description="Biblioteca documental del cliente."
    />
  )
}

function ModuleContainer({
  title,
  description,
}) {
  return (
    <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-10 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
      <h1 className="text-4xl tracking-[-0.04em] text-[#0F172A] font-medium">
        {title}
      </h1>

      <p className="mt-4 max-w-2xl text-base leading-8 text-[#64748B]">
        {description}
      </p>

      <div className="mt-10 rounded-3xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-14 text-center">
        <p className="text-[#64748B]">
          Módulo preparado para desarrollo.
        </p>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-7 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#059669]">
          <span className="text-2xl">
            {icon}
          </span>
        </div>

        <strong className="text-4xl tracking-[-0.04em] text-[#0F172A] font-medium">
          {value}
        </strong>
      </div>

      <p className="mt-6 text-sm text-[#64748B]">
        {title}
      </p>
    </div>
  )
}

function ActivityItem({
  title,
  subtitle,
  time,
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 h-3 w-3 rounded-full bg-[#059669]" />

      <div className="min-w-0 flex-1">
        <p className="text-[#0F172A] font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm text-[#64748B]">
          {subtitle}
        </p>
      </div>

      <span className="text-xs text-[#94A3B8]">
        {time}
      </span>
    </div>
  )
}

function QuickAction({
  title,
  icon,
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-5 text-left transition hover:bg-white"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#059669] shadow-sm">
          {icon}
        </div>

        <span className="text-[#0F172A] font-medium">
          {title}
        </span>
      </div>

      <span className="text-[#94A3B8]">
        →
      </span>
    </button>
  )
}