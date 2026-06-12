import { ReactNode } from 'react';

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const ACCENTS: Record<Accent, { icon: string; value: string }> = {
  primary: { icon: 'bg-primary-soft text-primary', value: 'text-ink' },
  success: { icon: 'bg-success-soft text-success', value: 'text-ink' },
  warning: { icon: 'bg-warning-soft text-warning', value: 'text-ink' },
  danger: { icon: 'bg-danger-soft text-danger', value: 'text-ink' },
  info: { icon: 'bg-info-soft text-info', value: 'text-ink' },
  neutral: { icon: 'bg-app text-ink-soft', value: 'text-ink' },
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: Accent;
  sub?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'primary',
  sub,
  loading = false,
}: StatCardProps) {
  const styles = ACCENTS[accent];

  return (
    <div className="bg-surface border border-edge rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-soft">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 rounded-md bg-app motion-safe:animate-pulse" />
          ) : (
            <p className={`mt-1 text-3xl font-bold tabular-nums ${styles.value}`}>
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="mt-1 text-xs text-ink-muted truncate">{sub}</p>
          )}
        </div>
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${styles.icon}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
