# Auditoria de Farmacias

## Alcance

Esta revision cubre dos planos:

1. Consolidacion funcional y visual de la ficha de farmacia.
2. Deteccion de redundancias en base de datos antes de aplicar cambios destructivos.

## Cambios aplicados en frontend

### Consolidacion de rutas y paginas

- Se mantiene una sola ficha principal en `/farmacias/:id`.
- La ruta `/farmacias/:id/editar` deja de ser una pantalla independiente y ahora redirige a la misma ficha con edicion contextual.
- `Datos generales`, `Equipamiento`, `Equipos informaticos`, `Personas`, `Incidencias`, `Proyectos` y `Documentos` quedan reunidos bajo la misma navegacion superior.

### Secciones unificadas

- `Datos generales` ya no depende de la pantalla legacy para editar y usa drawer inline.
- `Equipamiento` ya no depende de la pantalla legacy para editar y usa drawer inline.
- `Incidencias` se incorpora como tab propia dentro de la ficha, con consulta y creacion sin salir de la pagina.
- `Documentos`, `Proyectos`, `Personas` y `Equipos informaticos` siguen en la ficha unica y comparten la misma linea base de modulos, toolbar, tarjetas y estados.

### Componentes reutilizados

- `PharmacyModuleHeader`
- `PharmacyModuleToolbar`
- `PharmacySectionCard`
- `PharmacyEditDrawer`
- `EditGeneralModal`
- `EditEquipmentModal`

## Duplicidades funcionales detectadas

### Rutas y pantallas

- `src/pages/PharmacyEditPage.jsx`
  - Sigue existiendo en codigo, pero ya no forma parte del flujo principal.
  - Recomendacion: eliminarla cuando confirmemos que no queda ningun acceso operativo pendiente.

### Flujo legacy todavia activo

- `src/pages/PharmacyDetailPage.jsx`
  - Sigue siendo necesario como fallback para algunas acciones heredadas de `Personas` y `Equipos informaticos`.
  - Recomendacion: extraer sus modales y formularios a componentes reutilizables para cerrar definitivamente la dependencia legacy.

## Redundancias detectadas en base de datos

No se ha eliminado ninguna tabla ni columna. Esto es solo informe y propuesta.

### 1. Documentos duplicados

Tablas afectadas:

- `documents`
- `pharmacy_documents`

Problema:

- Ambas guardan documentos vinculables a farmacia.
- Tienen campos solapados de nombre, ruta, tipo, tamano y fecha.

Propuesta no destructiva:

1. Elegir una sola tabla destino para documentos de farmacia.
2. Crear una vista de compatibilidad temporal para no romper el frontend.
3. Migrar lectura y escritura a una unica fuente.
4. Eliminar la tabla sobrante solo tras validar conteos y referencias.

### 2. Personas / contactos solapados

Tablas afectadas:

- `pharmacy_contacts`
- `pharmacy_persons`

Problema:

- Ambas representan contactos o personas de farmacia.
- `pharmacy_persons` es claramente mas rica y parece la tabla viva.

Propuesta no destructiva:

1. Congelar altas nuevas en `pharmacy_contacts`.
2. Migrar datos faltantes a `pharmacy_persons`.
3. Crear vista o adaptador temporal si algun modulo antiguo sigue leyendo `pharmacy_contacts`.

### 3. Incidencias duplicadas conceptualmente

Tablas afectadas:

- `incidents`
- `support_tickets`

Problema:

- Las dos cubren incidencias o soporte, pero con modelos distintos.
- El portal ya se apoya mucho mas en `support_tickets`.

Propuesta no destructiva:

1. Decidir si `incidents` sera solo historico o si debe absorberse en `support_tickets`.
2. Si `support_tickets` es la fuente canonica, crear migracion de datos y vista de compatibilidad.
3. Revisar integracion futura con proyectos antes de eliminar nada.

### 4. Titulares repetidos entre farmacia y personas

Columnas afectadas:

- `pharmacies.owner_name`
- `pharmacies.cb_owners`
- `pharmacies.sl_data`
- `pharmacy_persons`

Problema:

- La identidad legal vive parte en `pharmacies` y parte en `pharmacy_persons`.
- Hoy esto obliga a sincronizacion manual o logica auxiliar.

Propuesta no destructiva:

1. Mantener `pharmacies` como fuente legal/juridica.
2. Mantener `pharmacy_persons` como fuente operativa de personas.
3. Formalizar sincronizacion automatica de titulares a personas, ya iniciada en frontend.
4. Valorar tabla intermedia futura para titulares societarios si la casuistica crece.

### 5. Equipamiento con columnas heredadas y nombres inconsistentes

Tabla afectada:

- `pharmacy_equipment`

Problemas detectados:

- `consultoria_detail` y `consulting_detail`
- `pantallas_detail` y `screens_detail`
- coexistencia de campos antiguos por producto y nuevos `jsonb`
- mezcla de nombres en castellano e ingles

Impacto:

- Duplica semantica.
- Aumenta el riesgo de escribir en una columna y leer otra.

Propuesta no destructiva:

1. Definir por cada producto una estructura canonica.
2. Marcar columnas legacy en un documento tecnico.
3. Migrar lecturas del frontend a la estructura canonica.
4. Ejecutar migracion de consolidacion y despues retirar columnas obsoletas.

### 6. Posibles claves foraneas e indices a revisar

Revisar explicitamente:

- todas las relaciones `pharmacy_id`
- `projects.pharmacy_id`
- `tasks.pharmacy_id`
- `documents.pharmacy_id`
- `incidents.pharmacy_id`
- `support_tickets.pharmacy_id`
- `assigned_to`, `assigned_commercial_id`, `assigned_technician_id`

Propuesta:

- asegurar claves foraneas donde falten
- anadir indices en columnas de cruce principales para vistas de ficha

## Orden recomendado para migraciones futuras

1. Consolidar lecturas del frontend a una sola tabla por dominio.
2. Anadir vistas o adaptadores de compatibilidad.
3. Migrar datos historicos.
4. Validar conteos, integridad y permisos.
5. Solo entonces retirar tablas o columnas duplicadas.

## Riesgos a vigilar

- Componentes legacy de `Personas` y `Equipos informaticos` aun no totalmente extraidos.
- Posibles escrituras en paralelo sobre tablas duplicadas si siguen vivas por otros modulos.
- Inconsistencias historicas en `pharmacy_equipment` por mezcla de columnas antiguas y nuevas.
