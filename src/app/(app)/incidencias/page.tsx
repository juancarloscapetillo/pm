"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { PageHeader, Modal, PriorityBadge, EmptyState } from "@/components/ui";
import { useFetch, useCatalogs } from "@/lib/hooks";
import { incidentStatusLabels, incidentStatusColors, incidentCategoryLabels } from "@/lib/labels";
import { formatDaysLabel } from "@/lib/dueStatus";

interface IncidentRow {
  id: string;
  folio: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string } | null;
  responsible: { id: string; name: string } | null;
}

export default function IncidenciasPage() {
  const { data, loading, reload } = useFetch<IncidentRow[]>("/api/incidents");
  const { projects, users } = useCatalogs();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [projectFilter, setProjectFilter] = useState("TODOS");

  const incidents = data || [];
  const filtered = useMemo(() => incidents.filter((i) => projectFilter === "TODOS" || i.project?.id === projectFilter), [incidents, projectFilter]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/incidents", {
      method: "POST",
      body: JSON.stringify({
        projectId: fd.get("projectId"),
        location: fd.get("location"),
        type: fd.get("type"),
        description: fd.get("description"),
        priority: fd.get("priority"),
        responsibleId: fd.get("responsibleId") || null,
        contractorName: fd.get("contractorName"),
        dueDate: fd.get("dueDate") || null,
      }),
    });
    if (res.ok) {
      toast.success("Incidencia registrada");
      setShowCreate(false);
      reload();
    } else toast.error("No se pudo registrar");
  }

  return (
    <div>
      <PageHeader
        title="Incidencias"
        subtitle="Tickets de incidencias de obra"
        actions={
          <button className="btn-gold" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nueva incidencia
          </button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <select className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="TODOS">Todos los proyectos</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {loading && <p className="text-sm text-gray-400">Cargando...</p>}
        {!loading && (
          <div className="card divide-y divide-gray-50">
            {filtered.length === 0 && <EmptyState title="Sin incidencias" description="Registra la primera incidencia de obra." />}
            {filtered.map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/incidencias/${i.id}`)}>
                <span className="badge bg-gray-100 text-gray-600 flex-shrink-0">{i.folio}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{i.description}</div>
                  <div className="text-xs text-gray-400">
                    {incidentCategoryLabels[i.type]} · {i.project?.name ?? "—"} {i.responsible ? `· ${i.responsible.name}` : ""}
                  </div>
                </div>
                <span className="badge" style={{ backgroundColor: `${incidentStatusColors[i.status]}1A`, color: incidentStatusColors[i.status] }}>
                  {incidentStatusLabels[i.status]}
                </span>
                <PriorityBadge priority={i.priority} />
                <span className="text-xs text-gray-500 w-28 text-right">{formatDaysLabel(i.dueDate)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva incidencia" wide>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Proyecto</label>
            <select name="projectId" required className="input">
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea name="description" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ubicación</label>
              <input name="location" className="input" placeholder="Ej. Torre B, nivel 3" />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select name="type" className="input" defaultValue="OTRO">
                {Object.entries(incidentCategoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Responsable</label>
              <select name="responsibleId" className="input">
                <option value="">Sin asignar</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select name="priority" className="input" defaultValue="MEDIA">
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
            <div>
              <label className="label">Contratista relacionado</label>
              <input name="contractorName" className="input" />
            </div>
            <div>
              <label className="label">Fecha compromiso</label>
              <input type="date" name="dueDate" className="input" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Registrar incidencia
          </button>
        </form>
      </Modal>
    </div>
  );
}
