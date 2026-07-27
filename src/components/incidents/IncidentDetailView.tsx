"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader, PriorityBadge } from "@/components/ui";
import CommentsThread from "@/components/CommentsThread";
import ReviewRequestPanel from "@/components/ReviewRequestPanel";
import { incidentStatusLabels, incidentCategoryLabels } from "@/lib/labels";
import { formatDaysLabel, toDateInputValue } from "@/lib/dueStatus";

interface Member {
  id: string;
  name: string;
}

interface IncidentData {
  id: string;
  folio: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  location: string | null;
  contractorName: string | null;
  dueDate: string | null;
  solution: string | null;
  estimatedCost: number | null;
  project: Member | null;
  responsible: Member | null;
  reportedBy: Member | null;
}

export default function IncidentDetailView({
  incident,
  users,
  reviewRequests,
  currentUserId,
}: {
  incident: IncidentData;
  users: Member[];
  reviewRequests: any[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(incident.status);
  const [solution, setSolution] = useState(incident.solution ?? "");
  const [cost, setCost] = useState(incident.estimatedCost?.toString() ?? "");

  async function updateField(data: Record<string, any>) {
    const res = await fetch(`/api/incidents/${incident.id}`, { method: "PATCH", body: JSON.stringify(data) });
    if (res.ok) router.refresh();
    else toast.error("No se pudo actualizar");
  }

  return (
    <div>
      <PageHeader
        title={`${incident.folio} · ${incidentCategoryLabels[incident.type]}`}
        subtitle={incident.project?.name ?? "Sin proyecto"}
        onBack={() => router.push("/incidencias")}
        actions={<PriorityBadge priority={incident.priority} />}
      />
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{incident.description}</p>
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
                  {Object.entries(incidentStatusLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label">Responsable</div>
                <select className="input" defaultValue={incident.responsible?.id ?? ""} onChange={(e) => updateField({ responsibleId: e.target.value || null })}>
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
                  defaultValue={toDateInputValue(incident.dueDate)}
                  onChange={(e) => updateField({ dueDate: e.target.value || null })}
                />
                <p className="text-xs text-gray-400 mt-1">{formatDaysLabel(incident.dueDate)}</p>
              </div>
              <div>
                <div className="label">Ubicación</div>
                <div className="text-gray-700 py-2">{incident.location ?? "—"}</div>
              </div>
              <div>
                <div className="label">Contratista</div>
                <div className="text-gray-700 py-2">{incident.contractorName ?? "—"}</div>
              </div>
              <div>
                <div className="label">Reportó</div>
                <div className="text-gray-700 py-2">{incident.reportedBy?.name ?? "—"}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div>
                <div className="label">Solución aplicada</div>
                <textarea className="input" value={solution} onChange={(e) => setSolution(e.target.value)} onBlur={() => updateField({ solution })} />
              </div>
              <div>
                <div className="label">Costo estimado</div>
                <input
                  type="number"
                  className="input"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  onBlur={() => updateField({ estimatedCost: cost || null })}
                />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <CommentsThread entityType="INCIDENT" entityId={incident.id} members={users} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <ReviewRequestPanel
              entityType="INCIDENT"
              entityId={incident.id}
              projectId={incident.project?.id ?? null}
              label={incident.folio}
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
