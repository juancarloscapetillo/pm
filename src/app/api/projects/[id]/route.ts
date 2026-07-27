import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireRole("GERENTE_PROYECTOS", "DIRECCION").catch(() => null);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const payload = await req.json();
  const data: any = {};
  for (const key of [
    "name",
    "location",
    "type",
    "status",
    "description",
  ]) {
    if (payload[key] !== undefined) data[key] = payload[key];
  }
  if (payload.unitsCount !== undefined) data.unitsCount = payload.unitsCount ? Number(payload.unitsCount) : null;
  if (payload.budgetTotal !== undefined) data.budgetTotal = payload.budgetTotal ? Number(payload.budgetTotal) : null;
  if (payload.progressReal !== undefined) data.progressReal = Number(payload.progressReal);
  if (payload.progressPlanned !== undefined) data.progressPlanned = Number(payload.progressPlanned);
  if (payload.managerId !== undefined) data.managerId = payload.managerId || null;
  if (payload.startDate !== undefined) data.startDate = payload.startDate ? new Date(payload.startDate) : null;
  if (payload.estimatedEndDate !== undefined) data.estimatedEndDate = payload.estimatedEndDate ? new Date(payload.estimatedEndDate) : null;

  const updated = await prisma.project.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const project = await prisma.project.findUnique({ where: { id: params.id }, include: { members: { include: { user: true } } } });
  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(project);
}
