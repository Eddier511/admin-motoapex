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

Los banners no tienen controles de inicio ni fin: al crear o guardar se envían startsAt y endsAt como null. Guardar un banner existente elimina su programación anterior; su estado Activo/Inactivo controla la publicación. Las promociones conservan las fechas exigidas por su contrato y las envían con zona horaria y segundos, sin milisegundos.

Páginas se retiró de la interfaz de Contenido web, que abre en Banners y conserva Contacto y horarios y Redes sociales. Los banners se guardan sin página relacionada (pageId null), sin consultar /admin/pages. Esta modificación de la interfaz no elimina registros existentes de la base de datos. La suite actual verifica la ausencia de Páginas y de esas consultas en lugar de su CRUD anterior.

Promociones oculta slug, imagen y destino manual. Al crear genera un slug a partir del título con sufijo aleatorio; al editar conserva el slug del servidor. Usa la imagen primaria HTTPS de la primera moto seleccionada, o su primera foto HTTPS disponible. Si falta moto o foto, bloquea el guardado con un error visible. Las fechas de calendario usan America/Costa_Rica: inicio 00:00:00 y final 23:59:59 (offset -06:00), respetando el día al volver a editar. Mantiene texto del botón, precios y monedas por moto. La API aún exige buttonHref; se envía /motocicletas como destino seguro. La web debe implementar la apertura del popup usando motorcycleId y los precios/endsAt de la promoción; ese cambio visual no se implementa en este repositorio.

## Pendiente en Hostinger, con datos desechables

1. Confirmar migraciones 002–005 con el administrador del backend. No borrar/reimportar la base.
2. Login/me/logout reales desde el dominio admin y CORS, incluyendo X-Reauth-Token y encabezados expuestos.
3. Crear registros privados con identificador de prueba en promociones, páginas, banners, redes y usuarios; volver a leer para acreditar persistencia. Eliminar solo esos registros mediante los endpoints lógicos. Mantener al menos un admin activo.
4. Verificar permisos DB, 403, slug/correo duplicados, 422 y LAST_ADMIN en una base aislada. No intentar eliminar/desactivar el último admin real como prueba.
5. Confirmar SMTP con un buzón de prueba, SPF/DKIM y URL de reset. Validar enlace usado/vencido y mensaje genérico para correo inexistente. Un 503 SMTP_NOT_CONFIGURED exige configuración del backend; no implica envío.
6. MFA en una cuenta desechable con autenticador real: alta, QR, confirmación, login/challenge, antirrepetición TOTP, recuperación, rotación y desactivación. Reautenticación con código nuevo y token vencido/usado. Verificar Sodium y clave privada según accounts-install.md.
7. Cambio obligatorio, perfil/correo y contraseña; comprobar que las sesiones revocadas reciben 401 y el admin vuelve al login. Si SMTP/MFA faltan, registrar 503 explícito y completar la instalación del backend.

No se probaron estas escrituras ni envío SMTP/MFA reales en este trabajo. No hay despliegue manual ni merge automático. Futuro endpoint https://api.motoapexcr.com/v1: requiere recompilar y ajustar configuración privada de API.
