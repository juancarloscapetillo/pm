import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/auth";
import { getEscalationConfig, saveEscalationConfig } from "@/lib/escalation";

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const config = await getEscalationConfig();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const session = await requireRole("GERENTE_PROYECTOS", "DIRECCION").catch(() => null);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const config = await req.json();
  await saveEscalationConfig(config);
  return NextResponse.json({ ok: true });
}
