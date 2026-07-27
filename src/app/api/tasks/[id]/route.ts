import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const existing = await prisma.task.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const body = await req.json();
  const data: any = { lastUpdatedAt: new Date() };

  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "TERMINADA") {
      data.closedAt = new Date();
      data.closedById = userId;
      data.completionEvidence = body.completionEvidence ?? existing.completionEvidence;
    }
    if (body.status !== "TERMINADA") {
      data.closedAt = null;
      data.closedById = null;
    }
  }
  if (body.responsibleId !== undefined) data.responsibleId = body.responsibleId;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.rejectedReason !== undefined) data.rejectedReason = body.rejectedReason;
  if (body.completionEvidence !== undefined) data.completionEvidence = body.completionEvidence;

  const updated = await prisma.task.update({ where: { id: params.id }, data });

  // Reasignación
  if (body.responsibleId && body.responsibleId !== existing.responsibleId && body.responsibleId !== userId) {
    await notifyUser({
      userId: body.responsibleId,
      type: "NUEVA_TAREA",
      title: "Tarea asignada",
      message: `${userName} te asignó: "${updated.title}".`,
      priority: updated.priority,
      projectId: updated.projectId,
      entityType: "TASK",
      entityId: updated.id,
      entityLabel: updated.title,
      relatedResponsibleName: userName,
    });
  }

  // Cambio de fecha compromiso
  if (body.dueDate !== undefined && existing.dueDate?.toISOString() !== updated.dueDate?.toISOString() && updated.responsibleId) {
    await notifyUser({
      userId: updated.responsibleId,
      type: "CAMBIO_FECHA",
      title: "Fecha compromiso modificada",
      message: `La fecha de "${updated.title}" cambió.`,
      priority: "MEDIA",
      projectId: updated.projectId,
      entityType: "TASK",
      entityId: updated.id,
      entityLabel: updated.title,
      relatedResponsibleName: userName,
    });
  }

  // Cambio de estatus (avisar al creador si no es quien hizo el cambio)
  if (body.status !== undefined && body.status !== existing.status && existing.createdById && existing.createdById !== userId) {
    await notifyUser({
      userId: existing.createdById,
      type: body.status === "BLOQUEADA" ? "BLOQUEADA" : "CAMBIO_ESTATUS",
      title: body.status === "BLOQUEADA" ? "Tarea bloqueada" : "Cambio de estatus",
      message: `"${updated.title}" cambió a estatus ${body.status}.`,
      priority: body.status === "BLOQUEADA" ? "ALTA" : "MEDIA",
      projectId: updated.projectId,
      entityType: "TASK",
      entityId: updated.id,
      entityLabel: updated.title,
      relatedResponsibleName: userName,
    });
  }

  // Rechazo de una tarea marcada como terminada
  if (body.rejectedReason && updated.responsibleId && updated.responsibleId !== userId) {
    await notifyUser({
      userId: updated.responsibleId,
      type: "RECHAZO",
      title: "Se rechazó tu entrega",
      message: `${userName} rechazó "${updated.title}": ${body.rejectedReason}`,
      priority: "ALTA",
      projectId: updated.projectId,
      entityType: "TASK",
      entityId: updated.id,
      entityLabel: updated.title,
      relatedResponsibleName: userName,
    });
  }

  // Dependencias: si esta tarea se termina, avisar a las que dependen de ella
  if (body.status === "TERMINADA" && existing.status !== "TERMINADA") {
    const dependents = await prisma.task.findMany({ where: { dependsOnId: updated.id }, select: { id: true, title: true, responsibleId: true, projectId: true } });
    for (const dep of dependents) {
      if (!dep.responsibleId) continue;
      await notifyUser({
        userId: dep.responsibleId,
        type: "DEPENDENCIA_TERMINADA",
        title: "Una dependencia fue terminada",
        message: `"${updated.title}" (de la cual depende "${dep.title}") fue terminada.`,
        priority: "MEDIA",
        projectId: dep.projectId,
        entityType: "TASK",
        entityId: dep.id,
        entityLabel: dep.title,
      });
    }
  }

  return NextResponse.json(updated);
}
