-- Winess Club: isolated tables and authenticated RPCs in the existing project.
create schema if not exists wc_private;
revoke all on schema wc_private from public, anon, authenticated;
grant usage on schema wc_private to authenticated;

create table wc_private.staff_emails (
 email text primary key check(email=lower(email)),
 role text not null check(role in ('admin','seller')),
 enabled boolean not null default true
);
alter table wc_private.staff_emails enable row level security;
insert into wc_private.staff_emails(email,role) values ('steven@sabwine.com','admin');

create function wc_private.current_role() returns text language sql stable security definer set search_path='' as $$
 select s.role from wc_private.staff_emails s join auth.users u on lower(u.email)=s.email
 where u.id=(select auth.uid()) and u.email_confirmed_at is not null and s.enabled
$$;
revoke all on function wc_private.current_role() from public, anon;
grant execute on function wc_private.current_role() to authenticated;

create table public.wc_members (
 id uuid primary key default gen_random_uuid(),
 auth_user_id uuid unique not null references auth.users(id),
 first_name text not null check(length(trim(first_name)) between 1 and 80),
 last_name text not null check(length(trim(last_name)) between 1 and 80),
 phone text unique check(phone is null or phone ~ '^[0-9]{12}$'),
 vip boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.wc_products (
 sku text primary key, name text not null, variant text not null default '',
 image_url text not null default '', product_url text not null default '',
 active boolean not null default true
);
create table public.wc_settings (
 id boolean primary key default true check(id),
 points_per_euro numeric(10,2) not null default 1 check(points_per_euro between 0 and 100),
 vip_discount integer not null default 10 check(vip_discount between 0 and 100),
 goal integer not null default 1000 check(goal>0)
);
insert into public.wc_settings(id) values(true);
create table public.wc_sales (
 id uuid primary key default gen_random_uuid(),
 ticket_ref text not null unique check(length(trim(ticket_ref)) between 1 and 100),
 member_id uuid not null references public.wc_members(id),
 sale_date date not null,
 total_cents bigint not null check(total_cents>=0),
 points bigint not null check(points>=0),
 points_rate numeric not null,
 source_payload jsonb not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create index wc_sales_member_idx on public.wc_sales(member_id);
create index wc_sales_created_by_idx on public.wc_sales(created_by);
create table public.wc_sale_lines (
 id uuid primary key default gen_random_uuid(),
 sale_id uuid not null references public.wc_sales(id),
 sku text not null references public.wc_products(sku),
 product_name text not null,
 quantity numeric not null check(quantity>0),
 total_cents bigint not null check(total_cents>=0)
);
create index wc_sale_lines_sale_idx on public.wc_sale_lines(sale_id);
create index wc_sale_lines_sku_idx on public.wc_sale_lines(sku);
create table public.wc_notifications (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.wc_members(id),
 sale_id uuid not null unique references public.wc_sales(id),
 title text not null, body text not null,
 created_at timestamptz not null default now(), read_at timestamptz
);
create index wc_notifications_member_idx on public.wc_notifications(member_id);

alter table public.wc_members enable row level security;
alter table public.wc_products enable row level security;
alter table public.wc_settings enable row level security;
alter table public.wc_sales enable row level security;
alter table public.wc_sale_lines enable row level security;
alter table public.wc_notifications enable row level security;
revoke all on public.wc_members,public.wc_sales,public.wc_sale_lines,public.wc_notifications,public.wc_settings,public.wc_products from public,anon,authenticated;
grant select on public.wc_products to anon,authenticated;
grant select on public.wc_members,public.wc_sales,public.wc_sale_lines,public.wc_notifications,public.wc_settings to authenticated;
grant update on public.wc_settings,public.wc_products to authenticated;
create policy wc_products_read on public.wc_products for select to anon,authenticated using(true);
create policy wc_products_admin on public.wc_products for update to authenticated using((select wc_private.current_role())='admin') with check((select wc_private.current_role())='admin');
create policy wc_settings_read on public.wc_settings for select to authenticated using(true);
create policy wc_settings_admin on public.wc_settings for update to authenticated using((select wc_private.current_role())='admin') with check((select wc_private.current_role())='admin');
create policy wc_members_read on public.wc_members for select to authenticated using(auth_user_id=(select auth.uid()) or (select wc_private.current_role()) in ('admin','seller'));
create policy wc_sales_read on public.wc_sales for select to authenticated using((select wc_private.current_role()) in ('admin','seller') or exists(select 1 from public.wc_members m where m.id=member_id and m.auth_user_id=(select auth.uid())));
create policy wc_lines_read on public.wc_sale_lines for select to authenticated using(exists(select 1 from public.wc_sales s where s.id=sale_id));
create policy wc_notifications_read on public.wc_notifications for select to authenticated using((select wc_private.current_role()) in ('admin','seller') or exists(select 1 from public.wc_members m where m.id=member_id and m.auth_user_id=(select auth.uid())));

create function public.wc_get_role() returns text language sql stable security invoker set search_path='' as $$select coalesce(wc_private.current_role(),'client')$$;

create function wc_private.save_member(p_first text,p_last text,p_phone text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Verified authentication required' using errcode='42501'; end if;
 insert into public.wc_members(auth_user_id,first_name,last_name,phone) values(auth.uid(),trim(p_first),trim(p_last),nullif(trim(p_phone),''))
 on conflict(auth_user_id) do update set first_name=excluded.first_name,last_name=excluded.last_name,phone=excluded.phone returning id into v_id;
 return v_id;
end $$;
create function public.wc_save_member(p_first text,p_last text,p_phone text) returns uuid language sql security invoker set search_path='' as $$select wc_private.save_member(p_first,p_last,p_phone)$$;

create function wc_private.update_member(p_id uuid,p_first text,p_last text,p_phone text,p_vip boolean) returns void language plpgsql security definer set search_path='' as $$
declare v_role text:=wc_private.current_role();
begin
 if auth.uid() is null or v_role is null or v_role not in ('admin','seller') then raise exception 'Staff required' using errcode='42501'; end if;
 if p_vip is not null and v_role<>'admin' then raise exception 'Admin required for VIP' using errcode='42501'; end if;
 update public.wc_members set first_name=trim(p_first),last_name=trim(p_last),phone=nullif(trim(p_phone),''),vip=coalesce(p_vip,vip) where id=p_id;
 if not found then raise exception 'Unknown member'; end if;
end $$;
create function public.wc_update_member(p_id uuid,p_first text,p_last text,p_phone text,p_vip boolean default null) returns void language sql security invoker set search_path='' as $$select wc_private.update_member(p_id,p_first,p_last,p_phone,p_vip)$$;

create function wc_private.record_sale(p_member uuid,p_ticket text,p_date date,p_items jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare v_sale uuid; v_old public.wc_sales; v_item jsonb; v_total bigint:=0; v_amount numeric; v_qty numeric; v_cents bigint; v_rate numeric; v_points bigint; v_product public.wc_products; v_role text:=wc_private.current_role();
begin
 if auth.uid() is null or v_role is null or v_role not in ('admin','seller') then raise exception 'Staff required' using errcode='42501'; end if;
 if not exists(select 1 from public.wc_members where id=p_member) then raise exception 'Unknown member'; end if;
 if p_items is null or p_date is null or p_ticket is null or length(trim(p_ticket)) not between 1 and 100 or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 500 then raise exception 'Invalid ticket'; end if;
 perform pg_advisory_xact_lock(hashtextextended('wc-sale:'||trim(p_ticket),0));
 select * into v_old from public.wc_sales where ticket_ref=trim(p_ticket);
 if found then
  if v_old.member_id=p_member and v_old.sale_date=p_date and v_old.source_payload=p_items then return v_old.id; end if;
  raise exception 'Ticket already exists with different contents' using errcode='23505';
 end if;
 select points_per_euro into v_rate from public.wc_settings where id=true;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_amount:=(v_item->>'total_ttc')::numeric;v_qty:=(v_item->>'quantite')::numeric;
  if v_amount is null or v_qty is null or v_qty<=0 or v_qty>100000 or v_amount<0 or v_amount>100000000 or round(v_amount,2)<>v_amount then raise exception 'Invalid quantity or amount'; end if;
  select * into v_product from public.wc_products where sku=trim(v_item->>'sku') and active;
  if not found then raise exception 'Unknown SKU'; end if;
  v_total:=v_total+(v_amount*100)::bigint;
 end loop;
 v_points:=floor(v_total::numeric*v_rate/100);
 insert into public.wc_sales(ticket_ref,member_id,sale_date,total_cents,points,points_rate,source_payload,created_by) values(trim(p_ticket),p_member,p_date,v_total,v_points,v_rate,p_items,auth.uid()) returning id into v_sale;
 for v_item in select value from jsonb_array_elements(p_items) loop
  insert into public.wc_sale_lines(sale_id,sku,product_name,quantity,total_cents)
  select v_sale,p.sku,p.name,(v_item->>'quantite')::numeric,((v_item->>'total_ttc')::numeric*100)::bigint from public.wc_products p where p.sku=trim(v_item->>'sku');
 end loop;
 insert into public.wc_notifications(member_id,sale_id,title,body) values(p_member,v_sale,'Votre achat Winess a été enregistré','Ticket '||trim(p_ticket)||' : '||v_points||' points ajoutés. Retrouvez les produits dans vos achats.');
 return v_sale;
end $$;
create function public.wc_record_sale(p_member uuid,p_ticket text,p_date date,p_items jsonb) returns uuid language sql security invoker set search_path='' as $$select wc_private.record_sale(p_member,p_ticket,p_date,p_items)$$;

create function wc_private.read_notification(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 update public.wc_notifications n set read_at=coalesce(read_at,now()) where n.id=p_id and exists(select 1 from public.wc_members m where m.id=n.member_id and m.auth_user_id=auth.uid());
end $$;
create function public.wc_read_notification(p_id uuid) returns void language sql security invoker set search_path='' as $$select wc_private.read_notification(p_id)$$;

create function wc_private.set_seller(p_email text,p_enabled boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or wc_private.current_role() is distinct from 'admin' then raise exception 'Admin required' using errcode='42501'; end if;
 if lower(trim(p_email))='steven@sabwine.com' then raise exception 'Owner cannot be changed here'; end if;
 if p_email is null or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'Invalid email'; end if;
 insert into wc_private.staff_emails(email,role,enabled) values(lower(trim(p_email)),'seller',p_enabled) on conflict(email) do update set enabled=excluded.enabled;
end $$;
create function public.wc_set_seller(p_email text,p_enabled boolean) returns void language sql security invoker set search_path='' as $$select wc_private.set_seller(p_email,p_enabled)$$;

revoke all on all functions in schema wc_private from public,anon;
grant execute on all functions in schema wc_private to authenticated;
revoke all on function public.wc_get_role(),public.wc_save_member(text,text,text),public.wc_update_member(uuid,text,text,text,boolean),public.wc_record_sale(uuid,text,date,jsonb),public.wc_read_notification(uuid),public.wc_set_seller(text,boolean) from public,anon;
grant execute on function public.wc_get_role(),public.wc_save_member(text,text,text),public.wc_update_member(uuid,text,text,text,boolean),public.wc_record_sale(uuid,text,date,jsonb),public.wc_read_notification(uuid),public.wc_set_seller(text,boolean) to authenticated;

alter publication supabase_realtime add table public.wc_members,public.wc_sales,public.wc_sale_lines,public.wc_notifications,public.wc_settings;
