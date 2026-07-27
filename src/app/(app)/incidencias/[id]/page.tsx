import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const [incident, users, reviewRequests] = await Promise.all([
    prisma.incident.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.reviewRequest.findMany({
      where: { incidentId: params.id },
      include: { requestedBy: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!incident) notFound();

  return (
    <IncidentDetailView
      incident={incident as any}
      users={users}
      reviewRequests={reviewRequests as any}
      currentUserId={(session.user as any).id}
    />
  );
}
