import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllClients } from "@/lib/data";
import { createQrSvg } from "@/lib/qr-code";
import { getQrTargetUrl, QrPublicOriginError } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const clients = (await getAllClients()).filter((client) => client.status === "unassigned");

  if (clients.length === 0) return new NextResponse("No hay QR disponibles", { status: 404 });

  const zip = new JSZip();
  try {
    for (const client of clients) {
      const qrUrl = getQrTargetUrl(client.slug, request.url);
      zip.file(`${client.slug}.svg`, await createQrSvg(qrUrl));
    }
  } catch (error) {
    if (error instanceof QrPublicOriginError) {
      return new NextResponse(error.message, { status: 400 });
    }
    throw error;
  }

  const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const body = new ArrayBuffer(archive.byteLength);
  new Uint8Array(body).set(archive);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=qr-disponibles.zip",
      "Cache-Control": "private, no-store",
    },
  });
}