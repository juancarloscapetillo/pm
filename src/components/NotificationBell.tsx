"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { priorityColors, notificationTypeLabels } from "@/lib/labels";
import { formatDistanceToNow } from "date-fns";
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // silencioso: no bloquear la UI si falla el polling
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    window.addEventListener("pm:notifications-changed", load);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pm:notifications-changed", load);
    };
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH", body: JSON.stringify({ read: true }) });
    window.dispatchEvent(new Event("pm:notifications-changed"));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-gray-500 hover:text-calume-navy transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-alert-red text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl2 shadow-popover border border-gray-100 z-30">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Notificaciones</h3>
            <Link href="/notificaciones" onClick={() => setOpen(false)} className="text-xs text-calume-navy hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 && <div className="px-4 py-8 text-center text-sm text-gray-400">Sin notificaciones</div>}
            {items.map((n) => {
              const href = n.entityType && n.entityId ? ENTITY_HREF[n.entityType]?.(n.entityId) : null;
              return (
                <div key={n.id} className={`px-4 py-3 text-sm flex gap-2 ${n.read ? "bg-white" : "bg-calume-navy/5"}`}>
                  <span
                    className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: priorityColors[n.priority] ?? "#9CA3AF" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{n.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{notificationTypeLabels[n.type] ?? n.type}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {href && (
                        <Link
                          href={href}
                          onClick={() => {
                            setOpen(false);
                            if (!n.read) markRead(n.id);
                          }}
                          className="text-xs font-medium text-calume-navy hover:underline"
                        >
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
