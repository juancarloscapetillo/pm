"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, ProgressBar } from "@/components/ui";
import { useFetch } from "@/lib/hooks";
import { projectStatusLabels, projectStatusColors, workActivityStatusLabels, taskStatusLabels, incidentStatusLabels, warrantyStatusLabels } from "@/lib/labels";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectData {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  unitsCount: number | null;
  startDate: string | null;
  estimatedEndDate: string | null;
  status: string;
  progressPlanned: number;
  progressReal: number;
  budgetTotal: number | null;
  description: string | null;
  manager: { id: string; name: string } | null;
  members: { user: { id: string; name: string } }[];
  _count: { workActivities: number; tasks: number; incidents: number; warranties: number };
}

const TABS = ["Programa de obra", "Tareas", "Incidencias", "Garantías"] as const;

export default function ProjectDetailView({ project, role }: { project: ProjectData; role: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Programa de obra");

  const activities = useFetch<any[]>(`/api/work-activities?projectId=${project.id}`);
  const tasks = useFetch<any[]>(`/api/tasks?projectId=${project.id}`);
  const incidents = useFetch<any[]>(`/api/incidents?projectId=${project.id}`);
  const warranties = useFetch<any[]>(`/api/warranties?projectId=${project.id}`);

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.location ?? undefined}
        onBack={() => router.push("/proyectos")}
        actions={
          <span className="badge" style={{ backgroundColor: `${projectStatusColors[project.status]}1A`, color: projectStatusColors[project.status] }}>
            {projectStatusLabels[project.status]}
          </span>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="label">Tipo</div>
            <div>{project.type ?? "—"}</div>
          </div>
          <div>
            <div className="label">Unidades</div>
            <div>{project.unitsCount ?? "—"}</div>
          </div>
          <div>
            <div className="label">Gerente</div>
            <div>{project.manager?.name ?? "—"}</div>
          </div>
          <div>
            <div className="label">Presupuesto</div>
            <div>{project.budgetTotal ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(project.budgetTotal) : "—"}</div>
          </div>
          <div>
            <div className="label">Inicio</div>
            <div>{project.startDate ? format(new Date(project.startDate), "d MMM yyyy", { locale: es }) : "—"}</div>
          </div>
          <div>
            <div className="label">Fin estimado</div>
            <div>{project.estimatedEndDate ? format(new Date(project.estimatedEndDate), "d MMM yyyy", { locale: es }) : "—"}</div>
          </div>
          <div className="col-span-2">
            <div className="label">Avance</div>
            <ProgressBar value={project.progressReal} />
            <div className="text-xs text-gray-400 mt-1">
              Real: {project.progressReal.toFixed(0)}% · Programado: {project.progressPlanned.toFixed(0)}%
            </div>
          </div>
        </div>

        {project.description && <div className="card p-4 text-sm text-gray-700">{project.description}</div>}

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? "tab-active" : "tab-inactive"}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Programa de obra" && (
          <div className="card divide-y divide-gray-50">
            {(activities.data ?? []).map((a: any) => (
              <Link key={a.id} href={`/programa-de-obra/${a.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-900">{a.name}</span>
                <span className="text-xs text-gray-400">{workActivityStatusLabels[a.status]}</span>
              </Link>
            ))}
            {(activities.data ?? []).length === 0 && <div className="p-6 text-sm text-gray-400 text-center">Sin actividades registradas.</div>}
          </div>
        )}
        {tab === "Tareas" && (
          <div className="card divide-y divide-gray-50">
            {(tasks.data ?? []).map((t: any) => (
              <Link key={t.id} href={`/tareas/${t.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-900">{t.title}</span>
                <span className="text-xs text-gray-400">{taskStatusLabels[t.status]}</span>
              </Link>
            ))}
            {(tasks.data ?? []).length === 0 && <div className="p-6 text-sm text-gray-400 text-center">Sin tareas registradas.</div>}
          </div>
        )}
        {tab === "Incidencias" && (
          <div className="card divide-y divide-gray-50">
            {(incidents.data ?? []).map((i: any) => (
              <Link key={i.id} href={`/incidencias/${i.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-900">{i.folio} · {i.description}</span>
                <span className="text-xs text-gray-400">{incidentStatusLabels[i.status]}</span>
              </Link>
            ))}
            {(incidents.data ?? []).length === 0 && <div className="p-6 text-sm text-gray-400 text-center">Sin incidencias registradas.</div>}
          </div>
        )}
        {tab === "Garantías" && (
          <div className="card divide-y divide-gray-50">
            {(warranties.data ?? []).map((w: any) => (
              <Link key={w.id} href={`/garantias/${w.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-900">{w.folio} · Unidad {w.unit}</span>
                <span className="text-xs text-gray-400">{warrantyStatusLabels[w.status]}</span>
              </Link>
            ))}
            {(warranties.data ?? []).length === 0 && <div className="p-6 text-sm text-gray-400 text-center">Sin garantías registradas.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
