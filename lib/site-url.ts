type SiteUrlEnvironment = Record<string, string | undefined>;

export class QrPublicOriginError extends Error {
  constructor() {
    super("Configurá NEXT_PUBLIC_SITE_URL con el dominio público antes de descargar QR");
    this.name = "QrPublicOriginError";
  }
}

export function getQrBaseUrl(
  requestUrl: string,
  environment: SiteUrlEnvironment = process.env,
): string {
  const configuredUrl =
    environment.NEXT_PUBLIC_SITE_URL?.trim() ||
    environment.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    environment.VERCEL_URL?.trim();

  if (!configuredUrl) return new URL(requestUrl).origin;

  const candidate = /^https?:\/\//i.test(configuredUrl) ? configuredUrl : `https://${configuredUrl}`;
  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("La URL pública debe usar HTTP o HTTPS");
  }

  return url.origin;
}

export function getQrTargetUrl(
  slug: string,
  requestUrl: string,
  environment?: SiteUrlEnvironment,
): string {
  const baseUrl = getQrBaseUrl(requestUrl, environment);
  if (isPrivateHost(new URL(baseUrl).hostname)) {
    throw new QrPublicOriginError();
  }

  return new URL(`/r/${encodeURIComponent(slug)}`, baseUrl).toString();
}

function isPrivateHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    normalizedHost === "localhost" ||
    normalizedHost.endsWith(".localhost") ||
    normalizedHost.endsWith(".local") ||
    normalizedHost === "::1" ||
    normalizedHost.startsWith("fc") ||
    normalizedHost.startsWith("fd") ||
    normalizedHost.startsWith("fe80:") ||
    isPrivateIPv4(normalizedHost)
  );
}

function isPrivateIPv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  return (
    octets.length === 4 &&
    (octets[0] === 0 ||
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31))
  );
}
