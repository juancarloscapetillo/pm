"use client";

import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { useFetch } from "@/lib/hooks";

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportRow({ title, description, rows, mapRow, filename }: { title: string; description: string; rows: any[]; mapRow: (r: any) => Record<string, any>; filename: string }) {
  return (
    <div className="card p-4 flex items-center justify-between gap-3">
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button className="btn-secondary btn-sm" onClick={() => download(filename, toCsv(rows.map(mapRow)))} disabled={rows.length === 0}>
        <Download size={14} /> Exportar CSV
      </button>
    </div>
  );
}

export default function ReportesPage() {
  const activities = useFetch<any[]>("/api/work-activities");
  const tasks = useFetch<any[]>("/api/tasks");
  const incidents = useFetch<any[]>("/api/incidents");
  const warranties = useFetch<any[]>("/api/warranties");

  const delayedActivities = (activities.data ?? []).filter((a) => a.status === "RETRASADA" || a.status === "BLOQUEADA");

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Exporta datos operativos a CSV (Excel y PDF quedan pendientes para una siguiente fase)" />
      <div className="p-4 sm:p-6 space-y-3 max-w-3xl">
        <ReportRow
          title="Actividades atrasadas / bloqueadas"
          description="Programa de obra con retraso o bloqueo"
          rows={delayedActivities}
          filename="actividades-atrasadas.csv"
          mapRow={(a) => ({ Proyecto: a.project?.name, Actividad: a.name, Etapa: a.stage, Estatus: a.status, Responsable: a.responsible?.name, FechaCompromiso: a.plannedEnd })}
        />
        <ReportRow
          title="Avance de obra (todas las actividades)"
          description="Listado completo del programa de obra con % de avance"
          rows={activities.data ?? []}
          filename="avance-de-obra.csv"
          mapRow={(a) => ({ Proyecto: a.project?.name, Actividad: a.name, Etapa: a.stage, Partida: a.partida, Avance: a.progressPercent, Estatus: a.status, Responsable: a.responsible?.name })}
        />
        <ReportRow
          title="Tareas pendientes"
          description="Tareas del equipo por proyecto y responsable"
          rows={tasks.data ?? []}
          filename="tareas.csv"
          mapRow={(t) => ({ Proyecto: t.project?.name, Tarea: t.title, Estatus: t.status, Prioridad: t.priority, Responsable: t.responsible?.name, FechaLimite: t.dueDate })}
        />
        <ReportRow
          title="Incidencias"
          description="Todas las incidencias de obra registradas"
          rows={incidents.data ?? []}
          filename="incidencias.csv"
          mapRow={(i) => ({ Folio: i.folio, Proyecto: i.project?.name, Tipo: i.type, Estatus: i.status, Prioridad: i.priority, Responsable: i.responsible?.name })}
        />
        <ReportRow
          title="Garantías"
          description="Todas las garantías posventa registradas"
          rows={warranties.data ?? []}
          filename="garantias.csv"
          mapRow={(w) => ({ Folio: w.folio, Proyecto: w.project?.name, Unidad: w.unit, Estatus: w.status, Urgencia: w.urgency, Responsable: w.responsible?.name })}
        />
      </div>
    </div>
  );
}
