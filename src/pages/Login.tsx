import { errorMessage } from "../lib/api"

import { useState } from "react"

import { Eye, EyeOff, Lock, Mail } from "lucide-react"

import { useApp } from "../context/AppContext"

export function Login() {
  const { login, addToast } = useApp()

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    setLoading(true)
    setError("")

    try {
      await login(email, password)
      setPassword("")
      addToast("success", "Sesión iniciada")
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)" }}
    >
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #18181b 0%, #2c1000 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, #f97316 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <h2
            className="text-4xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Panel de
            <br />
            Administración
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            Gestiona todo el contenido de MotoApex — motocicletas, inventario,
            leads y más desde un solo lugar.
          </p>
        </div>
        <div className="relative">
          <p className="text-sm text-zinc-400">
            Catálogo, inventario y consultas conectados a MotoApex.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-4 mb-8">
            <img src={`${import.meta.env.BASE_URL}motoapex-logo.png`} alt="MotoApex Costa Rica"
              width={104} height={104} className="w-[104px] h-[104px] object-contain shrink-0" />
            <p className="font-bold text-zinc-100">MotoApex Admin</p>
          </div>

          <h1
            className="text-2xl font-bold text-zinc-100 mb-2"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Iniciar sesión
          </h1>
          <p className="text-sm text-zinc-500 mb-8">
            Accede a tu panel de administración
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  id="login-email"
                  disabled={loading}
                  autoComplete="username"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-colors focus:ring-1"
                  style={
                    {
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      "--tw-ring-color": "var(--primary)",
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-zinc-400 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  id="login-password"
                  disabled={loading}
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border outline-none transition-colors"
                  style={{
                    background: "var(--secondary)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" disabled className="text-xs text-zinc-500">
                Recuperación de contraseña pendiente
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: "var(--primary)",
                color: "#000",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <p className="text-xs text-center text-zinc-600 mt-8">
            MotoApex Costa Rica · admin.motoapexcr.com
          </p>
        </div>
      </div>
    </div>
  )
}
