-- Keep implementation functions outside exposed API schemas. Public RPC wrappers
-- retain their names and caller privileges; the private implementations keep
-- the existing authorization and transaction checks. No business data changes.
create schema if not exists youkidzoo_private;
revoke all on schema youkidzoo_private from public;
grant usage on schema youkidzoo_private to anon,authenticated,service_role;
alter function public.is_admin() set schema youkidzoo_private;
alter function public.active_user() set schema youkidzoo_private;
alter function public.handle_new_user() set schema youkidzoo_private;
alter function public.sync_auth_email() set schema youkidzoo_private;
alter function public.validate_category_tree() set schema youkidzoo_private;
alter function public.validate_product_shop() set schema youkidzoo_private;
alter function public.update_my_profile(text,text,text) set schema youkidzoo_private;
alter function public.place_order(jsonb,jsonb,text,uuid) set schema youkidzoo_private;
alter function public.set_order_status(uuid,text) set schema youkidzoo_private;
alter function public.set_shop_categories(uuid,uuid[]) set schema youkidzoo_private;

create or replace function youkidzoo_private.update_my_profile(p_full_name text,p_phone text,p_language text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not youkidzoo_private.active_user() then raise exception 'Please sign in.'; end if;
 if length(p_full_name)>200 or length(p_phone)>40 or p_language not in ('en','ar') then raise exception 'Invalid profile.'; end if;
 update public.profiles set full_name=p_full_name,phone=p_phone,preferred_language=p_language where id=auth.uid();
end; $$;

create or replace function youkidzoo_private.place_order(p_items jsonb,p_address jsonb,p_notes text,p_request_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
 v_order uuid; v_item jsonb; v_product public.products%rowtype; v_count integer;
 v_price numeric(10,2); v_subtotal numeric(10,2):=0; v_shipping numeric(10,2);
begin
 if not youkidzoo_private.active_user() then raise exception 'Please sign in to place your order.'; end if;
 if p_request_id is null then raise exception 'Missing checkout request ID.'; end if;
 -- Serialize retries of this request before checking for an existing order.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request_id::text,0));
 select id into v_order from public.orders where user_id=auth.uid() and request_id=p_request_id;
 if found then return v_order; end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Your bag must contain between 1 and 100 products.'; end if;
 if (select count(distinct x->>'productId') from jsonb_array_elements(p_items) x) <> jsonb_array_length(p_items) then raise exception 'Duplicate or missing products in bag.'; end if;
 if jsonb_typeof(p_address) is distinct from 'object' then raise exception 'Invalid shipping address.'; end if;
 if exists(select 1 from unnest(array['recipientName','phone','country','city','streetAddress']) field where jsonb_typeof(p_address->field) is distinct from 'string' or coalesce(length(trim(p_address->>field)),0) not between 1 and 300) then raise exception 'Please complete the shipping address.'; end if;
 if length(coalesce(p_notes,''))>2000 then raise exception 'Order notes are too long.'; end if;
 -- Deterministic lock order prevents deadlocks between overlapping bags.
 for v_item in select value from jsonb_array_elements(p_items) order by value->>'productId' loop
   if coalesce(v_item->>'quantity','') !~ '^[1-9][0-9]{0,2}$' then raise exception 'Quantity must be a whole number from 1 to 999.'; end if;
   v_count := (v_item->>'quantity')::integer;
   select * into v_product from public.products where id=(v_item->>'productId')::uuid for update;
   if not found or not v_product.is_active or not exists(select 1 from public.shops where id=v_product.shop_id and is_active) or not exists(select 1 from public.categories where id=v_product.category_id and is_active) then raise exception 'A product is no longer available.'; end if;
   if v_product.currency <> 'EGP' then raise exception 'This store currently accepts EGP orders only.'; end if;
   if v_product.stock_quantity < v_count then raise exception 'Not enough stock for %.',v_product.name_en; end if;
   v_price := case when v_product.discount_price is not null and (not v_product.is_special_deal or v_product.special_deal_ends_at > now()) then v_product.discount_price else v_product.price end;
   v_subtotal := v_subtotal + v_price*v_count;
 end loop;
 v_shipping := case when v_subtotal >= 100 then 0 else 7 end;
 insert into public.orders(order_number,user_id,subtotal_amount,shipping_fee,total_amount,shipping_address,notes,request_id,currency)
 values('YKZ-'||to_char(now(),'YYYY')||'-'||upper(replace(gen_random_uuid()::text,'-','')),auth.uid(),v_subtotal,v_shipping,v_subtotal+v_shipping,p_address,coalesce(p_notes,''),p_request_id,'EGP') returning id into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
   select * into strict v_product from public.products where id=(v_item->>'productId')::uuid;
   v_count := (v_item->>'quantity')::integer;
   v_price := case when v_product.discount_price is not null and (not v_product.is_special_deal or v_product.special_deal_ends_at > now()) then v_product.discount_price else v_product.price end;
   update public.products set stock_quantity=stock_quantity-v_count where id=v_product.id;
   insert into public.order_items(order_id,product_id,shop_id,product_name_en,product_name_ar,product_photo,unit_price,quantity,subtotal)
   values(v_order,v_product.id,v_product.shop_id,v_product.name_en,v_product.name_ar,v_product.thumbnail_url,v_price,v_count,v_price*v_count);
 end loop;
 insert into public.payments(order_id,user_id,amount,currency,method) values(v_order,auth.uid(),v_subtotal+v_shipping,'EGP','cash_on_delivery');
 return v_order;
end; $$;

create or replace function youkidzoo_private.set_order_status(p_order_id uuid,p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_order public.orders%rowtype; v_item record;
begin
 if not youkidzoo_private.is_admin() then raise exception 'Administrator access required.'; end if;
 select * into strict v_order from public.orders where id=p_order_id for update;
 if v_order.status=p_status then return; end if;
 if not (
  (v_order.status='pending' and p_status in ('confirmed','processing','cancelled')) or
  (v_order.status='confirmed' and p_status in ('processing','cancelled')) or
  (v_order.status='processing' and p_status in ('shipped','cancelled')) or
  (v_order.status='shipped' and p_status='delivered') or
  (v_order.status='delivered' and p_status='refunded')
 ) then raise exception 'Invalid order status transition.'; end if;
 if p_status='cancelled' then
   for v_item in select product_id,quantity from public.order_items where order_id=p_order_id order by product_id loop
     update public.products set stock_quantity=stock_quantity+v_item.quantity where id=v_item.product_id;
   end loop;
   update public.payments set status='failed' where order_id=p_order_id and status='pending';
 end if;
 if p_status='delivered' then
   update public.payments set status='paid',paid_at=now() where order_id=p_order_id and method='cash_on_delivery' and status='pending';
 end if;
 if p_status='refunded' then
   update public.payments set status='refunded' where order_id=p_order_id and status='paid';
 end if;
 update public.orders set status=p_status,updated_at=now() where id=p_order_id;
end; $$;

create or replace function youkidzoo_private.set_shop_categories(p_shop_id uuid,p_category_ids uuid[]) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not youkidzoo_private.is_admin() then raise exception 'Administrator access required.'; end if;
 perform 1 from public.shops where id=p_shop_id for update;
 if not found then raise exception 'Shop not found.'; end if;
 if exists(select 1 from public.categories where id=any(p_category_ids) and shop_id is not null and shop_id<>p_shop_id) then raise exception 'A category belongs to another shop.'; end if;
 delete from public.shop_categories where shop_id=p_shop_id;
 insert into public.shop_categories(shop_id,category_id) select p_shop_id,unnest(p_category_ids);
end; $$;

revoke all on function youkidzoo_private.handle_new_user(),youkidzoo_private.sync_auth_email(),youkidzoo_private.validate_category_tree(),youkidzoo_private.validate_product_shop() from public,anon,authenticated;
revoke all on function youkidzoo_private.is_admin(),youkidzoo_private.active_user() from public;
grant execute on function youkidzoo_private.is_admin(),youkidzoo_private.active_user() to anon,authenticated,service_role;

create function public.update_my_profile(p_full_name text,p_phone text,p_language text) returns void language sql security invoker set search_path='' as $$ select youkidzoo_private.update_my_profile(p_full_name,p_phone,p_language); $$;
revoke all on function public.update_my_profile(text,text,text) from public,anon;
grant execute on function public.update_my_profile(text,text,text) to authenticated,service_role;

create function public.place_order(p_items jsonb,p_address jsonb,p_notes text,p_request_id uuid) returns uuid language sql security invoker set search_path='' as $$ select youkidzoo_private.place_order(p_items,p_address,p_notes,p_request_id); $$;
revoke all on function public.place_order(jsonb,jsonb,text,uuid) from public,anon;
grant execute on function public.place_order(jsonb,jsonb,text,uuid) to authenticated,service_role;

create function public.set_order_status(p_order_id uuid,p_status text) returns void language sql security invoker set search_path='' as $$ select youkidzoo_private.set_order_status(p_order_id,p_status); $$;
revoke all on function public.set_order_status(uuid,text) from public,anon;
grant execute on function public.set_order_status(uuid,text) to authenticated,service_role;

create function public.set_shop_categories(p_shop_id uuid,p_category_ids uuid[]) returns void language sql security invoker set search_path='' as $$ select youkidzoo_private.set_shop_categories(p_shop_id,p_category_ids); $$;
revoke all on function public.set_shop_categories(uuid,uuid[]) from public,anon;
grant execute on function public.set_shop_categories(uuid,uuid[]) to authenticated,service_role;

notify pgrst,'reload schema';
