import { describe, expect, it } from "vitest";
import { createQrSvg } from "./qr-code";
import { filterClients, formatAuditAction, normalizeLinkUrl } from "./qr-admin-domain";

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

describe("formatAuditAction", () => {
  it("turns audit event keys into readable Spanish labels", () => {
    expect(formatAuditAction("activated")).toBe("QR activado");
    expect(formatAuditAction("link_removed")).toBe("Link quitado");
  });
});