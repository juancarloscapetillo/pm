import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectDetailView from "@/components/projects/ProjectDetailView";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      manager: { select: { id: true, name: true } },
      members: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { workActivities: true, tasks: true, incidents: true, warranties: true } },
    },
  });

  if (!project) notFound();

  return <ProjectDetailView project={project as any} role={(session.user as any).role} />;
}
