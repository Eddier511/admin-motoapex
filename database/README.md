# Base de datos MotoApex

Importa `motoapex.sql` en una base **vacía** seleccionada en phpMyAdmin. Compatible con MySQL 8.0.16+ y MariaDB 10.6+. Verifica la versión con `SELECT VERSION();`. Crea la base y su usuario en hPanel; este script no ejecuta CREATE DATABASE ni necesita permisos para crear usuarios, triggers o eventos. Sí requiere permisos de tablas y vistas.

No lo vuelvas a importar sobre una base instalada: es la migración inicial, no un actualizador. El DDL de MySQL no es transaccional; si la importación falla, revisa el error antes de reintentar sobre las tablas creadas. No se borran tablas ni se desactivan claves foráneas.

## Cobertura

- Usuarios, roles y permisos, sesiones revocables, recuperación de contraseña, intentos de acceso, secretos 2FA cifrados y códigos de recuperación.
- Marcas y categorías con estado, orden y recursos gráficos.
- Motos nuevas y usadas, precios CRC/USD, estados de disponibilidad y publicación, destacados, kilometraje, dueños, SEO y fechas de publicación.
- Especificaciones técnicas del formulario y filas ilimitadas de especificaciones personalizadas.
- Colores independientes y galerías sin límite fijo de fotos; etiqueta, texto alternativo, orden y una foto principal por color. Recursos hero, card y móvil, galerías, documentos y videos.
- Inventario por moto/color/ubicación, reservas, movimientos e identificación opcional de unidades por VIN.
- Promociones con varias motos y precios, fechas e imagen; vista de promociones vigentes.
- Leads, responsables, notas, historial, seguimiento, pruebas de manejo y cotizaciones con partidas.
- Páginas, banners, contacto, redes sociales, ajustes, revisiones, auditoría, notificaciones y eventos de analítica.

## Contrato para la API

Los IDs son BIGINT UNSIGNED; serialízalos como cadenas en JavaScript. Las relaciones usan IDs reales, no los identificadores ficticios de `mock.ts`. `order` del frontend corresponde a `sort_order`; `year` a `model_year`; `status` de motos a `availability_status`; `published` se deriva de `publication_status = 'published'`; `inventory` se deriva de `v_motorcycle_inventory`. `is_new` es la etiqueta de novedad, mientras `condition_type` distingue nuevas y usadas. No dupliques existencias en motorcycles.

Las fotos se guardan como archivos en hosting/almacenamiento; la base guarda URL, clave y metadatos en media_assets. No hay columnas foto1/foto2 ni un número máximo por galería. El almacenamiento y la API pueden tener cuotas operativas. Evita borrar archivos que aún tengan referencias; los vínculos usan claves foráneas. Una foto principal por color y un hero/card/mobile por moto se controlan con índices únicos. Para cambiar la principal, quita la anterior y asigna la nueva en la misma transacción.

Inventario: en una transacción bloquea la fila con SELECT ... FOR UPDATE, valida existencias, modifica inventory_stock e inserta inventory_movements. quantity incluye las reservadas; disponibles = quantity - reserved_quantity. Los movimientos son un historial, no actualizan el saldo automáticamente. Las unidades/VIN son opcionales: si se usan, la API debe mantener sus estados coherentes con el saldo. Color NULL admite inventario de motos sin colores. La clave foránea compuesta impide asignar un color de otra moto.

La API debe validar HEX, URLs, permisos, JSON de revisiones/auditoría/ajustes, parentesco de categorías sin ciclos, categoría compatible con marca, consentimiento, y fechas. Debe aplicar publicación programada y resolver promociones vigentes; no hay tareas automáticas SQL. No renderices HTML sin sanitizar. El historial y la auditoría se escriben en la misma transacción del cambio; no guardes contraseñas, tokens ni secretos en esos registros. Aplica retención a datos de contacto, sesiones y analítica.

Todas las fechas se guardan en UTC; establece time_zone = '+00:00' en cada conexión. Presenta fechas en America/Costa_Rica. Los precios son DECIMAL; evita operaciones financieras con flotantes. La API debe comprobar moneda al aplicar promociones y cotizaciones. Los permisos iniciales son una propuesta modificable, no sustituyen la autorización del servidor.

Crea el primer administrador desde la API/CLI con hash bcrypt o Argon2id. No hay contraseña predeterminada. Guarda solo SHA-256 de tokens aleatorios de sesión/recuperación y códigos de recuperación; cifra el secreto 2FA con una clave externa a la base. Las credenciales de la base pertenecen exclusivamente al backend.

Importar este esquema no conecta el admin: todavía requiere implementar la API y sustituir los mocks. Validación realizada: revisión estructural de tablas, referencias, índices y semillas; no se ejecutó una importación real porque este entorno no tiene servidor MySQL.
