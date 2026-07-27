import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true, email: true, managerId: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await requireRole("DIRECCION", "GERENTE_PROYECTOS").catch(() => null);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const payload = await req.json();
  if (!payload.name || !payload.email || !payload.password) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase().trim(),
      passwordHash,
      role: payload.role || "RESIDENTE",
      managerId: payload.managerId || null,
    },
  });
  return NextResponse.json({ id: user.id, name: user.name, role: user.role });
}
