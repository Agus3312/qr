import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export type ClientLink = {
  platform: "google" | "instagram" | "whatsapp" | "facebook" | "web";
  label: string;
  url: string;
  order: number;
};

export type ClientStatus = "unassigned" | "active" | "paused";

export type Client = {
  id: string;
  slug: string;
  businessName: string | null;
  status: ClientStatus;
  links: ClientLink[];
};

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, slug, business_name, status, client_links(platform, label, url, display_order)")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    slug: data.slug,
    businessName: data.business_name,
    status: data.status as ClientStatus,
    links: (data.client_links as any[]).map((link) => ({
      platform: link.platform,
      label: link.label,
      url: link.url,
      order: link.display_order,
    })),
  };
}

export async function getAllClients(): Promise<Client[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, slug, business_name, status, client_links(platform, label, url, display_order)")
    .order("slug");

  if (error || !data) return [];

  return data.map((client: any) => ({
    id: client.id,
    slug: client.slug,
    businessName: client.business_name,
    status: client.status as ClientStatus,
    links: (client.client_links as any[]).map((link) => ({
      platform: link.platform,
      label: link.label,
      url: link.url,
      order: link.display_order,
    })),
  }));
}

export type AuditEvent = {
  id: string;
  slug: string;
  action: string;
  actorEmail: string | null;
  createdAt: string;
  details: Record<string, unknown>;
};

export type ScanSummary = Record<string, { totalCount: number; recentCount: number; lastScannedAt: string | null }>;

export async function getRecentAuditEvents(limit = 20): Promise<AuditEvent[] | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_audit_log")
    .select("id, slug, action, actor_email, created_at, details")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return null;

  return data.map((event: any) => ({
    id: event.id,
    slug: event.slug,
    action: event.action,
    actorEmail: event.actor_email,
    createdAt: event.created_at,
    details: event.details ?? {},
  }));
}

export async function getQrScanSummary(): Promise<ScanSummary | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_scan_summary", { period_days: 30 });

  if (error || !data) return null;

  return Object.fromEntries(
    (data as {
      slug: string;
      total_scan_count: number | string;
      recent_scan_count: number | string;
      last_scanned_at: string | null;
    }[]).map((row) => [
      row.slug,
      {
        totalCount: Number(row.total_scan_count),
        recentCount: Number(row.recent_scan_count),
        lastScannedAt: row.last_scanned_at,
      },
    ]),
  );
}

export async function recordQrScan(clientId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("scan_events").insert({ client_id: clientId });
  if (error) console.error("Could not record QR scan", error.message);
}

export async function generateBatch(count: number): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("clients")
    .select("slug")
    .like("slug", "qr-%");

  const numbers = (existing ?? [])
    .map((client) => parseInt(client.slug.replace("qr-", ""), 10))
    .filter((number) => !isNaN(number));
  let next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

  const rows = [];
  const created: string[] = [];
  for (let index = 0; index < count; index++) {
    const slug = `qr-${String(next).padStart(4, "0")}`;
    rows.push({ slug, business_name: null, status: "unassigned" });
    created.push(slug);
    next++;
  }

  await supabase.from("clients").insert(rows);
  return created;
}

export async function assignClient(slug: string, businessName: string, links: ClientLink[]): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: client, error } = await supabase
    .from("clients")
    .update({ business_name: businessName, status: "active" })
    .eq("slug", slug)
    .select("id")
    .single();

  if (error || !client) throw new Error("No se pudo activar el cliente");

  await supabase.from("client_links").delete().eq("client_id", client.id);

  await supabase.from("client_links").insert(
    links.map((link) => ({
      client_id: client.id,
      platform: link.platform,
      label: link.label,
      url: link.url,
      display_order: link.order,
    })),
  );
}

export async function editClient(slug: string, businessName: string, links: ClientLink[]): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: client, error: lookupError } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", slug)
    .single();

  if (lookupError || !client) throw new Error("No se encontró el QR");

  const { error: updateError } = await supabase
    .from("clients")
    .update({ business_name: businessName })
    .eq("id", client.id);
  if (updateError) throw new Error("No se pudieron guardar los datos del negocio");

  const { error: deleteError } = await supabase
    .from("client_links")
    .delete()
    .eq("client_id", client.id);
  if (deleteError) throw new Error("No se pudieron actualizar los links");

  if (links.length > 0) {
    const { error: insertError } = await supabase.from("client_links").insert(
      links.map((link) => ({
        client_id: client.id,
        platform: link.platform,
        label: link.label,
        url: link.url,
        display_order: link.order,
      })),
    );
    if (insertError) throw new Error("No se pudieron guardar los nuevos links");
  }
}

export async function setStatus(slug: string, status: ClientStatus): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clients").update({ status }).eq("slug", slug);
  if (error) throw new Error("No se pudo actualizar el estado del QR");
}

export async function resetClient(slug: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: client, error: lookupError } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", slug)
    .single();

  if (lookupError || !client) throw new Error("No se encontró el QR");

  const { error: updateError } = await supabase
    .from("clients")
    .update({ business_name: null, status: "unassigned" })
    .eq("id", client.id);

  if (updateError) throw new Error("No se pudo liberar el QR");

  const { error: deleteError } = await supabase
    .from("client_links")
    .delete()
    .eq("client_id", client.id);

  if (deleteError) throw new Error("El QR quedó sin asignar, pero no se pudieron borrar sus links");
}