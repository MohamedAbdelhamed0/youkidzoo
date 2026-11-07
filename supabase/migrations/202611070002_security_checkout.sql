-- Domain constraints, RLS, trusted checkout and administrative workflows.
alter table public.profiles add constraint profiles_username_format check(username ~ '^[a-z0-9_]{3,30}$');
create unique index profiles_username_case_unique on public.profiles(lower(username));
alter table public.products add constraint nonnegative_stock check(stock_quantity >= 0);
alter table public.products add constraint valid_discount check(discount_price is null or discount_price <= price);
alter table public.products add constraint valid_age check(age_group in ('0-6m','6-12m','1-3y','4-6y','7-9y','10-12y','all-ages'));
alter table public.products add column material_en text, add column material_ar text, add column dimensions jsonb;
alter table public.products add column emoji text not null default '🧸', add column color text not null default '#fce7ed';
alter table public.orders add column request_id uuid not null default gen_random_uuid();
alter table public.orders add constraint order_request_unique unique(user_id,request_id);
create index products_category on public.products(category_id);
create index products_shop on public.products(shop_id);
create index orders_customer on public.orders(user_id,created_at desc);
create index items_order on public.order_items(order_id);
create index payments_order on public.payments(order_id);

create function public.is_admin() returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active); $$;
create function public.active_user() returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = auth.uid() and is_active); $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,username,email,full_name)
 values(new.id,lower(coalesce(new.raw_user_meta_data->>'username','user_'||left(replace(new.id::text,'-',''),25))),new.email,coalesce(new.raw_user_meta_data->>'full_name',''));
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.update_my_profile(p_full_name text,p_phone text,p_language text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.active_user() then raise exception 'Please sign in.'; end if;
 if length(p_full_name)>200 or length(p_phone)>40 or p_language not in ('en','ar') then raise exception 'Invalid profile.'; end if;
 update public.profiles set full_name=p_full_name,phone=p_phone,preferred_language=p_language where id=auth.uid();
end; $$;

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.categories enable row level security;
alter table public.shop_categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy admin_profiles on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy public_shops on public.shops for select using(is_active or public.is_admin());
create policy admin_shops on public.shops for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy public_categories on public.categories for select using((is_active and (shop_id is null or exists(select 1 from public.shops where id=shop_id and is_active))) or public.is_admin());
create policy admin_categories on public.categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy public_shop_categories on public.shop_categories for select using(exists(select 1 from public.shops where id=shop_id and is_active) or public.is_admin());
create policy admin_shop_categories on public.shop_categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy public_products on public.products for select using((is_active and exists(select 1 from public.shops where id=shop_id and is_active) and exists(select 1 from public.categories where id=category_id and is_active)) or public.is_admin());
create policy admin_products on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy own_orders on public.orders for select to authenticated using((user_id=auth.uid() and public.active_user()) or public.is_admin());
create policy own_items on public.order_items for select to authenticated using(exists(select 1 from public.orders where id=order_id));
create policy own_payments on public.payments for select to authenticated using((user_id=auth.uid() and public.active_user()) or public.is_admin());

-- No client-side INSERT/UPDATE permissions for orders, items or payments.
-- SECURITY DEFINER functions below enforce prices, stock, identities and transitions.
create function public.place_order(p_items jsonb,p_address jsonb,p_notes text,p_request_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
 v_order uuid; v_item jsonb; v_product public.products%rowtype; v_count integer;
 v_price numeric(10,2); v_subtotal numeric(10,2):=0; v_shipping numeric(10,2);
begin
 if not public.active_user() then raise exception 'Please sign in to place your order.'; end if;
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
   if v_product.currency <> 'USD' then raise exception 'This store currently accepts USD orders only.'; end if;
   if v_product.stock_quantity < v_count then raise exception 'Not enough stock for %.',v_product.name_en; end if;
   v_price := case when v_product.discount_price is not null and (not v_product.is_special_deal or v_product.special_deal_ends_at > now()) then v_product.discount_price else v_product.price end;
   v_subtotal := v_subtotal + v_price*v_count;
 end loop;
 v_shipping := case when v_subtotal >= 100 then 0 else 7 end;
 insert into public.orders(order_number,user_id,subtotal_amount,shipping_fee,total_amount,shipping_address,notes,request_id)
 values('YKZ-'||to_char(now(),'YYYY')||'-'||upper(replace(gen_random_uuid()::text,'-','')),auth.uid(),v_subtotal,v_shipping,v_subtotal+v_shipping,p_address,coalesce(p_notes,''),p_request_id) returning id into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
   select * into strict v_product from public.products where id=(v_item->>'productId')::uuid;
   v_count := (v_item->>'quantity')::integer;
   v_price := case when v_product.discount_price is not null and (not v_product.is_special_deal or v_product.special_deal_ends_at > now()) then v_product.discount_price else v_product.price end;
   update public.products set stock_quantity=stock_quantity-v_count where id=v_product.id;
   insert into public.order_items(order_id,product_id,shop_id,product_name_en,product_name_ar,product_photo,unit_price,quantity,subtotal)
   values(v_order,v_product.id,v_product.shop_id,v_product.name_en,v_product.name_ar,v_product.thumbnail_url,v_price,v_count,v_price*v_count);
 end loop;
 insert into public.payments(order_id,user_id,amount,currency,method) values(v_order,auth.uid(),v_subtotal+v_shipping,'USD','cash_on_delivery');
 return v_order;
end; $$;

create function public.set_order_status(p_order_id uuid,p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_order public.orders%rowtype; v_item record;
begin
 if not public.is_admin() then raise exception 'Administrator access required.'; end if;
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

revoke all on function public.place_order(jsonb,jsonb,text,uuid) from public,anon;
revoke all on function public.set_order_status(uuid,text) from public,anon;
revoke all on function public.update_my_profile(text,text,text) from public,anon;
grant execute on function public.place_order(jsonb,jsonb,text,uuid) to authenticated;
grant execute on function public.set_order_status(uuid,text) to authenticated;
grant execute on function public.update_my_profile(text,text,text) to authenticated;
grant usage on schema public to anon,authenticated;
grant select on public.shops,public.categories,public.shop_categories,public.products to anon,authenticated;
grant select on public.profiles,public.orders,public.order_items,public.payments to authenticated;
grant insert,update,delete on public.profiles,public.shops,public.categories,public.shop_categories,public.products to authenticated;
