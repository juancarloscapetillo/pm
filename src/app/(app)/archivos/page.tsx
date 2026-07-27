import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { entityTypeLabels } from "@/lib/labels";
import { FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function ArchivosPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const attachments = await prisma.attachment.findMany({
    include: {
      project: { select: { name: true } },
      task: { select: { title: true } },
      workActivity: { select: { name: true } },
      incident: { select: { folio: true } },
      warranty: { select: { folio: true } },
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Archivos" subtitle="Evidencias y documentos relacionados a proyectos, tareas, incidencias y garantías (solo lectura en este prototipo)" />
      <div className="p-4 sm:p-6">
        {attachments.length === 0 && (
          <EmptyState
            icon={<FolderOpen size={40} />}
            title="Sin archivos"
            description="La carga de archivos desde la interfaz queda pendiente para una siguiente fase; el modelo de datos ya está preparado para soportarla."
          />
        )}
        <div className="card divide-y divide-gray-50">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium text-gray-900">{a.filename}</div>
                <div className="text-xs text-gray-400">
                  {entityTypeLabels[a.entityType]} · {a.project?.name ?? a.task?.title ?? a.workActivity?.name ?? a.incident?.folio ?? a.warranty?.folio ?? "—"}
                </div>
              </div>
              <div className="text-xs text-gray-400 text-right">
                <div>{a.uploadedBy?.name ?? "—"}</div>
                <div>{format(new Date(a.createdAt), "d MMM yyyy", { locale: es })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
