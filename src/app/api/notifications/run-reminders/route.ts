import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { runReminderCycle } from "@/lib/escalation";

export async function POST() {
  const session = await requireRole("GERENTE_PROYECTOS", "DIRECCION").catch(() => null);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const result = await runReminderCycle();
  return NextResponse.json(result);
}
