"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  CalendarRange,
  AlertTriangle,
  ShieldCheck,
  Eye,
  AtSign,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StatCard, PriorityBadge } from "@/components/ui";
import { pendingKindLabels } from "@/lib/labels";
import { formatDaysLabel, alertFromDue, alertColors } from "@/lib/dueStatus";
import type { PendingGroup, PendingItem as PendingItemType, PersonalIndicators } from "@/lib/myWork";
import { groupLabels } from "@/lib/myWork";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

type PendingItem = Omit<PendingItemType, "dueDate" | "updatedAt"> & {
  dueDate: string | Date | null;
  updatedAt: string | Date;
};

const KIND_ICON: Record<string, any> = {
  TAREA: ListChecks,
  ACTIVIDAD_OBRA: CalendarRange,
  INCIDENCIA: AlertTriangle,
  GARANTIA: ShieldCheck,
  REVISION: Eye,
  MENCION: AtSign,
};

const GROUP_ORDER: PendingGroup[] = [
  "VENCIDO",
  "HOY",
  "PROXIMOS_7",
  "SIN_FECHA",
  "EN_ESPERA",
  "PENDIENTES_REVISION",
  "COMPLETADOS_RECIENTE",
];

const VIEWS = ["Lista", "Kanban", "Calendario", "Línea de tiempo"] as const;
type View = (typeof VIEWS)[number];

export default function MyWorkView({
  items,
  indicators,
  projects,
  userName,
}: {
  items: PendingItem[];
  indicators: PersonalIndicators;
  projects: { id: string; name: string }[];
  userName: string;
}) {
  const [view, setView] = useState<View>("Lista");
  const [projectFilter, setProjectFilter] = useState("TODOS");
  const [priorityFilter, setPriorityFilter] = useState("TODOS");
  const [kindFilter, setKindFilter] = useState("TODOS");

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (projectFilter !== "TODOS" && i.projectId !== projectFilter) return false;
      if (priorityFilter !== "TODOS" && i.priority !== priorityFilter) return false;
      if (kindFilter !== "TODOS" && i.kind !== kindFilter) return false;
      return true;
    });
  }, [items, projectFilter, priorityFilter, kindFilter]);

  const grouped = useMemo(() => {
    const map: Record<PendingGroup, PendingItem[]> = {
      VENCIDO: [],
      HOY: [],
      PROXIMOS_7: [],
      SIN_FECHA: [],
      EN_ESPERA: [],
      PENDIENTES_REVISION: [],
      COMPLETADOS_RECIENTE: [],
    };
    for (const item of filtered) map[item.group].push(item);
    return map;
  }, [filtered]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6 py-5 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mi trabajo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Todo lo que requiere tu atención, {userName.split(" ")[0]}</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total de pendientes" value={indicators.total} />
          <StatCard label="Vencidos" value={indicators.vencidos} accent="red" />
          <StatCard label="Terminados (mes)" value={indicators.terminadosMes} accent="green" />
          <StatCard
            label="Cumplimiento a tiempo"
            value={indicators.cumplimientoATiempoPct !== null ? `${indicators.cumplimientoATiempoPct}%` : "Sin datos"}
            accent="gold"
          />
          <StatCard
            label="Tiempo prom. de resolución"
            value={indicators.tiempoPromedioResolucionDias !== null ? `${indicators.tiempoPromedioResolucionDias} d` : "Sin datos"}
          />
          <StatCard label="Requieren revisión" value={indicators.requierenRevision} accent="gold" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {VIEWS.map((v) => (
              <button key={v} onClick={() => setView(v)} className={view === v ? "tab-active" : "tab-inactive"}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="TODOS">Todos los proyectos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select className="input w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="TODOS">Toda prioridad</option>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
            <select className="input w-auto" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="TODOS">Todo tipo</option>
              {Object.entries(pendingKindLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {view === "Lista" && <ListView grouped={grouped} />}
        {view === "Kanban" && <KanbanView grouped={grouped} />}
        {view === "Calendario" && <CalendarView items={filtered} />}
        {view === "Línea de tiempo" && <TimelineView items={filtered} />}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: PendingItem }) {
  const Icon = KIND_ICON[item.kind] ?? ListChecks;
  const alert = alertFromDue(item.dueDate, item.done);
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
    >
      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: alertColors[alert] }} />
      <Icon size={16} className="text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
        <div className="text-xs text-gray-400 flex flex-wrap gap-x-2">
          {item.projectName && <span>{item.projectName}</span>}
          <span>{item.statusLabel}</span>
          {item.nextAction && <span>→ {item.nextAction}</span>}
        </div>
      </div>
      <PriorityBadge priority={item.priority} />
      <span className="text-xs text-gray-500 w-28 text-right flex-shrink-0">{formatDaysLabel(item.dueDate)}</span>
    </Link>
  );
}

function ListView({ grouped }: { grouped: Record<PendingGroup, PendingItem[]> }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-4">
      {GROUP_ORDER.map((group) => {
        const list = grouped[group];
        if (list.length === 0) return null;
        const isCollapsed = collapsed[group];
        return (
          <div key={group} className="card overflow-hidden">
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-left"
            >
              {isCollapsed ? <ChevronRightIcon size={16} /> : <ChevronDown size={16} />}
              <span className="font-semibold text-sm text-gray-900">{groupLabels[group]}</span>
              <span className="text-xs text-gray-400">({list.length})</span>
            </button>
            {!isCollapsed && <div>{list.map((item) => <ItemRow key={item.id} item={item} />)}</div>}
          </div>
        );
      })}
      {GROUP_ORDER.every((g) => grouped[g].length === 0) && (
        <div className="card p-16 text-center text-sm text-gray-400">No tienes pendientes con estos filtros. 🎉</div>
      )}
    </div>
  );
}

function KanbanCard({ item }: { item: PendingItem }) {
  const Icon = KIND_ICON[item.kind] ?? ListChecks;
  return (
    <Link href={item.href} className="block bg-white border border-gray-100 rounded-lg p-3 shadow-card hover:shadow-popover transition-shadow">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className="text-gray-400" />
        <span className="text-xs text-gray-400">{pendingKindLabels[item.kind]}</span>
      </div>
      <div className="text-sm font-medium text-gray-900 mb-1.5 line-clamp-2">{item.title}</div>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={item.priority} />
        <span className="text-[11px] text-gray-500">{formatDaysLabel(item.dueDate)}</span>
      </div>
      {item.projectName && <div className="text-[11px] text-gray-400 mt-1.5 truncate">{item.projectName}</div>}
    </Link>
  );
}

function KanbanView({ grouped }: { grouped: Record<PendingGroup, PendingItem[]> }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {GROUP_ORDER.map((group) => (
        <div key={group} className="w-72 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2 px-1">
            <h3 className="text-sm font-semibold text-gray-700">{groupLabels[group]}</h3>
            <span className="text-xs text-gray-400">({grouped[group].length})</span>
          </div>
          <div className="space-y-2 bg-gray-100/60 rounded-xl2 p-2 min-h-[120px]">
            {grouped[group].map((item) => (
              <KanbanCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({ items }: { items: PendingItem[] }) {
  const [month, setMonth] = useState(new Date());
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const withDate = items.filter((i) => i.dueDate);
  const noDate = items.filter((i) => !i.dueDate);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <button className="btn-secondary btn-sm" onClick={() => setMonth((m) => addMonths(m, -1))}>
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-semibold text-gray-900 capitalize">{format(month, "MMMM yyyy", { locale: es })}</h3>
        <button className="btn-secondary btn-sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="text-center text-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dayItems = withDate.filter((i) => isSameDay(new Date(i.dueDate!), day));
          const inMonth = isSameMonth(day, month);
          return (
            <div key={day.toISOString()} className={`min-h-[86px] rounded-lg border p-1 ${inMonth ? "border-gray-100" : "border-gray-50 bg-gray-50/50"}`}>
              <div className={`text-[11px] mb-1 ${inMonth ? "text-gray-500" : "text-gray-300"}`}>{format(day, "d")}</div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block truncate text-[10px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: `${alertColors[alertFromDue(item.dueDate, item.done)]}22` }}
                    title={item.title}
                  >
                    {item.title}
                  </Link>
                ))}
                {dayItems.length > 3 && <div className="text-[10px] text-gray-400 px-1">+{dayItems.length - 3} más</div>}
              </div>
            </div>
          );
        })}
      </div>
      {noDate.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">Sin fecha asignada ({noDate.length})</h4>
          <div className="flex flex-wrap gap-2">
            {noDate.map((item) => (
              <Link key={item.id} href={item.href} className="badge bg-gray-100 text-gray-600 hover:bg-gray-200">
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineView({ items }: { items: PendingItem[] }) {
  const withDate = [...items.filter((i) => i.dueDate)].sort(
    (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
  );
  const noDate = items.filter((i) => !i.dueDate);

  let lastDay = "";
  return (
    <div className="card p-4">
      {withDate.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Sin pendientes con fecha.</p>}
      <div className="relative pl-6 border-l-2 border-gray-100 space-y-4">
        {withDate.map((item) => {
          const dayStr = format(new Date(item.dueDate!), "d 'de' MMMM yyyy", { locale: es });
          const showDay = dayStr !== lastDay;
          lastDay = dayStr;
          const alert = alertFromDue(item.dueDate, item.done);
          return (
            <div key={item.id} className="relative">
              <span
                className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-white"
                style={{ backgroundColor: alertColors[alert] }}
              />
              {showDay && <div className="text-xs font-semibold text-gray-500 mb-1 capitalize">{dayStr}</div>}
              <Link href={item.href} className="block card p-3 hover:shadow-popover transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.title}</span>
                  <PriorityBadge priority={item.priority} />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {item.projectName ? `${item.projectName} · ` : ""}
                  {item.statusLabel}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
      {noDate.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">Sin fecha asignada</h4>
          <div className="space-y-2">
            {noDate.map((item) => (
              <Link key={item.id} href={item.href} className="block card p-3 hover:shadow-popover transition-shadow">
                <span className="text-sm font-medium text-gray-900">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
