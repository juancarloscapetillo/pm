import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMyPending, getPersonalIndicators } from "@/lib/myWork";
import { prisma } from "@/lib/prisma";
import MyWorkView from "@/components/myWork/MyWorkView";

export default async function MiTrabajoPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id;

  const [items, indicators, projects] = await Promise.all([
    getMyPending(userId),
    getPersonalIndicators(userId),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <MyWorkView
      items={items}
      indicators={indicators}
      projects={projects}
      userName={session.user.name as string}
    />
  );
}
