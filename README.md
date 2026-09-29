# QR dinámicos

Sistema para gestionar QR físicos que apuntan a una URL pública fija, pero cuyo destino puede cambiarse desde un panel administrativo sin reimprimir el código.

La idea es simple: cada tarjeta tiene un slug fijo, y el contenido asociado a ese slug vive en la base de datos. Eso permite vender QRs en blanco, imprimirlos una vez y luego activarlos para un negocio cuando corresponda.

## ¿Qué resuelve este proyecto?

Permite:

- vender o distribuir tarjetas QR en blanco
- asignarlas a un negocio cuando se concreta la venta
- cambiar sus links sin tocar el QR impreso
- pausar o reactivar un QR sin perder el slug
- generar copias de QR para imprimir
- leer métricas básicas y auditoría operativa

## Modelo de negocio

Cada QR apunta a una ruta pública del tipo:

- https://tudominio.com/r/qr-0001

Cuando un negocio activa ese QR, se le asigna:

- nombre del negocio
- links de redes, WhatsApp, Google Reviews, web, etc.
- estado activo, pausado o sin asignar

Cuando un cliente escanea el código:

- si hay un solo link, redirige directamente
- si hay varios, muestra una landing con botones para elegir
- si está pausado, muestra un mensaje de disponibilidad momentánea
- si todavía no fue vendido, muestra un estado sin asignar

## Stack

- Next.js 16
- App Router de Next.js
- TypeScript
- Supabase Postgres
- Supabase Auth para login del panel
- Server Actions para administración
- QR generado localmente en SVG
- Vitest para pruebas automatizadas

## Estructura del proyecto

```text
app/
  admin/
    page.tsx
  login/
    page.tsx
  r/
    [slug]/
      page.tsx
lib/
  actions.ts
  data.ts
  supabase.ts
  supabase-config.ts
  supabase-server.ts
  supabase-browser.ts
supabase/
  rls.sql
middleware.ts
package.json
plan.md
```

## Funcionalidades principales

### Panel administrativo

El panel `/admin` permite:

- generar lotes de QR en blanco
- activar un QR para un negocio
- editar el contenido del negocio
- pausar o reactivar clientes
- liberar un QR para reutilizarlo
- buscar por nombre o slug
- filtrar por estado
- generar QR individual y ZIP de lotes sin asignar
- revisar historial y métricas

### Redirección pública

La página `/r/[slug]` resuelve el destino según el estado:

- active
- paused
- unassigned

### QR real para impresión

Se reemplaza el uso de servicios externos por generación propia en SVG para que el QR sea más limpio, más claro y más amigable para impresión.

## Requisitos

Necesitás:

- Node.js 18 o superior
- npm
- una cuenta de Supabase
- una URL pública para el sitio (Vercel, Netlify, Railway u otra)
- un email autorizado para acceder al panel

## Variables de entorno

Crea un archivo `.env.local` con algo como esto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
ADMIN_EMAILS=tu-email@ejemplo.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

El valor de `ADMIN_EMAILS` debe incluir el mismo email que usarás para iniciar sesión en Supabase Auth.

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Luego abrís:

- http://localhost:3000
- http://localhost:3000/admin

## Scripts disponibles

```bash
npm run dev
npm run build
npm run start
npm test
```

## Seguridad y Supabase

La capa de seguridad real debe aplicarse en Supabase con el SQL de:

- `supabase/rls.sql`

Ese script habilita RLS y define políticas para:

- lectura pública de QR y estados
- permisos de escritura solo para el administrador
- registro de escaneos
- auditoría de cambios
- funciones de resumen de métricas

Importante: el código del proyecto no reemplaza la seguridad de la base de datos. El SQL debe ejecutarse en el proyecto de Supabase real.

## Flujo de uso

1. Generás un lote de QR en blanco desde el panel
2. Imprimís las tarjetas
3. Vendés o asignás el QR a un negocio
4. Activás el QR con nombre y links
5. El cliente escanea la tarjeta y llega al destino correcto
6. Si hace falta, pausás, editás o reutilizás el QR

## Reglas de negocio importantes

- El slug es la identidad pública del QR y no debe cambiarse una vez impreso
- Los links asociados sí pueden cambiar
- Si una URL no incluye protocolo, la app intenta agregar `https://` automáticamente
- El panel administrativo queda centralizado para el dueño del sistema

## Despliegue

Este proyecto está preparado para desplegarse en Vercel.

Pasos recomendados:

1. conectar el repo a Vercel
2. definir las variables de entorno
3. asegurar que `supabase/rls.sql` fue aplicado en Supabase
4. desplegar la app
5. validar login, panel y QR público con una prueba real

## Estado del proyecto

El proyecto ya incluye la funcionalidad base de QR dinámicos, panel admin, seguridad por login, generación de QR SVG y reseteo reutilizable del mismo QR.

Las siguientes etapas prácticas son:

- aplicar el SQL de seguridad en Supabase real
- validar impresión física del QR
- probar un caso real de negocio
- dejar el pricing y la política de activación/pausa definidas

## Créditos

Proyecto pensado para gestión operativa de QR de negocios locales, con activación por administración central y contenido dinámico por QR.
