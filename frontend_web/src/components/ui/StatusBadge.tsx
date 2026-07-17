import { TransferStatus } from '../../types';

interface StatusConfig {
  label: string;
  classes: string;
  dot: string;
}

const STATUS_CONFIG: Record<TransferStatus, StatusConfig> = {
  PENDIENTE: {
    label: 'Pendiente',
    classes: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  ASIGNADA: {
    label: 'Asignada',
    classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  EN_PREPARACION: {
    label: 'En Preparación',
    classes: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
  LISTA_DESPACHO: {
    label: 'Lista p/ Despacho',
    classes: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  EN_TRANSITO: {
    label: 'En Tránsito',
    classes: 'bg-info-soft text-info',
    dot: 'bg-info motion-safe:animate-pulse',
  },
  LLEGADA_DESTINO: {
    label: 'En Destino',
    classes: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  COMPLETADA: {
    label: 'Completada',
    classes: 'bg-success-soft text-success',
    dot: 'bg-success',
  },
  COMPLETADA_CON_DISCREPANCIA: {
    label: 'Con Discrepancia',
    classes: 'bg-warning-soft text-warning',
    dot: 'bg-warning',
  },
  CANCELADA: {
    label: 'Cancelada',
    classes: 'bg-danger-soft text-danger',
    dot: 'bg-danger',
  },
};

export const getStatusLabel = (status: TransferStatus): string =>
  STATUS_CONFIG[status]?.label ?? status;

export const getStatusDotClass = (status: TransferStatus): string =>
  STATUS_CONFIG[status]?.dot ?? STATUS_CONFIG.PENDIENTE.dot;

interface StatusBadgeProps {
  status: TransferStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDIENTE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}
