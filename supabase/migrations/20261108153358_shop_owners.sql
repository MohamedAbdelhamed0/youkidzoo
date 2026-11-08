-- Multi-owner assignments; authorization always reads current database state.
alter table public.profiles drop constraint profiles_role_check;
update public.profiles set role='shop_owner' where role='shop_manager';
alter table public.profiles add constraint profiles_role_check check(role in ('user','admin','shop_owner'));
create table public.shop_owners (
 shop_id uuid not null references public.shops(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 primary key(shop_id,user_id)
);
create index shop_owners_user on public.shop_owners(user_id,shop_id);
insert into public.shop_owners select id,owner_id from public.shops where owner_id is not null;
update public.profiles set role='shop_owner' where role='user' and id in(select user_id from public.shop_owners);
-- Retained for migration compatibility only; never used for authorization.
comment on column public.shops.owner_id is 'Deprecated: use shop_owners.';
alter table public.shop_owners enable row level security;
grant select,insert,update,delete on public.shop_owners to authenticated;
create policy own_shop_assignments on public.shop_owners for select to authenticated using((user_id=auth.uid() and youkidzoo_private.active_user()) or youkidzoo_private.is_admin());
create policy admin_shop_assignments on public.shop_owners for all to authenticated using(youkidzoo_private.is_admin()) with check(youkidzoo_private.is_admin());
create function youkidzoo_private.owns_shop(p_shop uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.shop_owners a join public.profiles p on p.id=a.user_id where a.shop_id=p_shop and p.id=auth.uid() and p.is_active and p.role='shop_owner');
$$;
revoke all on function youkidzoo_private.owns_shop(uuid) from public;
grant execute on function youkidzoo_private.owns_shop(uuid) to anon,authenticated;
create policy owner_shop_read on public.shops for select to authenticated using(youkidzoo_private.owns_shop(id));
create policy owner_category_read on public.categories for select to authenticated using(youkidzoo_private.owns_shop(shop_id));
create policy owner_shop_categories_read on public.shop_categories for select to authenticated using(youkidzoo_private.owns_shop(shop_id));
create policy owner_product_read on public.products for select to authenticated using(youkidzoo_private.owns_shop(shop_id));
create function youkidzoo_private.valid_product_category(p_shop uuid,p_category uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.categories c where c.id=p_category and c.is_active and (c.shop_id=p_shop or (c.shop_id is null and exists(select 1 from public.shop_categories a where a.shop_id=p_shop and a.category_id=c.id))));
$$;
revoke all on function youkidzoo_private.valid_product_category(uuid,uuid) from public;
grant execute on function youkidzoo_private.valid_product_category(uuid,uuid) to authenticated;
create policy owner_product_insert on public.products for insert to authenticated with check(youkidzoo_private.owns_shop(shop_id) and youkidzoo_private.valid_product_category(shop_id,category_id));
create policy owner_product_update on public.products for update to authenticated using(youkidzoo_private.owns_shop(shop_id)) with check(youkidzoo_private.owns_shop(shop_id) and youkidzoo_private.valid_product_category(shop_id,category_id));
create policy owner_product_delete on public.products for delete to authenticated using(youkidzoo_private.owns_shop(shop_id));

create function youkidzoo_private.owns_image(p_name text) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.shop_owners where user_id=auth.uid() and shop_id::text=split_part(p_name,'/',2) and split_part(p_name,'/',1)='shops' and youkidzoo_private.owns_shop(shop_id));
$$;
revoke all on function youkidzoo_private.owns_image(text) from public;
grant execute on function youkidzoo_private.owns_image(text) to authenticated;
create policy owner_image_insert on storage.objects for insert to authenticated with check(bucket_id='store-images' and youkidzoo_private.owns_image(name));
create policy owner_image_update on storage.objects for update to authenticated using(bucket_id='store-images' and youkidzoo_private.owns_image(name)) with check(bucket_id='store-images' and youkidzoo_private.owns_image(name));
create policy owner_image_delete on storage.objects for delete to authenticated using(bucket_id='store-images' and youkidzoo_private.owns_image(name));

create function youkidzoo_private.save_shop_with_owners(p_id uuid,p_shop jsonb,p_owners uuid[]) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_shop public.shops%rowtype;
begin
 if not youkidzoo_private.is_admin() then raise exception 'Administrator access required.'; end if;
 if p_owners is null or array_position(p_owners,null) is not null then raise exception 'Invalid owners.'; end if;
 -- Lock selected profiles before validation and promotion.
 perform 1 from public.profiles where id=any(p_owners) order by id for update;
 if (select count(*) from public.profiles where id=any(p_owners) and is_active) <> (select count(distinct x) from unnest(p_owners) x) then raise exception 'Choose active registered users.'; end if;
 v_shop := jsonb_populate_record(null::public.shops,p_shop);
 if p_id is null then
 insert into public.shops(slug,name_en,name_ar,description_en,description_ar,logo_url,cover_banner_url,contact_email,contact_phone,is_verified,is_active)
 values(v_shop.slug,v_shop.name_en,v_shop.name_ar,v_shop.description_en,v_shop.description_ar,v_shop.logo_url,v_shop.cover_banner_url,v_shop.contact_email,v_shop.contact_phone,coalesce(v_shop.is_verified,false),coalesce(v_shop.is_active,true)) returning id into v_id;
 else
 update public.shops set slug=v_shop.slug,name_en=v_shop.name_en,name_ar=v_shop.name_ar,description_en=v_shop.description_en,description_ar=v_shop.description_ar,logo_url=v_shop.logo_url,cover_banner_url=v_shop.cover_banner_url,contact_email=v_shop.contact_email,contact_phone=v_shop.contact_phone,is_verified=v_shop.is_verified,is_active=v_shop.is_active,owner_id=null where id=p_id returning id into v_id;
 if not found then raise exception 'Shop not found.'; end if;
 end if;
 delete from public.shop_owners where shop_id=v_id;
 insert into public.shop_owners select v_id,x from (select distinct unnest(p_owners) x) owners;
 update public.profiles set role='shop_owner' where id=any(p_owners) and role='user';
 return v_id;
end; $$;
revoke all on function youkidzoo_private.save_shop_with_owners(uuid,jsonb,uuid[]) from public,anon;
grant execute on function youkidzoo_private.save_shop_with_owners(uuid,jsonb,uuid[]) to authenticated;
create function public.save_shop_with_owners(p_id uuid,p_shop jsonb,p_owners uuid[]) returns uuid language sql security invoker set search_path='' as $$ select youkidzoo_private.save_shop_with_owners(p_id,p_shop,p_owners); $$;
revoke all on function public.save_shop_with_owners(uuid,jsonb,uuid[]) from public,anon;
grant execute on function public.save_shop_with_owners(uuid,jsonb,uuid[]) to authenticated;
notify pgrst,'reload schema';
