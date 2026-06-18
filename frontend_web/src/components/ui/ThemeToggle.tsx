import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'logitrack-theme';

const getInitialDark = (): boolean => {
  if (typeof document === 'undefined') return false;
  // El script de index.html ya aplicó la clase antes de pintar; nos alineamos
  return document.documentElement.classList.contains('dark');
};

/**
 * Botón para alternar entre modo claro y oscuro. Persiste la preferencia en
 * localStorage y alterna la clase `dark` en <html> (los tokens del tema hacen
 * el resto). El valor inicial lo fija el script anti-FOUC de index.html.
 */
export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(getInitialDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      /* almacenamiento no disponible: el toggle sigue funcionando en sesión */
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((prev) => !prev)}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-soft hover:bg-app hover:text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? (
        // Sol
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        // Luna
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
