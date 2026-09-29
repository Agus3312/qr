import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PrintCardButton from "@/app/admin/print-card-button";
import { requireAdmin } from "@/lib/admin-auth";
import { getClientBySlug } from "@/lib/data";

export default async function PrintCardPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const qrUrl = `${protocol}://${host}/r/${client.slug}`;

  return (
    <main className="print-card-page">
      <nav className="print-controls" aria-label="Controles de impresión">
        <a href="/admin">Volver al panel</a>
        <PrintCardButton />
      </nav>
      <article className="print-card">
        <div className="print-card-copy">
          <span className="print-card-logo">QR/</span>
          <p className="print-card-kicker">ENCONTRANOS ONLINE</p>
          <h1>{client.businessName ?? "Escaneá para conectar"}</h1>
          <p className="print-card-caption">Escaneá y encontrá todos nuestros links.</p>
          <span className="print-card-url">{qrUrl}</span>
        </div>
        <img
          className="print-card-code"
          src={`/admin/qr/${encodeURIComponent(client.slug)}`}
          alt={`Código QR ${client.slug}`}
        />
      </article>
    </main>
  );
}