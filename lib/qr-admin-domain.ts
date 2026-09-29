export type QrStatus = "unassigned" | "active" | "paused";

type SearchableClient = {
  slug: string;
  businessName: string | null;
  status: QrStatus;
};

export function normalizeLinkUrl(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("El link no puede estar vacío");

  const explicitScheme = normalized.match(/^([a-z][a-z\d+.-]*):\/\//i)?.[1];
  if (explicitScheme && !/^https?$/i.test(explicitScheme)) {
    throw new Error("Solo se permiten links HTTP o HTTPS");
  }

  const candidate = explicitScheme ? normalized : `https://${normalized}`;
  const url = new URL(candidate);
  if (!url.hostname || !["http:", "https:"].includes(url.protocol)) {
    throw new Error("Los links deben ser URLs válidas");
  }

  return url.toString();
}

export function normalizeWhatsAppLink(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("El número de WhatsApp no puede estar vacío");

  if (/^(https?:\/\/|wa\.me\/)/i.test(normalized)) {
    return normalizeLinkUrl(normalized);
  }

  const phoneNumber = normalized.replace(/\D/g, "");
  if (phoneNumber.length < 8 || phoneNumber.length > 15) {
    throw new Error("Ingresá el número de WhatsApp con código de país, entre 8 y 15 dígitos");
  }

  return `https://wa.me/${phoneNumber}`;
}

export function whatsAppLinkToInput(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname === "wa.me") {
      const phoneNumber = url.pathname.replace(/^\/+|\/+$/g, "");
      return phoneNumber ? `+${phoneNumber}` : value;
    }
    if (url.hostname === "api.whatsapp.com") {
      const phoneNumber = url.searchParams.get("phone");
      return phoneNumber ? `+${phoneNumber.replace(/\D/g, "")}` : value;
    }
  } catch {
    return value;
  }

  return value;
}

export function filterClients<T extends SearchableClient>(
  clients: readonly T[],
  query: string,
  status: QrStatus | "all" = "all",
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return clients.filter((client) => {
    const matchesStatus = status === "all" || client.status === status;
    const searchableText = `${client.slug} ${client.businessName ?? ""}`.toLocaleLowerCase();
    return matchesStatus && searchableText.includes(normalizedQuery);
  });
}

const auditActionLabels: Record<string, string> = {
  created: "QR creado",
  activated: "QR activado",
  paused: "QR pausado",
  released: "QR liberado",
  updated: "QR editado",
  deleted: "QR eliminado",
  link_added: "Link agregado",
  link_updated: "Link editado",
  link_removed: "Link quitado",
};

export function formatAuditAction(action: string): string {
  return auditActionLabels[action] ?? action;
}