import { prisma } from "@/lib/prisma";

export async function getExecutiveDashboard() {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [projects, activities, openTasks, budgetLines, warranties, criticalIncidents, upcomingMilestones] =
    await Promise.all([
      prisma.project.findMany({
        where: { status: { notIn: ["TERMINADO"] } },
        include: {
          _count: { select: { workActivities: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.workActivity.findMany({
        select: { id: true, status: true, priority: true, plannedEnd: true, actualEnd: true, projectId: true },
      }),
      prisma.task.findMany({
        where: { status: { notIn: ["TERMINADA", "CANCELADA"] } },
        include: { responsible: { select: { name: true } } },
      }),
      prisma.budgetLine.findMany(),
      prisma.warranty.findMany({ where: { status: { notIn: ["CERRADA", "RECHAZADA"] } } }),
      prisma.incident.count({ where: { priority: "CRITICA", status: { notIn: ["CERRADA", "RESUELTA"] } } }),
      prisma.workActivity.findMany({
        where: { status: { not: "TERMINADA" }, plannedEnd: { gte: now, lte: in14Days } },
        include: { project: { select: { name: true } } },
        orderBy: { plannedEnd: "asc" },
        take: 8,
      }),
    ]);

  const activitiesOnTime = activities.filter((a) => a.status !== "RETRASADA" && a.status !== "BLOQUEADA").length;
  const activitiesDelayed = activities.filter((a) => a.status === "RETRASADA").length;
  const activitiesCritical = activities.filter((a) => a.priority === "CRITICA" && a.status !== "TERMINADA").length;

  const tasksByResponsible = new Map<string, number>();
  for (const t of openTasks) {
    const name = t.responsible?.name ?? "Sin asignar";
    tasksByResponsible.set(name, (tasksByResponsible.get(name) ?? 0) + 1);
  }

  const budgetAuthorized = budgetLines.reduce((acc, b) => acc + b.authorizedAmount, 0);
  const budgetExecuted = budgetLines.reduce((acc, b) => acc + b.executedAmount + b.contractedAmount, 0);
  const budgetVariance = budgetAuthorized - budgetExecuted;
  const budgetVariancePct = budgetAuthorized > 0 ? Math.round((budgetVariance / budgetAuthorized) * 1000) / 10 : null;

  const warrantiesOverdue = warranties.filter((w) => w.dueDate && w.dueDate < now).length;

  return {
    projects,
    activeProjectsCount: projects.length,
    activitiesOnTime,
    activitiesDelayed,
    activitiesCritical,
    tasksByResponsible: Array.from(tasksByResponsible.entries()).sort((a, b) => b[1] - a[1]),
    budgetAuthorized,
    budgetExecuted,
    budgetVariance,
    budgetVariancePct,
    warrantiesOpen: warranties.length,
    warrantiesOverdue,
    criticalIncidents,
    upcomingMilestones,
  };
}

export type ExecutiveDashboard = Awaited<ReturnType<typeof getExecutiveDashboard>>;
