-- Ejecutar en Supabase Dashboard > SQL Editor.
-- Reemplazá Aguscarp923@gmail.com por el mismo email usado en ADMIN_EMAILS.

alter table public.clients enable row level security;
alter table public.client_links enable row level security;

-- Estas políticas permiten que la página pública pueda resolver cualquier QR
-- y mostrar si está activo, pausado o todavía sin asignar.
drop policy if exists "Public can read clients" on public.clients;
create policy "Public can read clients"
on public.clients
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read client links" on public.client_links;
create policy "Public can read client links"
on public.client_links
for select
to anon, authenticated
using (true);

-- Solo el email del administrador puede modificar clientes.
drop policy if exists "Admin can insert clients" on public.clients;
create policy "Admin can insert clients"
on public.clients
for insert
to authenticated
with check (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'));

drop policy if exists "Admin can update clients" on public.clients;
create policy "Admin can update clients"
on public.clients
for update
to authenticated
using (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'))
with check (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'));

drop policy if exists "Admin can delete clients" on public.clients;
create policy "Admin can delete clients"
on public.clients
for delete
to authenticated
using (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'));

-- Solo el email del administrador puede modificar links.
drop policy if exists "Admin can insert client links" on public.client_links;
create policy "Admin can insert client links"
on public.client_links
for insert
to authenticated
with check (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'));

drop policy if exists "Admin can update client links" on public.client_links;
create policy "Admin can update client links"
on public.client_links
for update
to authenticated
using (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'))
with check (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'));

drop policy if exists "Admin can delete client links" on public.client_links;
create policy "Admin can delete client links"
on public.client_links
for delete
to authenticated
using (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'));

create table if not exists public.scan_events (
	id uuid primary key default gen_random_uuid(),
	client_id uuid not null references public.clients(id) on delete cascade,
	scanned_at timestamptz not null default now()
);

create index if not exists scan_events_client_scanned_at_idx
	on public.scan_events (client_id, scanned_at desc);

alter table public.scan_events enable row level security;
drop policy if exists "Public can record QR scans" on public.scan_events;
create policy "Public can record QR scans"
on public.scan_events
for insert
to anon, authenticated
with check (exists (
	select 1 from public.clients where public.clients.id = client_id
));

drop policy if exists "Admin can read QR scans" on public.scan_events;
create policy "Admin can read QR scans"
on public.scan_events
for select
to authenticated
using (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'));

grant insert on public.scan_events to anon, authenticated;
grant select on public.scan_events to authenticated;

create table if not exists public.client_audit_log (
	id uuid primary key default gen_random_uuid(),
	client_id uuid,
	slug text not null,
	action text not null,
	actor_email text,
	details jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now()
);

create index if not exists client_audit_log_created_at_idx
	on public.client_audit_log (created_at desc);

alter table public.client_audit_log enable row level security;
drop policy if exists "Admin can read client audit log" on public.client_audit_log;
create policy "Admin can read client audit log"
on public.client_audit_log
for select
to authenticated
using (lower(auth.jwt() ->> 'email') = lower('Aguscarp923@gmail.com'));

revoke all on public.client_audit_log from anon;
grant select on public.client_audit_log to authenticated;

create or replace function public.audit_client_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	event_action text;
	event_details jsonb;
begin
	if tg_op = 'DELETE' then
		insert into public.client_audit_log (client_id, slug, action, actor_email, details)
		values (
			old.id,
			old.slug,
			'deleted',
			auth.jwt() ->> 'email',
			jsonb_build_object('business_name', old.business_name, 'status', old.status)
		);
		return old;
	end if;

	if tg_op = 'INSERT' then
		event_action := 'created';
		event_details := jsonb_build_object('business_name', new.business_name, 'status', new.status);
	else
		event_action := case
			when old.status is distinct from new.status and new.status = 'active' then 'activated'
			when old.status is distinct from new.status and new.status = 'paused' then 'paused'
			when old.status is distinct from new.status and new.status = 'unassigned' then 'released'
			else 'updated'
		end;
		event_details := jsonb_build_object(
			'old_business_name', old.business_name,
			'new_business_name', new.business_name,
			'old_status', old.status,
			'new_status', new.status
		);
	end if;

	insert into public.client_audit_log (client_id, slug, action, actor_email, details)
	values (new.id, new.slug, event_action, auth.jwt() ->> 'email', event_details);
	return new;
end;
$$;

create or replace function public.audit_client_link_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	event_client_id uuid;
	event_slug text;
	event_action text;
	event_link record;
begin
	if tg_op = 'DELETE' then
		event_client_id := old.client_id;
		event_action := 'link_removed';
		event_link := old;
	else
		event_client_id := new.client_id;
		event_action := case when tg_op = 'INSERT' then 'link_added' else 'link_updated' end;
		event_link := new;
	end if;

	select slug into event_slug from public.clients where id = event_client_id;
	if event_slug is not null then
		insert into public.client_audit_log (client_id, slug, action, actor_email, details)
		values (
			event_client_id,
			event_slug,
			event_action,
			auth.jwt() ->> 'email',
			jsonb_build_object('platform', event_link.platform, 'label', event_link.label)
		);
	end if;

	if tg_op = 'DELETE' then return old; end if;
	return new;
end;
$$;

drop trigger if exists audit_clients on public.clients;
create trigger audit_clients
after insert or update or delete on public.clients
for each row execute function public.audit_client_changes();

drop trigger if exists audit_client_links on public.client_links;
create trigger audit_client_links
after insert or update or delete on public.client_links
for each row execute function public.audit_client_link_changes();

drop function if exists public.admin_scan_summary(integer);
create function public.admin_scan_summary(period_days integer default 30)
returns table (slug text, total_scan_count bigint, recent_scan_count bigint, last_scanned_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
	select
		clients.slug,
		count(*) as total_scan_count,
		count(*) filter (
			where scan_events.scanned_at >= now() - make_interval(days => greatest(1, least(coalesce(period_days, 30), 365)))
		) as recent_scan_count,
		max(scan_events.scanned_at) as last_scanned_at
	from public.scan_events
	join public.clients on public.clients.id = scan_events.client_id
	group by clients.slug
	order by clients.slug;
$$;

grant execute on function public.admin_scan_summary(integer) to authenticated;

-- Confirmá que las políticas aparezcan en Supabase después de ejecutar el script.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
	and tablename in ('clients', 'client_links', 'scan_events', 'client_audit_log')
order by tablename, policyname;

notify pgrst, 'reload schema';
