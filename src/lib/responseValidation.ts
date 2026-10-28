import { promotionDatesValid } from "./promotionDates"

type RecordValue = Record<string, unknown>
const object = (v: unknown): v is RecordValue =>
  !!v && typeof v === "object" && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === "string" && v.length > 0
const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v))
const mediaUrl = (v: unknown): boolean => {
  if (v === "") return true
  if (!text(v)) return false
  try {
    const url = new URL(v)
    return url.protocol === "https:" && !url.username && !url.password
  } catch {
    return false
  }
}
const user = (v: unknown) =>
  object(v) &&
  text(v.id) &&
  text(v.name) &&
  text(v.email) &&
  text(v.role) &&
  ["active", "inactive"].includes(String(v.status)) &&
  (v.permissions === undefined ||
    (Array.isArray(v.permissions) && v.permissions.every(text)))
const login = (v: unknown): boolean =>
  object(v) &&
  date(v.expiresAt) &&
  ((text(v.token) &&
    user(v.user) &&
    (v.user as RecordValue).status === "active" &&
    v.challenge === undefined) ||
    (["mfa_login", "password_change"].includes(String(v.challenge)) &&
      text(v.challengeToken) &&
      v.token === undefined &&
      v.user === undefined))
const recovery = (v: unknown) =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.length <= 100 &&
  v.every((code) => text(code) && code.length <= 200) &&
  new Set(v).size === v.length

function resource(kind: string, v: unknown): boolean {
  if (!object(v)) return false
  for (const key of [
    "imageUrl",
    "mobileImageUrl",
    "logo",
    "heroImageUrl",
    "tileImageUrl",
    "avatarUrl",
    "logoUrl",
    "faviconUrl",
  ])
    if (v[key] !== undefined && !mediaUrl(v[key])) return false
  if (
    kind === "motorcycles" &&
    v.colors !== undefined &&
    (!Array.isArray(v.colors) ||
      !v.colors.every(
        (color) =>
          object(color) &&
          Array.isArray(color.images) &&
          color.images.every(
            (image) => object(image) && text(image.url) && mediaUrl(image.url),
          ),
      ))
  )
    return false
  if (kind === "contact") return text(v.businessName) && Array.isArray(v.hours)
  if (!text(v.id)) return false
  switch (kind) {
    case "users":
      return user(v)
    case "brands":
    case "categories":
    case "leads":
    case "lead-assignees":
      return text(v.name)
    case "motorcycles":
      return text(v.model) && ["CRC", "USD"].includes(String(v.currency))
    case "promotions":
      return text(v.title) && promotionDatesValid(v)
    case "banners":
    case "pages":
      return text(v.title)
    case "social-links":
      return text(v.platform) && text(v.label)
    case "roles":
      return text(v.code) && Array.isArray(v.permissions)
    case "settings":
      return text(v.key) && typeof v.value === "string"
    default:
      return false
  }
}

function containsSentFields(data: RecordValue, sent: unknown): boolean {
  if (!object(sent)) return false
  return Object.entries(sent).every(([key, value]) => {
    if (["password", "newPassword"].includes(key)) return true
    if (!(key in data)) return false
    const result = data[key]
    if (value === null) return result === null
    if (Array.isArray(value)) return Array.isArray(result)
    if (object(value))
      return object(result) && containsSentFields(result, value)
    return (
      typeof result === typeof value &&
      (typeof result !== "number" || Number.isFinite(result))
    )
  })
}

// Validate untrusted envelopes before any caller can confirm a successful action.
// Never include the payload in errors: it can contain credentials or private data.
export function validApiData(
  path: string,
  method: string,
  data: unknown,
  sent: unknown,
): boolean {
  path = path.split("?")[0]
  if (
    ["/auth/login", "/auth/mfa/challenge", "/auth/password/required"].includes(
      path,
    )
  )
    return login(data)
  if (["/auth/me", "/auth/profile"].includes(path))
    return (
      user(data) &&
      (data as RecordValue).status === "active" &&
      (method !== "PUT" || containsSentFields(data as RecordValue, sent))
    )
  if (path === "/auth/logout") return object(data) && data.loggedOut === true
  if (path === "/auth/reauth")
    return (
      object(data) &&
      text(data.reauthToken) &&
      date(data.expiresAt) &&
      data.challenge === "reauth"
    )
  if (["/auth/password/reset", "/auth/password/change"].includes(path))
    return object(data) && data.changed === true && data.loginRequired === true
  if (path === "/auth/password/forgot")
    return object(data) && text(data.message)
  if (path === "/auth/mfa/status")
    return object(data) && typeof data.enabled === "boolean"
  if (path === "/auth/mfa/enroll") {
    if (
      !object(data) ||
      !text(data.otpauthUri) ||
      data.otpauthUri.length > 4096
    )
      return false
    try {
      const uri = new URL(data.otpauthUri)
      return (
        uri.protocol === "otpauth:" &&
        uri.hostname === "totp" &&
        /^[A-Z2-7]+=*$/i.test(uri.searchParams.get("secret") || "")
      )
    } catch {
      return false
    }
  }
  if (path === "/auth/mfa/confirm")
    return (
      object(data) &&
      data.enabled === true &&
      data.loginRequired === true &&
      recovery(data.recoveryCodes)
    )
  if (path === "/auth/mfa/recovery-codes")
    return object(data) && recovery(data.recoveryCodes)
  if (path === "/auth/mfa/disable")
    return object(data) && data.enabled === false && data.loginRequired === true
  const match = /^\/admin\/([^/]+)(?:\/([^/]+))?$/.exec(path)
  if (!match) return false
  const [, kind, id] = match
  if (method === "DELETE")
    return (
      object(data) &&
      data.deleted === true &&
      (data.id === undefined || data.id === decodeURIComponent(id || ""))
    )
  if (method === "GET" && !id && kind !== "contact")
    return Array.isArray(data) && data.every((v) => resource(kind, v))
  if (kind === "settings" && method === "PUT")
    return object(data) && data.key === id && typeof data.value === "string"
  if (!resource(kind, data)) return false
  if (id && /^\d+$/.test(id) && (data as RecordValue).id !== id) return false
  return (
    !["PUT", "POST"].includes(method) ||
    containsSentFields(data as RecordValue, sent)
  )
}
