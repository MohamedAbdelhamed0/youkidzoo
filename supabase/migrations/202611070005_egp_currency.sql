-- New catalog and checkout amounts are Egyptian pounds. No exchange-rate conversion.
-- Preserve historical order/payment currency rather than relabeling paid amounts.
alter table public.products alter column currency set default 'EGP';
alter table public.payments alter column currency set default 'EGP';
alter table public.orders add column currency text not null default 'USD';
update public.orders o set currency=p.currency from public.payments p where p.order_id=o.id;
alter table public.orders alter column currency set default 'EGP';

create or replace function public.place_order(p_items jsonb,p_address jsonb,p_notes text,p_request_id uuid) returns uuid
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

