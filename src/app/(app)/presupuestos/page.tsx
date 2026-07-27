import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";

function currency(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

export default async function PresupuestosPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const lines = await prisma.budgetLine.findMany({ include: { project: { select: { name: true } } }, orderBy: [{ projectId: "asc" }, { stage: "asc" }] });

  const totals = lines.reduce(
    (acc, l) => {
      acc.authorized += l.authorizedAmount;
      acc.updated += l.updatedAmount;
      acc.contracted += l.contractedAmount;
      acc.executed += l.executedAmount;
      return acc;
    },
    { authorized: 0, updated: 0, contracted: 0, executed: 0 }
  );

  return (
    <div>
      <PageHeader title="Presupuestos" subtitle="Control operativo: autorizado vs. ejecutado por proyecto y partida (solo lectura, con datos de ejemplo)" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4">
            <div className="text-xs text-gray-500">Autorizado</div>
            <div className="text-lg font-semibold text-calume-navy">{currency(totals.authorized)}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-gray-500">Contratado</div>
            <div className="text-lg font-semibold text-calume-goldDark">{currency(totals.contracted)}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-gray-500">Ejecutado</div>
            <div className="text-lg font-semibold text-gray-700">{currency(totals.executed)}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-gray-500">Variación</div>
            <div className={`text-lg font-semibold ${totals.authorized - totals.executed - totals.contracted < 0 ? "text-alert-red" : "text-alert-green"}`}>
              {currency(totals.authorized - totals.executed - totals.contracted)}
            </div>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-4 py-2 font-medium">Proyecto</th>
                <th className="px-4 py-2 font-medium">Etapa</th>
                <th className="px-4 py-2 font-medium">Partida</th>
                <th className="px-4 py-2 font-medium">Contratista</th>
                <th className="px-4 py-2 font-medium text-right">Autorizado</th>
                <th className="px-4 py-2 font-medium text-right">Contratado</th>
                <th className="px-4 py-2 font-medium text-right">Ejecutado</th>
                <th className="px-4 py-2 font-medium text-right">Variación %</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const variancePct = l.authorizedAmount > 0 ? (((l.authorizedAmount - l.executedAmount - l.contractedAmount) / l.authorizedAmount) * 100).toFixed(1) : "—";
                return (
                  <tr key={l.id} className="border-b border-gray-50">
                    <td className="px-4 py-2.5 text-gray-700">{l.project.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{l.stage}</td>
                    <td className="px-4 py-2.5 text-gray-500">{l.partida}{l.subpartida ? ` / ${l.subpartida}` : ""}</td>
                    <td className="px-4 py-2.5 text-gray-500">{l.contractor ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right">{currency(l.authorizedAmount)}</td>
                    <td className="px-4 py-2.5 text-right">{currency(l.contractedAmount)}</td>
                    <td className="px-4 py-2.5 text-right">{currency(l.executedAmount)}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${Number(variancePct) < 0 ? "text-alert-red" : "text-alert-green"}`}>{variancePct}%</td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    Sin líneas de presupuesto registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
