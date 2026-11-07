select jsonb_build_object(
 'migration_versions',(select jsonb_agg(version order by version) from supabase_migrations.schema_migrations),
 'table_counts',jsonb_build_object('shops',(select count(*) from public.shops),'categories',(select count(*) from public.categories),'products',(select count(*) from public.products),'profiles',(select count(*) from public.profiles),'orders',(select count(*) from public.orders),'order_items',(select count(*) from public.order_items),'payments',(select count(*) from public.payments)),
 'all_tables_have_rls',not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity),
 'catalog_currency',(select jsonb_agg(distinct currency) from public.products),
 'administrator_count',(select count(*) from public.profiles where role='admin' and is_active),
 'auth_user_count',(select count(*) from auth.users),
 'verification_user_count',(select count(*) from public.profiles where username like 'verify\_%' escape '\'),
 'storage_object_count',(select count(*) from storage.objects),
 'exposed_security_definer_functions',(select coalesce(jsonb_agg(p.proname),'[]'::jsonb) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef)
) as verification;
