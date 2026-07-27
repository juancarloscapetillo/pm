import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getExecutiveDashboard } from "@/lib/dashboard";
import { PageHeader, StatCard, ProgressBar } from "@/components/ui";
import { projectStatusColors, projectStatusLabels } from "@/lib/labels";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Milestone } from "lucide-react";

const OPERATIONAL_ROLES = ["CONTROL_OBRA", "RESIDENTE", "GARANTIAS"];

function currency(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

export default async function HomePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;

  if (OPERATIONAL_ROLES.includes(role)) redirect("/mi-trabajo");

  const d = await getExecutiveDashboard();

  return (
    <div>
      <PageHeader title="Dashboard ejecutivo" subtitle="Situación general de los proyectos de Calume en menos de dos minutos" />
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Proyectos activos" value={d.activeProjectsCount} />
          <StatCard label="Actividades en tiempo" value={d.activitiesOnTime} accent="green" />
          <StatCard label="Actividades atrasadas" value={d.activitiesDelayed} accent="red" />
          <StatCard label="Actividades críticas" value={d.activitiesCritical} accent="red" />
          <StatCard label="Incidencias críticas" value={d.criticalIncidents} accent="red" />
          <StatCard label="Garantías abiertas" value={d.warrantiesOpen} hint={`${d.warrantiesOverdue} vencidas`} accent="gold" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Avance por proyecto</h3>
            <div className="space-y-4">
              {d.projects.length === 0 && <p className="text-sm text-gray-400">Sin proyectos activos.</p>}
              {d.projects.map((p) => (
                <Link key={p.id} href={`/proyectos/${p.id}`} className="block hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    <span
                      className="badge"
                      style={{ backgroundColor: `${projectStatusColors[p.status]}1A`, color: projectStatusColors[p.status] }}
                    >
                      {projectStatusLabels[p.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={p.progressReal} colorClass="bg-calume-navy" />
                    </div>
                    <span className="text-xs text-gray-500 w-24 text-right">
                      {p.progressReal.toFixed(0)}% real / {p.progressPlanned.toFixed(0)}% plan
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Milestone size={16} /> Próximos hitos de obra
            </h3>
            <div className="space-y-3">
              {d.upcomingMilestones.length === 0 && <p className="text-sm text-gray-400">Sin hitos en los próximos 14 días.</p>}
              {d.upcomingMilestones.map((m) => (
                <Link key={m.id} href={`/programa-de-obra/${m.id}`} className="block hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{m.name}</div>
                  <div className="text-xs text-gray-400">
                    {m.project?.name} · {format(new Date(m.plannedEnd), "d MMM yyyy", { locale: es })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Presupuesto operativo (todos los proyectos)</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-gray-400">Autorizado</div>
                <div className="text-lg font-semibold text-calume-navy">{currency(d.budgetAuthorized)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Ejecutado/comprometido</div>
                <div className="text-lg font-semibold text-calume-goldDark">{currency(d.budgetExecuted)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Variación</div>
                <div className={`text-lg font-semibold ${d.budgetVariance < 0 ? "text-alert-red" : "text-alert-green"}`}>
                  {d.budgetVariancePct !== null ? `${d.budgetVariancePct}%` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Tareas pendientes por responsable</h3>
            <div className="space-y-2">
              {d.tasksByResponsible.length === 0 && <p className="text-sm text-gray-400">Sin tareas pendientes.</p>}
              {d.tasksByResponsible.slice(0, 8).map(([name, count]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 flex-1">{name}</span>
                  <div className="w-32">
                    <ProgressBar value={(count / (d.tasksByResponsible[0][1] || 1)) * 100} colorClass="bg-calume-gold" />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
