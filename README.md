# MotoApex Admin

React 19/Vite 8/Tailwind 4 con operaciones reales de API. Conserva identidad, menú, Sonner, estados y LoadingOverlay. Sin mocks ni fallback en producción.

## Contrato y ramas

Fuente: [contract.md](https://github.com/Eddier511/api-motoapex/blob/codex/accounts-security/docs/contract.md) y [accounts-install.md](https://github.com/Eddier511/api-motoapex/blob/codex/accounts-security/docs/accounts-install.md), rama codex/accounts-security, commit fb73f39920e0b7d91fdcca53aa1569968be4338f.

Los PR API siguen abiertos y apilados: #1 base → #2 promociones → #3 contenido → #4 cuentas y seguridad. No se presupone que estén en main. Admin parte de main 902cd6a; su PR #2 de referencias seguía abierto. Este cambio evita también duplicar referencias, sin hacer merge de ese PR.

## Desarrollo

Node 22.12+, pnpm 10.34.3. Las variables VITE son públicas: nunca incluir MySQL, SMTP ni secretos. El build usa .env.production:

```env
VITE_API_BASE_URL=https://darksalmon-quetzal-730302.hostingersite.com/v1
```

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm test
```

En Windows con Edge usar PLAYWRIGHT_CHANNEL=msedge. pnpm preview sirve el build. Las pruebas usan respuestas de contrato controladas exclusivamente en tests, con datos desechables aislados; no modifican Hostinger.

## Funciones

- Catálogo: marcas, categorías, motos, precios CRC/USD, publicación, especificaciones, inventario total y galerías HTTPS por color. Publicar requiere motorcycles.publish. PUT conserva todos los campos editables y excluye ID, fechas, nombres calculados y campos desconocidos de GET. Colores/fotos nuevos usan UUID según contrato; se conservan IDs del servidor después del guardado.
- Leads: estado, notas agregadas al historial y responsables mediante GET /admin/lead-assignees; exclusivamente ID/nombre. Vacío desasigna. Ventas no consulta usuarios completos.
- Promociones: listado, detalle, POST/PUT y eliminación lógica; marca, relaciones de motos/precios/moneda, imágenes, vigencia, flags, orden y botón. Valida promo ≤ original y moneda/marca de la moto. No importa ofertas de ejemplo.
- Contenido: CRUD de páginas/banners/redes; contacto singleton solo GET/PUT. Texto plano o bloques estructurados, SEO, botones, imágenes escritorio/móvil, ALT, relaciones y vigencia. Nunca renderiza HTML de la API.
- Usuarios: CRUD, roles/permisos solo de referencia, contraseña inicial explícita de 16–72 bytes y cambio obligatorio. Edición puede imponer cambio obligatorio o nueva contraseña; nunca envía mustChangePassword:false. LAST_ADMIN explica la protección sin eludirla.
- Configuración: únicamente site_url, admin_url, api_url, timezone y default_currency. URL informativas, no reconfiguran CORS ni el endpoint del build. Contacto/horarios/logos/redes pertenecen a Contenido web.
- Mi cuenta: perfil, contraseña, estado/alta/confirmación/desactivación MFA y rotación de códigos. Disponible para todos los roles autenticados desde el menú y perfil.
- Login normal o desafíos mfa_login/password_change; sin acceso al panel hasta completarlos. Cuando exige ambos, MFA precede a contraseña. Desafío inválido obliga a reiniciar login. Usa expiresAt y /auth/me.
- Recuperación genérica y /reset-password#token=...: elimina fragmento antes de montar React, token solo en memoria. Recargar pierde el token; abrir el enlace de nuevo o solicitar otro. Reset no crea sesión. SMTP pendiente se informa sin simular envío.
- Operaciones sensibles: contraseña actual y MFA/recuperación cuando corresponde; POST /auth/reauth y X-Reauth-Token junto a Bearer para una sola escritura del propósito exacto. Cada intento nuevo pide reautenticación. Cambios que revocan sesiones vuelven al login.

Bearer, desafíos, reautenticación, reset, URI MFA y recoveryCodes viven únicamente en memoria. No se guardan en localStorage/sessionStorage, logs ni URL (excepto el fragmento recibido y eliminado inmediatamente). QR generado localmente con qrcode, sin proveedor externo. Códigos se muestran solo cuando el servidor los entrega y se descartan al cerrar.

## Permisos y errores

La UI aplica roles/permisos iniciales del contrato. /auth/me actualmente no devuelve grants DB; el servidor consulta role_permissions y su 403 es definitivo. Si la identidad trae permisos explícitos, restringen también la UI. Admin gestiona usuarios/ajustes; admin/marketing promociones; admin/marketing/editor contenido; admin/sales leads. Catálogo conserva sus restricciones. No hay edición de permisos.

Carga real, vacíos, validaciones, reintentos y avisos de éxito únicamente tras respuesta exitosa. Maneja 401 (descarta sesión), 403, 409/LAST_ADMIN, 422, 429/Retry-After y 503/SMTP o MFA pendientes. Muestra X-Request-ID sin duplicarlo. No reintenta escrituras automáticamente.

## Hostinger

1. Respaldo y revisión de schema_migrations en la API. Aplicar en orden solo las pendientes: 002_api_support.sql, 003_promotions.sql, 004_web_content.sql y 005_accounts.sql. **No reimportar schema.sql.** La 005 revoca sesiones anteriores.
2. Usar paquete API que incluya los cuatro PR. PHP 8.3+, PDO MySQL, Sodium y SMTP/cifrado según accounts-install.md. Configuración privada fuera de public_html, jamás en frontend. password_reset_url debe apuntar al HTTPS exacto del admin terminado en /reset-password.
3. CORS: origen exacto del admin, Authorization y X-Reauth-Token; exponer X-Request-ID/Retry-After.
4. Extraer ZIP del admin en su public_html: index.html, .htaccess, robots.txt y assets/ directamente en la raíz. .htaccess conserva navegación directa a /reset-password. No requiere Node en hosting.
5. Completar [verificación real pendiente](docs/integration-verification.md) con una cuenta desechable. Este PR no hace merge ni despliegue automático; CI comprueba y empaqueta.

**Después cambiaremos VITE_API_BASE_URL a https://api.motoapexcr.com/v1 y recompilaremos.** Cambiar .env en hosting no modifica un ZIP construido. Actualizar también CORS y password_reset_url privados.

## Identidad y límites

Logo completo en login y encabezado izquierdo; src/assets/motoapex-logo.png importado por Vite. Favicon 16/32/48 y Apple 180. Binarios normales en Git. Título MotoApex Admin y noindex/nofollow/robots.txt. scripts/generate-brand-icons.py requiere Pillow.

Analítica completa, notificaciones y movimientos de inventario siguen pendientes: el contrato no ofrece rutas. No hay uploads ni edición de permisos. Las pruebas locales no acreditan entrega de correo, cifrado real ni persistencia MySQL; consultar la guía de verificación.
