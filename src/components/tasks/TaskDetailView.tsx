"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { PageHeader, PriorityBadge } from "@/components/ui";
import CommentsThread from "@/components/CommentsThread";
import ReviewRequestPanel from "@/components/ReviewRequestPanel";
import { taskStatusLabels } from "@/lib/labels";
import { toDateInputValue } from "@/lib/dueStatus";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Member {
  id: string;
  name: string;
}

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  category: string | null;
  completionEvidence: string | null;
  rejectedReason: string | null;
  project: Member | null;
  responsible: Member | null;
  createdBy: Member | null;
  closedBy: Member | null;
  participants: { user: Member }[];
  subtasks: { id: string; title: string; status: string }[];
  dependsOn: { id: string; title: string; status: string } | null;
}

export default function TaskDetailView({
  task,
  users,
  reviewRequests,
  currentUserId,
}: {
  task: TaskData;
  users: Member[];
  reviewRequests: any[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(task.status);
  const [evidence, setEvidence] = useState(task.completionEvidence ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function updateField(data: Record<string, any>) {
    const res = await fetch(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(data) });
    if (res.ok) {
      router.refresh();
    } else {
      toast.error("No se pudo actualizar");
    }
  }

  async function changeStatus(newStatus: string) {
    setStatus(newStatus);
    await updateField({ status: newStatus, completionEvidence: newStatus === "TERMINADA" ? evidence : undefined });
    toast.success("Estatus actualizado");
  }

  async function submitReject() {
    await updateField({ status: "PENDIENTE", rejectedReason: rejectReason });
    setShowReject(false);
    setRejectReason("");
    toast.success("Tarea rechazada, se notificó al responsable");
  }

  return (
    <div>
      <PageHeader
        title={task.title}
        subtitle={task.project ? task.project.name : "Sin proyecto"}
        onBack={() => router.push("/tareas")}
        actions={<PriorityBadge priority={task.priority} />}
      />
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            {task.description && <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{task.description}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="label">Estatus</div>
                <select className="input" value={status} onChange={(e) => changeStatus(e.target.value)}>
                  {Object.entries(taskStatusLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label">Responsable</div>
                <select
                  className="input"
                  defaultValue={task.responsible?.id ?? ""}
                  onChange={(e) => updateField({ responsibleId: e.target.value || null })}
                >
                  <option value="">Sin asignar</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label">Fecha límite</div>
                <input
                  type="date"
                  className="input"
                  defaultValue={toDateInputValue(task.dueDate)}
                  onChange={(e) => updateField({ dueDate: e.target.value || null })}
                />
              </div>
              <div>
                <div className="label">Categoría</div>
                <div className="text-gray-700 py-2">{task.category ?? "—"}</div>
              </div>
              <div>
                <div className="label">Creada por</div>
                <div className="text-gray-700 py-2">{task.createdBy?.name ?? "—"}</div>
              </div>
              {task.dependsOn && (
                <div>
                  <div className="label">Depende de</div>
                  <Link href={`/tareas/${task.dependsOn.id}`} className="text-calume-navy text-sm hover:underline py-2 block">
                    {task.dependsOn.title}
                  </Link>
                </div>
              )}
            </div>

            {task.participants.length > 0 && (
              <div className="mt-3">
                <div className="label">Participantes</div>
                <div className="flex flex-wrap gap-1.5">
                  {task.participants.map((p) => (
                    <span key={p.user.id} className="badge bg-gray-100 text-gray-600">
                      {p.user.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {status === "TERMINADA" && (
              <div className="mt-3">
                <div className="label">Evidencia de terminación</div>
                <textarea
                  className="input"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  onBlur={() => updateField({ completionEvidence: evidence })}
                  placeholder="Describe la evidencia (fotos, documentos, etc.)"
                />
                {task.closedBy && (
                  <p className="text-xs text-gray-400 mt-1">
                    Cerrada por {task.closedBy.name}
                  </p>
                )}
                <button className="btn-danger btn-sm mt-2" onClick={() => setShowReject((s) => !s)}>
                  Rechazar entrega
                </button>
                {showReject && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      className="input"
                      placeholder="Motivo del rechazo"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <button className="btn-danger btn-sm" onClick={submitReject} disabled={!rejectReason.trim()}>
                      Confirmar rechazo
                    </button>
                  </div>
                )}
              </div>
            )}

            {task.rejectedReason && (
              <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                <strong>Rechazada:</strong> {task.rejectedReason}
              </div>
            )}
          </div>

          {task.subtasks.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Subtareas</h3>
              <div className="space-y-1">
                {task.subtasks.map((s) => (
                  <Link key={s.id} href={`/tareas/${s.id}`} className="flex items-center justify-between text-sm hover:bg-gray-50 px-2 py-1.5 rounded-lg">
                    <span>{s.title}</span>
                    <span className="text-xs text-gray-400">{taskStatusLabels[s.status]}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <CommentsThread entityType="TASK" entityId={task.id} members={users} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <ReviewRequestPanel
              entityType="TASK"
              entityId={task.id}
              projectId={task.project?.id ?? null}
              label={task.title}
              members={users.filter((u) => u.id !== currentUserId)}
              currentUserId={currentUserId}
              reviewRequests={reviewRequests}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
