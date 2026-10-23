-- Integration checks run in one transaction, rolled back including all synthetic users.
begin;
select set_config('wc.qa.client1',gen_random_uuid()::text,true),set_config('wc.qa.client2',gen_random_uuid()::text,true),set_config('wc.qa.staff',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
values (current_setting('wc.qa.client1')::uuid,'wc-qa-client1@example.invalid',now(),'{}','{}'),
(current_setting('wc.qa.client2')::uuid,'wc-qa-client2@example.invalid',now(),'{}','{}'),
(current_setting('wc.qa.staff')::uuid,'wc-qa-staff@example.invalid',now(),'{}','{}');
insert into wc_private.staff_emails(email,role) values('wc-qa-staff@example.invalid','seller');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('wc.qa.client1'),'role','authenticated')::text,true);
select set_config('wc.qa.member1',public.wc_save_member('QA','Client un','')::text,true);
do $$begin
 if (select count(*) from public.wc_members)<>1 then raise exception 'Client member isolation failed'; end if;
 if public.wc_get_role()<>'client' then raise exception 'Client role failed'; end if;
 begin
  perform public.wc_set_seller('not-allowed@example.invalid',true);
  raise exception 'Client privilege escalation';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('wc.qa.client2'),'role','authenticated')::text,true);
select set_config('wc.qa.member2',public.wc_save_member('QA','Client deux','')::text,true);
do $$begin
 if exists(select 1 from public.wc_members where id=current_setting('wc.qa.member1')::uuid) then raise exception 'Cross-client member leak'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('wc.qa.staff'),'role','authenticated')::text,true);
do $$declare v_sku text; v_id uuid; v_retry uuid; v_items jsonb;
begin
 if public.wc_get_role()<>'seller' then raise exception 'Staff role failed'; end if;
 if not exists(select 1 from public.wc_members where id=current_setting('wc.qa.member1')::uuid) then raise exception 'QR member lookup failed'; end if;
 select sku into v_sku from public.wc_products limit 1;
 v_items:=jsonb_build_array(jsonb_build_object('sku',v_sku,'quantite',1,'total_ttc',29.90));
 v_id:=public.wc_record_sale(current_setting('wc.qa.member1')::uuid,'WC-QA-'||current_setting('wc.qa.staff'),current_date,v_items);
 v_retry:=public.wc_record_sale(current_setting('wc.qa.member1')::uuid,'WC-QA-'||current_setting('wc.qa.staff'),current_date,v_items);
 if v_id<>v_retry then raise exception 'Retry idempotency failed'; end if;
 if (select points from public.wc_sales where id=v_id)<>floor(29.90*(select points_per_euro from public.wc_settings where id)) then raise exception 'Points failed'; end if;
 if (select count(*) from public.wc_notifications where sale_id=v_id)<>1 then raise exception 'Notification idempotency failed'; end if;
 begin
  perform public.wc_update_member(current_setting('wc.qa.member1')::uuid,'QA','Client un','',true);
  raise exception 'Seller changed VIP';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.wc_record_sale(current_setting('wc.qa.member2')::uuid,'WC-QA-'||current_setting('wc.qa.staff'),current_date,v_items);
  raise exception 'Conflicting ticket accepted';
 exception when unique_violation then null;
 end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('wc.qa.client2'),'role','authenticated')::text,true);
do $$begin
 if exists(select 1 from public.wc_sales where member_id=current_setting('wc.qa.member1')::uuid) or exists(select 1 from public.wc_notifications where member_id=current_setting('wc.qa.member1')::uuid) or exists(select 1 from public.wc_sale_lines) then raise exception 'Cross-client purchase leak'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('wc.qa.client1'),'role','authenticated')::text,true);
do $$declare v_id uuid;
begin
 if (select count(*) from public.wc_sales where member_id=current_setting('wc.qa.member1')::uuid)<>1 then raise exception 'Client cannot see own sale'; end if;
 if (select count(*) from public.wc_sale_lines)<>1 then raise exception 'Client cannot see own lines'; end if;
 select id into v_id from public.wc_notifications where member_id=current_setting('wc.qa.member1')::uuid;
 perform public.wc_read_notification(v_id);
 if not exists(select 1 from public.wc_notifications where id=v_id and read_at is not null) then raise exception 'Read notification failed'; end if;
end $$;
reset role;
set local role anon;
do $$begin
 begin
  perform 1 from public.wc_members;
  raise exception 'Anonymous member access allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.wc_get_role();
  raise exception 'Anonymous RPC access allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'PASS: member isolation, staff QR lookup, ticket, points, retry, conflicting ticket, notification, read state, seller VIP denial and anonymous denial; fixtures rolled back' as verification;
