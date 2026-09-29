import { describe, expect, it } from "vitest";
import { createQrImageSvg, createQrSvg } from "./qr-code";
import {
  filterClients,
  formatAuditAction,
  normalizeLinkUrl,
  normalizeWhatsAppLink,
  whatsAppLinkToInput,
} from "./qr-admin-domain";
import { getQrTargetUrl } from "./site-url";

describe("getQrTargetUrl", () => {
  it("uses the configured public site URL instead of the local request host", () => {
    expect(getQrTargetUrl("cafe-maria", "http://localhost:3000/admin", {
      NEXT_PUBLIC_SITE_URL: "https://qr.example.com",
    })).toBe("https://qr.example.com/r/cafe-maria");
  });

  it("prefers the Vercel production domain when no custom URL is configured", () => {
    expect(getQrTargetUrl("qr 001", "http://localhost:3000/admin", {
      VERCEL_PROJECT_PRODUCTION_URL: "qr-project.vercel.app",
      VERCEL_URL: "qr-preview.vercel.app",
    })).toBe("https://qr-project.vercel.app/r/qr%20001");
  });

  it("rejects a private request host instead of generating a Wi-Fi-only QR", () => {
    expect(() => getQrTargetUrl("qr-001", "http://192.168.1.23:3000/admin", {}))
      .toThrow("Configurá NEXT_PUBLIC_SITE_URL con el dominio público antes de descargar QR");
  });

  it("rejects localhost rather than embedding it in a QR image", () => {
    expect(() => getQrTargetUrl("qr-001", "http://localhost:3000/admin", {}))
      .toThrow("Configurá NEXT_PUBLIC_SITE_URL con el dominio público antes de descargar QR");
  });

  it("uses a public request host when no explicit origin is configured", () => {
    expect(getQrTargetUrl("qr-001", "https://qr.example.com/admin", {}))
      .toBe("https://qr.example.com/r/qr-001");
  });
});

describe("normalizeLinkUrl", () => {
  it("adds https when a link has no protocol", () => {
    expect(normalizeLinkUrl("instagram.com/cafe")).toBe("https://instagram.com/cafe");
    expect(normalizeLinkUrl("localhost:3000/page")).toBe("https://localhost:3000/page");
  });

  it("rejects non-http protocols and blank values", () => {
    expect(() => normalizeLinkUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeLinkUrl("  ")).toThrow();
  });
});

describe("filterClients", () => {
  const clients = [
    { slug: "qr-0001", businessName: "Café Sur", status: "active" as const },
    { slug: "qr-0002", businessName: null, status: "unassigned" as const },
    { slug: "qr-0003", businessName: "Sur Peluquería", status: "paused" as const },
  ];

  it("searches slugs and business names without case sensitivity", () => {
    expect(filterClients(clients, "SUR").map((client) => client.slug)).toEqual(["qr-0001", "qr-0003"]);
    expect(filterClients(clients, "0002").map((client) => client.slug)).toEqual(["qr-0002"]);
  });

  it("combines the search query with the selected status", () => {
    expect(filterClients(clients, "sur", "paused").map((client) => client.slug)).toEqual(["qr-0003"]);
    expect(filterClients(clients, "", "active").map((client) => client.slug)).toEqual(["qr-0001"]);
  });
});

describe("createQrSvg", () => {
  it("returns a vector SVG QR code", async () => {
    const svg = await createQrSvg("https://example.test/r/qr-0001");

    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
    expect(svg).toContain("<path");
  });
});

describe("createQrImageSvg", () => {
  it("puts each QR slug below its code and leaves exactly 2 mm between QR codes", () => {
    const svg = createQrImageSvg([
      { slug: "qr-0001", value: "https://example.test/r/qr-0001" },
      { slug: "qr-0002", value: "https://example.test/r/qr-0002" },
    ]);

    expect(svg).toContain('width="60mm"');
    expect(svg).toContain('height="34mm"');
    const qrPositions = [...svg.matchAll(/<svg x="([\d.]+)" y="([\d.]+)" width="28" height="28"/g)];
    expect(qrPositions).toHaveLength(2);
    expect(Number(qrPositions[1][1]) - Number(qrPositions[0][1]) - 28).toBe(2);
    expect(Number(qrPositions[1][1]) + 28).toBeLessThanOrEqual(59);
    expect(svg).toContain(">qr-0001</text>");
    expect(svg).toContain(">qr-0002</text>");
  });

  it("keeps all available QRs in one SVG image even when there are more than 12", () => {
    const entries = Array.from({ length: 13 }, (_, index) => ({
      slug: `qr-${String(index + 1).padStart(3, "0")}`,
      value: `https://example.test/r/qr-${String(index + 1).padStart(3, "0")}`,
    }));
    const svg = createQrImageSvg(entries);

    expect(svg.match(/<svg x=/g)).toHaveLength(13);
    expect(svg).toContain('width="180mm"');
    expect(svg).toContain('height="102mm"');
    expect(svg).toContain(">qr-013</text>");
  });

  it("keeps 2 mm between rows after including the identifier label", () => {
    const entries = Array.from({ length: 7 }, (_, index) => ({
      slug: `qr-${String(index + 1).padStart(3, "0")}`,
      value: `https://example.test/r/qr-${String(index + 1).padStart(3, "0")}`,
    }));
    const svg = createQrImageSvg(entries);
    const qrPositions = [...svg.matchAll(/<svg x="([\d.]+)" y="([\d.]+)" width="28" height="28"/g)];

    expect(qrPositions).toHaveLength(7);
    expect(Number(qrPositions[6][2]) - Number(qrPositions[0][2])).toBe(34);
  });
});

describe("formatAuditAction", () => {
  it("turns audit event keys into readable Spanish labels", () => {
    expect(formatAuditAction("activated")).toBe("QR activado");
    expect(formatAuditAction("link_removed")).toBe("Link quitado");
  });
});

describe("WhatsApp number input", () => {
  it("turns a formatted international number into a wa.me link", () => {
    expect(normalizeWhatsAppLink("+54 9 11 1234-5678")).toBe("https://wa.me/5491112345678");
  });

  it("keeps existing WhatsApp URLs and shows their number when editing", () => {
    expect(normalizeWhatsAppLink("https://wa.me/5491112345678")).toBe("https://wa.me/5491112345678");
    expect(whatsAppLinkToInput("https://wa.me/5491112345678")).toBe("+5491112345678");
  });

  it("rejects numbers that cannot be valid international WhatsApp numbers", () => {
    expect(() => normalizeWhatsAppLink("12345")).toThrow();
  });
});