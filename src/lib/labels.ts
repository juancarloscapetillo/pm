export const roleLabels: Record<string, string> = {
  DIRECCION: "Dirección General",
  GERENTE_PROYECTOS: "Gerente de Proyectos",
  CONTROL_OBRA: "Control de Obra",
  RESIDENTE: "Residente de Obra",
  GARANTIAS: "Garantías",
};

export const projectStatusLabels: Record<string, string> = {
  PLANEACION: "Planeación",
  PRECONSTRUCCION: "Preconstrucción",
  EN_CONSTRUCCION: "En construcción",
  EN_ENTREGA: "En proceso de entrega",
  GARANTIAS: "Garantías",
  TERMINADO: "Terminado",
  PAUSADO: "Pausado",
};

export const projectStatusColors: Record<string, string> = {
  PLANEACION: "#9CA3AF",
  PRECONSTRUCCION: "#5B8DEF",
  EN_CONSTRUCCION: "#F0B429",
  EN_ENTREGA: "#9B6FD9",
  GARANTIAS: "#dd9e22",
  TERMINADO: "#3FBE7A",
  PAUSADO: "#E15B5B",
};

export const priorityLabels: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const priorityColors: Record<string, string> = {
  BAJA: "#5B8DEF",
  MEDIA: "#F0B429",
  ALTA: "#F0834A",
  CRITICA: "#E15B5B",
};

export const taskStatusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  EN_REVISION: "En revisión",
  BLOQUEADA: "Bloqueada",
  TERMINADA: "Terminada",
  CANCELADA: "Cancelada",
};

export const taskStatusColors: Record<string, string> = {
  PENDIENTE: "#9CA3AF",
  EN_PROCESO: "#5B8DEF",
  EN_REVISION: "#9B6FD9",
  BLOQUEADA: "#E15B5B",
  TERMINADA: "#3FBE7A",
  CANCELADA: "#6B7280",
};

export const workActivityStatusLabels: Record<string, string> = {
  SIN_INICIAR: "Sin iniciar",
  EN_PROCESO: "En proceso",
  EN_REVISION: "En revisión",
  BLOQUEADA: "Bloqueada",
  TERMINADA: "Terminada",
  RETRASADA: "Retrasada",
};

export const workActivityStatusColors: Record<string, string> = {
  SIN_INICIAR: "#9CA3AF",
  EN_PROCESO: "#5B8DEF",
  EN_REVISION: "#9B6FD9",
  BLOQUEADA: "#E15B5B",
  TERMINADA: "#3FBE7A",
  RETRASADA: "#F0834A",
};

export const incidentCategoryLabels: Record<string, string> = {
  CALIDAD: "Calidad",
  SEGURIDAD: "Seguridad",
  RETRASO: "Retraso",
  MATERIALES: "Materiales",
  CONTRATISTA: "Contratista",
  PROYECTO_EJECUTIVO: "Proyecto ejecutivo",
  INSTALACIONES: "Instalaciones",
  PRESUPUESTO: "Presupuesto",
  OTRO: "Otro",
};

export const incidentStatusLabels: Record<string, string> = {
  ABIERTA: "Abierta",
  EN_REVISION: "En revisión",
  ASIGNADA: "Asignada",
  EN_PROCESO: "En proceso",
  RESUELTA: "Resuelta",
  CERRADA: "Cerrada",
};

export const incidentStatusColors: Record<string, string> = {
  ABIERTA: "#E15B5B",
  EN_REVISION: "#9B6FD9",
  ASIGNADA: "#5B8DEF",
  EN_PROCESO: "#F0B429",
  RESUELTA: "#3FBE7A",
  CERRADA: "#6B7280",
};

export const warrantyStatusLabels: Record<string, string> = {
  RECIBIDA: "Recibida",
  EN_REVISION: "En revisión",
  VISITA_PROGRAMADA: "Visita programada",
  ASIGNADA: "Asignada",
  EN_REPARACION: "En reparación",
  PENDIENTE_VALIDACION: "Pendiente de validación",
  CERRADA: "Cerrada",
  RECHAZADA: "Rechazada",
};

export const warrantyStatusColors: Record<string, string> = {
  RECIBIDA: "#E15B5B",
  EN_REVISION: "#9B6FD9",
  VISITA_PROGRAMADA: "#5B8DEF",
  ASIGNADA: "#5B8DEF",
  EN_REPARACION: "#F0B429",
  PENDIENTE_VALIDACION: "#F0834A",
  CERRADA: "#3FBE7A",
  RECHAZADA: "#6B7280",
};

export const notificationTypeLabels: Record<string, string> = {
  NUEVA_TAREA: "Nueva tarea asignada",
  NUEVA_INCIDENCIA: "Nueva incidencia asignada",
  NUEVA_GARANTIA: "Nueva garantía asignada",
  CAMBIO_FECHA: "Fecha compromiso modificada",
  PROXIMO_VENCER: "Próximo a vencer",
  VENCIDO: "Vencido",
  MENCION: "Mención en comentario",
  SOLICITUD_REVISION: "Solicitud de revisión/autorización",
  RECHAZO: "Actividad rechazada",
  ARCHIVO_COMENTARIO: "Nuevo archivo o comentario",
  CAMBIO_ESTATUS: "Cambio de estatus",
  DEPENDENCIA_TERMINADA: "Dependencia terminada",
  BLOQUEADA: "Actividad bloqueada",
  EVIDENCIA_REQUERIDA: "Evidencia adicional requerida",
  ESCALAMIENTO: "Escalamiento",
};

export const entityTypeLabels: Record<string, string> = {
  PROJECT: "Proyecto",
  TASK: "Tarea",
  WORK_ACTIVITY: "Actividad de obra",
  INCIDENT: "Incidencia",
  WARRANTY: "Garantía",
};

export const pendingKindLabels: Record<string, string> = {
  TAREA: "Tarea",
  ACTIVIDAD_OBRA: "Actividad de obra",
  INCIDENCIA: "Incidencia",
  GARANTIA: "Garantía",
  REVISION: "Revisión/Autorización",
  MENCION: "Mención",
};

export const reviewKindLabels: Record<string, string> = {
  REVISION: "Revisión",
  AUTORIZACION: "Autorización",
  INFORMACION: "Solicitud de información",
};
