import { prisma } from "@/lib/prisma";
import type { EntityType, NotificationType, Priority } from "@prisma/client";

export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: Priority;
  projectId?: string | null;
  entityType?: EntityType | null;
  entityId?: string | null;
  entityLabel?: string | null;
  relatedResponsibleName?: string | null;
  escalationLevel?: number;
}) {
  if (!params.userId) return null;
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      priority: params.priority ?? "MEDIA",
      projectId: params.projectId ?? null,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      entityLabel: params.entityLabel ?? null,
      relatedResponsibleName: params.relatedResponsibleName ?? null,
      escalationLevel: params.escalationLevel ?? 0,
    },
  });
}

export async function notifyMany(
  userIds: (string | null | undefined)[],
  base: Omit<Parameters<typeof notifyUser>[0], "userId">
) {
  const ids = Array.from(new Set(userIds.filter(Boolean))) as string[];
  await Promise.all(ids.map((userId) => notifyUser({ ...base, userId })));
}
