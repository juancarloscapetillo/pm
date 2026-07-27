import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const tasks = await prisma.task.findMany({
    where: { ...(projectId ? { projectId } : {}) },
    include: { project: { select: { id: true, name: true } }, responsible: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const payload = await req.json();
  const { title, description, projectId, category, responsibleId, priority, dueDate, participantIds = [] } = payload;
  if (!title?.trim()) return NextResponse.json({ error: "Falta el título" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      projectId: projectId || null,
      category: category || null,
      responsibleId: responsibleId || null,
      priority: priority || "MEDIA",
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: userId,
      participants: { create: participantIds.map((uid: string) => ({ userId: uid })) },
    },
  });

  if (responsibleId && responsibleId !== userId) {
    await notifyUser({
      userId: responsibleId,
      type: "NUEVA_TAREA",
      title: "Nueva tarea asignada",
      message: `${userName} te asignó: "${title}".`,
      priority: priority || "MEDIA",
      projectId: projectId || null,
      entityType: "TASK",
      entityId: task.id,
      entityLabel: title,
      relatedResponsibleName: userName,
    });
  }

  return NextResponse.json(task);
}
