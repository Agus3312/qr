import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getClientBySlug } from "@/lib/data";
import { createQrSvg } from "@/lib/qr-code";
import { getQrTargetUrl, QrPublicOriginError } from "@/lib/site-url";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const client = await getClientBySlug(slug);

  if (!client) return new NextResponse("QR no encontrado", { status: 404 });

  const isDownload = request.nextUrl.searchParams.get("download") === "1";
  let qrUrl: string;
  if (isDownload) {
    try {
      qrUrl = getQrTargetUrl(client.slug, request.url);
    } catch (error) {
      if (error instanceof QrPublicOriginError) {
        return new NextResponse(error.message, { status: 400 });
      }
      throw error;
    }
  } else {
    qrUrl = new URL(`/r/${encodeURIComponent(client.slug)}`, request.url).toString();
  }

  const svg = await createQrSvg(qrUrl);
  const headers = new Headers({
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "private, no-store",
  });

  if (isDownload) {
    const filename = client.slug.replace(/[^a-zA-Z0-9_-]/g, "_");
    headers.set("Content-Disposition", `attachment; filename="${filename}.svg"`);
  }

  return new NextResponse(svg, { headers });
}