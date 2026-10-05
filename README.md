# MotoApex Admin

Panel React + Vite. Requiere Node.js 22.12 o posterior y pnpm 10.34.3 para compilar.

## Desarrollo y compilación

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm preview
```

## Publicar en Hostinger

El resultado es estático: Hostinger no necesita ejecutar Node.js para servirlo.

1. Configura el dominio o subdominio del admin en hPanel y activa su certificado SSL y HTTPS.
2. Ejecuta `pnpm build` o descarga el artefacto `admin-motoapex-hostinger` de GitHub Actions.
3. Sube y extrae el contenido de `dist` en la raíz del sitio correspondiente (normalmente `public_html`). `index.html`, `.htaccess`, `robots.txt` y `assets` deben quedar directamente en esa raíz, sin una carpeta `dist` intermedia.
4. Abre el sitio por HTTPS y verifica el inicio de sesión y la navegación. En cada actualización reemplaza el contenido de la compilación anterior, conservando otros archivos del hosting que necesites.

Las rutas de los recursos son relativas para admitir un subdominio o una subcarpeta. `.htaccess` incluye la entrada de la aplicación, evita listar directorios y desaconseja indexar el admin. Las reglas de robots no restringen el acceso.

Si usas la opción de aplicaciones web de Hostinger con GitHub, configura `pnpm build` como comando de compilación y `dist` como directorio de salida. Un despliegue Git que solo copia el código fuente no reemplaza la compilación.

## Estado funcional

Esta versión es una interfaz de demostración. Usa `src/data/mock.ts`; no está conectada a la API ni guarda cambios en una base de datos. El login actual acepta un correo con `@` y no valida la contraseña contra un servidor. Antes de usarlo para administrar datos reales, conecta la API, implementa autenticación y autorización en el backend y sustituye los datos de ejemplo. No incluyas secretos en el frontend.
