export default function HomePage() {
  return (
    <main className="home-shell">
      <nav className="home-nav"><span className="brand-mark">QR<span>/</span></span><a href="/login">Panel privado <span aria-hidden="true">↗</span></a></nav>
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Una tarjeta. Todos tus destinos.</p>
          <h1>Tu negocio, a un escaneo de distancia.</h1>
          <p className="hero-description">Un QR dinámico para reunir reseñas, redes y contacto. Cambiá tus links cuando quieras sin reimprimir una sola tarjeta.</p>
          <a className="hero-button" href="/login">Entrar al panel <span aria-hidden="true">→</span></a>
        </div>
        <div className="hero-art" aria-label="Vista previa de una tarjeta QR">
          <div className="hero-card">
            <span className="hero-card-label">ESCANEÁ Y CONOCENOS</span>
            <div className="fake-qr" aria-hidden="true">▦</div>
            <strong>Tu marca<br />en un solo lugar.</strong>
            <span className="hero-card-url">tudominio.com/r/qr-0001</span>
          </div>
          <span className="art-note">QR dinámico / 01</span>
        </div>
      </section>
      <section className="feature-strip"><div><strong>01</strong><span>Imprimí una vez</span></div><div><strong>02</strong><span>Activá en minutos</span></div><div><strong>03</strong><span>Actualizá siempre</span></div></section>
    </main>
  );
}