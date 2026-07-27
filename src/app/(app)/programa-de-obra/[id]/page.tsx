import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ActivityDetailView from "@/components/activities/ActivityDetailView";

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const [activity, users, reviewRequests] = await Promise.all([
    prisma.workActivity.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        dependsOn: { select: { id: true, name: true, status: true } },
        dependents: { select: { id: true, name: true, status: true } },
      },
    }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.reviewRequest.findMany({
      where: { workActivityId: params.id },
      include: { requestedBy: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!activity) notFound();

  return (
    <ActivityDetailView
      activity={activity as any}
      users={users}
      reviewRequests={reviewRequests as any}
      currentUserId={(session.user as any).id}
    />
  );
}
