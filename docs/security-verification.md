# Seguridad y compatibilidad — 27 de octubre de 2026

Base API actual: https://darksalmon-quetzal-730302.hostingersite.com/v1. Futura: https://api.motoapexcr.com/v1. Cambiar la URL exige recompilar y coordinar CORS, certificados y password_reset_url del servidor.

## Revisión de API

PR #5 de Eddier511/api-motoapex, rama codex/security-hardening, commit 256801cea0e35e826d9722f6a8e20cbc7fccdabf. Se leyeron contract.md, accounts-install.md, security-hardening.md y los cambios de router/repositorio/lecturas. Su CI 40559466845 terminó success para ese SHA en los tres trabajos PHP 8.3.36, 8.4.27 y 8.5.12; no se hizo merge ni instalación desde el admin.

saveResource verifica inventory.manage si cambia la cantidad. Omitir inventory en PUT conserva existencias en esa revisión. El admin deshabilita el campo sin permiso y conserva su valor original en el PUT completo, por compatibilidad con la API anterior que interpreta una omisión como cero. Un cambio concurrente puede ser rechazado por la API nueva: debe recargarse la ficha. El control del servidor es indispensable, no se declara corregido desde la interfaz.

La lectura pública /public/brands?limit=1 devolvió cuatro registros sin X-Page-Limit ni X-Next-Cursor. Esto no acredita instalación del PR #5; hay que verificar el paquete/revisión en Hostinger. No se usaron credenciales reales ni se ejecutaron operaciones privadas, correos, migraciones o cambios en producción.

## Correcciones del admin

- AbortController compartido por sesión, además de cancelación por componente/timeout. Cambio de token, logout, 401 y vencimiento descartan solicitudes anteriores; generation impide aceptar respuestas de otra cuenta. La revocación del token anterior se envía por separado con su Bearer capturado. Un aborto cliente no revierte una transacción que ya haya confirmado el servidor.
- Limpieza de formularios por desmontaje, desafíos, códigos y notificaciones al terminar/cambiar sesión. Alta MFA conserva únicamente la presentación única de los códigos entregados por el servidor tras la revocación obligatoria; rotación no sobrevive al vencimiento. El diálogo se limpia al cerrar o a los cinco minutos.
- Validación de respuestas de auth, MFA, usuarios, catálogo y módulos antes de confirmar éxito. DELETE exige deleted:true; una respuesta HTTP exitosa vacía/malformada no equivale a guardado. Sin información privada en errores de validación.
- Listados paginados según X-Next-Cursor, incluyendo páginas vacías; limit/cursor opacos mediante URLSearchParams. PAGE_TOO_LARGE reduce limit, sin reintentar escrituras. Cursor repetido o listado demasiado grande se informa sin truncamiento silencioso. Con la API anterior, una respuesta array sin cursor termina la lectura normalmente.
- inventory.manage controla edición; motorcycles.publish sigue separado. Permisos efectivos se usan si la API los entrega; los roles desconocidos sin grants no reciben permisos inventados. /auth/me actual aún no expone esos permisos: queda como dependencia contractual para roles delegados.
- URLs de catálogo y marca rechazan credenciales y esquemas ejecutables. PUT de banners conserva vigencia/pageId existentes aunque esos controles sigan ocultos por decisión del producto. Páginas permanece retirada del menú.
- Node de compilación fijado a 22.23.4 y pnpm 10.34.3. Vite 8.3.3, PostCSS 8.5.23, nanoid 3.3.18 y source-map-js 1.2.2; no audit fix ni actualización general de paquetes.
- Dev/preview en loopback. CSP sin scripts externos, noindex, no-referrer, anti-iframe, nosniff y HSTS en el paquete. QR local permitido como imagen data:. No analytics ni scripts arbitrarios de .figma/make/site.json. El chequeo del paquete usa los bytes compilados; software de protección del equipo puede modificar el DOM del navegador durante pruebas y no forma parte del artefacto generado.

## Validación y límites

Compilar y ejecutar Playwright con respuestas controladas y contraseñas desechables. Regresiones de cancelación de mutaciones al logout, login nuevo durante revocación anterior, expiración de códigos/reauth, respuestas malformadas, permisos de inventario, páginas vacías/cursor, PAGE_TOO_LARGE, errores HTML del gateway y recuperación encolada. Se mantienen los flujos de catálogo, leads, usuarios/LAST_ADMIN, promociones, contenido, perfil, cambio obligatorio y MFA. La ejecución local final aprobó 67 pruebas con Edge, TypeScript sin emisión y compilación. pnpm install --frozen-lockfile fue reproducible y ambos audit (completo/producción) devolvieron cero avisos conocidos. Revisar también la ejecución CI del commit final.

pnpm audit consulta avisos conocidos: un resultado cero no prueba ausencia de vulnerabilidades. check-production detecta indicadores concretos de secretos/mocks/source maps y comprueba CSP/cabeceras; no es un escáner exhaustivo. La instalación global de Node del equipo no se reemplaza: se usó un runtime portable parcheado y se fijó el mismo piso en el proyecto/CI.

Las cabeceras nuevas requieren instalar el ZIP/.htaccess en Hostinger; un push solo genera el artefacto de CI. Verificar después DNS, certificados, ausencia de Vite dev/preview expuesto y cabeceras reales. El contrato nuevo de recuperación exige migraciones pendientes 002–006, configuración privada y cron del worker bin/process-mail-queue.php 20 cada minuto. Sin worker no hay entrega SMTP. No se creó un cron externo ni se probó entrega real.

## Verificación pendiente de API/alojamiento

En un entorno desechable: comprobar permisos reales y cambios concurrentes de inventario, revocación de permisos/sesiones, SQL/persistencia, cola cifrada, worker/leases/reintentos y SMTP local, runtime PHP soportado, CORS con X-Next-Cursor/X-Page-Limit y X-Reauth-Token, y paquete privado fuera de public_html. En producción, solo GET/OPTIONS hasta autorización específica. No reutilizar credenciales publicadas en chats. Rotaciones privadas de credenciales y versión PHP dependen del responsable de hosting.
