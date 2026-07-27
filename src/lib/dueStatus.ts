import { differenceInCalendarDays, startOfDay } from "date-fns";

export type DueBucket = "VENCIDO" | "HOY" | "PROXIMOS_7" | "SIN_FECHA" | "FUTURO";

export function daysRemaining(dueDate: Date | string | null | undefined): number | null {
  if (!dueDate) return null;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  return differenceInCalendarDays(due, today);
}

export function dueBucket(dueDate: Date | string | null | undefined, done = false): DueBucket {
  if (done) return "FUTURO";
  const d = daysRemaining(dueDate);
  if (d === null) return "SIN_FECHA";
  if (d < 0) return "VENCIDO";
  if (d === 0) return "HOY";
  if (d <= 7) return "PROXIMOS_7";
  return "FUTURO";
}

/** verde / amarillo / rojo / gris semaphore, matching the CRM's alert pattern */
export type AlertStatus = "green" | "yellow" | "red" | "gray";

export function alertFromDue(dueDate: Date | string | null | undefined, done = false): AlertStatus {
  if (done) return "green";
  const d = daysRemaining(dueDate);
  if (d === null) return "gray";
  if (d < 0) return "red";
  if (d <= 2) return "yellow";
  return "green";
}

export const alertColors: Record<AlertStatus, string> = {
  green: "#3FBE7A",
  yellow: "#F0B429",
  red: "#E15B5B",
  gray: "#9CA3AF",
};

export function formatDaysLabel(dueDate: Date | string | null | undefined): string {
  const d = daysRemaining(dueDate);
  if (d === null) return "Sin fecha";
  if (d === 0) return "Vence hoy";
  if (d < 0) return `${Math.abs(d)} día${Math.abs(d) === 1 ? "" : "s"} de atraso`;
  return `${d} día${d === 1 ? "" : "s"} restante${d === 1 ? "" : "s"}`;
}
