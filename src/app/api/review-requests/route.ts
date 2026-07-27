import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { reviewKindLabels } from "@/lib/labels";

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const payload = await req.json();
  const { entityType, entityId, kind, reason, assignedToId, dueDate, label, projectId } = payload;
  if (!entityType || !entityId || !assignedToId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const fkField =
    entityType === "TASK" ? "taskId" : entityType === "WORK_ACTIVITY" ? "workActivityId" : entityType === "INCIDENT" ? "incidentId" : "projectId";

  const review = await prisma.reviewRequest.create({
    data: {
      entityType,
      [fkField]: entityId,
      projectId: projectId ?? null,
      kind: kind ?? "REVISION",
      reason: reason ?? null,
      requestedById: userId,
      assignedToId,
      dueDate: dueDate ? new Date(dueDate) : null,
    } as any,
  });

  await notifyUser({
    userId: assignedToId,
    type: "SOLICITUD_REVISION",
    title: `Se solicita tu ${(reviewKindLabels[kind ?? "REVISION"] ?? "revisión").toLowerCase()}`,
    message: `${userName} solicita que revises/autorices "${label ?? ""}".`,
    priority: "ALTA",
    projectId: projectId ?? null,
    entityType,
    entityId,
    entityLabel: label ?? null,
    relatedResponsibleName: userName,
  });

  return NextResponse.json(review);
}
