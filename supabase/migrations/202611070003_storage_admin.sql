create function public.set_shop_categories(p_shop_id uuid,p_category_ids uuid[]) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Administrator access required.'; end if;
 perform 1 from public.shops where id=p_shop_id for update;
 if not found then raise exception 'Shop not found.'; end if;
 if exists(select 1 from public.categories where id=any(p_category_ids) and shop_id is not null and shop_id<>p_shop_id) then raise exception 'A category belongs to another shop.'; end if;
 delete from public.shop_categories where shop_id=p_shop_id;
 insert into public.shop_categories(shop_id,category_id) select p_shop_id,unnest(p_category_ids);
end; $$;
revoke all on function public.set_shop_categories(uuid,uuid[]) from public,anon;
grant execute on function public.set_shop_categories(uuid,uuid[]) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('store-images','store-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do nothing;
create policy public_store_images on storage.objects for select using(bucket_id='store-images');
create policy admin_image_insert on storage.objects for insert to authenticated with check(bucket_id='store-images' and public.is_admin());
create policy admin_image_update on storage.objects for update to authenticated using(bucket_id='store-images' and public.is_admin()) with check(bucket_id='store-images' and public.is_admin());
create policy admin_image_delete on storage.objects for delete to authenticated using(bucket_id='store-images' and public.is_admin());
