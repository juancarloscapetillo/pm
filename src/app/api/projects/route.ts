import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const projects = await prisma.project.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await requireRole("GERENTE_PROYECTOS", "DIRECCION").catch(() => null);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const payload = await req.json();
  const project = await prisma.project.create({
    data: {
      name: payload.name,
      location: payload.location || null,
      type: payload.type || null,
      unitsCount: payload.unitsCount ? Number(payload.unitsCount) : null,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      estimatedEndDate: payload.estimatedEndDate ? new Date(payload.estimatedEndDate) : null,
      managerId: payload.managerId || null,
      budgetTotal: payload.budgetTotal ? Number(payload.budgetTotal) : null,
      status: payload.status || "PLANEACION",
      description: payload.description || null,
    },
  });
  return NextResponse.json(project);
}
