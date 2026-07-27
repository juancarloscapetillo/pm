import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyMany, notifyUser } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  if (!entityType || !entityId) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  const fkField = fkFieldFor(entityType);
  const comments = await prisma.comment.findMany({
    where: { [fkField]: entityId } as any,
    include: { author: { select: { name: true } }, mentions: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

function fkFieldFor(entityType: string) {
  switch (entityType) {
    case "TASK":
      return "taskId";
    case "WORK_ACTIVITY":
      return "workActivityId";
    case "INCIDENT":
      return "incidentId";
    case "PROJECT":
      return "projectId";
    default:
      throw new Error("Tipo de entidad no soportado para comentarios");
  }
}

async function getResponsibleAndLabel(entityType: string, entityId: string) {
  if (entityType === "TASK") {
    const t = await prisma.task.findUnique({ where: { id: entityId } });
    return { responsibleId: t?.responsibleId ?? null, label: t?.title ?? "", projectId: t?.projectId ?? null };
  }
  if (entityType === "WORK_ACTIVITY") {
    const a = await prisma.workActivity.findUnique({ where: { id: entityId } });
    return { responsibleId: a?.responsibleId ?? null, label: a?.name ?? "", projectId: a?.projectId ?? null };
  }
  if (entityType === "INCIDENT") {
    const i = await prisma.incident.findUnique({ where: { id: entityId } });
    return { responsibleId: i?.responsibleId ?? null, label: i?.folio ?? "", projectId: i?.projectId ?? null };
  }
  if (entityType === "PROJECT") {
    const p = await prisma.project.findUnique({ where: { id: entityId } });
    return { responsibleId: p?.managerId ?? null, label: p?.name ?? "", projectId: p?.id ?? null };
  }
  return { responsibleId: null, label: "", projectId: null };
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const payload = await req.json();
  const { entityType, entityId, body, mentionUserIds = [] } = payload;
  if (!entityType || !entityId || !body?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const fkField = fkFieldFor(entityType);
  const comment = await prisma.comment.create({
    data: {
      entityType,
      [fkField]: entityId,
      authorId: userId,
      body,
    } as any,
    include: { author: { select: { name: true } } },
  });

  if (mentionUserIds.length > 0) {
    await prisma.commentMention.createMany({
      data: mentionUserIds.map((uid: string) => ({ commentId: comment.id, userId: uid })),
    });
  }

  const { responsibleId, label, projectId } = await getResponsibleAndLabel(entityType, entityId);

  await notifyMany(mentionUserIds.filter((id: string) => id !== userId), {
    type: "MENCION",
    title: "Te mencionaron en un comentario",
    message: `${userName}: "${body.slice(0, 120)}"`,
    priority: "MEDIA",
    projectId,
    entityType: entityType as any,
    entityId,
    entityLabel: label,
    relatedResponsibleName: userName,
  });

  if (responsibleId && responsibleId !== userId && !mentionUserIds.includes(responsibleId)) {
    await notifyUser({
      userId: responsibleId,
      type: "ARCHIVO_COMENTARIO",
      title: "Nuevo comentario",
      message: `${userName} comentó en "${label}": "${body.slice(0, 120)}"`,
      priority: "BAJA",
      projectId,
      entityType: entityType as any,
      entityId,
      entityLabel: label,
      relatedResponsibleName: userName,
    });
  }

  return NextResponse.json(comment);
}
