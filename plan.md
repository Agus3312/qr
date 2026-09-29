# plan.md — Hoja de ruta

## ✅ Ya hecho

- [x] Definir el modelo de negocio: QR fijo + destino editable en base de datos
- [x] Decidir usar solo QR (sin NFC) por costo y adopción
- [x] Modelo de "QRs en blanco pre-generados" que se activan al vender
- [x] Base de datos en Supabase (tablas `clients` y `client_links`)
- [x] Página de redirección `/r/[slug]` con 4 estados:
      sin activar / pausado / redirect directo (1 link) / landing con botones (varios links)
- [x] Panel `/admin` para:
      - generar lotes nuevos de QRs en blanco
      - activar un QR (nombre del negocio + links)
      - pausar / reactivar un cliente
- [x] Deploy en Vercel con URL de producción estable
- [x] Actualizar Next.js a una versión sin vulnerabilidades reportadas por `npm audit`
- [x] Corrección: agregar `https://` automático si el usuario carga
      una URL sin protocolo (bug detectado con el caso "youtube.com")

## 🔜 Próximos pasos (en orden sugerido)

### 1. Seguridad del panel (antes de vender, es lo más urgente)
- [x] Login con Supabase Auth
- [x] Restringir `/admin` para que solo el administrador pueda entrar
- [ ] Ejecutar `supabase/rls.sql` en el proyecto de Supabase y confirmar
      que el resultado final liste las políticas esperadas

### 2. Generación de QR real para imprimir
- [x] Reemplazar el preview de `api.qrserver.com` (solo para mirar en pantalla)
      por generación propia en SVG (vectorial, no se pixela al imprimir grande)
- [x] Botón de "Descargar QR" en cada tarjeta del panel
- [x] Opción de descargar los QRs sin asignar de una sola vez (ZIP)

### 3. Mejoras al panel / operación diaria
- [x] Buscador por nombre/slug y filtro por estado
- [x] Historial de activación, edición, pausa y liberación con actor y fecha
- [x] Editar los links de un cliente sin reactivar un QR pausado
- [x] Registrar escaneos y mostrar totales históricos y de los últimos 30 días
- [x] Plantilla imprimible de 85 × 55 mm desde la tarjeta de cada QR

> Historial y métricas requieren aplicar `supabase/rls.sql` en Supabase.

### 4. Antes de la primera venta real
- [ ] Probar el flujo completo con un negocio real (no solo datos de prueba)
- [ ] Imprimir la plantilla y escanearla con un celular para validar tamaño,
      contraste y lectura en condiciones reales
- [ ] Definir precio final luego de cotizar impresión, comisiones e impuestos.
      Modelo recomendado: costo inicial de tarjeta + mantenimiento mensual opcional.
- [x] Política inicial ante falta de pago: pausa manual desde `/admin`;
      no automatizar hasta integrar un sistema de cobro

## 💡 Ideas a futuro (no urgentes)

- El mini-panel para negocios queda fuera del alcance por ahora: la gestión
      de clientes y destinos se mantiene centralizada en `/admin`.
- Las métricas y la plantilla imprimible ya están implementadas; validar con
      el SQL y una impresión física antes de ofrecerlas a clientes.

