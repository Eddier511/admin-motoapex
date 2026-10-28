# Verificación de integración

## Servidor real: GET sin credenciales, 2026-10-05 UTC

| Ruta | Resultado |
|---|---|
| /health | 200 |
| /public/promotions | 200 |
| /public/pages, /public/banners | 200 |
| /public/contact, /public/social-links | 200 |
| /public/settings | 200 |
| /admin/users, /admin/roles | 401 UNAUTHENTICATED |
| /admin/settings, /admin/lead-assignees | 401 UNAUTHENTICATED |
| /auth/profile, /auth/mfa/status | 401 UNAUTHENTICATED |

Base: https://darksalmon-quetzal-730302.hostingersite.com/v1. No se detectó una ruta pública faltante en esta comprobación. Los 401 privados son esperados y no demuestran persistencia de escrituras ni instalación completa de tablas de seguridad. No se consultó schema_migrations ni se aplicaron migraciones desde el admin. Health solo prueba conexión DB.

OPTIONS /admin/users desde https://admin.motoapexcr.com devolvió 204, Access-Control-Allow-Origin exacto, Authorization/Content-Type/X-Reauth-Token permitidos y X-Request-ID/Retry-After expuestos. Otros dominios temporales del admin requieren su propia comprobación.

## Pruebas locales

Las eliminaciones de marcas, categorías, motocicletas y módulos comparten una confirmación visual con fondo gris, foco de teclado contenido, Escape/cancelación y restauración del foco. Desactivar MFA usa esa misma confirmación antes de la reautenticación requerida. Cancelar no envía una escritura. Los toast de éxito solo aparecen tras respuesta exitosa; los errores del servidor conservan el registro y muestran el error. Se verifican móvil y escritorio. El dashboard ya no muestra el aviso obsoleto de promociones pendientes; explica cuando la API devuelve consultas vacías.

Typecheck/build y Playwright/Edge con respuestas controladas, IDs de prueba y contraseñas desechables. Cubren catálogo/PUT permitido/precios/galerías/especificaciones/inventario, leads/notas/asignación, CRUD de promociones/páginas/banners/redes/usuarios, contacto singleton, settings whitelist, roles y errores. Seguridad: login normal, desafío MFA, cambio obligatorio y ambos en orden, desafío inválido, códigos de recuperación, perfil, contraseña, reautenticación con propósito y uso único, QR local, MFA alta/confirmación/rotación/desactivación, revocación, recuperación genérica, SMTP pendiente y fragmento de reset retirado. Escritorio y móvil sin desbordamiento.

La suite no conecta una cuenta real ni altera los datos del servidor. El frontend compilado no incluye mocks. GitHub Actions debe ejecutar esa misma suite y generar el ZIP; comprobar su resultado antes de instalar.

Los banners no tienen controles de inicio ni fin. Al crear no se programa vigencia; al editar se conservan startsAt/endsAt recibidos, para no ampliar involuntariamente una campaña existente. Las promociones admiten ambas fechas nulas según API PR #6 y migración 007; las fechas no nulas llevan zona horaria y segundos, sin milisegundos.

Páginas se retiró de la interfaz de Contenido web, que abre en Banners y conserva Contacto y horarios y Redes sociales. Los banners nuevos se crean sin página relacionada; los existentes conservan su pageId sin consultar /admin/pages. Esta modificación de la interfaz no elimina registros existentes de la base de datos. La suite actual verifica la ausencia de Páginas y de esas consultas en lugar de su CRUD anterior.

Promociones oculta slug, imagen y destino manual. Al crear genera un slug a partir del título con sufijo aleatorio; al editar conserva el slug del servidor. Usa la imagen primaria HTTPS de la primera moto seleccionada, o su primera foto HTTPS disponible. Si falta moto o foto, bloquea el guardado con un error visible. Las nuevas promociones no tienen límites de fechas por defecto. «Programar vigencia (opcional)» permite elegir solo inicio, solo fin o ambos; desmarcarlo quita ambos límites con null explícito. Las fechas de calendario nuevas usan America/Costa_Rica: inicio 00:00:00 y final 23:59:59 (offset -06:00). Un límite existente se conserva como instante exacto mientras no se cambie su campo. Mantiene texto del botón, precios y monedas por moto. La API aún exige buttonHref; se envía /motocicletas como destino seguro. La web debe implementar la apertura del popup usando motorcycleId y los precios/endsAt de la promoción; ese cambio visual no se implementa en este repositorio.

### Promociones sin fechas — dependencia de instalación

Los formularios de estos módulos se abren en un popup centrado, con fondo gris, desplazamiento interno y cierre mediante Cancelar, X, Escape o clic fuera cuando no se está guardando. El foco queda dentro y vuelve al botón que abrió el editor; la reautenticación de usuarios suspende el formulario mientras solicita identidad.

La columna Estado de Promociones incorpora un interruptor accesible. Lee la ficha actual y envía un PUT completo con campos editables, cambiando únicamente status. Conserva imagen, destino, fechas y todas las parejas de precios/monedas de las motos; no deriva estado de la fecha. No actualiza el estado visual ni muestra toast de éxito hasta recibir una respuesta válida con el estado solicitado. Un error conserva el estado confirmado y permite reintentar. Requiere promotions.manage y la API sigue siendo autoridad.

Contrato verificado en API commit `3ed3ef2f4ed673ba6648a10fe88cc75334592cc0`, PR #6, rama `codex/promotions-optional-dates`. No asumir que está en main o instalado. Antes de usar promociones sin límites, instalar esa revisión de API y `database/007_optional_promotion_dates.sql`, después de 006 y un respaldo. El frontend no ejecuta migraciones ni despliega la API.

POST/PUT incluyen siempre startsAt y endsAt: null/null sin límite, inicio/null desde inicio, null/fin hasta fin y ambas con rango inclusivo. No se envían cadenas vacías, "null", claves omitidas ni fechas inventadas. El DTO y la validación de respuestas aceptan únicamente null o fechas válidas con zona; rechazan claves ausentes y límites invertidos. No se calcula expired desde el navegador: se conserva el estado explícito del servidor.

Las pruebas aisladas cubren las cuatro combinaciones, conservación de instantes, retirada de límites, POST sin fechas, precios/moneda/relaciones y 422 sin confirmación falsa. No sustituyen un guardado real contra la API instalada. Verificar con cuenta desechable autorizada cuando API y migración estén disponibles; no usar credenciales de chats ni escribir datos de producción durante estas pruebas.

## Pendiente en Hostinger, con datos desechables

1. Confirmar migraciones 002–005 con el administrador del backend. No borrar/reimportar la base.
2. Login/me/logout reales desde el dominio admin y CORS, incluyendo X-Reauth-Token y encabezados expuestos.
3. Crear registros privados con identificador de prueba en promociones, páginas, banners, redes y usuarios; volver a leer para acreditar persistencia. Eliminar solo esos registros mediante los endpoints lógicos. Mantener al menos un admin activo.
4. Verificar permisos DB, 403, slug/correo duplicados, 422 y LAST_ADMIN en una base aislada. No intentar eliminar/desactivar el último admin real como prueba.
5. Confirmar SMTP con un buzón de prueba, SPF/DKIM y URL de reset. Validar enlace usado/vencido y mensaje genérico para correo inexistente. Un 503 SMTP_NOT_CONFIGURED exige configuración del backend; no implica envío.
6. MFA en una cuenta desechable con autenticador real: alta, QR, confirmación, login/challenge, antirrepetición TOTP, recuperación, rotación y desactivación. Reautenticación con código nuevo y token vencido/usado. Verificar Sodium y clave privada según accounts-install.md.
7. Cambio obligatorio, perfil/correo y contraseña; comprobar que las sesiones revocadas reciben 401 y el admin vuelve al login. Si SMTP/MFA faltan, registrar 503 explícito y completar la instalación del backend.

No se probaron estas escrituras ni envío SMTP/MFA reales en este trabajo. No hay despliegue manual ni merge automático. Futuro endpoint https://api.motoapexcr.com/v1: requiere recompilar y ajustar configuración privada de API.


## Actualización de seguridad del 27 de octubre

Consultar security-verification.md para cambios, pruebas y límites actuales. La integración soporta el contrato del PR #5 codex/security-hardening (256801ce) además de la versión anterior. Aplicar 006 y configurar worker SMTP es obligatorio en el backend nuevo; solo se verificó lectura sin credenciales en producción.
