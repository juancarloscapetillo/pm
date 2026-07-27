"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { PageHeader, Modal, PriorityBadge, EmptyState } from "@/components/ui";
import { useFetch, useCatalogs } from "@/lib/hooks";
import { warrantyStatusLabels, warrantyStatusColors } from "@/lib/labels";
import { formatDaysLabel } from "@/lib/dueStatus";

interface WarrantyRow {
  id: string;
  folio: string;
  unit: string;
  ownerName: string;
  description: string;
  status: string;
  urgency: string;
  dueDate: string | null;
  project: { id: string; name: string } | null;
  responsible: { id: string; name: string } | null;
}

export default function GarantiasPage() {
  const { data, loading, reload } = useFetch<WarrantyRow[]>("/api/warranties");
  const { projects, users } = useCatalogs();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [projectFilter, setProjectFilter] = useState("TODOS");

  const warranties = data || [];
  const filtered = useMemo(() => warranties.filter((w) => projectFilter === "TODOS" || w.project?.id === projectFilter), [warranties, projectFilter]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/warranties", {
      method: "POST",
      body: JSON.stringify({
        projectId: fd.get("projectId"),
        unit: fd.get("unit"),
        ownerName: fd.get("ownerName"),
        ownerContact: fd.get("ownerContact"),
        description: fd.get("description"),
        category: fd.get("category"),
        urgency: fd.get("urgency"),
        responsibleId: fd.get("responsibleId") || null,
        contractorName: fd.get("contractorName"),
        dueDate: fd.get("dueDate") || null,
      }),
    });
    if (res.ok) {
      toast.success("Garantía registrada");
      setShowCreate(false);
      reload();
    } else toast.error("No se pudo registrar");
  }

  return (
    <div>
      <PageHeader
        title="Garantías posventa"
        subtitle="Tickets de garantías por unidad"
        actions={
          <button className="btn-gold" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nueva garantía
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
            {filtered.length === 0 && <EmptyState title="Sin garantías" description="Registra la primera garantía posventa." />}
            {filtered.map((w) => (
              <div key={w.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/garantias/${w.id}`)}>
                <span className="badge bg-gray-100 text-gray-600 flex-shrink-0">{w.folio}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">Unidad {w.unit} · {w.ownerName}</div>
                  <div className="text-xs text-gray-400 truncate">{w.description}</div>
                </div>
                <span className="badge" style={{ backgroundColor: `${warrantyStatusColors[w.status]}1A`, color: warrantyStatusColors[w.status] }}>
                  {warrantyStatusLabels[w.status]}
                </span>
                <PriorityBadge priority={w.urgency} />
                <span className="text-xs text-gray-500 w-28 text-right">{formatDaysLabel(w.dueDate)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva garantía" wide>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Unidad / departamento</label>
              <input name="unit" required className="input" />
            </div>
            <div>
              <label className="label">Propietario</label>
              <input name="ownerName" required className="input" />
            </div>
            <div>
              <label className="label">Contacto</label>
              <input name="ownerContact" className="input" placeholder="Teléfono o correo" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <input name="category" className="input" placeholder="Ej. Plomería" />
            </div>
          </div>
          <div>
            <label className="label">Descripción del problema</label>
            <textarea name="description" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Responsable interno</label>
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
              <label className="label">Urgencia</label>
              <select name="urgency" className="input" defaultValue="MEDIA">
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
            <div>
              <label className="label">Contratista responsable</label>
              <input name="contractorName" className="input" />
            </div>
            <div>
              <label className="label">Fecha compromiso de solución</label>
              <input type="date" name="dueDate" className="input" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Registrar garantía
          </button>
        </form>
      </Modal>
    </div>
  );
}
