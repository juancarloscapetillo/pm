"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { PageHeader, PriorityBadge, ProgressBar } from "@/components/ui";
import CommentsThread from "@/components/CommentsThread";
import ReviewRequestPanel from "@/components/ReviewRequestPanel";
import { workActivityStatusLabels } from "@/lib/labels";
import { formatDaysLabel } from "@/lib/dueStatus";

interface Member {
  id: string;
  name: string;
}

interface ActivityData {
  id: string;
  name: string;
  stage: string;
  partida: string;
  status: string;
  priority: string;
  plannedStart: string;
  plannedEnd: string;
  progressPercent: number;
  delayReason: string | null;
  nextAction: string | null;
  project: Member | null;
  responsible: Member | null;
  dependsOn: { id: string; name: string; status: string } | null;
  dependents: { id: string; name: string; status: string }[];
}

export default function ActivityDetailView({
  activity,
  users,
  reviewRequests,
  currentUserId,
}: {
  activity: ActivityData;
  users: Member[];
  reviewRequests: any[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(activity.status);
  const [progress, setProgress] = useState(activity.progressPercent);
  const [nextAction, setNextAction] = useState(activity.nextAction ?? "");
  const [delayReason, setDelayReason] = useState(activity.delayReason ?? "");

  async function updateField(data: Record<string, any>) {
    const res = await fetch(`/api/work-activities/${activity.id}`, { method: "PATCH", body: JSON.stringify(data) });
    if (res.ok) router.refresh();
    else toast.error("No se pudo actualizar");
  }

  return (
    <div>
      <PageHeader
        title={activity.name}
        subtitle={`${activity.project?.name ?? "Sin proyecto"} · ${activity.stage} · ${activity.partida}`}
        onBack={() => router.push("/programa-de-obra")}
        actions={<PriorityBadge priority={activity.priority} />}
      />
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="label">Estatus</div>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    updateField({ status: e.target.value });
                  }}
                >
                  {Object.entries(workActivityStatusLabels).map(([k, v]) => (
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
                  defaultValue={activity.responsible?.id ?? ""}
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
                <div className="label">Fecha compromiso</div>
                <input
                  type="date"
                  className="input"
                  defaultValue={activity.plannedEnd.slice(0, 10)}
                  onChange={(e) => updateField({ plannedEnd: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">{formatDaysLabel(activity.plannedEnd)}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="label">Avance ({progress}%)</div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                onMouseUp={() => updateField({ progressPercent: progress })}
                onTouchEnd={() => updateField({ progressPercent: progress })}
                className="w-full"
              />
              <ProgressBar value={progress} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div>
                <div className="label">Próxima acción</div>
                <textarea
                  className="input"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  onBlur={() => updateField({ nextAction })}
                />
              </div>
              <div>
                <div className="label">Motivo de retraso</div>
                <textarea
                  className="input"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  onBlur={() => updateField({ delayReason })}
                />
              </div>
            </div>

            {activity.dependsOn && (
              <div className="mt-3 text-sm">
                <span className="text-gray-400">Depende de: </span>
                <Link href={`/programa-de-obra/${activity.dependsOn.id}`} className="text-calume-navy hover:underline">
                  {activity.dependsOn.name}
                </Link>
              </div>
            )}
            {activity.dependents.length > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-gray-400">Actividades que dependen de esta: </span>
                {activity.dependents.map((d, i) => (
                  <span key={d.id}>
                    <Link href={`/programa-de-obra/${d.id}`} className="text-calume-navy hover:underline">
                      {d.name}
                    </Link>
                    {i < activity.dependents.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <CommentsThread entityType="WORK_ACTIVITY" entityId={activity.id} members={users} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <ReviewRequestPanel
              entityType="WORK_ACTIVITY"
              entityId={activity.id}
              projectId={activity.project?.id ?? null}
              label={activity.name}
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
