import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;

  const notification = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!notification || notification.userId !== userId) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { read: body.read ?? true, readAt: (body.read ?? true) ? new Date() : null },
  });

  return NextResponse.json(updated);
}
