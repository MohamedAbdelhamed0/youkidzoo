-- Keep category hierarchies and shop ownership consistent under concurrent edits.
alter table public.profiles alter column is_active set not null;
alter table public.shops alter column is_active set not null;
alter table public.categories alter column is_active set not null;
alter table public.products alter column is_active set not null,alter column is_special_deal set not null,alter column is_featured set not null;
create function public.validate_category_tree() returns trigger language plpgsql set search_path='' as $$
declare v_parent public.categories%rowtype;
begin
 perform pg_advisory_xact_lock(40721);
 if new.parent_id is not null then
  select * into strict v_parent from public.categories where id=new.parent_id;
  if v_parent.shop_id is not null and v_parent.shop_id is distinct from new.shop_id then raise exception 'The parent category belongs to another shop.'; end if;
  if exists(
   with recursive ancestors as (
    select id,parent_id,array[id] as visited from public.categories where id=new.parent_id
    union all select c.id,c.parent_id,a.visited||c.id from public.categories c join ancestors a on c.id=a.parent_id where not c.id=any(a.visited)
   ) select 1 from ancestors where id=new.id
  ) then raise exception 'A category cannot contain itself or one of its ancestors.'; end if;
 end if;
 if new.shop_id is not null and exists(select 1 from public.products where category_id=new.id and shop_id<>new.shop_id) then raise exception 'Existing products belong to another shop.'; end if;
 if exists(select 1 from public.categories c where c.parent_id=new.id and new.shop_id is not null and c.shop_id is distinct from new.shop_id) then raise exception 'The category has children outside this shop.'; end if;
 return new;
end; $$;
create trigger validate_category_tree before insert or update of parent_id,shop_id on public.categories for each row execute function public.validate_category_tree();
create function public.validate_product_shop() returns trigger language plpgsql set search_path='' as $$
declare v_shop uuid;
begin
 select shop_id into v_shop from public.categories where id=new.category_id for share;
 if v_shop is not null and v_shop<>new.shop_id then raise exception 'The selected category belongs to another shop.'; end if;
 return new;
end; $$;
create trigger validate_product_shop before insert or update of category_id,shop_id on public.products for each row execute function public.validate_product_shop();
alter table public.orders add constraint nonnegative_order_amounts check(subtotal_amount>=0 and shipping_fee>=0 and discount_amount>=0 and total_amount>=0);
alter table public.payments add constraint nonnegative_payment check(amount>=0);
alter table public.order_items add constraint nonnegative_item check(unit_price>=0 and subtotal>=0);
create unique index one_payment_per_order on public.payments(order_id);
-- Usernames are the stable account handle. Keep private email copies in sync with Auth.
create function public.sync_auth_email() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email is distinct from old.email then update public.profiles set email=new.email where id=new.id; end if;
 return new;
end; $$;
create trigger on_auth_email_changed after update of email on auth.users for each row execute function public.sync_auth_email();
