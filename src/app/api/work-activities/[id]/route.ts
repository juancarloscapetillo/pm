import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const existing = await prisma.workActivity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const body = await req.json();
  const data: any = { lastUpdatedAt: new Date() };

  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "TERMINADA") data.actualEnd = new Date();
    if (body.status !== "TERMINADA") data.actualEnd = null;
    if (body.status === "EN_PROCESO" && !existing.actualStart) data.actualStart = new Date();
  }
  if (body.responsibleId !== undefined) data.responsibleId = body.responsibleId;
  if (body.plannedEnd !== undefined) data.plannedEnd = new Date(body.plannedEnd);
  if (body.progressPercent !== undefined) data.progressPercent = Number(body.progressPercent);
  if (body.delayReason !== undefined) data.delayReason = body.delayReason;
  if (body.nextAction !== undefined) data.nextAction = body.nextAction;
  if (body.priority !== undefined) data.priority = body.priority;

  const updated = await prisma.workActivity.update({ where: { id: params.id }, data });

  if (body.responsibleId && body.responsibleId !== existing.responsibleId && body.responsibleId !== userId) {
    await notifyUser({
      userId: body.responsibleId,
      type: "NUEVA_TAREA",
      title: "Actividad de obra asignada",
      message: `${userName} te asignó: "${updated.name}".`,
      priority: updated.priority,
      projectId: updated.projectId,
      entityType: "WORK_ACTIVITY",
      entityId: updated.id,
      entityLabel: updated.name,
      relatedResponsibleName: userName,
    });
  }

  if (body.plannedEnd !== undefined && existing.plannedEnd.toISOString() !== updated.plannedEnd.toISOString() && updated.responsibleId) {
    await notifyUser({
      userId: updated.responsibleId,
      type: "CAMBIO_FECHA",
      title: "Fecha compromiso modificada",
      message: `La fecha de "${updated.name}" cambió.`,
      priority: "MEDIA",
      projectId: updated.projectId,
      entityType: "WORK_ACTIVITY",
      entityId: updated.id,
      entityLabel: updated.name,
      relatedResponsibleName: userName,
    });
  }

  if (body.status === "BLOQUEADA" && existing.status !== "BLOQUEADA") {
    const project = await prisma.project.findUnique({ where: { id: updated.projectId } });
    if (project?.managerId && project.managerId !== userId) {
      await notifyUser({
        userId: project.managerId,
        type: "BLOQUEADA",
        title: "Actividad de obra bloqueada",
        message: `"${updated.name}" está bloqueada: ${updated.delayReason ?? "sin motivo especificado"}.`,
        priority: "ALTA",
        projectId: updated.projectId,
        entityType: "WORK_ACTIVITY",
        entityId: updated.id,
        entityLabel: updated.name,
        relatedResponsibleName: userName,
      });
    }
  }

  if (body.status === "TERMINADA" && existing.status !== "TERMINADA") {
    const dependents = await prisma.workActivity.findMany({
      where: { dependsOnId: updated.id },
      select: { id: true, name: true, responsibleId: true, projectId: true },
    });
    for (const dep of dependents) {
      if (!dep.responsibleId) continue;
      await notifyUser({
        userId: dep.responsibleId,
        type: "DEPENDENCIA_TERMINADA",
        title: "Una dependencia fue terminada",
        message: `"${updated.name}" (de la cual depende "${dep.name}") fue terminada.`,
        priority: "MEDIA",
        projectId: dep.projectId,
        entityType: "WORK_ACTIVITY",
        entityId: dep.id,
        entityLabel: dep.name,
      });
    }
  }

  return NextResponse.json(updated);
}
