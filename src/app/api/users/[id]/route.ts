import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireRole("DIRECCION", "GERENTE_PROYECTOS").catch(() => null);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const payload = await req.json();
  const data: any = {};
  if (payload.role !== undefined) data.role = payload.role;
  if (payload.active !== undefined) data.active = payload.active;
  if (payload.managerId !== undefined) data.managerId = payload.managerId || null;
  if (payload.password) data.passwordHash = await bcrypt.hash(payload.password, 10);

  const updated = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id, name: updated.name, role: updated.role, active: updated.active });
}
