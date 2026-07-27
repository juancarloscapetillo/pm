import { prisma } from "@/lib/prisma";
import { dueBucket, DueBucket } from "@/lib/dueStatus";
import {
  taskStatusLabels,
  workActivityStatusLabels,
  incidentStatusLabels,
  warrantyStatusLabels,
  reviewKindLabels,
} from "@/lib/labels";

export type PendingKind =
  | "TAREA"
  | "ACTIVIDAD_OBRA"
  | "INCIDENCIA"
  | "GARANTIA"
  | "REVISION"
  | "MENCION";

export type PendingGroup =
  | "VENCIDO"
  | "HOY"
  | "PROXIMOS_7"
  | "SIN_FECHA"
  | "EN_ESPERA"
  | "PENDIENTES_REVISION"
  | "COMPLETADOS_RECIENTE";

export interface PendingItem {
  id: string;
  kind: PendingKind;
  title: string;
  subtitle?: string | null;
  projectId: string | null;
  projectName: string | null;
  priority: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  dueDate: Date | null;
  statusLabel: string;
  responsibleName: string | null;
  nextAction: string | null;
  href: string;
  updatedAt: Date;
  done: boolean;
  group: PendingGroup;
}

const RECENT_DONE_DAYS = 5;

function isRecentlyDone(date: Date | null | undefined) {
  if (!date) return false;
  const diffMs = Date.now() - new Date(date).getTime();
  return diffMs >= 0 && diffMs <= RECENT_DONE_DAYS * 24 * 60 * 60 * 1000;
}

function groupFor(opts: {
  done: boolean;
  closedAt?: Date | null;
  dueDate: Date | null;
  forceWaiting?: boolean;
  forceReview?: boolean;
}): PendingGroup | null {
  if (opts.forceWaiting) return "EN_ESPERA";
  if (opts.forceReview) return "PENDIENTES_REVISION";
  if (opts.done) {
    return isRecentlyDone(opts.closedAt) ? "COMPLETADOS_RECIENTE" : null;
  }
  const b: DueBucket = dueBucket(opts.dueDate, false);
  if (b === "VENCIDO") return "VENCIDO";
  if (b === "HOY") return "HOY";
  if (b === "PROXIMOS_7") return "PROXIMOS_7";
  if (b === "SIN_FECHA") return "SIN_FECHA";
  return null; // FUTURO beyond 7 days -> not shown as "pendiente" bucket but still returned in "todos"
}

export async function getMyPending(userId: string): Promise<PendingItem[]> {
  const [tasks, activities, incidents, warranties, reviewsAssignedToMe, reviewsIWaitFor, mentions] =
    await Promise.all([
      prisma.task.findMany({
        where: { responsibleId: userId },
        include: { project: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.workActivity.findMany({
        where: { responsibleId: userId },
        include: { project: true },
        orderBy: { plannedEnd: "asc" },
      }),
      prisma.incident.findMany({
        where: { responsibleId: userId },
        include: { project: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.warranty.findMany({
        where: { responsibleId: userId },
        include: { project: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.reviewRequest.findMany({
        where: { assignedToId: userId, status: "PENDIENTE" },
        include: { task: { include: { project: true } }, workActivity: { include: { project: true } }, incident: { include: { project: true } }, project: true, requestedBy: true },
      }),
      prisma.reviewRequest.findMany({
        where: { requestedById: userId, status: "PENDIENTE" },
        include: { task: { include: { project: true } }, workActivity: { include: { project: true } }, incident: { include: { project: true } }, project: true, assignedTo: true },
      }),
      prisma.commentMention.findMany({
        where: { userId, acknowledged: false },
        include: {
          comment: {
            include: {
              task: { include: { project: true } },
              workActivity: { include: { project: true } },
              incident: { include: { project: true } },
              project: true,
              author: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const items: PendingItem[] = [];

  for (const t of tasks) {
    const done = t.status === "TERMINADA" || t.status === "CANCELADA";
    const group = groupFor({ done, closedAt: t.closedAt, dueDate: t.dueDate });
    if (!group) continue;
    items.push({
      id: `task:${t.id}`,
      kind: "TAREA",
      title: t.title,
      subtitle: t.category,
      projectId: t.projectId,
      projectName: t.project?.name ?? null,
      priority: t.priority,
      dueDate: t.dueDate,
      statusLabel: taskStatusLabels[t.status],
      responsibleName: null,
      nextAction: t.status === "BLOQUEADA" ? "Desbloquear y continuar" : null,
      href: `/tareas/${t.id}`,
      updatedAt: t.updatedAt,
      done,
      group,
    });
  }

  for (const a of activities) {
    const done = a.status === "TERMINADA";
    const group = groupFor({ done, closedAt: a.actualEnd, dueDate: a.plannedEnd });
    if (!group) continue;
    items.push({
      id: `activity:${a.id}`,
      kind: "ACTIVIDAD_OBRA",
      title: a.name,
      subtitle: `${a.stage} · ${a.partida}`,
      projectId: a.projectId,
      projectName: a.project?.name ?? null,
      priority: a.priority,
      dueDate: a.plannedEnd,
      statusLabel: workActivityStatusLabels[a.status],
      responsibleName: null,
      nextAction: a.nextAction,
      href: `/programa-de-obra/${a.id}`,
      updatedAt: a.updatedAt,
      done,
      group,
    });
  }

  for (const i of incidents) {
    const done = i.status === "CERRADA" || i.status === "RESUELTA";
    const group = groupFor({ done, closedAt: i.closedAt, dueDate: i.dueDate });
    if (!group) continue;
    items.push({
      id: `incident:${i.id}`,
      kind: "INCIDENCIA",
      title: `${i.folio} · ${i.description.slice(0, 60)}`,
      subtitle: i.location,
      projectId: i.projectId,
      projectName: i.project?.name ?? null,
      priority: i.priority,
      dueDate: i.dueDate,
      statusLabel: incidentStatusLabels[i.status],
      responsibleName: null,
      nextAction: null,
      href: `/incidencias/${i.id}`,
      updatedAt: i.updatedAt,
      done,
      group,
    });
  }

  for (const w of warranties) {
    const done = w.status === "CERRADA" || w.status === "RECHAZADA";
    const group = groupFor({ done, closedAt: w.closedAt, dueDate: w.dueDate });
    if (!group) continue;
    items.push({
      id: `warranty:${w.id}`,
      kind: "GARANTIA",
      title: `${w.folio} · Unidad ${w.unit}`,
      subtitle: w.description.slice(0, 60),
      projectId: w.projectId,
      projectName: w.project?.name ?? null,
      priority: w.urgency,
      dueDate: w.dueDate,
      statusLabel: warrantyStatusLabels[w.status],
      responsibleName: null,
      nextAction: null,
      href: `/garantias/${w.id}`,
      updatedAt: w.updatedAt,
      done,
      group,
    });
  }

  for (const r of reviewsAssignedToMe) {
    const parent = r.task ?? r.workActivity ?? r.incident;
    const project = r.project ?? parent?.project ?? null;
    items.push({
      id: `review:${r.id}`,
      kind: "REVISION",
      title: `${reviewKindLabels[r.kind]}: ${parent ? ("title" in parent ? parent.title : "name" in parent ? parent.name : "description" in parent ? parent.description.slice(0, 40) : "") : r.reason || "Solicitud"}`,
      subtitle: r.requestedBy ? `Solicitado por ${r.requestedBy.name}` : null,
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      priority: "ALTA",
      dueDate: r.dueDate,
      statusLabel: "Pendiente de tu revisión",
      responsibleName: null,
      nextAction: "Revisar y responder",
      href: r.task ? `/tareas/${r.taskId}` : r.workActivity ? `/programa-de-obra/${r.workActivityId}` : r.incident ? `/incidencias/${r.incidentId}` : "/mi-trabajo",
      updatedAt: r.createdAt,
      done: false,
      group: "PENDIENTES_REVISION",
    });
  }

  for (const r of reviewsIWaitFor) {
    const parent = r.task ?? r.workActivity ?? r.incident;
    const project = r.project ?? parent?.project ?? null;
    items.push({
      id: `waiting:${r.id}`,
      kind: "REVISION",
      title: `${reviewKindLabels[r.kind]}: ${parent ? ("title" in parent ? parent.title : "name" in parent ? parent.name : "description" in parent ? parent.description.slice(0, 40) : "") : r.reason || "Solicitud"}`,
      subtitle: r.assignedTo ? `Esperando a ${r.assignedTo.name}` : "Esperando respuesta",
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      priority: "MEDIA",
      dueDate: r.dueDate,
      statusLabel: "En espera de otra persona",
      responsibleName: r.assignedTo?.name ?? null,
      nextAction: null,
      href: r.task ? `/tareas/${r.taskId}` : r.workActivity ? `/programa-de-obra/${r.workActivityId}` : r.incident ? `/incidencias/${r.incidentId}` : "/mi-trabajo",
      updatedAt: r.createdAt,
      done: false,
      group: "EN_ESPERA",
    });
  }

  for (const m of mentions) {
    const c = m.comment;
    const parent = c.task ?? c.workActivity ?? c.incident;
    const project = c.project ?? parent?.project ?? null;
    items.push({
      id: `mention:${m.id}`,
      kind: "MENCION",
      title: `${c.author?.name ?? "Alguien"} te mencionó: "${c.body.slice(0, 60)}"`,
      subtitle: null,
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      priority: "MEDIA",
      dueDate: null,
      statusLabel: "Comentario sin revisar",
      responsibleName: null,
      nextAction: "Leer comentario",
      href: c.task ? `/tareas/${c.taskId}` : c.workActivity ? `/programa-de-obra/${c.workActivityId}` : c.incident ? `/incidencias/${c.incidentId}` : "/mi-trabajo",
      updatedAt: c.createdAt,
      done: false,
      group: "SIN_FECHA",
    });
  }

  return items;
}

export function groupItems(items: PendingItem[]) {
  const groups: Record<PendingGroup, PendingItem[]> = {
    VENCIDO: [],
    HOY: [],
    PROXIMOS_7: [],
    SIN_FECHA: [],
    EN_ESPERA: [],
    PENDIENTES_REVISION: [],
    COMPLETADOS_RECIENTE: [],
  };
  for (const item of items) groups[item.group].push(item);
  return groups;
}

export const groupLabels: Record<PendingGroup, string> = {
  VENCIDO: "Vencidos",
  HOY: "Para hoy",
  PROXIMOS_7: "Próximos 7 días",
  SIN_FECHA: "Sin fecha asignada",
  EN_ESPERA: "En espera de otra persona",
  PENDIENTES_REVISION: "Pendientes de revisión",
  COMPLETADOS_RECIENTE: "Completados recientemente",
};

export interface PersonalIndicators {
  total: number;
  vencidos: number;
  terminadosMes: number;
  cumplimientoATiempoPct: number | null;
  tiempoPromedioResolucionDias: number | null;
  porProyecto: { projectName: string; count: number }[];
  requierenRevision: number;
}

export async function getPersonalIndicators(userId: string): Promise<PersonalIndicators> {
  const [tasks, activities, incidents, warranties] = await Promise.all([
    prisma.task.findMany({ where: { responsibleId: userId }, include: { project: true } }),
    prisma.workActivity.findMany({ where: { responsibleId: userId }, include: { project: true } }),
    prisma.incident.findMany({ where: { responsibleId: userId }, include: { project: true } }),
    prisma.warranty.findMany({ where: { responsibleId: userId }, include: { project: true } }),
  ]);

  const reviewsPending = await prisma.reviewRequest.count({ where: { assignedToId: userId, status: "PENDIENTE" } });

  const allOpen = [
    ...tasks.filter((t) => t.status !== "TERMINADA" && t.status !== "CANCELADA"),
    ...activities.filter((a) => a.status !== "TERMINADA"),
    ...incidents.filter((i) => i.status !== "CERRADA" && i.status !== "RESUELTA"),
    ...warranties.filter((w) => w.status !== "CERRADA" && w.status !== "RECHAZADA"),
  ];

  const now = new Date();
  const vencidos = [
    ...tasks.filter((t) => t.status !== "TERMINADA" && t.status !== "CANCELADA" && t.dueDate && t.dueDate < now),
    ...activities.filter((a) => a.status !== "TERMINADA" && a.plannedEnd < now),
    ...incidents.filter((i) => i.status !== "CERRADA" && i.status !== "RESUELTA" && i.dueDate && i.dueDate < now),
    ...warranties.filter((w) => w.status !== "CERRADA" && w.status !== "RECHAZADA" && w.dueDate && w.dueDate < now),
  ].length;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const doneTasks = tasks.filter((t) => t.status === "TERMINADA" && t.closedAt);
  const doneActivities = activities.filter((a) => a.status === "TERMINADA" && a.actualEnd);
  const doneIncidents = incidents.filter((i) => (i.status === "CERRADA" || i.status === "RESUELTA") && i.closedAt);
  const doneWarranties = warranties.filter((w) => (w.status === "CERRADA") && w.closedAt);

  const terminadosMes = [
    ...doneTasks.filter((t) => t.closedAt! >= monthStart),
    ...doneActivities.filter((a) => a.actualEnd! >= monthStart),
    ...doneIncidents.filter((i) => i.closedAt! >= monthStart),
    ...doneWarranties.filter((w) => w.closedAt! >= monthStart),
  ].length;

  const doneWithDue: { due: Date; closed: Date; createdAt: Date }[] = [
    ...doneTasks.filter((t) => t.dueDate).map((t) => ({ due: t.dueDate!, closed: t.closedAt!, createdAt: t.createdAt })),
    ...doneActivities.map((a) => ({ due: a.plannedEnd, closed: a.actualEnd!, createdAt: a.createdAt })),
    ...doneIncidents.filter((i) => i.dueDate).map((i) => ({ due: i.dueDate!, closed: i.closedAt!, createdAt: i.createdAt })),
    ...doneWarranties.filter((w) => w.dueDate).map((w) => ({ due: w.dueDate!, closed: w.closedAt!, createdAt: w.createdAt })),
  ];

  const onTimeCount = doneWithDue.filter((x) => x.closed <= x.due).length;
  const cumplimientoATiempoPct = doneWithDue.length > 0 ? Math.round((onTimeCount / doneWithDue.length) * 100) : null;

  const allDoneWithCreated = [
    ...doneTasks.map((t) => ({ createdAt: t.createdAt, closed: t.closedAt! })),
    ...doneActivities.map((a) => ({ createdAt: a.createdAt, closed: a.actualEnd! })),
    ...doneIncidents.map((i) => ({ createdAt: i.createdAt, closed: i.closedAt! })),
    ...doneWarranties.map((w) => ({ createdAt: w.createdAt, closed: w.closedAt! })),
  ];
  const tiempoPromedioResolucionDias =
    allDoneWithCreated.length > 0
      ? Math.round(
          (allDoneWithCreated.reduce((acc, x) => acc + (x.closed.getTime() - x.createdAt.getTime()), 0) /
            allDoneWithCreated.length /
            (1000 * 60 * 60 * 24)) *
            10
        ) / 10
      : null;

  const porProyectoMap = new Map<string, number>();
  for (const item of allOpen) {
    const name = item.project?.name ?? "Sin proyecto";
    porProyectoMap.set(name, (porProyectoMap.get(name) ?? 0) + 1);
  }

  return {
    total: allOpen.length,
    vencidos,
    terminadosMes,
    cumplimientoATiempoPct,
    tiempoPromedioResolucionDias,
    porProyecto: Array.from(porProyectoMap.entries()).map(([projectName, count]) => ({ projectName, count })),
    requierenRevision: reviewsPending,
  };
}
