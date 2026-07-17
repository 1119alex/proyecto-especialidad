import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Centro de Control',
    subtitle: 'Visión general de la operación logística',
  },
  '/transfers': {
    title: 'Transferencias',
    subtitle: 'Gestión y seguimiento de órdenes de transferencia',
  },
  '/warehouses': {
    title: 'Almacenes',
    subtitle: 'Puntos de operación y su inventario',
  },
  '/vehicles': {
    title: 'Vehículos',
    subtitle: 'Flota disponible para asignación',
  },
  '/products': {
    title: 'Productos',
    subtitle: 'Catálogo global de productos',
  },
  '/inventory': {
    title: 'Inventario',
    subtitle: 'Existencias por almacén y ajustes de stock',
  },
  '/users': {
    title: 'Usuarios',
    subtitle: 'Cuentas y roles del sistema',
  },
  '/reports': {
    title: 'Reportes',
    subtitle: 'Análisis histórico y exportación',
  },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TRANSPORTISTA: 'Transportista',
  ENCARGADO_ALMACEN: 'Encargado de Almacén',
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  const page = PAGE_TITLES[location.pathname] ?? {
    title: 'LogiTrack',
    subtitle: '',
  };

  const initials = (user?.name ?? user?.email ?? '?')
    .split(' ')
    .map((part: string) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen bg-app">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior */}
        <header className="h-16 flex-shrink-0 bg-surface border-b border-edge flex items-center justify-between px-6 gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-ink leading-tight truncate">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-xs text-ink-muted truncate">{page.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />

            <NotificationBell />

            <div className="h-8 w-px bg-edge" aria-hidden="true" />

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="hidden md:block leading-tight">
                <p className="text-sm font-semibold text-ink">{user?.name}</p>
                <p className="text-xs text-ink-muted">
                  {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
