# MotoApex Admin

React + Vite + Tailwind. Conectado al contrato de `Eddier511/api-motoapex`, rama `codex/api-foundation`, `docs/contract.md` (PR #1, abierto al implementar). No depende de que la API esté en main. No hay datos simulados ni fallback a mocks.

## Configuración y desarrollo

Node.js 22.12+ y pnpm 10.34.3. Copia `.env.example` como `.env.local` para desarrollo; no agregues secretos. El build usa `.env.production`:

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
pnpm preview
```

En Windows con Edge instalado puedes ejecutar las pruebas con `PLAYWRIGHT_CHANNEL=msedge`. Las pruebas de navegador interceptan respuestas de contrato exclusivamente en tests; la aplicación distribuida siempre usa la API configurada.

## Hostinger

Sube y extrae el ZIP compilado en la raíz del sitio del admin, normalmente `public_html`. `index.html`, `.htaccess`, `robots.txt` y `assets/` deben quedar directamente ahí. Activa HTTPS. No se ejecuta Node.js en el hosting para servir estos archivos estáticos. GitHub Actions comprueba tipos, build y flujos de navegador antes de generar un ZIP descargable; no despliega ni hace merge.

API temporal: `https://darksalmon-quetzal-730302.hostingersite.com/v1`. Después cambiaremos **VITE_API_BASE_URL a `https://api.motoapexcr.com/v1` y recompilaremos**. La variable se incorpora durante el build: cambiar un archivo .env en el hosting no modifica un ZIP ya compilado. Configura en el backend CORS con los orígenes HTTPS exactos del admin temporal/definitivo.

## Funciones implementadas

Login mediante `/auth/login`, validación de identidad con `/auth/me`, revocación con `/auth/logout`. Campos de acceso inicialmente vacíos. Bearer en memoria únicamente; recargar requiere login. Cualquier 401 privado elimina el token y vuelve al login. Si logout falla, se descarta la sesión local y se indica que no se pudo confirmar su revocación.

Marcas y categorías: listado, creación, edición y eliminación según rol. Marcas conservan logo, colores, hero, tile, tagline y slogan; categorías usan el ID real de marca o vacío para una categoría general. Marcas/categorías en uso se desactivan: la API rechaza borrarlas con 409.

Motos: listado y filtros, detalle, creación, edición, eliminación y publicación. Cada PUT envía la ficha privada completa conservando todos sus campos; incluye moneda CRC/USD, precio promocional nullable, flags, especificaciones `{group,label,value}`, colores y sus galerías. El guardado toma los IDs reales de la respuesta, incluidos los de colores/fotos. Solo los nuevos colores/fotos tienen un UUID provisional según el contrato; se reemplaza por los IDs recibidos.

Imágenes por enlaces HTTPS, sin carga de archivos ni blob URLs. Hasta 30 colores, 30 fotos por color y 100 especificaciones según API v1. Etiqueta, ALT, orden y una foto principal por color. Texto del servidor se renderiza como texto React, nunca HTML crudo.

Inventario: total por moto mediante PUT de ficha completa. No inventa endpoints de existencias por color, reservas o movimientos. Si el backend detecta inventario distribuido o reservas incompatibles, muestra su error sin afirmar guardado.

Leads: últimas 200 consultas, estado, asignación por ID real de usuario activo admin/sales (vacío desasigna), historial y agregado de notas mediante PATCH. No hay endpoint de listado de usuarios: el responsable se ingresa por ID y la API lo valida. Las notas enviadas son nuevas notas, no reemplazan el historial.

Cargas, reintentos, errores de conexión/timeout, estados vacíos y validación. Las confirmaciones se muestran después de respuesta exitosa. 403 indica autorización; 409 conflicto; 422 datos inválidos; 429 espera/Retry-After si CORS lo expone. X-Request-ID se muestra si está disponible. No hay reintentos automáticos de escrituras.

## Autorización y pendientes

La API actual devuelve el rol, pero no los permisos DB en `/auth/me`. La UI aplica los roles documentados y los permisos iniciales: admin/editor editan catálogo, marketing consulta y admin/sales gestionan leads. Solo admin elimina. Publicar o retirar publicación requiere `motorcycles.publish`; la UI lo limita a admin. La autoridad final es el backend, que consulta role_permissions y puede devolver 403 aunque el rol muestre una acción. Si después la API expone grants explícitos, la UI también los restringe. No se inventa una consulta de permisos.

Pendientes de API: promociones, contenido web, usuarios, MFA, recuperación de contraseña, analítica completa, notificaciones, movimientos de inventario y multimedia hero/card/mobile/videos/SEO aparte del slug. Sus pantallas muestran que están pendientes y no anuncian guardados ficticios. Dashboard calcula cantidades de las respuestas disponibles según rol; el resumen de leads usa solo las últimas 200 consultas.

## Verificación y pruebas reales pendientes

Comprobaciones locales: TypeScript, build y 13 pruebas de navegador sobre respuestas controladas del contrato. Cubren autenticación/401, token solo en memoria, roles, CRUD, preservación de PUT, IDs devueltos, galerías HTTPS, inventario, notas acumulativas y errores 403/409/422/429, estados vacíos y fallo de red. Son pruebas del frontend, no de la persistencia MySQL del backend.

El endpoint temporal `/v1/health` devolvió **HTTP 403** durante esta integración. No se confirmó la instalación correcta ni CORS ni una sesión real. Pendiente en Hostinger: salud DB, login/me/logout reales, permisos DB modificados, lectura después de escrituras para confirmar persistencia, conflictos de slug/SKU, reservas/inventario distribuido, galerías y notas, acceso desde los orígenes temporales y definitivos. No se enviaron escrituras de prueba al servidor real.

Las credenciales MySQL pertenecen exclusivamente al backend. El SQL inicial en `database/` es histórico: para instalar el backend sigue las migraciones y correcciones del PR #1 de api-motoapex; no reimportes el esquema inicial sobre una base existente.
