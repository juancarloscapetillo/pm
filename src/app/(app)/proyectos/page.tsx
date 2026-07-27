"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Plus, Building2 } from "lucide-react";
import { PageHeader, Modal, ProgressBar, EmptyState } from "@/components/ui";
import { useFetch, useCatalogs } from "@/lib/hooks";
import { projectStatusLabels, projectStatusColors } from "@/lib/labels";

interface ProjectRow {
  id: string;
  name: string;
  location: string | null;
  status: string;
  progressPlanned: number;
  progressReal: number;
  unitsCount: number | null;
}

const CAN_CREATE = ["GERENTE_PROYECTOS", "DIRECCION"];

export default function ProyectosPage() {
  const { data, loading, reload } = useFetch<ProjectRow[]>("/api/projects");
  const { users } = useCatalogs();
  const { data: session } = useSession();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const role = (session?.user as any)?.role;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        location: fd.get("location"),
        type: fd.get("type"),
        unitsCount: fd.get("unitsCount"),
        managerId: fd.get("managerId") || null,
        budgetTotal: fd.get("budgetTotal"),
        status: fd.get("status"),
      }),
    });
    if (res.ok) {
      const p = await res.json();
      toast.success("Proyecto creado");
      setShowCreate(false);
      router.push(`/proyectos/${p.id}`);
    } else {
      toast.error("No se pudo crear el proyecto");
    }
  }

  return (
    <div>
      <PageHeader
        title="Proyectos"
        subtitle="Obras y desarrollos de Calume"
        actions={
          CAN_CREATE.includes(role) && (
            <button className="btn-gold" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Nuevo proyecto
            </button>
          )
        }
      />
      <div className="p-4 sm:p-6">
        {loading && <p className="text-sm text-gray-400">Cargando...</p>}
        {!loading && (data?.length ?? 0) === 0 && <EmptyState icon={<Building2 size={40} />} title="Sin proyectos" description="Crea el primer proyecto para comenzar." />}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((p) => (
            <div key={p.id} className="card p-4 cursor-pointer hover:shadow-popover transition-shadow" onClick={() => router.push(`/proyectos/${p.id}`)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                <span className="badge" style={{ backgroundColor: `${projectStatusColors[p.status]}1A`, color: projectStatusColors[p.status] }}>
                  {projectStatusLabels[p.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{p.location ?? "Sin ubicación"} {p.unitsCount ? `· ${p.unitsCount} unidades` : ""}</p>
              <ProgressBar value={p.progressReal} />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Avance real: {p.progressReal.toFixed(0)}%</span>
                <span>Plan: {p.progressPlanned.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo proyecto" wide>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Nombre</label>
            <input name="name" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ubicación</label>
              <input name="location" className="input" />
            </div>
            <div>
              <label className="label">Tipo de desarrollo</label>
              <input name="type" className="input" placeholder="Ej. Departamentos" />
            </div>
            <div>
              <label className="label">Número de unidades</label>
              <input type="number" name="unitsCount" className="input" />
            </div>
            <div>
              <label className="label">Presupuesto general</label>
              <input type="number" name="budgetTotal" className="input" />
            </div>
            <div>
              <label className="label">Gerente responsable</label>
              <select name="managerId" className="input">
                <option value="">Sin asignar</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estatus</label>
              <select name="status" className="input" defaultValue="PLANEACION">
                {Object.entries(projectStatusLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Crear proyecto
          </button>
        </form>
      </Modal>
    </div>
  );
}
