import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { test, beforeAll, afterAll } from "vitest";
import assert from "node:assert/strict";
const db = new PGlite();
const admin = "40000000-0000-4000-8000-000000000001",
  owner = "40000000-0000-4000-8000-000000000002",
  second = "40000000-0000-4000-8000-000000000003",
  customer = "40000000-0000-4000-8000-000000000004";
let shop, otherShop, category, product;
const payload = (slug) => ({
  slug,
  name_en: slug,
  name_ar: slug,
  logo_url: "",
  is_active: false,
  is_verified: false,
});
async function asUser(id, work) {
  await db.exec("begin; set local role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
  try {
    const result = await work();
    await db.exec("commit");
    return result;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
const save = (id, owners, slug = "owner-shop") =>
  db.query("select public.save_shop_with_owners($1,$2,$3) id", [
    id,
    payload(slug),
    owners,
  ]);
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets,name text); alter table storage.objects enable row level security; grant usage on schema storage to anon,authenticated; grant select,insert,update,delete on storage.objects to anon,authenticated;`);
  for (const file of readdirSync(new URL("../migrations/", import.meta.url))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    if (file.endsWith("_shop_owners.sql")) {
      await db.query(
        `insert into auth.users(id,email,raw_user_meta_data) values($1,'admin@test.com','{"username":"admin"}'),($2,'owner@test.com','{"username":"owner"}'),($3,'second@test.com','{"username":"second"}'),($4,'customer@test.com','{"username":"customer"}');`,
        [admin, owner, second, customer],
      );
      await db.query(
        "update public.profiles set role=case when id=$1 then 'admin' else 'shop_manager' end where id in($1,$2)",
        [admin, owner],
      );
      shop = (
        await db.query(
          "insert into public.shops(slug,name_en,name_ar,logo_url,owner_id,is_active) values('owner-shop','Shop','Shop','',$1,false) returning id",
          [owner],
        )
      ).rows[0].id;
    }
    await db.exec(
      readFileSync(new URL("../migrations/" + file, import.meta.url), "utf8"),
    );
  }
  otherShop = (
    await db.query(
      "insert into public.shops(slug,name_en,name_ar,logo_url,is_active) values('other','Other','Other','',false) returning id",
    )
  ).rows[0].id;
  category = (
    await db.query(
      "insert into public.categories(slug,name_en,name_ar,icon_url) values('global','Global','Global','') returning id",
    )
  ).rows[0].id;
  await db.query("insert into public.shop_categories values($1,$2),($3,$2)", [
    shop,
    category,
    otherShop,
  ]);
  product = (
    await db.query(
      "insert into public.products(sku,shop_id,category_id,name_en,name_ar,description_en,description_ar,price,thumbnail_url,is_active) values('OWNER-PRODUCT',$1,$2,'Hidden','Hidden','','',10,'',false) returning id",
      [shop, category],
    )
  ).rows[0].id;
});
afterAll(() => db.close());
test("migrates legacy roles and ownership without changing administrators", async () => {
  assert.equal(
    (await db.query("select role from public.profiles where id=$1", [owner]))
      .rows[0].role,
    "shop_owner",
  );
  assert.equal(
    (await db.query("select role from public.profiles where id=$1", [admin]))
      .rows[0].role,
    "admin",
  );
  assert.equal(
    (
      await db.query("select * from public.shop_owners where shop_id=$1", [
        shop,
      ])
    ).rows[0].user_id,
    owner,
  );
});
test("atomically assigns multiple owners and shops, promoting only customers", async () => {
  await asUser(admin, () => save(shop, [owner, second, admin]));
  await asUser(admin, () => save(otherShop, [second], "other"));
  assert.equal(
    (await db.query("select role from public.profiles where id=$1", [second]))
      .rows[0].role,
    "shop_owner",
  );
  assert.equal(
    (await db.query("select role from public.profiles where id=$1", [admin]))
      .rows[0].role,
    "admin",
  );
  assert.equal(
    (
      await asUser(second, () =>
        db.query("select * from public.shop_owners where user_id=$1", [second]),
      )
    ).rows.length,
    2,
  );
  await assert.rejects(() =>
    asUser(admin, () => save(shop, [customer], "other")),
  );
  assert.equal(
    (await db.query("select role from public.profiles where id=$1", [customer]))
      .rows[0].role,
    "user",
  );
  assert.equal(
    (
      await db.query("select * from public.shop_owners where shop_id=$1", [
        shop,
      ])
    ).rows.length,
    3,
  );
});
test("owners manage hidden products in inactive shops and cannot move them to unassigned shops", async () => {
  assert.equal(
    (
      await asUser(owner, () =>
        db.query("select * from public.products where id=$1", [product]),
      )
    ).rows.length,
    1,
  );
  await asUser(owner, () =>
    db.query("update public.products set price=12 where id=$1", [product]),
  );
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query("update public.products set shop_id=$1 where id=$2", [
        otherShop,
        product,
      ]),
    ),
  );
  const created = (
    await asUser(owner, () =>
      db.query(
        "insert into public.products(sku,shop_id,category_id,name_en,name_ar,description_en,description_ar,price,thumbnail_url) values('NEW-OWNER',$1,$2,'New','New','','',5,'') returning id",
        [shop, category],
      ),
    )
  ).rows[0].id;
  await asUser(owner, () =>
    db.query("delete from public.products where id=$1", [created]),
  );
  assert.equal(
    (await db.query("select * from public.products where id=$1", [created]))
      .rows.length,
    0,
  );
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query(
        "insert into public.products(sku,shop_id,category_id,name_en,name_ar,description_en,description_ar,price,thumbnail_url) values('FORBIDDEN',$1,$2,'No','No','','',5,'')",
        [otherShop, category],
      ),
    ),
  );
});
test("owners cannot assign users, promote themselves, edit shops or access private orders", async () => {
  await assert.rejects(() => asUser(owner, () => save(shop, [customer])));
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query("insert into public.shop_owners values($1,$2)", [
        otherShop,
        owner,
      ]),
    ),
  );
  assert.equal(
    (
      await asUser(owner, () =>
        db.query(
          "update public.profiles set role='admin' where id=$1 returning id",
          [owner],
        ),
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (
      await asUser(owner, () =>
        db.query(
          "update public.shops set name_en='Hacked' where id=$1 returning id",
          [shop],
        ),
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (
      await asUser(owner, () =>
        db.query("select * from public.shop_owners where shop_id=$1", [
          otherShop,
        ]),
      )
    ).rows.length,
    0,
  );
  for (const table of ["orders", "payments"])
    assert.equal(
      (await asUser(owner, () => db.query(`select * from public.${table}`)))
        .rows.length,
      0,
    );
});
test("storage writes are confined to assigned shop paths and revoke immediately", async () => {
  const path = `shops/${shop}/photo.png`;
  await asUser(owner, () =>
    db.query(
      "insert into storage.objects(bucket_id,name) values('store-images',$1)",
      [path],
    ),
  );
  await asUser(owner, () =>
    db.query("update storage.objects set name=$1 where name=$1", [path]),
  );
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('store-images',$1)",
        [`shops/${otherShop}/no.png`],
      ),
    ),
  );
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('store-images','products/no.png')",
      ),
    ),
  );
  await asUser(admin, () => save(shop, [second, admin]));
  assert.equal(
    (
      await asUser(owner, () =>
        db.query(
          "update public.products set price=99 where id=$1 returning id",
          [product],
        ),
      )
    ).rows.length,
    0,
  );
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('store-images',$1)",
        [path + "2"],
      ),
    ),
  );
  assert.equal(
    (
      await asUser(owner, () =>
        db.query("delete from storage.objects where name=$1 returning id", [
          path,
        ]),
      )
    ).rows.length,
    0,
  );
  await asUser(admin, () => save(shop, [owner, second, admin]));
  await asUser(owner, () =>
    db.query("delete from storage.objects where name=$1", [path]),
  );
});
test("inactive owners lose access without changing their identity or role", async () => {
  await db.query("update public.profiles set is_active=false where id=$1", [
    owner,
  ]);
  assert.equal(
    (
      await asUser(owner, () =>
        db.query(
          "update public.products set price=99 where id=$1 returning id",
          [product],
        ),
      )
    ).rows.length,
    0,
  );
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('store-images',$1)",
        [`shops/${shop}/inactive.png`],
      ),
    ),
  );
  await assert.rejects(() => asUser(admin, () => save(shop, [owner])));
  await db.query("update public.profiles set is_active=true where id=$1", [
    owner,
  ]);
});

test("owner writes reject inactive and unadopted global categories", async () => {
  const unadopted = (
    await db.query(
      "insert into public.categories(slug,name_en,name_ar,icon_url) values('unadopted','Other','Other','') returning id",
    )
  ).rows[0].id;
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query("update public.products set category_id=$1 where id=$2", [
        unadopted,
        product,
      ]),
    ),
  );
  await db.query("update public.categories set is_active=false where id=$1", [
    category,
  ]);
  await assert.rejects(() =>
    asUser(owner, () =>
      db.query("update public.products set price=13 where id=$1", [product]),
    ),
  );
  await db.query("update public.categories set is_active=true where id=$1", [
    category,
  ]);
});
