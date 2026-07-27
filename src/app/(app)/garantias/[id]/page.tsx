import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WarrantyDetailView from "@/components/warranties/WarrantyDetailView";

export default async function WarrantyDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const warranty = await prisma.warranty.findUnique({
    where: { id: params.id },
    include: { project: { select: { id: true, name: true } }, responsible: { select: { id: true, name: true } } },
  });
  const users = await prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });

  if (!warranty) notFound();

  return <WarrantyDetailView warranty={warranty as any} users={users} />;
}
