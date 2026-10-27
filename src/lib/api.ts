import { validApiData } from "./responseValidation"
import type { Brand, Category, Motorcycle, Lead, User } from "../types"

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
)

let token: string | null = null

let generation = 0
let sessionController = new AbortController()

let unauthorized: () => void = () => {}

export function setToken(value: string | null) {
  sessionController.abort()
  sessionController = new AbortController()
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
  if (
    (error instanceof ApiError && error.code === "SESSION_CHANGED") ||
    (error instanceof DOMException && error.name === "AbortError")
  )
    return ""
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
    error.code === "SMTP_NOT_CONFIGURED"
      ? "Instalación pendiente: configura SMTP en la API para enviar recuperación de contraseña."
      : "",
    error.code === "MFA_NOT_CONFIGURED"
      ? "Instalación pendiente: configura Sodium y la clave de cifrado MFA en la API."
      : "",
    error.message,
    ["RECOVERY_NOT_CONFIGURED", "RECOVERY_BUSY"].includes(error.code)
      ? "La recuperación no está disponible temporalmente. Intenta más tarde o contacta al administrador."
      : "",
    error.code === "LAST_ADMIN"
      ? "Debes conservar al menos un administrador activo. No se puede realizar este cambio."
      : "",
    error.requestId && !error.message.includes(error.requestId)
      ? `Referencia: ${error.requestId}`
      : "",
  ]
    .filter(Boolean)
    .join(" ")
}

type RequestOptions = RequestInit & { sessionIndependent?: boolean }
const paginated =
  /^\/admin\/(brands|categories|motorcycles|promotions|pages|banners|social-links)$/

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    const base = new URL(API_BASE_URL)
    if (
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    )
      throw new Error()
  } catch {
    throw new ApiError(
      0,
      "Configura VITE_API_BASE_URL con una URL HTTPS sin credenciales y recompila.",
    )
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    throw new ApiError(0, "Ruta de API inválida.")
  const { sessionIndependent = false, ...fetchOptions } = options
  const session = generation
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json")
  if (token && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${token}`)
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), 20000)
  const signal = AbortSignal.any([
    timeout.signal,
    ...(!sessionIndependent ? [sessionController.signal] : []),
    ...(options.signal ? [options.signal] : []),
  ])
  const method = (options.method || "GET").toUpperCase()
  const collection = method === "GET" && paginated.test(path.split("?")[0])
  let ownUnauthorized = false
  const collected: unknown[] = []
  const seen = new Set<string>()
  let cursor = "",
    limit = 100
  let sent: unknown
  if (typeof options.body === "string") {
    try {
      sent = JSON.parse(options.body)
    } catch {
      /* Invalid request is rejected by the server. */
    }
  }
  try {
    for (let page = 0; page < 1000; page++) {
      const target = new URL(`${API_BASE_URL}${path}`)
      if (collection) {
        target.searchParams.set("limit", String(limit))
        if (cursor) target.searchParams.set("cursor", cursor)
      }
      const response = await fetch(target.href, {
        ...fetchOptions,
        headers,
        signal,
        credentials: "omit",
        cache: "no-store",
      })
      const payload = await response.json().catch(() => null)
      if (!sessionIndependent && session !== generation)
        throw new ApiError(0, "", "SESSION_CHANGED")
      if (
        response.status === 401 &&
        path !== "/auth/login" &&
        !sessionIndependent
      ) {
        ownUnauthorized = true
        setToken(null)
        unauthorized()
      }
      if (
        collection &&
        response.status === 422 &&
        payload?.error?.code === "PAGE_TOO_LARGE" &&
        limit > 1
      ) {
        limit = Math.max(1, Math.floor(limit / 2))
        continue
      }
      if (!response.ok)
        throw new ApiError(
          response.status,
          payload?.error?.message || `La API respondió ${response.status}.`,
          payload?.error?.code,
          response.headers.get("X-Request-ID") || "",
          response.headers.get("Retry-After") || "",
        )
      if (
        !payload ||
        !Object.prototype.hasOwnProperty.call(payload, "data") ||
        !validApiData(path, method, payload.data, sent)
      )
        throw new ApiError(
          0,
          "Respuesta incompatible de la API. No se pudo confirmar la operación.",
          "INVALID_RESPONSE",
          response.headers.get("X-Request-ID") || "",
        )
      if (!collection) return payload.data as T
      collected.push(...payload.data)
      if (collected.length > 50000)
        throw new ApiError(
          0,
          "El listado es demasiado grande para cargarlo en el panel.",
        )
      const next = response.headers.get("X-Next-Cursor")
      if (!next) return collected as T
      if (seen.has(next))
        throw new ApiError(
          0,
          "La API devolvió un cursor repetido. Reintenta la consulta.",
          "INVALID_RESPONSE",
        )
      seen.add(next)
      cursor = next
    }
    throw new ApiError(
      0,
      "No se pudo completar el listado. Reintenta la consulta.",
    )
  } catch (error) {
    if (
      !sessionIndependent &&
      session !== generation &&
      !(ownUnauthorized && error instanceof ApiError && error.status === 401)
    )
      throw new ApiError(0, "", "SESSION_CHANGED")
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

export const detail = <K extends Kind>(
  kind: K,
  id: string,
  signal?: AbortSignal,
) =>
  request<Resources[K]>(`/admin/${kind}/${encodeURIComponent(id)}`, { signal })

// Preserve every editable field for replacement PUT; exclude GET-only metadata.

export const save = <K extends Kind>(
  kind: K,
  document: Partial<Resources[K]>,
  id?: string,
) =>
  request<Resources[K]>(
    `/admin/${kind}${id ? "/" + encodeURIComponent(id) : ""}`,
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(editableCatalog(kind, document)),
    },
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
    request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/auth/me"),

  logout: () => {
    const bearer = token
    setToken(null)
    return request("/auth/logout", {
      method: "POST",
      body: "{}",
      sessionIndependent: true,
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
    })
  },
}

export type LoginResult =
  | { token: string; expiresAt: string; user: User }
  | {
      challenge: "mfa_login" | "password_change"
      challengeToken: string
      expiresAt: string
    }
export const post = <T>(path: string, body: unknown, reauthToken?: string) =>
  request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: reauthToken ? { "X-Reauth-Token": reauthToken } : {},
  })
const catalogKeys = {
  brands:
    "name slug description status order primaryColor secondaryColor accentLight logo heroImageUrl tileImageUrl tagline slogan",
  categories: "name slug description status order brandId",
  motorcycles:
    "slug brandId categoryId model year price currency published showPrice allowQuote version sku tagline shortDescription description displacement inventory hp promoPrice status featured isNew specs colors",
}
export function editableCatalog(kind: Kind, document: object) {
  const result = Object.fromEntries(
    Object.entries(document).filter(([key]) =>
      catalogKeys[kind].split(" ").includes(key),
    ),
  )
  if (kind === "motorcycles") {
    const pick = (item: object, keys: string) =>
      Object.fromEntries(
        Object.entries(item).filter(([key]) => keys.split(" ").includes(key)),
      )
    if (Array.isArray(result.specs))
      result.specs = result.specs.map((s) => pick(s, "group label value"))
    if (Array.isArray(result.colors))
      result.colors = result.colors.map((c) => ({
        ...pick(c, "id name hex status available order"),
        images: (c.images || []).map((i: object) =>
          pick(i, "id url alt label order isPrimary"),
        ),
      }))
  }
  return result
}
