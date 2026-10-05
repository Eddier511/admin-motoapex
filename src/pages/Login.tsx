import motoapexLogo from "../assets/motoapex-logo.png"

import { errorMessage } from "../lib/api"

import { useState } from "react"

import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react"

import { useApp } from "../context/AppContext"
import { AccessFlow } from "./AccessFlow"

export function Login() {
  const { login, addToast, challenge } = useApp()
  const [forgot, setForgot] = useState(false)

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
    } catch (e) {
      setError(errorMessage(e))
      addToast("error", errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  if (challenge)
    return <AccessFlow key={challenge.challengeToken} mode="challenge" />
  if (forgot) return <AccessFlow mode="forgot" back={() => setForgot(false)} />
  return (
    <main className="login-screen min-h-svh flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="login-stripes" aria-hidden="true" />
      <section
        aria-labelledby="login-title"
        className="login-card relative w-full max-w-[520px] rounded-[20px] px-6 py-8 sm:px-9 sm:py-9"
      >
        <div className="text-center mb-8">
          <img
            src={motoapexLogo}
            alt="MotoApex Costa Rica"
            width={128}
            height={128}
            className="w-32 h-32 object-contain mx-auto mb-5"
          />
          <h1
            id="login-title"
            className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight text-[#151923]"
          >
            Iniciar sesión
          </h1>
          <p className="text-sm sm:text-base text-[#9095a4] mt-2">
            Accede a tu panel de administración
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 break-words"
            >
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-[#545b69] mb-2"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <Mail
                size={18}
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848b99]"
              />
              <input
                id="login-email"
                disabled={loading}
                autoComplete="username"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input w-full h-[52px] pl-12 pr-4 rounded-xl text-base"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-[#545b69] mb-2"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock
                size={18}
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848b99]"
              />
              <input
                id="login-password"
                disabled={loading}
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input w-full h-[52px] pl-12 pr-12 rounded-xl text-base"
              />
              <button
                type="button"
                disabled={loading}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-[#848b99] hover:text-[#353c49] focus-visible:outline-2 focus-visible:outline-orange-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={() => setForgot(true)}
              className="text-xs text-[#989ead]"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="login-submit w-full h-[54px] rounded-xl text-base font-semibold flex items-center justify-center gap-3 mt-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {loading ? (
              <>
                <span
                  aria-hidden="true"
                  className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                />
                Ingresando...
              </>
            ) : (
              <>
                Ingresar <ArrowRight size={21} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 mt-8 text-center">
          <span aria-hidden="true" className="h-px bg-[#e8eaf0] flex-1" />
          <p className="text-[11px] sm:text-xs text-[#989ead]">
            MotoApex Costa Rica
          </p>
          <span aria-hidden="true" className="h-px bg-[#e8eaf0] flex-1" />
        </div>
      </section>
    </main>
  )
}
