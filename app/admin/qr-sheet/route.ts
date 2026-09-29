import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllClients } from "@/lib/data";
import { createQrImageSvg } from "@/lib/qr-code";
import { getQrTargetUrl, QrPublicOriginError } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const clients = (await getAllClients()).filter((client) => client.status === "unassigned");

  if (clients.length === 0) return new NextResponse("No hay QR disponibles", { status: 404 });

  let entries;
  try {
    entries = clients.map((client) => ({
      slug: client.slug,
      value: getQrTargetUrl(client.slug, request.url),
    }));
  } catch (error) {
    if (error instanceof QrPublicOriginError) {
      return new NextResponse(error.message, { status: 400 });
    }
    throw error;
  }

  const svg = createQrImageSvg(entries);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": "attachment; filename=qr-disponibles.svg",
      "Cache-Control": "private, no-store",
    },
  });
}
