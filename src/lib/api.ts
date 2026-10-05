import type { Brand, Category, Motorcycle, Lead, User } from "../types"

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
)

let token: string | null = null

let generation = 0

let unauthorized: () => void = () => {}

export function setToken(value: string | null) {
  token = value
  generation++
}

export function onUnauthorized(handler: () => void) {
  unauthorized = handler
  return () => {
    unauthorized = () => {}
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "",
    public requestId = "",
    public retryAfter = "",
  ) {
    super(message)
  }
}

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return error instanceof Error
      ? error.message
      : "Ocurrió un error inesperado."

  const explanations: Record<number, string> = {
    401: "Sesión vencida o credenciales incorrectas. Inicia sesión.",

    403: "No tienes autorización para esta operación.",

    409: "Hay un conflicto: revisa el slug, SKU o registros relacionados.",

    422: "Revisa los valores del formulario.",

    429: `Demasiadas solicitudes. Espera ${
      error.retryAfter
        ? error.retryAfter + " segundos"
        : "antes de intentar nuevamente"
    }.`,
  }

  return [
    explanations[error.status],
    error.message,
    error.requestId && !error.message.includes(error.requestId)
      ? `Referencia: ${error.requestId}`
      : "",
  ]
    .filter(Boolean)
    .join(" ")
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_BASE_URL.startsWith("https://"))
    throw new ApiError(
      0,
      "Configura VITE_API_BASE_URL con una URL HTTPS y recompila.",
    )

  const session = generation

  const headers = new Headers(options.headers)

  headers.set("Accept", "application/json")

  if (options.body !== undefined)
    headers.set("Content-Type", "application/json")

  if (token) headers.set("Authorization", `Bearer ${token}`)

  const timeout = new AbortController()

  const timer = setTimeout(() => timeout.abort(), 20000)

  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout.signal])
    : timeout.signal

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal,
      credentials: "omit",
    })

    const payload = await response.json().catch(() => null)

    if (session !== generation)
      throw new ApiError(0, "La sesión cambió. Repite la operación.")

    if (response.status === 401 && path !== "/auth/login") {
      setToken(null)
      unauthorized()
    }

    if (!response.ok)
      throw new ApiError(
        response.status,
        payload?.error?.message || `La API respondió ${response.status}.`,
        payload?.error?.code,
        response.headers.get("X-Request-ID") || "",
        response.headers.get("Retry-After") || "",
      )

    if (!payload || !Object.prototype.hasOwnProperty.call(payload, "data"))
      throw new ApiError(
        0,
        "Respuesta inválida de la API; verifica su instalación.",
      )

    return payload.data as T
  } catch (error) {
    if (error instanceof ApiError) throw error

    if (options.signal?.aborted) throw error

    throw new ApiError(
      0,
      timeout.signal.aborted
        ? "La API tardó demasiado. Intenta nuevamente."
        : "No se pudo conectar con la API. Verifica instalación, conexión y CORS.",
    )
  } finally {
    clearTimeout(timer)
  }
}

export type Kind = "brands" | "categories" | "motorcycles"

export type Resources = {
  brands: Brand
  categories: Category
  motorcycles: Motorcycle
}

export const list = <K extends Kind>(kind: K, signal?: AbortSignal) =>
  request<Resources[K][]>(`/admin/${kind}`, { signal })

export const detail = <K extends Kind,>(
  kind: K,
  id: string,
  signal?: AbortSignal,
) =>
  request<Resources[K]>(`/admin/${kind}/${encodeURIComponent(id)}`, { signal })

// Preserve the entire private document: PUT is replacement, never a partial update.

export const save = <K extends Kind,>(
  kind: K,
  document: Partial<Resources[K]>,
  id?: string,
) =>
  request<Resources[K]>(
    `/admin/${kind}${id ? "/" + encodeURIComponent(id) : ""}`,
    { method: id ? "PUT" : "POST", body: JSON.stringify(document) },
  )

export const remove = (kind: Kind, id: string) =>
  request(`/admin/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" })

export const patchLead = (
  id: string,
  fields: { status?: Lead["status"]; assignedTo?: string; notes?: string },
) =>
  request<Lead>(`/admin/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  })

export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; expiresAt: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/auth/me"),

  logout: () => request("/auth/logout", { method: "POST", body: "{}" }),
}
