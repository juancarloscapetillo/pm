import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const activities = await prisma.workActivity.findMany({
    where: { ...(projectId ? { projectId } : {}) },
    include: { project: { select: { id: true, name: true } }, responsible: { select: { id: true, name: true } } },
    orderBy: { plannedEnd: "asc" },
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const payload = await req.json();
  const { projectId, stage, partida, name, responsibleId, plannedStart, plannedEnd, priority, dependsOnId } = payload;
  if (!projectId || !name?.trim() || !plannedStart || !plannedEnd) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const activity = await prisma.workActivity.create({
    data: {
      projectId,
      stage: stage || "General",
      partida: partida || "General",
      name,
      responsibleId: responsibleId || null,
      plannedStart: new Date(plannedStart),
      plannedEnd: new Date(plannedEnd),
      priority: priority || "MEDIA",
      dependsOnId: dependsOnId || null,
    },
  });

  if (responsibleId && responsibleId !== userId) {
    await notifyUser({
      userId: responsibleId,
      type: "NUEVA_TAREA",
      title: "Nueva actividad de obra asignada",
      message: `${userName} te asignó: "${name}".`,
      priority: priority || "MEDIA",
      projectId,
      entityType: "WORK_ACTIVITY",
      entityId: activity.id,
      entityLabel: name,
      relatedResponsibleName: userName,
    });
  }

  return NextResponse.json(activity);
}
