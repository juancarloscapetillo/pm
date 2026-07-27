import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const incidents = await prisma.incident.findMany({
    where: { ...(projectId ? { projectId } : {}) },
    include: { project: { select: { id: true, name: true } }, responsible: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(incidents);
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const payload = await req.json();
  const { projectId, location, type, description, priority, responsibleId, contractorName, dueDate } = payload;
  if (!projectId || !description?.trim()) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const count = await prisma.incident.count();
  const folio = `INC-${String(count + 1).padStart(4, "0")}`;

  const incident = await prisma.incident.create({
    data: {
      folio,
      projectId,
      location: location || null,
      reportedById: userId,
      type: type || "OTRO",
      description,
      priority: priority || "MEDIA",
      responsibleId: responsibleId || null,
      contractorName: contractorName || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  if (responsibleId && responsibleId !== userId) {
    await notifyUser({
      userId: responsibleId,
      type: "NUEVA_INCIDENCIA",
      title: "Nueva incidencia asignada",
      message: `${userName} te asignó ${folio}: "${description.slice(0, 80)}".`,
      priority: priority || "MEDIA",
      projectId,
      entityType: "INCIDENT",
      entityId: incident.id,
      entityLabel: folio,
      relatedResponsibleName: userName,
    });
  }

  return NextResponse.json(incident);
}
