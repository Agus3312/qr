"use server";

import { revalidatePath } from "next/cache";
import { assignClient, editClient, setStatus, generateBatch, resetClient, ClientLink } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeLinkUrl, normalizeWhatsAppLink } from "@/lib/qr-admin-domain";

async function saveClientAction(formData: FormData, activate: boolean) {
  await requireAdmin();
  const slug = formData.get("slug");
  const businessName = formData.get("businessName");
  if (typeof slug !== "string" || !slug || typeof businessName !== "string") {
    throw new Error("Faltan los datos del QR o del negocio");
  }

  const normalizedBusinessName = businessName.trim();
  const links: ClientLink[] = [];
  const platforms: { key: ClientLink["platform"]; label: string }[] = [
    { key: "google", label: "Dejanos tu reseña en Google" },
    { key: "instagram", label: "Seguinos en Instagram" },
    { key: "whatsapp", label: "Escribinos por WhatsApp" },
    { key: "facebook", label: "Visitá nuestro Facebook" },
    { key: "web", label: "Visitá nuestra web" },
  ];

  let order = 1;
  for (const platform of platforms) {
    const value = formData.get(platform.key);
    const url = typeof value === "string" ? value.trim() : "";
    if (url) {
      const normalizedUrl = platform.key === "whatsapp" ? normalizeWhatsAppLink(url) : normalizeLinkUrl(url);
      links.push({ platform: platform.key, label: platform.label, url: normalizedUrl, order: order++ });
    }
  }

  if (!normalizedBusinessName || links.length === 0) {
    throw new Error("Falta el nombre del negocio o al menos un link");
  }

  if (activate) {
    await assignClient(slug, normalizedBusinessName, links);
  } else {
    await editClient(slug, normalizedBusinessName, links);
  }
  revalidatePath("/admin");
}

export async function activateClientAction(formData: FormData) {
  return saveClientAction(formData, true);
}

export async function editClientAction(formData: FormData) {
  return saveClientAction(formData, false);
}

export async function toggleStatusAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug");
  const newStatus = formData.get("newStatus");
  if (typeof slug !== "string" || !slug || (newStatus !== "active" && newStatus !== "paused")) {
    throw new Error("Estado de QR inválido");
  }

  await setStatus(slug, newStatus);
  revalidatePath("/admin");
}

export async function resetClientAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug");
  if (typeof slug !== "string" || !slug) throw new Error("QR inválido");

  await resetClient(slug);
  revalidatePath("/admin");
}

export async function generateBatchAction(formData: FormData) {
  await requireAdmin();
  const countValue = formData.get("count");
  const requestedCount = typeof countValue === "string" ? parseInt(countValue, 10) : NaN;
  const count = Number.isFinite(requestedCount) ? Math.min(Math.max(requestedCount, 1), 500) : 10;
  await generateBatch(count);
  revalidatePath("/admin");
}