import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const review = await prisma.reviewRequest.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (review.assignedToId !== userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { status, comment } = await req.json();
  if (status !== "APROBADA" && status !== "RECHAZADA") {
    return NextResponse.json({ error: "Estatus inválido" }, { status: 400 });
  }

  const updated = await prisma.reviewRequest.update({
    where: { id: params.id },
    data: { status, resolvedAt: new Date() },
  });

  if (review.requestedById) {
    await notifyUser({
      userId: review.requestedById,
      type: status === "RECHAZADA" ? "RECHAZO" : "CAMBIO_ESTATUS",
      title: status === "RECHAZADA" ? "Tu solicitud fue rechazada" : "Tu solicitud fue aprobada",
      message: comment ? `${userName}: "${comment}"` : `${userName} ${status === "RECHAZADA" ? "rechazó" : "aprobó"} tu solicitud.`,
      priority: status === "RECHAZADA" ? "ALTA" : "MEDIA",
      projectId: review.projectId,
      entityType: review.entityType,
      entityId: review.taskId ?? review.workActivityId ?? review.incidentId ?? review.projectId,
      relatedResponsibleName: userName,
    });
  }

  return NextResponse.json(updated);
}
