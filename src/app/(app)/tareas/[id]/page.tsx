import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TaskDetailView from "@/components/tasks/TaskDetailView";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const [task, users, reviewRequests] = await Promise.all([
    prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        participants: { include: { user: { select: { id: true, name: true } } } },
        subtasks: { select: { id: true, title: true, status: true } },
        dependsOn: { select: { id: true, title: true, status: true } },
      },
    }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.reviewRequest.findMany({
      where: { taskId: params.id },
      include: { requestedBy: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!task) notFound();

  return (
    <TaskDetailView
      task={task as any}
      users={users}
      reviewRequests={reviewRequests as any}
      currentUserId={(session.user as any).id}
    />
  );
}
