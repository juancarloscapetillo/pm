"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader, EmptyState, PriorityBadge } from "@/components/ui";
import { notificationTypeLabels } from "@/lib/labels";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  entityLabel: string | null;
  entityId: string | null;
  entityType: string | null;
  relatedResponsibleName: string | null;
  project: { name: string } | null;
  read: boolean;
  createdAt: string;
}

const ENTITY_HREF: Record<string, (id: string) => string> = {
  TASK: (id) => `/tareas/${id}`,
  WORK_ACTIVITY: (id) => `/programa-de-obra/${id}`,
  INCIDENT: (id) => `/incidencias/${id}`,
  WARRANTY: (id) => `/garantias/${id}`,
  PROJECT: (id) => `/proyectos/${id}`,
};

function dayLabel(date: Date) {
  if (isToday(date)) return "Hoy";
  if (isYesterday(date)) return "Ayer";
  return format(date, "d 'de' MMMM yyyy", { locale: es });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [readFilter, setReadFilter] = useState("TODOS");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifications?limit=150");
    const data = await res.json();
    setItems(data.items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}`, { method: "PATCH", body: JSON.stringify({ read: true }) });
    window.dispatchEvent(new Event("pm:notifications-changed"));
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" });
    window.dispatchEvent(new Event("pm:notifications-changed"));
  }

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (typeFilter !== "TODOS" && n.type !== typeFilter) return false;
      if (readFilter === "NO_LEIDAS" && n.read) return false;
      if (readFilter === "LEIDAS" && !n.read) return false;
      return true;
    });
  }, [items, typeFilter, readFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, NotificationItem[]>();
    for (const n of filtered) {
      const key = dayLabel(new Date(n.createdAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Centro de notificaciones"
        subtitle={`${unreadCount} sin leer de ${items.length} en total`}
        actions={
          <button className="btn-secondary" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={16} /> Marcar todas como leídas
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="TODOS">Todos los motivos</option>
            {Object.entries(notificationTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className="input w-auto" value={readFilter} onChange={(e) => setReadFilter(e.target.value)}>
            <option value="TODOS">Todas</option>
            <option value="NO_LEIDAS">Sin leer</option>
            <option value="LEIDAS">Leídas</option>
          </select>
        </div>

        {loading && <p className="text-sm text-gray-400">Cargando...</p>}

        {!loading && filtered.length === 0 && (
          <EmptyState icon={<Bell size={40} />} title="Sin notificaciones" description="Aquí verás avisos de asignaciones, vencimientos, menciones y escalamientos." />
        )}

        {groups.map(([day, dayItems]) => (
          <div key={day}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{day}</h3>
            <div className="card divide-y divide-gray-50">
              {dayItems.map((n) => {
                const href = n.entityType && n.entityId ? ENTITY_HREF[n.entityType]?.(n.entityId) : null;
                return (
                  <div key={n.id} className={`p-4 flex flex-wrap items-start gap-3 ${n.read ? "" : "bg-calume-navy/5"}`}>
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{n.title}</span>
                        <PriorityBadge priority={n.priority} />
                        {!n.read && <span className="h-2 w-2 rounded-full bg-calume-gold" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mt-2">
                        <span>{notificationTypeLabels[n.type] ?? n.type}</span>
                        {n.project && <span>· Proyecto: {n.project.name}</span>}
                        {n.relatedResponsibleName && <span>· Responsable: {n.relatedResponsibleName}</span>}
                        <span>· {format(new Date(n.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {href && (
                        <Link href={href} onClick={() => !n.read && markRead(n.id)} className="btn-secondary btn-sm">
                          Abrir
                        </Link>
                      )}
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="text-xs text-gray-400 hover:text-gray-600">
                          Marcar leída
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
