"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useDraggable, useSensor, useSensors } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { PageHeader, Modal, PriorityBadge, EmptyState } from "@/components/ui";
import { useFetch, useCatalogs } from "@/lib/hooks";
import { taskStatusLabels, taskStatusColors } from "@/lib/labels";
import { formatDaysLabel } from "@/lib/dueStatus";

const STATUSES = ["PENDIENTE", "EN_PROCESO", "EN_REVISION", "BLOQUEADA", "TERMINADA", "CANCELADA"];

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string } | null;
  responsible: { id: string; name: string } | null;
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`w-72 flex-shrink-0 rounded-xl2 p-2 transition-colors ${isOver ? "bg-calume-navy/5" : ""}`}>
      {children}
    </div>
  );
}

function DraggableCard({ task }: { task: TaskRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 10 : "auto" }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="mb-2 cursor-grab active:cursor-grabbing">
      <Link href={`/tareas/${task.id}`} onClick={(e) => isDragging && e.preventDefault()} className="block bg-white border border-gray-100 rounded-lg p-3 shadow-card hover:shadow-popover">
        <div className="text-sm font-medium text-gray-900 mb-1.5 line-clamp-2">{task.title}</div>
        <div className="flex items-center justify-between mb-1">
          <PriorityBadge priority={task.priority} />
          <span className="text-[11px] text-gray-500">{formatDaysLabel(task.dueDate)}</span>
        </div>
        {task.project && <div className="text-[11px] text-gray-400 truncate">{task.project.name}</div>}
        {task.responsible && <div className="text-[11px] text-gray-400 truncate">{task.responsible.name}</div>}
      </Link>
    </div>
  );
}

export default function TareasPage() {
  const { data, loading, reload } = useFetch<TaskRow[]>("/api/tasks");
  const { projects, users } = useCatalogs();
  const router = useRouter();
  const [view, setView] = useState<"Lista" | "Kanban">("Kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [projectFilter, setProjectFilter] = useState("TODOS");
  const [override, setOverride] = useState<Record<string, string>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const tasks = (data || []).map((t) => (override[t.id] ? { ...t, status: override[t.id] } : t));
  const filtered = useMemo(() => tasks.filter((t) => projectFilter === "TODOS" || t.project?.id === projectFilter), [tasks, projectFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, TaskRow[]> = {};
    for (const s of STATUSES) map[s] = [];
    for (const t of filtered) (map[t.status] ||= []).push(t);
    return map;
  }, [filtered]);

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as string;
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === newStatus) return;
    setOverride((o) => ({ ...o, [taskId]: newStatus }));
    const res = await fetch(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
    if (!res.ok) {
      toast.error("No se pudo actualizar");
      setOverride((o) => ({ ...o, [taskId]: current.status }));
    } else {
      reload();
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const participantIds = users.filter((u) => formData.getAll("participants").includes(u.id)).map((u) => u.id);
    const res = await fetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        projectId: formData.get("projectId") || null,
        category: formData.get("category"),
        responsibleId: formData.get("responsibleId") || null,
        priority: formData.get("priority"),
        dueDate: formData.get("dueDate") || null,
        participantIds,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      toast.success("Tarea creada");
      setShowCreate(false);
      router.push(`/tareas/${task.id}`);
    } else {
      toast.error("No se pudo crear la tarea");
    }
  }

  return (
    <div>
      <PageHeader
        title="Tareas"
        subtitle="Pendientes operativos del equipo"
        actions={
          <button className="btn-gold" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nueva tarea
          </button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {(["Kanban", "Lista"] as const).map((v) => (
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

        {!loading && view === "Kanban" && (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STATUSES.map((s) => (
                <DroppableColumn key={s} id={s}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: taskStatusColors[s] }} />
                    <h3 className="text-sm font-semibold text-gray-700">{taskStatusLabels[s]}</h3>
                    <span className="text-xs text-gray-400">({grouped[s].length})</span>
                  </div>
                  <div className="bg-gray-100/60 rounded-xl2 p-2 min-h-[120px]">
                    {grouped[s].map((t) => (
                      <DraggableCard key={t.id} task={t} />
                    ))}
                  </div>
                </DroppableColumn>
              ))}
            </div>
          </DndContext>
        )}

        {!loading && view === "Lista" && (
          <div className="card divide-y divide-gray-50">
            {filtered.length === 0 && <EmptyState title="Sin tareas" description="Crea la primera tarea del equipo." />}
            {filtered.map((t) => (
              <Link key={t.id} href={`/tareas/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: taskStatusColors[t.status] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{t.title}</div>
                  <div className="text-xs text-gray-400">
                    {t.project?.name ?? "Sin proyecto"} {t.responsible ? `· ${t.responsible.name}` : ""}
                  </div>
                </div>
                <PriorityBadge priority={t.priority} />
                <span className="text-xs text-gray-500 w-28 text-right">{formatDaysLabel(t.dueDate)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva tarea" wide>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Título</label>
            <input name="title" required className="input" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea name="description" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Proyecto</label>
              <select name="projectId" className="input">
                <option value="">Sin proyecto</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Categoría</label>
              <input name="category" className="input" placeholder="Ej. Administrativo" />
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
              <label className="label">Fecha límite</label>
              <input type="date" name="dueDate" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Participantes</label>
            <div className="flex flex-wrap gap-2">
              {users.map((u: any) => (
                <label key={u.id} className="text-xs flex items-center gap-1.5 border border-gray-200 rounded-full px-2 py-1">
                  <input type="checkbox" name="participants" value={u.id} /> {u.name}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Crear tarea
          </button>
        </form>
      </Modal>
    </div>
  );
}
