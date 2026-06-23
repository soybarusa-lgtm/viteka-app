# Viteka App

Aplicación interna para gestionar la operación profesional de Viteka: farmacias, proyectos, soporte, personas, documentación y configuración.

## Interfaz actual

La app usa una estructura de workspace inspirada en herramientas de gestión como Plane:

- Resumen operativo con cola de trabajo, métricas, módulos y actividad reciente.
- Planificación con ciclos, módulos, vistas guardadas y páginas operativas.
- Proyectos con lista, tablero, calendario, tareas, hitos y comunicaciones.
- Soporte interno y portal cliente para tickets y seguimiento.
- Directorio de farmacias, personas, equipamiento y documentación.
- Configuración de equipo, permisos, solicitudes y auditoría.

## Desarrollo local

```bash
npm install
npm run dev
```

Variables necesarias:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Rutas principales

- `/` resumen operativo.
- `/planificacion` ciclos, módulos, vistas y páginas.
- `/proyectos` cartera de proyectos.
- `/farmacias` directorio de farmacias.
- `/personas` contactos y responsables.
- `/soporte/dashboard` centro de soporte.
- `/soporte/tickets` bandeja de tickets.
- `/documentos` biblioteca corporativa.
- `/configuracion/general` configuración interna.

Los alias `/gestion` y `/roadmap` redirigen a `/planificacion`.
