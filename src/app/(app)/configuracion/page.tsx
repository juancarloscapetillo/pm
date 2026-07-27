"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { PageHeader, Modal } from "@/components/ui";
import { useFetch } from "@/lib/hooks";
import { roleLabels } from "@/lib/labels";
import { Plus, PlayCircle } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  managerId: string | null;
}

const TABS = ["Usuarios", "Escalamiento"] as const;
const ENTITY_LABELS: Record<string, string> = {
  TASK: "Tareas",
  WORK_ACTIVITY: "Programa de obra",
  INCIDENT: "Incidencias",
  WARRANTY: "Garantías",
};

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [tab, setTab] = useState<(typeof TABS)[number]>("Usuarios");

  if (role && role !== "DIRECCION" && role !== "GERENTE_PROYECTOS") {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Usuarios y configuración" subtitle="Administración del equipo y reglas de escalamiento" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? "tab-active" : "tab-inactive"}>
              {t}
            </button>
          ))}
        </div>
        {tab === "Usuarios" && <UsersTab />}
        {tab === "Escalamiento" && <EscalationTab />}
      </div>
    </div>
  );
}

function UsersTab() {
  const { data, loading, reload } = useFetch<UserRow[]>("/api/users");
  const [showCreate, setShowCreate] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        role: fd.get("role"),
        managerId: fd.get("managerId") || null,
      }),
    });
    if (res.ok) {
      toast.success("Usuario creado");
      setShowCreate(false);
      reload();
    } else toast.error("No se pudo crear el usuario");
  }

  async function toggleActive(u: UserRow) {
    const res = await fetch(`/api/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ active: !u.active }) });
    if (res.ok) reload();
  }

  async function changeRole(u: UserRow, newRole: string) {
    const res = await fetch(`/api/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ role: newRole }) });
    if (res.ok) reload();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button className="btn-gold" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>
      {loading && <p className="text-sm text-gray-400">Cargando...</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Correo</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              <th className="px-4 py-2 font-medium">Jefe inmediato</th>
              <th className="px-4 py-2 font-medium">Activo</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{u.email}</td>
                <td className="px-4 py-2.5">
                  <select className="input" value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                    {Object.entries(roleLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5 text-gray-500">{data.find((m) => m.id === u.managerId)?.name ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <button className={u.active ? "btn-secondary btn-sm" : "btn-primary btn-sm"} onClick={() => toggleActive(u)}>
                    {u.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo usuario">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Nombre</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="label">Correo</label>
            <input type="email" name="email" required className="input" />
          </div>
          <div>
            <label className="label">Contraseña temporal</label>
            <input type="password" name="password" required className="input" />
          </div>
          <div>
            <label className="label">Rol</label>
            <select name="role" className="input" defaultValue="RESIDENTE">
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jefe inmediato</label>
            <select name="managerId" className="input">
              <option value="">Sin jefe asignado</option>
              {data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">
            Crear usuario
          </button>
        </form>
      </Modal>
    </div>
  );
}

function EscalationTab() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch("/api/settings/escalation")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings/escalation", { method: "POST", body: JSON.stringify(config) });
    setSaving(false);
    if (res.ok) toast.success("Configuración guardada");
    else toast.error("No se pudo guardar");
  }

  async function runNow() {
    setRunning(true);
    const res = await fetch("/api/notifications/run-reminders", { method: "POST" });
    setRunning(false);
    if (res.ok) {
      const result = await res.json();
      toast.success(`Recordatorios generados: ${result.remindersSent + result.overdueSent + result.escalatedToManager + result.escalatedToDirector + result.staleSent}`);
    } else {
      toast.error("No se pudo ejecutar");
    }
  }

  if (!config) return <p className="text-sm text-gray-400">Cargando...</p>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Tiempos de recordatorio y escalamiento por tipo de actividad</h3>
          <button className="btn-secondary btn-sm" onClick={runNow} disabled={running}>
            <PlayCircle size={14} /> Ejecutar recordatorios ahora
          </button>
        </div>
        <div className="space-y-3">
          {Object.entries(ENTITY_LABELS).map(([key, label]) => (
            <div key={key} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end border-b border-gray-50 pb-3">
              <div className="sm:col-span-4 text-sm font-medium text-gray-700">{label}</div>
              {(["beforeDays", "jefeDays", "gerenteDays", "staleDays"] as const).map((field) => (
                <div key={field}>
                  <label className="label">
                    {field === "beforeDays" && "Días antes de vencer"}
                    {field === "jefeDays" && "Atraso → jefe inmediato"}
                    {field === "gerenteDays" && "Atraso → Gerente Proyectos"}
                    {field === "staleDays" && "Días sin actualización"}
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={config[key][field]}
                    onChange={(e) => setConfig({ ...config, [key]: { ...config[key], [field]: Number(e.target.value) } })}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <button className="btn-primary mt-3" onClick={save} disabled={saving}>
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
