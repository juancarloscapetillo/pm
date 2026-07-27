"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader, PriorityBadge } from "@/components/ui";
import { warrantyStatusLabels } from "@/lib/labels";
import { formatDaysLabel } from "@/lib/dueStatus";

interface Member {
  id: string;
  name: string;
}

interface WarrantyData {
  id: string;
  folio: string;
  unit: string;
  ownerName: string;
  ownerContact: string | null;
  description: string;
  category: string | null;
  status: string;
  urgency: string;
  dueDate: string | null;
  visitDate: string | null;
  repairCost: number | null;
  clientConfirmed: boolean;
  contractorName: string | null;
  project: Member | null;
  responsible: Member | null;
}

export default function WarrantyDetailView({ warranty, users }: { warranty: WarrantyData; users: Member[] }) {
  const router = useRouter();
  const [status, setStatus] = useState(warranty.status);
  const [cost, setCost] = useState(warranty.repairCost?.toString() ?? "");
  const [confirmed, setConfirmed] = useState(warranty.clientConfirmed);

  async function updateField(data: Record<string, any>) {
    const res = await fetch(`/api/warranties/${warranty.id}`, { method: "PATCH", body: JSON.stringify(data) });
    if (res.ok) router.refresh();
    else toast.error("No se pudo actualizar");
  }

  return (
    <div>
      <PageHeader
        title={`${warranty.folio} · Unidad ${warranty.unit}`}
        subtitle={warranty.project?.name ?? "Sin proyecto"}
        onBack={() => router.push("/garantias")}
        actions={<PriorityBadge priority={warranty.urgency} />}
      />
      <div className="p-4 sm:p-6">
        <div className="card p-4 max-w-3xl">
          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{warranty.description}</p>
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
                {Object.entries(warrantyStatusLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="label">Responsable interno</div>
              <select className="input" defaultValue={warranty.responsible?.id ?? ""} onChange={(e) => updateField({ responsibleId: e.target.value || null })}>
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
                defaultValue={warranty.dueDate ? warranty.dueDate.slice(0, 10) : ""}
                onChange={(e) => updateField({ dueDate: e.target.value || null })}
              />
              <p className="text-xs text-gray-400 mt-1">{formatDaysLabel(warranty.dueDate)}</p>
            </div>
            <div>
              <div className="label">Propietario</div>
              <div className="text-gray-700 py-2">{warranty.ownerName}</div>
            </div>
            <div>
              <div className="label">Contacto</div>
              <div className="text-gray-700 py-2">{warranty.ownerContact ?? "—"}</div>
            </div>
            <div>
              <div className="label">Contratista</div>
              <div className="text-gray-700 py-2">{warranty.contractorName ?? "—"}</div>
            </div>
            <div>
              <div className="label">Fecha de visita</div>
              <input
                type="date"
                className="input"
                defaultValue={warranty.visitDate ? warranty.visitDate.slice(0, 10) : ""}
                onChange={(e) => updateField({ visitDate: e.target.value || null })}
              />
            </div>
            <div>
              <div className="label">Costo de reparación</div>
              <input type="number" className="input" value={cost} onChange={(e) => setCost(e.target.value)} onBlur={() => updateField({ repairCost: cost || null })} />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                updateField({ clientConfirmed: e.target.checked });
              }}
            />
            Confirmación del cliente recibida
          </label>
        </div>
      </div>
    </div>
  );
}
