import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { runReminderCycle } from "../src/lib/escalation";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Sembrando usuarios de demostración...");

  const direccionPass = await bcrypt.hash("Direccion2026!", 10);
  const gerentePass = await bcrypt.hash("Gerente2026!", 10);
  const controlPass = await bcrypt.hash("Control2026!", 10);
  const residentePass = await bcrypt.hash("Residente2026!", 10);
  const garantiasPass = await bcrypt.hash("Garantias2026!", 10);

  const direccion = await prisma.user.upsert({
    where: { email: "direccion@calume.mx" },
    update: {},
    create: { name: "Alejandra Ibarra", email: "direccion@calume.mx", passwordHash: direccionPass, role: "DIRECCION" },
  });

  const gerente = await prisma.user.upsert({
    where: { email: "gerente@calume.mx" },
    update: {},
    create: { name: "Roberto Peón", email: "gerente@calume.mx", passwordHash: gerentePass, role: "GERENTE_PROYECTOS", managerId: direccion.id },
  });

  const controlObra = await prisma.user.upsert({
    where: { email: "controldeobra@calume.mx" },
    update: {},
    create: { name: "Fernanda Uc", email: "controldeobra@calume.mx", passwordHash: controlPass, role: "CONTROL_OBRA", managerId: gerente.id },
  });

  const residente1 = await prisma.user.upsert({
    where: { email: "residente1@calume.mx" },
    update: {},
    create: { name: "Jorge Chan", email: "residente1@calume.mx", passwordHash: residentePass, role: "RESIDENTE", managerId: gerente.id },
  });

  const residente2 = await prisma.user.upsert({
    where: { email: "residente2@calume.mx" },
    update: {},
    create: { name: "Mariana Dzul", email: "residente2@calume.mx", passwordHash: residentePass, role: "RESIDENTE", managerId: gerente.id },
  });

  const garantias = await prisma.user.upsert({
    where: { email: "garantias@calume.mx" },
    update: {},
    create: { name: "Luis Poot", email: "garantias@calume.mx", passwordHash: garantiasPass, role: "GARANTIAS", managerId: gerente.id },
  });

  console.log("Sembrando proyectos...");

  const proyecto1 = await prisma.project.upsert({
    where: { name: "Residencial Xamán" },
    update: {},
    create: {
      name: "Residencial Xamán",
      location: "Mérida, Yucatán",
      type: "Departamentos",
      unitsCount: 84,
      startDate: daysFromNow(-180),
      estimatedEndDate: daysFromNow(200),
      managerId: gerente.id,
      budgetTotal: 65000000,
      status: "EN_CONSTRUCCION",
      progressPlanned: 52,
      progressReal: 45,
      description: "Torre residencial de 6 niveles con amenidades, en etapa de estructura y acabados.",
      isDemo: true,
    },
  });

  const proyecto2 = await prisma.project.upsert({
    where: { name: "Torres Kaanbal" },
    update: {},
    create: {
      name: "Torres Kaanbal",
      location: "Mérida, Yucatán",
      type: "Departamentos",
      unitsCount: 120,
      startDate: daysFromNow(-30),
      estimatedEndDate: daysFromNow(420),
      managerId: gerente.id,
      budgetTotal: 98000000,
      status: "PRECONSTRUCCION",
      progressPlanned: 8,
      progressReal: 5,
      description: "Desarrollo de dos torres, en trámites y cimentación.",
      isDemo: true,
    },
  });

  const proyecto3 = await prisma.project.upsert({
    where: { name: "Privada Itzamná" },
    update: {},
    create: {
      name: "Privada Itzamná",
      location: "Mérida, Yucatán",
      type: "Departamentos",
      unitsCount: 40,
      startDate: daysFromNow(-500),
      estimatedEndDate: daysFromNow(-30),
      managerId: gerente.id,
      budgetTotal: 32000000,
      status: "GARANTIAS",
      progressPlanned: 100,
      progressReal: 100,
      description: "Proyecto entregado, actualmente en etapa de garantías posventa.",
      isDemo: true,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: proyecto1.id, userId: residente1.id, roleLabel: "Residente de obra" },
      { projectId: proyecto1.id, userId: controlObra.id, roleLabel: "Control de obra" },
      { projectId: proyecto2.id, userId: residente2.id, roleLabel: "Residente de obra" },
      { projectId: proyecto3.id, userId: garantias.id, roleLabel: "Garantías" },
    ],
    skipDuplicates: true,
  });

  console.log("Sembrando programa de obra...");

  const cimentacion = await prisma.workActivity.create({
    data: {
      projectId: proyecto1.id,
      stage: "Cimentación",
      partida: "Excavación y zapatas",
      name: "Colado de zapatas nivel -1",
      responsibleId: residente1.id,
      plannedStart: daysFromNow(-60),
      plannedEnd: daysFromNow(-45),
      actualStart: daysFromNow(-60),
      actualEnd: daysFromNow(-44),
      progressPercent: 100,
      priority: "ALTA",
      status: "TERMINADA",
      isDemo: true,
    },
  });

  const estructura = await prisma.workActivity.create({
    data: {
      projectId: proyecto1.id,
      stage: "Estructura",
      partida: "Losas y columnas",
      name: "Colado de losa nivel 3",
      responsibleId: residente1.id,
      dependsOnId: cimentacion.id,
      plannedStart: daysFromNow(-10),
      plannedEnd: daysFromNow(-3),
      progressPercent: 70,
      priority: "CRITICA",
      status: "RETRASADA",
      delayReason: "Retraso en entrega de acero por proveedor.",
      nextAction: "Dar seguimiento a proveedor y reprogramar cuadrilla.",
      isDemo: true,
    },
  });

  await prisma.workActivity.create({
    data: {
      projectId: proyecto1.id,
      stage: "Estructura",
      partida: "Losas y columnas",
      name: "Armado de columnas nivel 4",
      responsibleId: residente1.id,
      dependsOnId: estructura.id,
      plannedStart: daysFromNow(0),
      plannedEnd: daysFromNow(10),
      progressPercent: 0,
      priority: "MEDIA",
      status: "SIN_INICIAR",
      nextAction: "Esperando término de losa nivel 3.",
      isDemo: true,
    },
  });

  await prisma.workActivity.create({
    data: {
      projectId: proyecto1.id,
      stage: "Instalaciones",
      partida: "Hidrosanitarias",
      name: "Instalación hidráulica nivel 2",
      responsibleId: residente1.id,
      plannedStart: daysFromNow(-5),
      plannedEnd: daysFromNow(0),
      progressPercent: 40,
      priority: "ALTA",
      status: "BLOQUEADA",
      delayReason: "Falta de material en almacén.",
      nextAction: "Solicitar compra urgente de tubería.",
      isDemo: true,
    },
  });

  await prisma.workActivity.create({
    data: {
      projectId: proyecto1.id,
      stage: "Acabados",
      partida: "Pisos",
      name: "Colocación de piso departamentos nivel 1",
      responsibleId: controlObra.id,
      plannedStart: daysFromNow(2),
      plannedEnd: daysFromNow(6),
      progressPercent: 0,
      priority: "MEDIA",
      status: "SIN_INICIAR",
      isDemo: true,
    },
  });

  await prisma.workActivity.create({
    data: {
      projectId: proyecto2.id,
      stage: "Preliminares",
      partida: "Trámites",
      name: "Obtención de licencia de construcción",
      responsibleId: residente2.id,
      plannedStart: daysFromNow(-20),
      plannedEnd: daysFromNow(3),
      progressPercent: 80,
      priority: "CRITICA",
      status: "EN_PROCESO",
      nextAction: "Dar seguimiento con el municipio.",
      isDemo: true,
    },
  });

  await prisma.workActivity.create({
    data: {
      projectId: proyecto2.id,
      stage: "Cimentación",
      partida: "Excavación",
      name: "Excavación general del predio",
      responsibleId: residente2.id,
      plannedStart: daysFromNow(5),
      plannedEnd: daysFromNow(20),
      progressPercent: 0,
      priority: "MEDIA",
      status: "SIN_INICIAR",
      isDemo: true,
    },
  });

  console.log("Sembrando tareas...");

  const tareaResponsiva = await prisma.task.create({
    data: {
      title: "Entregar responsiva de seguridad actualizada",
      description: "Actualizar y firmar la responsiva de seguridad en obra del mes en curso.",
      projectId: proyecto1.id,
      category: "Administrativo",
      responsibleId: residente1.id,
      createdById: gerente.id,
      priority: "ALTA",
      dueDate: daysFromNow(-2),
      status: "PENDIENTE",
      isDemo: true,
    },
  });

  await prisma.task.create({
    data: {
      title: "Revisar bitácora de obra semanal",
      projectId: proyecto1.id,
      category: "Control de obra",
      responsibleId: residente1.id,
      createdById: controlObra.id,
      priority: "MEDIA",
      dueDate: daysFromNow(0),
      status: "PENDIENTE",
      isDemo: true,
    },
  });

  await prisma.task.create({
    data: {
      title: "Cotizar cuadrilla adicional para acabados",
      projectId: proyecto1.id,
      category: "Compras",
      responsibleId: residente1.id,
      createdById: gerente.id,
      priority: "MEDIA",
      dueDate: daysFromNow(4),
      status: "EN_PROCESO",
      isDemo: true,
    },
  });

  await prisma.task.create({
    data: {
      title: "Actualizar fotografías de avance para Dirección",
      projectId: proyecto1.id,
      category: "Reportes",
      responsibleId: residente1.id,
      createdById: direccion.id,
      priority: "BAJA",
      status: "PENDIENTE",
      isDemo: true,
    },
  });

  const tareaTerminadaReciente = await prisma.task.create({
    data: {
      title: "Enviar reporte de avance mensual",
      projectId: proyecto1.id,
      category: "Reportes",
      responsibleId: residente1.id,
      createdById: gerente.id,
      priority: "MEDIA",
      dueDate: daysFromNow(-1),
      status: "TERMINADA",
      closedAt: daysFromNow(-1),
      closedById: residente1.id,
      completionEvidence: "Reporte PDF enviado por correo el día de ayer.",
      isDemo: true,
    },
  });

  await prisma.task.create({
    data: {
      title: "Revisar planos actualizados de instalaciones",
      projectId: proyecto2.id,
      category: "Proyecto ejecutivo",
      responsibleId: residente2.id,
      createdById: gerente.id,
      priority: "ALTA",
      dueDate: daysFromNow(1),
      status: "EN_REVISION",
      isDemo: true,
    },
  });

  console.log("Sembrando incidencias...");

  const inc1 = await prisma.incident.create({
    data: {
      folio: "INC-0001",
      projectId: proyecto1.id,
      location: "Torre A, nivel 3",
      reportedById: controlObra.id,
      type: "MATERIALES",
      description: "Falta de acero de refuerzo 3/8 para continuar losa nivel 3.",
      priority: "CRITICA",
      responsibleId: residente1.id,
      contractorName: "Aceros del Mayab",
      dueDate: daysFromNow(-1),
      status: "ABIERTA",
      isDemo: true,
    },
  });

  await prisma.incident.create({
    data: {
      folio: "INC-0002",
      projectId: proyecto1.id,
      location: "Acceso de obra",
      reportedById: residente1.id,
      type: "SEGURIDAD",
      description: "Falta señalización de seguridad en zona de excavación.",
      priority: "ALTA",
      responsibleId: controlObra.id,
      dueDate: daysFromNow(2),
      status: "ASIGNADA",
      isDemo: true,
    },
  });

  await prisma.incident.create({
    data: {
      folio: "INC-0003",
      projectId: proyecto2.id,
      type: "PROYECTO_EJECUTIVO",
      description: "Inconsistencia entre plano estructural y arquitectónico en fachada norte.",
      priority: "MEDIA",
      responsibleId: residente2.id,
      dueDate: daysFromNow(6),
      status: "EN_REVISION",
      isDemo: true,
    },
  });

  console.log("Sembrando garantías...");

  await prisma.warranty.create({
    data: {
      folio: "GAR-0001",
      projectId: proyecto3.id,
      unit: "302",
      ownerName: "Familia Herrera",
      ownerContact: "999-123-4567",
      deliveryDate: daysFromNow(-200),
      description: "Fuga menor en llave de fregadero de cocina.",
      category: "Plomería",
      urgency: "MEDIA",
      responsibleId: garantias.id,
      contractorName: "Plomería Total",
      dueDate: daysFromNow(-3),
      status: "RECIBIDA",
      isDemo: true,
    },
  });

  await prisma.warranty.create({
    data: {
      folio: "GAR-0002",
      projectId: proyecto3.id,
      unit: "108",
      ownerName: "Carlos Aguilar",
      deliveryDate: daysFromNow(-150),
      description: "Grieta menor en muro de recámara secundaria.",
      category: "Acabados",
      urgency: "BAJA",
      responsibleId: garantias.id,
      dueDate: daysFromNow(5),
      status: "VISITA_PROGRAMADA",
      visitDate: daysFromNow(3),
      isDemo: true,
    },
  });

  await prisma.warranty.create({
    data: {
      folio: "GAR-0003",
      projectId: proyecto3.id,
      unit: "205",
      ownerName: "Sofía Canto",
      deliveryDate: daysFromNow(-100),
      description: "Falla en contacto eléctrico de sala.",
      category: "Eléctrico",
      urgency: "ALTA",
      responsibleId: garantias.id,
      contractorName: "Electricidad Peninsular",
      dueDate: daysFromNow(0),
      status: "EN_REPARACION",
      isDemo: true,
    },
  });

  console.log("Sembrando presupuesto operativo...");

  await prisma.budgetLine.createMany({
    data: [
      { projectId: proyecto1.id, stage: "Cimentación", partida: "Excavación y zapatas", contractor: "Cimentaciones del Sureste", authorizedAmount: 4200000, updatedAmount: 4200000, contractedAmount: 4200000, executedAmount: 4100000, isDemo: true },
      { projectId: proyecto1.id, stage: "Estructura", partida: "Losas y columnas", contractor: "Constructora Peninsular", authorizedAmount: 12500000, updatedAmount: 12500000, contractedAmount: 11800000, executedAmount: 8200000, isDemo: true },
      { projectId: proyecto1.id, stage: "Instalaciones", partida: "Hidrosanitarias", contractor: "Instalaciones Mayab", authorizedAmount: 3800000, updatedAmount: 4100000, contractedAmount: 3600000, executedAmount: 1900000, isDemo: true },
      { projectId: proyecto1.id, stage: "Acabados", partida: "Pisos y azulejos", contractor: "Acabados Xamán", authorizedAmount: 5200000, updatedAmount: 5200000, contractedAmount: 0, executedAmount: 0, isDemo: true },
      { projectId: proyecto2.id, stage: "Preliminares", partida: "Trámites y permisos", contractor: null, authorizedAmount: 900000, updatedAmount: 900000, contractedAmount: 400000, executedAmount: 350000, isDemo: true },
      { projectId: proyecto2.id, stage: "Cimentación", partida: "Excavación", contractor: "Cimentaciones del Sureste", authorizedAmount: 5100000, updatedAmount: 5100000, contractedAmount: 0, executedAmount: 0, isDemo: true },
    ],
  });

  console.log("Sembrando comentarios y menciones...");

  const comentario1 = await prisma.comment.create({
    data: {
      entityType: "WORK_ACTIVITY",
      workActivityId: estructura.id,
      authorId: gerente.id,
      body: "@Jorge Chan necesito que confirmemos con el proveedor la fecha de entrega del acero, esto está afectando el programa general.",
    },
  });
  await prisma.commentMention.create({ data: { commentId: comentario1.id, userId: residente1.id } });

  const comentario2 = await prisma.comment.create({
    data: {
      entityType: "INCIDENT",
      incidentId: inc1.id,
      authorId: controlObra.id,
      body: "@Jorge Chan ya levanté el ticket con el proveedor, favor de confirmar cuando llegue el material.",
    },
  });
  await prisma.commentMention.create({ data: { commentId: comentario2.id, userId: residente1.id } });

  console.log("Sembrando solicitudes de revisión/autorización...");

  await prisma.reviewRequest.create({
    data: {
      entityType: "TASK",
      taskId: tareaResponsiva.id,
      projectId: proyecto1.id,
      kind: "AUTORIZACION",
      reason: "Necesito tu autorización para extender el plazo de la responsiva.",
      requestedById: residente1.id,
      assignedToId: gerente.id,
      status: "PENDIENTE",
    },
  });

  await prisma.reviewRequest.create({
    data: {
      entityType: "TASK",
      taskId: tareaTerminadaReciente.id,
      projectId: proyecto1.id,
      kind: "REVISION",
      reason: "Favor de validar el reporte de avance antes de enviarlo a Dirección.",
      requestedById: gerente.id,
      assignedToId: residente1.id,
      status: "PENDIENTE",
    },
  });

  console.log("Ejecutando ciclo de recordatorios/escalamiento inicial...");
  const result = await runReminderCycle();
  console.log("Resultado:", result);

  console.log("\nUsuarios de prueba:");
  console.log("  Dirección:        direccion@calume.mx / Direccion2026!");
  console.log("  Gerente Proy.:    gerente@calume.mx / Gerente2026!");
  console.log("  Control de obra:  controldeobra@calume.mx / Control2026!");
  console.log("  Residente 1:      residente1@calume.mx / Residente2026!");
  console.log("  Residente 2:      residente2@calume.mx / Residente2026!");
  console.log("  Garantías:        garantias@calume.mx / Garantias2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
