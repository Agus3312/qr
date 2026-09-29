"use client";

export default function PrintCardButton() {
  return <button type="button" onClick={() => window.print()}>Imprimir tarjeta</button>;
}