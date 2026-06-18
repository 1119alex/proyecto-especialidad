import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const REMEMBER_KEY = 'logitrack-remember-email';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Precargar el correo recordado de una sesión anterior
  useEffect(() => {
    try {
      const remembered = localStorage.getItem(REMEMBER_KEY);
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email: email.trim(), password });

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        /* localStorage no disponible */
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  // Detecta Bloq Mayús para avisar al usuario antes de que falle el login
  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const canSubmit = email.trim() !== '' && password !== '' && !loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-surface rounded-xl shadow-2xl p-8 border border-edge">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-primary rounded-full p-4 mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">LOGITRACK</h1>
            <p className="text-ink-muted mt-2">Sistema de Gestión Logística</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink-soft mb-2"
              >
                Correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface text-ink border border-edge rounded-lg placeholder:text-ink-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="ejemplo@empresa.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink-soft mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={handleCapsLock}
                  onKeyDown={handleCapsLock}
                  className="w-full px-4 py-3 pr-12 bg-surface text-ink border border-edge rounded-lg placeholder:text-ink-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-ink-muted hover:text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-r-lg"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {capsLockOn && (
                <p className="mt-2 text-xs text-warning flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Bloq Mayús está activado
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary border-edge rounded focus:ring-primary"
                />
                <span className="text-sm text-ink-soft">Recordar mi correo</span>
              </label>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-danger-soft border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-primary hover:bg-primary-strong text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
              )}
              {loading ? 'Ingresando...' : 'INGRESAR'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-muted">
            <p>¿Olvidaste tu contraseña?</p>
            <a
              href="mailto:soporte@logitrack.com?subject=Recuperación de contraseña"
              className="text-primary hover:underline mt-1 inline-block font-medium"
            >
              Contactar al administrador
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-white/70 mt-6">
          © {new Date().getFullYear()} LogiTrack · Sistema de Gestión Logística
        </p>
      </div>
    </div>
  );
};

export default Login;
