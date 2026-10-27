import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
const html = readFileSync("dist/index.html", "utf8")
const headers = readFileSync("dist/.htaccess", "utf8")
const policy = /http-equiv="Content-Security-Policy" content="([^"]+)"/
  .exec(html)?.[1]
  ?.replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&")
if (
  !policy ||
  !policy.includes("script-src 'self';") ||
  !policy.includes("object-src 'none';") ||
  !headers.includes(policy + "; frame-ancestors 'none'")
)
  throw new Error("CSP de HTML y cabeceras incompleta o incompatible.")
for (const required of [
  'X-Frame-Options "DENY"',
  'Referrer-Policy "no-referrer"',
  'Strict-Transport-Security "max-age=31536000"',
  'X-Robots-Tag "noindex, nofollow"',
])
  if (!headers.includes(required))
    throw new Error("Falta una cabecera de seguridad requerida.")
const forbidden =
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16}|(?:MYSQL_PASSWORD|DB_PASSWORD)\s*[:=]|mfa_encryption_key\s*[:=]|smtp_password\s*[:=]|https?:\/\/[^\s"'<>/]+@|session-only-in-memory|test-token-only|admin@example\.test|googletagmanager\.com|kaspersky-labs\.com|sourceMappingURL=/
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      inspect(path)
      continue
    }
    if (
      entry.name.endsWith(".map") ||
      entry.name.startsWith(".env") ||
      /\.(?:sql|php|ts|tsx)$/.test(entry.name)
    )
      throw new Error("El paquete contiene un archivo privado o de desarrollo.")
    if (
      /\.(?:js|html|css)$/.test(entry.name) &&
      forbidden.test(readFileSync(path, "utf8"))
    )
      throw new Error(
        "El paquete contiene un indicador de secretos, pruebas o scripts externos. No publicarlo.",
      )
  }
}
inspect("dist")
console.log(
  "Paquete estático verificado: CSP, cabeceras, noindex y ausencia de indicadores privados/de prueba.",
)
