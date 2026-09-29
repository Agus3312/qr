import { redirect } from "next/navigation";
import { getClientBySlug, recordQrScan } from "@/lib/data";

export default async function RedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);

  if (!client) {
    return <main className="public-shell"><div className="public-state"><span className="public-logo">QR/</span><h1>Este QR no existe.</h1><p>Revisá que el código esté bien escrito.</p></div></main>;
  }

  await recordQrScan(client.id);

  if (client.status === "unassigned") {
    return <main className="public-shell"><div className="public-state"><span className="public-logo">QR/</span><h1>Estamos preparando este espacio.</h1><p>Este código todavía no fue activado.</p></div></main>;
  }

  if (client.status === "paused") {
    return <main className="public-shell"><div className="public-state"><span className="public-logo">QR/</span><h1>Volvemos pronto.</h1><p>Este espacio está temporalmente pausado.</p></div></main>;
  }

  if (client.links.length === 1) redirect(client.links[0].url);

  return (
    <main className="public-shell">
      <div className="public-profile">
        <span className="public-logo">QR/</span>
        <p className="eyebrow">Encontranos online</p>
        <h1>{client.businessName}</h1>
        <p className="public-subtitle">Elegí cómo querés conectar con nosotros.</p>
      </div>
      <ul className="public-links">
        {client.links.map((link) => (
          <li key={link.platform}>
            <a href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
          </li>
        ))}
      </ul>
      <p className="public-footer">Powered by QR dinámicos</p>
    </main>
  );
}