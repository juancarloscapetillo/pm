import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "20");
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return NextResponse.json({ items, unreadCount });
}
