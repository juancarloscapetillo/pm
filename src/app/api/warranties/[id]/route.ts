import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const userName = (session.user as any).name as string;

  const existing = await prisma.warranty.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const body = await req.json();
  const data: any = { lastUpdatedAt: new Date() };

  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "CERRADA") data.closedAt = new Date();
    else data.closedAt = null;
  }
  if (body.responsibleId !== undefined) data.responsibleId = body.responsibleId;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.visitDate !== undefined) data.visitDate = body.visitDate ? new Date(body.visitDate) : null;
  if (body.repairCost !== undefined) data.repairCost = body.repairCost ? Number(body.repairCost) : null;
  if (body.clientConfirmed !== undefined) data.clientConfirmed = !!body.clientConfirmed;

  const updated = await prisma.warranty.update({ where: { id: params.id }, data });

  if (body.responsibleId && body.responsibleId !== existing.responsibleId && body.responsibleId !== userId) {
    await notifyUser({
      userId: body.responsibleId,
      type: "NUEVA_GARANTIA",
      title: "Garantía asignada",
      message: `${userName} te asignó ${updated.folio}.`,
      priority: updated.urgency,
      projectId: updated.projectId,
      entityType: "WARRANTY",
      entityId: updated.id,
      entityLabel: updated.folio,
      relatedResponsibleName: userName,
    });
  }

  return NextResponse.json(updated);
}
