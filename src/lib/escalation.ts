import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";
import { daysRemaining } from "@/lib/dueStatus";

export interface EntityEscalationConfig {
  beforeDays: number; // recordatorio antes de vencer
  jefeDays: number; // días de atraso para avisar al jefe inmediato
  gerenteDays: number; // días de atraso para avisar al Gerente de Proyectos
  staleDays: number; // días sin actualización para avisar
}

const DEFAULT_CONFIG: Record<"TASK" | "WORK_ACTIVITY" | "INCIDENT" | "WARRANTY", EntityEscalationConfig> = {
  TASK: { beforeDays: 2, jefeDays: 3, gerenteDays: 6, staleDays: 5 },
  WORK_ACTIVITY: { beforeDays: 2, jefeDays: 2, gerenteDays: 5, staleDays: 4 },
  INCIDENT: { beforeDays: 1, jefeDays: 2, gerenteDays: 4, staleDays: 3 },
  WARRANTY: { beforeDays: 1, jefeDays: 3, gerenteDays: 7, staleDays: 5 },
};

export async function getEscalationConfig() {
  const setting = await prisma.setting.findUnique({ where: { key: "escalation_config" } });
  if (!setting) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(setting.value) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveEscalationConfig(config: typeof DEFAULT_CONFIG) {
  await prisma.setting.upsert({
    where: { key: "escalation_config" },
    update: { value: JSON.stringify(config) },
    create: { key: "escalation_config", value: JSON.stringify(config) },
  });
}

const DEDUPE_WINDOW_HOURS = 20;

async function alreadyNotifiedRecently(userId: string, entityId: string, type: string, escalationLevel: number) {
  const since = new Date(Date.now() - DEDUPE_WINDOW_HOURS * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: { userId, entityId, type: type as any, escalationLevel, createdAt: { gte: since } },
  });
  return !!existing;
}

async function findGerenteProyectos(projectManagerId?: string | null) {
  if (projectManagerId) return projectManagerId;
  const gerente = await prisma.user.findFirst({ where: { role: "GERENTE_PROYECTOS", active: true } });
  return gerente?.id ?? null;
}

interface Reportable {
  id: string;
  entityType: "TASK" | "WORK_ACTIVITY" | "INCIDENT" | "WARRANTY";
  title: string;
  dueDate: Date | null;
  lastUpdatedAt: Date;
  responsibleId: string | null;
  responsibleManagerId: string | null;
  projectId: string | null;
  projectName: string | null;
  projectManagerId: string | null;
  priority: string;
  done: boolean;
}

async function collectReportables(): Promise<Reportable[]> {
  const [tasks, activities, incidents, warranties] = await Promise.all([
    prisma.task.findMany({
      where: { status: { notIn: ["TERMINADA", "CANCELADA"] } },
      include: { responsible: true, project: true },
    }),
    prisma.workActivity.findMany({
      where: { status: { not: "TERMINADA" } },
      include: { responsible: true, project: true },
    }),
    prisma.incident.findMany({
      where: { status: { notIn: ["CERRADA", "RESUELTA"] } },
      include: { responsible: true, project: true },
    }),
    prisma.warranty.findMany({
      where: { status: { notIn: ["CERRADA", "RECHAZADA"] } },
      include: { responsible: true, project: true },
    }),
  ]);

  const out: Reportable[] = [];
  for (const t of tasks)
    out.push({
      id: t.id,
      entityType: "TASK",
      title: t.title,
      dueDate: t.dueDate,
      lastUpdatedAt: t.lastUpdatedAt,
      responsibleId: t.responsibleId,
      responsibleManagerId: t.responsible?.managerId ?? null,
      projectId: t.projectId,
      projectName: t.project?.name ?? null,
      projectManagerId: t.project?.managerId ?? null,
      priority: t.priority,
      done: false,
    });
  for (const a of activities)
    out.push({
      id: a.id,
      entityType: "WORK_ACTIVITY",
      title: a.name,
      dueDate: a.plannedEnd,
      lastUpdatedAt: a.lastUpdatedAt,
      responsibleId: a.responsibleId,
      responsibleManagerId: a.responsible?.managerId ?? null,
      projectId: a.projectId,
      projectName: a.project?.name ?? null,
      projectManagerId: a.project?.managerId ?? null,
      priority: a.priority,
      done: false,
    });
  for (const i of incidents)
    out.push({
      id: i.id,
      entityType: "INCIDENT",
      title: `${i.folio}`,
      dueDate: i.dueDate,
      lastUpdatedAt: i.lastUpdatedAt,
      responsibleId: i.responsibleId,
      responsibleManagerId: i.responsible?.managerId ?? null,
      projectId: i.projectId,
      projectName: i.project?.name ?? null,
      projectManagerId: i.project?.managerId ?? null,
      priority: i.priority,
      done: false,
    });
  for (const w of warranties)
    out.push({
      id: w.id,
      entityType: "WARRANTY",
      title: `${w.folio}`,
      dueDate: w.dueDate,
      lastUpdatedAt: w.lastUpdatedAt,
      responsibleId: w.responsibleId,
      responsibleManagerId: w.responsible?.managerId ?? null,
      projectId: w.projectId,
      projectName: w.project?.name ?? null,
      projectManagerId: w.project?.managerId ?? null,
      priority: w.urgency,
      done: false,
    });
  return out;
}

export interface ReminderRunResult {
  scanned: number;
  remindersSent: number;
  overdueSent: number;
  escalatedToManager: number;
  escalatedToDirector: number;
  staleSent: number;
}

export async function runReminderCycle(): Promise<ReminderRunResult> {
  const config = await getEscalationConfig();
  const items = await collectReportables();
  const result: ReminderRunResult = {
    scanned: items.length,
    remindersSent: 0,
    overdueSent: 0,
    escalatedToManager: 0,
    escalatedToDirector: 0,
    staleSent: 0,
  };

  for (const item of items) {
    if (!item.responsibleId) continue;
    const cfg = config[item.entityType];
    const d = daysRemaining(item.dueDate);
    const entityTypeMap = { TASK: "TASK", WORK_ACTIVITY: "WORK_ACTIVITY", INCIDENT: "INCIDENT", WARRANTY: "WARRANTY" } as const;

    // Antes del vencimiento / el día del vencimiento
    if (d !== null && d >= 0 && d <= cfg.beforeDays) {
      const level = d === 0 ? 2 : 1;
      if (!(await alreadyNotifiedRecently(item.responsibleId, item.id, "PROXIMO_VENCER", level))) {
        await notifyUser({
          userId: item.responsibleId,
          type: "PROXIMO_VENCER",
          title: d === 0 ? "Vence hoy" : `Vence en ${d} día${d === 1 ? "" : "s"}`,
          message: `"${item.title}" está próximo a vencer.`,
          priority: item.priority as any,
          projectId: item.projectId,
          entityType: entityTypeMap[item.entityType] as any,
          entityId: item.id,
          entityLabel: item.title,
          escalationLevel: level,
        });
        result.remindersSent++;
      }
    }

    // Vencido: escalamiento progresivo
    if (d !== null && d < 0) {
      const overdueDays = Math.abs(d);
      if (!(await alreadyNotifiedRecently(item.responsibleId, item.id, "VENCIDO", 2))) {
        await notifyUser({
          userId: item.responsibleId,
          type: "VENCIDO",
          title: "Pendiente vencido",
          message: `"${item.title}" lleva ${overdueDays} día${overdueDays === 1 ? "" : "s"} de atraso.`,
          priority: "ALTA",
          projectId: item.projectId,
          entityType: entityTypeMap[item.entityType] as any,
          entityId: item.id,
          entityLabel: item.title,
          escalationLevel: 2,
        });
        result.overdueSent++;
      }

      if (overdueDays >= cfg.jefeDays && item.responsibleManagerId) {
        if (!(await alreadyNotifiedRecently(item.responsibleManagerId, item.id, "ESCALAMIENTO", 3))) {
          await notifyUser({
            userId: item.responsibleManagerId,
            type: "ESCALAMIENTO",
            title: "Escalamiento: pendiente atrasado de tu equipo",
            message: `"${item.title}" acumula ${overdueDays} día${overdueDays === 1 ? "" : "s"} de atraso.`,
            priority: "ALTA",
            projectId: item.projectId,
            entityType: entityTypeMap[item.entityType] as any,
            entityId: item.id,
            entityLabel: item.title,
            escalationLevel: 3,
          });
          result.escalatedToManager++;
        }
      }

      if (overdueDays >= cfg.gerenteDays || (item.priority === "CRITICA" && overdueDays >= cfg.jefeDays)) {
        const gerenteId = await findGerenteProyectos(item.projectManagerId);
        if (gerenteId && !(await alreadyNotifiedRecently(gerenteId, item.id, "ESCALAMIENTO", 4))) {
          await notifyUser({
            userId: gerenteId,
            type: "ESCALAMIENTO",
            title: "Escalamiento crítico: atraso afecta el programa",
            message: `"${item.title}" (${item.projectName ?? "sin proyecto"}) lleva ${overdueDays} días de atraso.`,
            priority: "CRITICA",
            projectId: item.projectId,
            entityType: entityTypeMap[item.entityType] as any,
            entityId: item.id,
            entityLabel: item.title,
            escalationLevel: 4,
          });
          result.escalatedToDirector++;
        }
      }
    }

    // Sin actualización durante varios días
    const staleFor = Math.floor((Date.now() - item.lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (staleFor >= cfg.staleDays) {
      if (!(await alreadyNotifiedRecently(item.responsibleId, item.id, "SIN_ACTUALIZACION", 1))) {
        await notifyUser({
          userId: item.responsibleId,
          type: "SIN_ACTUALIZACION",
          title: "Sin actualización reciente",
          message: `"${item.title}" no se ha actualizado en ${staleFor} días.`,
          priority: "MEDIA",
          projectId: item.projectId,
          entityType: entityTypeMap[item.entityType] as any,
          entityId: item.id,
          entityLabel: item.title,
          escalationLevel: 1,
        });
        result.staleSent++;
      }
    }
  }

  return result;
}
