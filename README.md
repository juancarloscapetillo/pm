# Calume Proyectos

Plataforma tipo Monday.com para el área de **Proyectos de Desarrolladora Calume**
(Mérida, Yucatán): programa de obra, tareas, incidencias, garantías posventa,
presupuesto operativo y, como módulo prioritario del MVP, **Mi trabajo (Mis
pendientes) y el Centro de notificaciones**.

## Arquitectura

- **Next.js 14 (App Router, TypeScript)** — un solo proyecto sirve frontend y backend
  (API routes), igual que el CRM de Calume.
- **PostgreSQL + Prisma ORM** — persistencia y modelo de datos.
- **NextAuth (Credentials + JWT)** — autenticación con 5 roles: `DIRECCION`,
  `GERENTE_PROYECTOS`, `CONTROL_OBRA`, `RESIDENTE`, `GARANTIAS`.
- **Tailwind CSS** — mismo sistema visual del CRM (`#253574` navy, `#F6B436` dorado).
- **dnd-kit** — Kanban de tareas con drag & drop.
- **date-fns** — cálculo de días restantes/atraso y clasificación de pendientes.

### Modelo de datos (resumen)

`User` (rol, `managerId` para cadena de escalamiento) · `Project` · `ProjectMember` ·
`WorkActivity` (programa de obra, con dependencia simple `dependsOnId`) · `Task`
(subtareas, dependencia, `TaskParticipant`) · `Incident` (folio `INC-000N`) ·
`Warranty` (folio `GAR-000N`) · `BudgetLine` · `Comment` + `CommentMention` (@menciones)
· `ReviewRequest` (revisión / autorización / información) · `Attachment` ·
`Notification` · `Setting` (configuración de escalamiento).

### El motor de "Mi trabajo" (`src/lib/myWork.ts`)

En vez de una tabla única de "pendientes", `getMyPending(userId)` consulta en
paralelo Tareas, Actividades de obra, Incidencias, Garantías, Solicitudes de
revisión y Menciones sin leer del usuario, y las normaliza a un mismo tipo
`PendingItem`. `groupItems()` los clasifica automáticamente en los 7 buckets del
spec (Vencidos, Para hoy, Próximos 7 días, Sin fecha asignada, En espera de otra
persona, Pendientes de revisión, Completados recientemente) y
`getPersonalIndicators()` calcula los indicadores personales.

### Escalamiento (`src/lib/escalation.ts`)

`runReminderCycle()` recorre todo lo abierto (tareas, actividades, incidencias,
garantías) y genera notificaciones:

1. Recordatorio antes del vencimiento y el día del vencimiento.
2. Aviso al responsable cuando se vence.
3. Aviso al responsable **y al jefe inmediato** (`User.managerId`) cuando acumula
   atraso.
4. Aviso al **Gerente de Proyectos** (gerente del proyecto o, si no hay, el primer
   usuario activo con rol `GERENTE_PROYECTOS`) cuando el atraso es crítico.
5. Aviso cuando una actividad lleva varios días sin actualizarse.

Los umbrales (días antes de vencer, días de atraso para escalar a jefe/gerente,
días sin actualización) son configurables por tipo de actividad desde
**Usuarios y configuración → Escalamiento**, y se guardan en la tabla `Setting`.

Este entorno no tiene un scheduler en segundo plano. `scripts/generateReminders.ts`
es un wrapper de línea de comandos (`npm run reminders:run`) pensado para
programarse externamente (cron, Railway Scheduled Job, etc.). Mientras tanto, el
botón **"Ejecutar recordatorios ahora"** en Configuración dispara el mismo ciclo
bajo demanda (solo Gerente de Proyectos / Dirección), y el seed ya corre un ciclo
inicial para que existan notificaciones desde el primer login.

## Requisitos previos

- Node.js 20+
- PostgreSQL 14+

## Configuración local

```bash
npm install
cp .env.example .env   # completa DATABASE_URL y NEXTAUTH_SECRET
npx prisma db push     # crea las tablas
npm run db:seed        # usuarios y datos de demostración
npm run dev
```

### Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL |
| `NEXTAUTH_SECRET` | Clave aleatoria para firmar sesiones (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL pública de la app |

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Dirección General | `direccion@calume.mx` | `Direccion2026!` |
| Gerente de Proyectos | `gerente@calume.mx` | `Gerente2026!` |
| Control de obra | `controldeobra@calume.mx` | `Control2026!` |
| Residente de obra | `residente1@calume.mx` | `Residente2026!` |
| Residente de obra | `residente2@calume.mx` | `Residente2026!` |
| Garantías | `garantias@calume.mx` | `Garantias2026!` |

Todos los datos sembrados (proyectos, actividades, tareas, incidencias, garantías,
presupuesto) están marcados `isDemo: true` en base de datos para poder
distinguirlos de información real más adelante.

## Funcionalidades terminadas

- Autenticación con 5 roles y control de acceso por API.
- **Mi trabajo** (`/mi-trabajo`, pantalla inicial de roles operativos): vistas de
  Lista, Kanban, Calendario y Línea de tiempo; clasificación automática en los 7
  buckets del spec; filtros por proyecto/prioridad/tipo; indicadores personales
  (total, vencidos, terminados, % cumplimiento a tiempo, tiempo promedio de
  resolución, pendientes por proyecto, requieren revisión).
- **Centro de notificaciones**: campana con contador de no leídas, dropdown y
  página completa agrupada por día, botón "Abrir" al pendiente relacionado, marcar
  leída / marcar todas.
- Recordatorios y escalamiento de 4 niveles, configurable por tipo de actividad.
- Dashboard ejecutivo (Dirección/Gerente) con semáforos, avance por proyecto,
  próximos hitos, presupuesto y tareas pendientes por responsable.
- Proyectos (ficha con tabs de programa/tareas/incidencias/garantías), Programa de
  obra (tabla + Kanban), Tareas (Kanban con drag & drop + lista), Incidencias y
  Garantías (folio automático), cada una con detalle, comentarios con @menciones y
  cambio de estatus.
- Solicitudes de revisión/autorización/información con aprobar/rechazar.
- Presupuesto operativo (solo lectura), Reportes con exportación a CSV, Usuarios y
  configuración de escalamiento.

## Funcionalidades pendientes / limitaciones conocidas

- **Dependencias**: simplificadas a un solo predecesor (`dependsOnId`) en vez de un
  grafo de dependencias múltiples.
- **Adjuntos**: el modelo de datos (`Attachment`) ya soporta archivos por
  proyecto/tarea/actividad/incidencia/garantía, pero la carga desde la interfaz
  (drag & drop de archivos) queda pendiente para una siguiente fase; la pantalla
  de Archivos es de solo lectura.
- **Reportes**: exportación solo a CSV en esta fase; Excel y vista de impresión/PDF
  quedan pendientes (el CRM de Calume sí las tiene y se puede reutilizar ese
  patrón).
- **Recordatorios automáticos**: requieren un scheduler externo
  (`npm run reminders:run` vía cron/Railway) — no hay proceso en segundo plano
  corriendo dentro de la propia app.
- **Notificaciones por correo/WhatsApp/push**: el modelo y el Centro de
  notificaciones ya están listos para conectarlas, pero el envío externo no está
  implementado (solo se muestran dentro de la plataforma, como pidió el alcance).
- **Presupuesto y Reportes** de solo lectura sobre datos sembrados; falta UI de
  alta/edición de líneas de presupuesto.
- Resto de los 11 módulos (Proyectos, Programa de obra, Tareas, Incidencias,
  Garantías) tienen alta y cambio de estatus, pero sin edición avanzada (Gantt
  interactivo, reordenar Kanban del programa de obra, etc.) — se priorizó a fondo
  el módulo de Mis pendientes y notificaciones según lo solicitado.

## Despliegue

Mismo patrón que el CRM: `npm run build` ejecuta `prisma generate` y `next build`;
antes de cada deploy correr `npx prisma db push` para sincronizar el esquema; y
`npm start` levanta `next start` en el puerto `$PORT`.
