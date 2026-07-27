import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const warranties = await prisma.warranty.findMany({
    where: { ...(projectId ? { projectId } : {}) },
    include: { project: { select: { id: true, name: true } }, responsible: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(warranties);
}

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const payload = await req.json();
  const { projectId, unit, ownerName, ownerContact, description, category, urgency, responsibleId, contractorName, dueDate, deliveryDate } = payload;
  if (!projectId || !unit?.trim() || !ownerName?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const count = await prisma.warranty.count();
  const folio = `GAR-${String(count + 1).padStart(4, "0")}`;

  const warranty = await prisma.warranty.create({
    data: {
      folio,
      projectId,
      unit,
      ownerName,
      ownerContact: ownerContact || null,
      description,
      category: category || null,
      urgency: urgency || "MEDIA",
      responsibleId: responsibleId || null,
      contractorName: contractorName || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    },
  });

  if (responsibleId && responsibleId !== userId) {
    await notifyUser({
      userId: responsibleId,
      type: "NUEVA_GARANTIA",
      title: "Nueva garantía asignada",
      message: `${userName} te asignó ${folio} (unidad ${unit}).`,
      priority: urgency || "MEDIA",
      projectId,
      entityType: "WARRANTY",
      entityId: warranty.id,
      entityLabel: folio,
      relatedResponsibleName: userName,
    });
  }

  return NextResponse.json(warranty);
}
