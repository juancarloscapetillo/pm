import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const existing = await prisma.incident.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const body = await req.json();
  const data: any = { lastUpdatedAt: new Date() };

  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "CERRADA" || body.status === "RESUELTA") data.closedAt = new Date();
    else data.closedAt = null;
  }
  if (body.responsibleId !== undefined) data.responsibleId = body.responsibleId;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.solution !== undefined) data.solution = body.solution;
  if (body.estimatedCost !== undefined) data.estimatedCost = body.estimatedCost ? Number(body.estimatedCost) : null;
  if (body.priority !== undefined) data.priority = body.priority;

  const updated = await prisma.incident.update({ where: { id: params.id }, data });

  if (body.responsibleId && body.responsibleId !== existing.responsibleId && body.responsibleId !== userId) {
    await notifyUser({
      userId: body.responsibleId,
      type: "NUEVA_INCIDENCIA",
      title: "Incidencia asignada",
      message: `${userName} te asignó ${updated.folio}.`,
      priority: updated.priority,
      projectId: updated.projectId,
      entityType: "INCIDENT",
      entityId: updated.id,
      entityLabel: updated.folio,
      relatedResponsibleName: userName,
    });
  }

  if (body.dueDate !== undefined && existing.dueDate?.toISOString() !== updated.dueDate?.toISOString() && updated.responsibleId) {
    await notifyUser({
      userId: updated.responsibleId,
      type: "CAMBIO_FECHA",
      title: "Fecha compromiso modificada",
      message: `La fecha compromiso de ${updated.folio} cambió.`,
      priority: "MEDIA",
      projectId: updated.projectId,
      entityType: "INCIDENT",
      entityId: updated.id,
      entityLabel: updated.folio,
      relatedResponsibleName: userName,
    });
  }

  return NextResponse.json(updated);
}
