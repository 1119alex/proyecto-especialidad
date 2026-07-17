import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  empty = false,
  emptyMessage = 'Sin datos en el período seleccionado',
  children,
}: ChartCardProps) {
  return (
    <section className="bg-surface border border-edge rounded-lg shadow-sm p-5">
      <header className="mb-4">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </header>
      {empty ? (
        <div className="flex items-center justify-center h-40 text-sm text-ink-muted">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
