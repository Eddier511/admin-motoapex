import { useState } from 'react';
import { Bike, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Login() {
  const { login, addToast } = useApp();
  const [email, setEmail] = useState('eddier@motoapexcr.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const ok = login(email, password);
    if (!ok) addToast('error', 'Credenciales incorrectas');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #18181b 0%, #2c1000 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #f97316 0%, transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Bike size={20} className="text-black" />
            </div>
            <div>
              <p className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>MotoApex</p>
              <p className="text-xs text-zinc-500">Costa Rica</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Panel de<br />Administración
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            Gestiona todo el contenido de MotoApex — motocicletas, inventario, leads y más desde un solo lugar.
          </p>
        </div>
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Motocicletas', value: '28' },
              { label: 'Marcas activas', value: '4' },
              { label: 'Leads este mes', value: '24' },
              { label: 'Promociones', value: '2' },
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <Bike size={17} className="text-black" />
            </div>
            <p className="font-bold text-zinc-100" style={{ fontFamily: 'DM Sans, sans-serif' }}>MotoApex Admin</p>
          </div>

          <h1 className="text-2xl font-bold text-zinc-100 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Iniciar sesión</h1>
          <p className="text-sm text-zinc-500 mb-8">Accede a tu panel de administración</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-colors focus:ring-1"
                  style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border outline-none transition-colors"
                  style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{ background: 'var(--primary)', color: '#000', opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Ingresando...</>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-xs text-center text-zinc-600 mt-8">
            MotoApex Costa Rica © 2025 · admin.motoapexcr.com
          </p>
        </div>
      </div>
    </div>
  );
}
