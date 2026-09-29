import { generateBatchAction, activateClientAction, editClientAction, toggleStatusAction } from "@/lib/actions";
import { getAllClients, getQrScanSummary, getRecentAuditEvents } from "@/lib/data";
import { headers } from "next/headers";
import LogoutButton from "@/app/admin/logout-button";
import ResetClientButton from "@/app/admin/reset-client-button";
import { filterClients, formatAuditAction, whatsAppLinkToInput, type QrStatus } from "@/lib/qr-admin-domain";
import { getQrBaseUrl } from "@/lib/site-url";

type AdminPageProps = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = await searchParams;
  const [clients, auditEvents, scanSummary] = await Promise.all([
    getAllClients(),
    getRecentAuditEvents(),
    getQrScanSummary(),
  ]);
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const baseUrl = getQrBaseUrl(`${protocol}://${host}`);
  const query = resolvedSearchParams.q ?? "";
  const requestedStatus = resolvedSearchParams.status;
  const selectedStatus: QrStatus | "all" =
    requestedStatus === "active" || requestedStatus === "paused" || requestedStatus === "unassigned"
      ? requestedStatus
      : "all";
  const visibleClients = filterClients(clients, query, selectedStatus);
  const activeCount = clients.filter((client) => client.status === "active").length;
  const pausedCount = clients.filter((client) => client.status === "paused").length;
  const availableCount = clients.filter((client) => client.status === "unassigned").length;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">QR dinámicos</p>
          <h1>Panel de control</h1>
          <p className="muted">Gestioná tus tarjetas, destinos y estados desde un solo lugar.</p>
        </div>
        <LogoutButton />
      </header>

      <section className="stats-grid" aria-label="Resumen">
        <div className="stat-card"><span>QR totales</span><strong>{clients.length}</strong></div>
        <div className="stat-card stat-active"><span>Activos</span><strong>{activeCount}</strong></div>
        <div className="stat-card stat-available"><span>Sin asignar</span><strong>{availableCount}</strong></div>
        <div className="stat-card stat-paused"><span>Pausados</span><strong>{pausedCount}</strong></div>
      </section>

      <section className="batch-panel">
        <div>
          <p className="eyebrow">Inventario</p>
          <h2>Generar nuevos QR</h2>
          <p className="muted">Cada código recibe un slug permanente listo para imprimir.</p>
        </div>
        <form className="batch-form" action={generateBatchAction}>
          <label htmlFor="count">Cantidad</label>
          <input id="count" name="count" type="number" min="1" max="500" defaultValue="10" />
          <button type="submit">Generar lote</button>
        </form>
      </section>

      <section className="clients-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tarjetas</p>
            <h2>Todos tus QR</h2>
          </div>
          <div className="card-actions">
            <span className="count-label">{visibleClients.length} de {clients.length} registrados</span>
            {availableCount > 0 && (
              <a className="button button-secondary" href="/admin/qr-sheet">Descargar imagen de QR disponibles</a>
            )}
          </div>
        </div>
        <form className="client-filter" action="/admin" method="get">
          <label>Buscar por negocio o QR<input name="q" type="search" defaultValue={query} placeholder="Ej. qr-0001 o Café Sur" /></label>
          <label>Estado
            <select name="status" defaultValue={selectedStatus}>
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="unassigned">Sin asignar</option>
              <option value="paused">Pausados</option>
            </select>
          </label>
          <div className="filter-actions">
            <button type="submit">Filtrar</button>
            {(query || selectedStatus !== "all") && <a href="/admin">Limpiar</a>}
          </div>
        </form>
        {clients.length === 0 ? (
          <div className="empty-state"><h3>No hay QRs cargados todavía</h3><p>Generá un lote para empezar.</p></div>
        ) : visibleClients.length === 0 ? (
          <div className="empty-state"><h3>No encontramos coincidencias</h3><p>Probá con otro nombre, código o estado.</p></div>
        ) : (
          <div className="clients-grid">
            {visibleClients.map((client) => {
              const qrUrl = `${baseUrl}/r/${client.slug}`;
              const qrPath = `/admin/qr/${encodeURIComponent(client.slug)}`;
              return (
                <article className="client-card" key={client.slug}>
                  <div className="qr-preview">
                    <img src={qrPath} alt={`QR de ${client.slug}`} width="240" height="240" />
                  </div>
                  <div className="client-content">
                    <div className="client-title-row">
                      <div><span className="slug">{client.slug}</span><h3>{client.businessName ?? "Disponible para asignar"}</h3></div>
                      <span className={`status status-${client.status}`}>{client.status}</span>
                    </div>
                    <p className="scan-summary">
                      {scanSummary?.[client.slug]?.totalCount ?? 0} escaneos totales · {scanSummary?.[client.slug]?.recentCount ?? 0} en 30 días
                    </p>
                    <a className="qr-link" href={qrUrl} target="_blank" rel="noreferrer">{qrUrl}</a>
                    <div className="card-actions">
                      <a className="button button-secondary" href={`${qrPath}?download=1`}>Descargar SVG</a>
                      <a className="button button-secondary" href={`/admin/card/${encodeURIComponent(client.slug)}`}>Tarjeta imprimible</a>
                      {client.status === "unassigned" ? (
                        <details>
                          <summary className="button">Activar</summary>
                          <form className="activate-form" action={activateClientAction}>
                            <input type="hidden" name="slug" value={client.slug} />
                            <label>Negocio<input name="businessName" required /></label>
                            <label>Google<input name="google" type="url" placeholder="https://..." /></label>
                            <label>Instagram<input name="instagram" type="url" placeholder="https://..." /></label>
                            <label>WhatsApp<input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="+54 9 11 1234-5678" /></label>
                            <label>Facebook<input name="facebook" type="url" placeholder="https://..." /></label>
                            <label>Web<input name="web" type="url" placeholder="https://..." /></label>
                            <button type="submit">Guardar y activar</button>
                          </form>
                        </details>
                      ) : (
                        <>
                          <details>
                            <summary className="button button-secondary">Editar links</summary>
                            <form className="activate-form" action={editClientAction}>
                              <input type="hidden" name="slug" value={client.slug} />
                              <label>Negocio<input name="businessName" defaultValue={client.businessName ?? ""} required /></label>
                              {(["google", "instagram", "whatsapp", "facebook", "web"] as const).map((platform) => {
                                const savedValue = client.links.find((link) => link.platform === platform)?.url ?? "";
                                const isWhatsApp = platform === "whatsapp";
                                return (
                                  <label key={platform}>{platform[0].toUpperCase() + platform.slice(1)}<input name={platform} type={isWhatsApp ? "tel" : "url"} inputMode={isWhatsApp ? "tel" : undefined} autoComplete={isWhatsApp ? "tel" : undefined} defaultValue={isWhatsApp ? whatsAppLinkToInput(savedValue) : savedValue} placeholder={isWhatsApp ? "+54 9 11 1234-5678" : "https://..."} /></label>
                                );
                              })}
                              <button type="submit">Guardar cambios</button>
                            </form>
                          </details>
                          <form action={toggleStatusAction}>
                            <input type="hidden" name="slug" value={client.slug} />
                            <input type="hidden" name="newStatus" value={client.status === "paused" ? "active" : "paused"} />
                            <button className="button button-secondary" type="submit">{client.status === "paused" ? "Reactivar" : "Pausar"}</button>
                          </form>
                        </>
                      )}
                      {(client.status !== "unassigned" || Boolean(client.businessName) || client.links.length > 0) && (
                        <ResetClientButton slug={client.slug} />
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="activity-section">
        <div className="section-heading">
          <div><p className="eyebrow">Registro</p><h2>Actividad reciente</h2></div>
          <span className="count-label">Últimos 20 eventos</span>
        </div>
        {auditEvents === null ? (
          <p className="muted">El historial todavía no está disponible. Ejecutá `supabase/rls.sql` en Supabase.</p>
        ) : auditEvents.length === 0 ? (
          <p className="muted">Todavía no hay actividad registrada.</p>
        ) : (
          <ol className="activity-list">
            {auditEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.slug}</strong>
                <span>{formatAuditAction(event.action)}</span>
                <span>{event.actorEmail ?? "Usuario desconocido"}</span>
                <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString("es-AR")}</time>
              </li>
            ))}
          </ol>
        )}
        {scanSummary === null && (
          <p className="muted">Las métricas requieren ejecutar `supabase/rls.sql` en Supabase.</p>
        )}
      </section>
    </main>
  );
}