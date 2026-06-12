import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  notificationService,
  AppNotification,
} from '../../services/notificationService';

const SOCKET_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
).replace(/\/api\/v1\/?$/, '');

const TYPE_ICONS: Record<string, string> = {
  ASIGNACION: '🚚',
  PREPARACION: '📦',
  EN_RUTA: '🛣️',
  LLEGADA: '📍',
  RECEPCION: '✅',
  DISCREPANCIA: '⚠️',
  CANCELACION: '🚫',
  SISTEMA: 'ℹ️',
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return 'hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch {
      // Silencioso: la campana no debe romper el layout
    }
  }, []);

  // Carga inicial + suscripción en tiempo real a la room personal del usuario
  useEffect(() => {
    loadNotifications();

    const socket: Socket = io(`${SOCKET_BASE_URL}/tracking`, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
    });

    socket.on('notification:new', (incoming: Partial<AppNotification>) => {
      setNotifications((prev) => [
        {
          id: incoming.id ?? Date.now(),
          transferId: incoming.transferId ?? null,
          type: incoming.type ?? 'SISTEMA',
          priority: incoming.priority ?? 'NORMAL',
          title: incoming.title ?? 'Notificación',
          message: incoming.message ?? '',
          isRead: false,
          sentAt: (incoming.sentAt as string) ?? new Date().toISOString(),
        },
        ...prev,
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [loadNotifications]);

  // Cerrar con click fuera o Escape
  useEffect(() => {
    if (!open) return;

    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const handleMarkRead = async (notification: AppNotification) => {
    if (notification.isRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
    try {
      await notificationService.markAsRead(notification.id);
    } catch {
      // Si falla, se recargará en la próxima apertura
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notificaciones: ${unreadCount} sin leer`
            : 'Notificaciones'
        }
        aria-expanded={open}
        aria-haspopup="true"
        className="relative w-10 h-10 rounded-lg flex items-center justify-center text-ink-soft hover:bg-app transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Panel de notificaciones"
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-surface border border-edge rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-edge flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-primary">
                {unreadCount} sin leer
              </span>
            )}
          </div>

          <ul role="list" className="max-h-96 overflow-y-auto divide-y divide-edge">
            {notifications.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-ink-muted">
                No tienes notificaciones
              </li>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <li key={notification.id}>
                  <button
                    onClick={() => handleMarkRead(notification)}
                    className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-app focus-visible:outline-none focus-visible:bg-app ${
                      notification.isRead ? 'opacity-70' : ''
                    }`}
                  >
                    <span className="text-lg flex-shrink-0" aria-hidden="true">
                      {TYPE_ICONS[notification.type] ?? 'ℹ️'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink truncate">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span
                            className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                            aria-label="Sin leer"
                          />
                        )}
                      </span>
                      <span className="block text-xs text-ink-soft mt-0.5 line-clamp-2">
                        {notification.message}
                      </span>
                      <span className="block text-[11px] text-ink-muted mt-1">
                        {timeAgo(notification.sentAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
