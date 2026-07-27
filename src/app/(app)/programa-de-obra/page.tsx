"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { PageHeader, Modal, PriorityBadge, ProgressBar, EmptyState } from "@/components/ui";
import { useFetch, useCatalogs } from "@/lib/hooks";
import { workActivityStatusLabels, workActivityStatusColors } from "@/lib/labels";
import { formatDaysLabel } from "@/lib/dueStatus";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityRow {
  id: string;
  stage: string;
  partida: string;
  name: string;
  status: string;
  priority: string;
  plannedEnd: string;
  progressPercent: number;
  project: { id: string; name: string } | null;
  responsible: { id: string; name: string } | null;
}

const STATUSES = ["SIN_INICIAR", "EN_PROCESO", "EN_REVISION", "BLOQUEADA", "RETRASADA", "TERMINADA"];

export default function ProgramaObraPage() {
  const { data, loading, reload } = useFetch<ActivityRow[]>("/api/work-activities");
  const { projects, users } = useCatalogs();
  const router = useRouter();
  const [view, setView] = useState<"Tabla" | "Kanban">("Tabla");
  const [showCreate, setShowCreate] = useState(false);
  const [projectFilter, setProjectFilter] = useState("TODOS");

  const activities = data || [];
  const filtered = useMemo(
    () => activities.filter((a) => projectFilter === "TODOS" || a.project?.id === projectFilter),
    [activities, projectFilter]
  );

  const grouped = useMemo(() => {
    const map: Record<string, ActivityRow[]> = {};
    for (const s of STATUSES) map[s] = [];
    for (const a of filtered) (map[a.status] ||= []).push(a);
    return map;
  }, [filtered]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/work-activities", {
      method: "POST",
      body: JSON.stringify({
        projectId: fd.get("projectId"),
        stage: fd.get("stage"),
        partida: fd.get("partida"),
        name: fd.get("name"),
        responsibleId: fd.get("responsibleId") || null,
        plannedStart: fd.get("plannedStart"),
        plannedEnd: fd.get("plannedEnd"),
        priority: fd.get("priority"),
      }),
    });
    if (res.ok) {
      toast.success("Actividad creada");
      setShowCreate(false);
      reload();
    } else {
      toast.error("No se pudo crear");
    }
  }

  return (
    <div>
      <PageHeader
        title="Programa de obra"
        subtitle="Actividades, etapas y avance de cada proyecto"
        actions={
          <button className="btn-gold" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nueva actividad
          </button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {(["Tabla", "Kanban"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={view === v ? "tab-active" : "tab-inactive"}>
                {v}
              </button>
            ))}
          </div>
          <select className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="TODOS">Todos los proyectos</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-sm text-gray-400">Cargando...</p>}

        {!loading && view === "Tabla" && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-4 py-2 font-medium">Actividad</th>
                  <th className="px-4 py-2 font-medium">Proyecto</th>
                  <th className="px-4 py-2 font-medium">Etapa / Partida</th>
                  <th className="px-4 py-2 font-medium">Responsable</th>
                  <th className="px-4 py-2 font-medium">Avance</th>
                  <th className="px-4 py-2 font-medium">Estatus</th>
                  <th className="px-4 py-2 font-medium">Fecha compromiso</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/programa-de-obra/${a.id}`)}>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{a.project?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{a.stage} · {a.partida}</td>
                    <td className="px-4 py-2.5 text-gray-500">{a.responsible?.name ?? "Sin asignar"}</td>
                    <td className="px-4 py-2.5 w-32">
                      <ProgressBar value={a.progressPercent} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="badge" style={{ backgroundColor: `${workActivityStatusColors[a.status]}1A`, color: workActivityStatusColors[a.status] }}>
                        {workActivityStatusLabels[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{formatDaysLabel(a.plannedEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState title="Sin actividades" description="Agrega la primera actividad del programa de obra." />}
          </div>
        )}

        {!loading && view === "Kanban" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((s) => (
              <div key={s} className="w-72 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: workActivityStatusColors[s] }} />
                  <h3 className="text-sm font-semibold text-gray-700">{workActivityStatusLabels[s]}</h3>
                  <span className="text-xs text-gray-400">({grouped[s].length})</span>
                </div>
                <div className="space-y-2 bg-gray-100/60 rounded-xl2 p-2 min-h-[120px]">
                  {grouped[s].map((a) => (
                    <Link key={a.id} href={`/programa-de-obra/${a.id}`} className="block bg-white border border-gray-100 rounded-lg p-3 shadow-card hover:shadow-popover">
                      <div className="text-sm font-medium text-gray-900 mb-1.5 line-clamp-2">{a.name}</div>
                      <div className="flex items-center justify-between mb-1">
                        <PriorityBadge priority={a.priority} />
                        <span className="text-[11px] text-gray-500">{formatDaysLabel(a.plannedEnd)}</span>
                      </div>
                      {a.project && <div className="text-[11px] text-gray-400 truncate">{a.project.name}</div>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva actividad de obra" wide>
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
            <label className="label">Actividad</label>
            <input name="name" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Etapa</label>
              <input name="stage" className="input" placeholder="Ej. Cimentación" />
            </div>
            <div>
              <label className="label">Partida</label>
              <input name="partida" className="input" placeholder="Ej. Estructura" />
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
              <label className="label">Inicio programado</label>
              <input type="date" name="plannedStart" required className="input" />
            </div>
            <div>
              <label className="label">Fin programado</label>
              <input type="date" name="plannedEnd" required className="input" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Crear actividad
          </button>
        </form>
      </Modal>
    </div>
  );
}
