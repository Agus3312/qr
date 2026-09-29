"use client";

import { resetClientAction } from "@/lib/actions";

export default function ResetClientButton({ slug }: { slug: string }) {
  function confirmReset(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`¿Borrar la configuración de ${slug}? El QR impreso se conserva y quedará disponible para configurar otra vez.`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={resetClientAction} onSubmit={confirmReset}>
      <input type="hidden" name="slug" value={slug} />
      <button className="button button-danger" type="submit">Borrar configuración</button>
    </form>
  );
}