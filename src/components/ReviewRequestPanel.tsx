"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { reviewKindLabels } from "@/lib/labels";

interface Member {
  id: string;
  name: string;
}

interface ReviewRequestData {
  id: string;
  kind: string;
  reason: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
  requestedBy: Member | null;
  assignedTo: Member | null;
}

const STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "#F0B429",
  APROBADA: "#3FBE7A",
  RECHAZADA: "#E15B5B",
};

export default function ReviewRequestPanel({
  entityType,
  entityId,
  projectId,
  label,
  members,
  currentUserId,
  reviewRequests,
}: {
  entityType: "TASK" | "WORK_ACTIVITY" | "INCIDENT";
  entityId: string;
  projectId: string | null;
  label: string;
  members: Member[];
  currentUserId: string;
  reviewRequests: ReviewRequestData[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState("REVISION");
  const [assignedToId, setAssignedToId] = useState(members[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function createRequest() {
    if (!assignedToId) return;
    setSubmitting(true);
    const res = await fetch("/api/review-requests", {
      method: "POST",
      body: JSON.stringify({ entityType, entityId, projectId, kind, reason, assignedToId, label }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Solicitud enviada");
      setShowForm(false);
      setReason("");
      router.refresh();
    } else {
      toast.error("No se pudo enviar la solicitud");
    }
  }

  async function resolve(id: string, status: "APROBADA" | "RECHAZADA") {
    const res = await fetch(`/api/review-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (res.ok) {
      toast.success(status === "APROBADA" ? "Aprobada" : "Rechazada");
      router.refresh();
    } else {
      toast.error("No se pudo actualizar");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-900">Revisión y autorización</h3>
        <button className="btn-secondary btn-sm" onClick={() => setShowForm((s) => !s)}>
          Solicitar
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(reviewKindLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className="input" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <textarea className="input" placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn-primary btn-sm" onClick={createRequest} disabled={submitting}>
            Enviar solicitud
          </button>
        </div>
      )}

      <div className="space-y-2">
        {reviewRequests.length === 0 && <p className="text-sm text-gray-400">Sin solicitudes de revisión.</p>}
        {reviewRequests.map((r) => (
          <div key={r.id} className="border border-gray-100 rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{reviewKindLabels[r.kind]}</span>
              <span className="badge" style={{ backgroundColor: `${STATUS_COLOR[r.status]}1A`, color: STATUS_COLOR[r.status] }}>
                {r.status === "PENDIENTE" ? "Pendiente" : r.status === "APROBADA" ? "Aprobada" : "Rechazada"}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {r.requestedBy?.name} → {r.assignedTo?.name} · {format(new Date(r.createdAt), "d MMM, HH:mm", { locale: es })}
            </div>
            {r.reason && <p className="text-xs text-gray-600 mt-1">{r.reason}</p>}
            {r.status === "PENDIENTE" && r.assignedTo?.id === currentUserId && (
              <div className="flex gap-2 mt-2">
                <button className="btn-primary btn-sm" onClick={() => resolve(r.id, "APROBADA")}>
                  Aprobar
                </button>
                <button className="btn-danger btn-sm" onClick={() => resolve(r.id, "RECHAZADA")}>
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
