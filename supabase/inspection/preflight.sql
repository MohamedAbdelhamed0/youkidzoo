select jsonb_build_object(
  'database', current_database(),
  'public_tables', coalesce((select jsonb_agg(jsonb_build_object('name', c.relname, 'rls_enabled', c.relrowsecurity, 'estimated_rows', c.reltuples::bigint) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')), '[]'::jsonb),
  'public_columns', coalesce((select jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',data_type,'nullable',is_nullable) order by table_name,ordinal_position) from information_schema.columns where table_schema='public'),'[]'::jsonb),
  'migration_history_table', to_regclass('supabase_migrations.schema_migrations')::text,
  'auth_user_count', (select count(*) from auth.users),
  'storage_buckets', coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'public',public)) from storage.buckets),'[]'::jsonb),
  'storage_object_count', (select count(*) from storage.objects),
  'public_functions', coalesce((select jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'),'[]'::jsonb),
  'public_policies', coalesce((select jsonb_agg(jsonb_build_object('table',tablename,'policy',policyname,'command',cmd)) from pg_policies where schemaname='public'),'[]'::jsonb)
) as inspection;
