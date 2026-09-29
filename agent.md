# agent.md — Contexto del proyecto

Este archivo existe para que cualquier asistente de IA (Claude, ChatGPT, Copilot, etc.)
entienda rápido de qué se trata el proyecto sin tener que leer todo el código primero.

## ¿Qué es esto?

Un sistema de **QR dinámicos** para negocios locales. La idea de negocio:

1. Se compran/imprimen QRs en blanco por lote (ej: 100 tarjetas).
2. Cada QR apunta a una URL fija de este sitio: `tudominio.com/r/{slug}`
   (ej: `tudominio.com/r/qr-0001`).
3. El dueño del proyecto vende las tarjetas físicas a negocios locales
   (peluquerías, cafés, kioscos, etc.).
4. Cuando un negocio compra una tarjeta, el dueño del proyecto entra al
   panel `/admin` y **activa** ese QR: le pone el nombre del negocio y
   los links a donde quiere que la gente vaya (Google Reviews, Instagram,
   WhatsApp, Facebook, su web).
5. Cuando un cliente final escanea el QR en el local, el sitio:
   - Si el negocio cargó UN solo link → redirige directo ahí.
   - Si cargó VARIOS links → muestra una mini-landing con botones
     (tipo Linktree) para que el cliente final elija a dónde ir.
6. El slug del QR **nunca cambia** una vez impreso. Lo que cambia es
   el contenido asociado a ese slug en la base de datos — por eso es
   "dinámico": el papel es fijo, el destino es editable.

## Estados posibles de un QR (columna `status` en la tabla `clients`)

- `unassigned` → QR impreso, todavía sin vender/asignar a ningún negocio.
- `active` → asignado a un negocio, funcionando normalmente.
- `paused` → el negocio dejó de pagar / se dio de baja. El QR muestra
  un mensaje de "pausado" en vez de redirigir.

## Stack técnico

- **Next.js 16.3.6 (App Router)** — el sitio web, alojado en **Vercel**.
- **Supabase (Postgres)** — la base de datos. Tablas principales:
  - `clients`: un registro por cada QR/slug (asignado o no).
  - `client_links`: los links de cada cliente (relación 1 a muchos).
  - `scan_events`: registros de escaneos.
  - `client_audit_log`: historial de cambios administrativos.
- **Server Actions** de Next.js para las escrituras desde el panel
  `/admin` (activar/editar/liberar clientes, pausar y generar lotes).
- `scan_events` y `client_audit_log` se crean junto con sus políticas,
  funciones y triggers mediante `supabase/rls.sql`.
- Los QRs se generan localmente en SVG; el panel ofrece descargas SVG,
  ZIP de QRs sin asignar y una plantilla de tarjeta imprimible.

## Estructura de archivos

```
app/
  layout.tsx          → layout raíz obligatorio de Next.js
  page.tsx            → home simple con links de ejemplo
  admin/page.tsx       → EL PANEL. Acá se activan/pausan QRs.
  r/[slug]/page.tsx     → LA PÁGINA QUE VE EL CLIENTE FINAL al escanear
lib/
  data.ts             → todas las lecturas/escrituras a Supabase
  actions.ts          → Server Actions que usan los <form> del panel
  supabase.ts         → cliente de Supabase (URL + clave pública)
```

## Decisiones de diseño importantes (para no romper el modelo)

- El `slug` es la clave pública e inmutable. Los links asociados son
  mutables. Nunca cambiar el slug de un cliente ya impreso.
- Si una URL cargada no empieza con `http://` o `https://`, el sistema
  le agrega `https://` automáticamente (si no, el navegador la trata
  como una ruta interna del propio sitio y rompe la redirección).
- La tabla `client_links` está separada de `clients` (en vez de columnas
  fijas `link_google`, `link_instagram`, etc.) para poder agregar
  plataformas nuevas sin modificar el schema.

## Pendientes antes de vender

- Ejecutar `supabase/rls.sql` en el proyecto remoto y revisar la salida de
  `pg_policies`; las políticas no se pueden confirmar desde el código local.
- Probar el flujo con un negocio real e imprimir/leer una tarjeta física.
- Definir el precio final luego de cotizar impresión, impuestos y comisiones.
- La gestión se mantiene centralizada en `/admin`; no se habilitan cuentas
  para clientes mientras el dueño configure los destinos.
