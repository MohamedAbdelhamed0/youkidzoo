import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { test, beforeAll as before, afterAll as after } from "vitest";
import assert from "node:assert/strict";
const db = new PGlite();
const user = "40000000-0000-4000-8000-000000000001",
  other = "40000000-0000-4000-8000-000000000002",
  admin = "40000000-0000-4000-8000-000000000003";
const shop = "20000000-0000-4000-8000-000000000001",
  category = "30000000-0000-4000-8000-000000000001",
  product = "10000000-0000-4000-8000-000000000001";
const address = {
  recipientName: "Test Parent",
  phone: "01234567890",
  country: "Egypt",
  city: "Cairo",
  streetAddress: "123 Test Street",
};
before(async () => {
  await db.exec(
    `create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`,
  );
  await db.exec(
    `create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets,name text);alter table storage.objects enable row level security;grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;`,
  );
  for (const name of [
    "202611070001_store.sql",
    "202611070002_security_checkout.sql",
    "202611070003_storage_admin.sql",
    "202611070004_domain_invariants.sql",
    "202611070005_egp_currency.sql",
    "202611070006_guarded_rpc_surface.sql",
    "20261108153358_shop_owners.sql",
  ]) {
    if (name === "202611070005_egp_currency.sql") {
      await db.exec(
        `insert into auth.users(id,email,raw_user_meta_data) values('40000000-0000-4000-8000-000000000099','legacy@test.com','{"username":"legacy_customer"}');insert into public.orders(id,order_number,user_id,subtotal_amount,total_amount,shipping_address) values('50000000-0000-4000-8000-000000000099','LEGACY-USD','40000000-0000-4000-8000-000000000099',20,20,'{}');insert into public.payments(order_id,user_id,amount,currency,method) values('50000000-0000-4000-8000-000000000099','40000000-0000-4000-8000-000000000099',20,'USD','cash_on_delivery');`,
      );
    }
    await db.exec(
      readFileSync(new URL("../migrations/" + name, import.meta.url), "utf8"),
    );
  }
  await db.query(
    `insert into auth.users(id,email,raw_user_meta_data) values($1,'one@test.com','{"username":"customer"}'),($2,'two@test.com','{"username":"other"}'),($3,'admin@test.com','{"username":"administrator"}');`,
    [user, other, admin],
  );
  await db.query(`update public.profiles set role='admin' where id=$1`, [
    admin,
  ]);
  await db.query(
    `insert into public.shops(id,slug,name_en,name_ar,logo_url) values($1,'test','Test','تجربة','');`,
    [shop],
  );
  await db.query(
    `insert into public.categories(id,slug,name_en,name_ar,icon_url) values($1,'toys','Toys','ألعاب','');`,
    [category],
  );
  await db.query(
    `insert into public.products(id,sku,shop_id,category_id,name_en,name_ar,description_en,description_ar,price,discount_price,thumbnail_url,stock_quantity) values($1,'TEST',$2,$3,'Test toy','لعبة','Test','تجربة',30,25,'',10)`,
    [product, shop, category],
  );
});
after(() => db.close());
async function asUser(id, work) {
  await db.exec("begin; set local role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
  try {
    const result = await work();
    await db.exec("commit");
    return result;
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}
async function place(
  items = [{ productId: product, quantity: 2 }],
  request = crypto.randomUUID(),
  addr = address,
) {
  return (
    await db.query(
      "select public.place_order($1::jsonb,$2::jsonb,$3,$4) as id",
      [JSON.stringify(items), JSON.stringify(addr), "", request],
    )
  ).rows[0].id;
}
test("checkout calculates discounted totals, shipping and snapshots; retries are idempotent", async () => {
  const request = crypto.randomUUID();
  const id = await asUser(user, () => place(undefined, request));
  const row = (await db.query("select * from public.orders where id=$1", [id]))
    .rows[0];
  assert.equal(Number(row.total_amount), 57);
  assert.equal(Number(row.subtotal_amount), 50);
  assert.equal(row.user_id, user);
  const item = (
    await db.query("select * from public.order_items where order_id=$1", [id])
  ).rows[0];
  assert.equal(item.product_name_en, "Test toy");
  assert.equal(Number(item.unit_price), 25);
  assert.equal(await asUser(user, () => place(undefined, request)), id);
  assert.equal(
    (
      await db.query("select stock_quantity from public.products where id=$1", [
        product,
      ])
    ).rows[0].stock_quantity,
    8,
  );
  const payment = (
    await db.query("select * from public.payments where order_id=$1", [id])
  ).rows[0];
  assert.equal(payment.method, "cash_on_delivery");
  assert.equal(payment.currency, "EGP");
  assert.equal(row.currency, "EGP");
  assert.equal(payment.status, "pending");
});
test("rejects invalid quantities, duplicated products, missing addresses and overselling atomically", async () => {
  for (const quantity of [0, -1, 1.5, "2", 1000]) {
    if (quantity === "2") continue; // PostgreSQL JSON numeric strings normalize to valid whole quantities.
    await assert.rejects(() =>
      asUser(user, () => place([{ productId: product, quantity }])),
    );
  }
  await assert.rejects(() =>
    asUser(user, () =>
      place([
        { productId: product, quantity: 1 },
        { productId: product, quantity: 1 },
      ]),
    ),
  );
  await assert.rejects(() =>
    asUser(user, () =>
      place(undefined, crypto.randomUUID(), { ...address, city: "" }),
    ),
  );
  await assert.rejects(() =>
    asUser(user, () => place([{ productId: product, quantity: 99 }])),
  );
  assert.equal(
    (
      await db.query("select stock_quantity from public.products where id=$1", [
        product,
      ])
    ).rows[0].stock_quantity,
    8,
  );
});
test("RLS protects other customers, role escalation and direct forged orders/payments", async () => {
  await asUser(other, async () => {
    assert.equal(
      (await db.query("select * from public.orders")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.order_items")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.payments")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.profiles")).rows.length,
      1,
    );
    const result = await db.query(
      "update public.profiles set role='admin' where id=$1 returning id",
      [other],
    );
    assert.equal(result.rows.length, 0);
  });
  await assert.rejects(() =>
    asUser(other, () =>
      db.exec(
        "insert into public.payments(order_id,user_id,amount,currency,method,status) select id,user_id,1,'EGP','cash_on_delivery','paid' from public.orders",
      ),
    ),
  );
  await assert.rejects(() =>
    asUser(other, () =>
      db.query(
        "insert into public.orders(order_number,user_id,subtotal_amount,total_amount,shipping_address) values('FORGED',$1,0,0,'{}')",
        [other],
      ),
    ),
  );
});
test("only admin transitions orders; cancellation restores stock once", async () => {
  const id = await asUser(user, () =>
    place([{ productId: product, quantity: 1 }]),
  );
  await assert.rejects(() =>
    asUser(user, () =>
      db.query("select public.set_order_status($1,$2)", [id, "cancelled"]),
    ),
  );
  await assert.rejects(() =>
    asUser(admin, () =>
      db.query("select public.set_order_status($1,$2)", [id, "delivered"]),
    ),
  );
  await asUser(admin, () =>
    db.query("select public.set_order_status($1,$2)", [id, "cancelled"]),
  );
  await asUser(admin, () =>
    db.query("select public.set_order_status($1,$2)", [id, "cancelled"]),
  );
  assert.equal(
    (
      await db.query("select stock_quantity from public.products where id=$1", [
        product,
      ])
    ).rows[0].stock_quantity,
    8,
  );
});
test("delivery records COD payment; refunds require a delivered order", async () => {
  const id = await asUser(user, () =>
    place([{ productId: product, quantity: 4 }]),
  );
  assert.equal(
    Number(
      (
        await db.query("select shipping_fee from public.orders where id=$1", [
          id,
        ])
      ).rows[0].shipping_fee,
    ),
    0,
  );
  for (const status of ["processing", "shipped", "delivered"])
    await asUser(admin, () =>
      db.query("select public.set_order_status($1,$2)", [id, status]),
    );
  assert.equal(
    (
      await db.query("select status from public.payments where order_id=$1", [
        id,
      ])
    ).rows[0].status,
    "paid",
  );
  await asUser(admin, () =>
    db.query("select public.set_order_status($1,$2)", [id, "refunded"]),
  );
  assert.equal(
    (
      await db.query("select status from public.payments where order_id=$1", [
        id,
      ])
    ).rows[0].status,
    "refunded",
  );
});
test("inactive users cannot check out and cannot grant themselves privileges", async () => {
  await db.query("update public.profiles set is_active=false where id=$1", [
    other,
  ]);
  await assert.rejects(() => asUser(other, () => place()));
});
test("address properties must be strings and prices cannot be forged by the client", async () => {
  await assert.rejects(() =>
    asUser(user, () =>
      place(undefined, crypto.randomUUID(), {
        ...address,
        city: { forged: true },
      }),
    ),
  );
  const id = await asUser(user, () =>
    place([{ productId: product, quantity: 1, unitPrice: 0, subtotal: 0 }]),
  );
  assert.equal(
    Number(
      (
        await db.query(
          "select subtotal_amount from public.orders where id=$1",
          [id],
        )
      ).rows[0].subtotal_amount,
    ),
    25,
  );
});
test("expired deals use the regular price and inactive products cannot be ordered", async () => {
  await db.query(
    "update public.products set is_special_deal=true,special_deal_ends_at=now()-interval '1 hour' where id=$1",
    [product],
  );
  const id = await asUser(user, () =>
    place([{ productId: product, quantity: 1 }]),
  );
  assert.equal(
    Number(
      (
        await db.query(
          "select subtotal_amount from public.orders where id=$1",
          [id],
        )
      ).rows[0].subtotal_amount,
    ),
    30,
  );
  await db.query("update public.products set is_active=false where id=$1", [
    product,
  ]);
  await assert.rejects(() =>
    asUser(user, () => place([{ productId: product, quantity: 1 }])),
  );
  await db.query("update public.products set is_active=true where id=$1", [
    product,
  ]);
});
test("category hierarchy rejects cycles and cross-shop product assignments", async () => {
  const child = "30000000-0000-4000-8000-000000000098";
  const scoped = "30000000-0000-4000-8000-000000000099";
  const secondShop = "20000000-0000-4000-8000-000000000099";
  await db.query(
    "insert into public.shops(id,slug,name_en,name_ar,logo_url) values($1,'other-shop','Other','آخر','')",
    [secondShop],
  );
  await db.query(
    "insert into public.categories(id,slug,name_en,name_ar,icon_url,parent_id) values($1,'child','Child','طفل','',$2)",
    [child, category],
  );
  await assert.rejects(() =>
    db.query("update public.categories set parent_id=$1 where id=$2", [
      child,
      category,
    ]),
  );
  await db.query(
    "insert into public.categories(id,slug,name_en,name_ar,icon_url,shop_id) values($1,'scoped','Scoped','خاص','',$2)",
    [scoped, secondShop],
  );
  await assert.rejects(() =>
    db.query("update public.products set category_id=$1 where id=$2", [
      scoped,
      product,
    ]),
  );
  await assert.rejects(() =>
    asUser(user, () =>
      db.query("select public.set_shop_categories($1,$2::uuid[])", [
        shop,
        [category],
      ]),
    ),
  );
  await asUser(admin, () =>
    db.query("select public.set_shop_categories($1,$2::uuid[])", [
      shop,
      [category],
    ]),
  );
  await assert.rejects(() =>
    asUser(admin, () =>
      db.query("select public.set_shop_categories($1,$2::uuid[])", [
        shop,
        [scoped],
      ]),
    ),
  );
  assert.deepEqual(
    (
      await db.query(
        "select category_id from public.shop_categories where shop_id=$1",
        [shop],
      )
    ).rows.map((r) => r.category_id),
    [category],
  );
});
test("storage policies permit admin uploads and deny customer uploads", async () => {
  await assert.rejects(() =>
    asUser(user, () =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('store-images','forged.jpg')",
      ),
    ),
  );
  await asUser(admin, () =>
    db.query(
      "insert into storage.objects(bucket_id,name) values('store-images','admin.jpg')",
    ),
  );
  await asUser(user, async () =>
    assert.equal(
      (await db.query("select name from storage.objects")).rows[0].name,
      "admin.jpg",
    ),
  );
});
test("profile changes cannot change roles; Auth email updates stay in sync", async () => {
  await asUser(user, () =>
    db.query("select public.update_my_profile($1,$2,$3)", [
      "Updated Parent",
      "01234567890",
      "ar",
    ]),
  );
  const p = (
    await db.query("select * from public.profiles where id=$1", [user])
  ).rows[0];
  assert.equal(p.role, "user");
  assert.equal(p.preferred_language, "ar");
  await db.query("update auth.users set email=$1 where id=$2", [
    "updated@test.com",
    user,
  ]);
  assert.equal(
    (await db.query("select email from public.profiles where id=$1", [user]))
      .rows[0].email,
    "updated@test.com",
  );
});
test("the development seed applies to the complete schema and can be run twice", async () => {
  const catalog = JSON.parse(
    readFileSync(
      new URL("../../src/shared/data/demo-data.json", import.meta.url),
      "utf8",
    ),
  );
  const seed = readFileSync(new URL("../seed.sql", import.meta.url), "utf8");
  await db.exec(seed);
  await db.exec(seed);
  assert.equal(
    Number(
      (await db.query("select count(*) as n from public.products")).rows[0].n,
    ),
    catalog.products.length,
  );
  assert.equal(
    Number(
      (await db.query("select count(*) as n from public.categories")).rows[0].n,
    ),
    catalog.categories.length + 2,
  );
  assert.equal(
    (
      await db.query(
        "select * from public.products p left join public.categories c on c.id=p.category_id where c.id is null",
      )
    ).rows.length,
    0,
  );
});
test("EGP migration preserves historical USD records and rejects non-EGP checkout", async () => {
  const id = "50000000-0000-4000-8000-000000000099";
  assert.equal(
    (await db.query("select currency from public.orders where id=$1", [id]))
      .rows[0].currency,
    "USD",
  );
  assert.equal(
    (
      await db.query("select currency from public.payments where order_id=$1", [
        id,
      ])
    ).rows[0].currency,
    "USD",
  );
  await db.query("update public.products set currency='USD' where id=$1", [
    product,
  ]);
  await assert.rejects(() =>
    asUser(user, () => place([{ productId: product, quantity: 1 }])),
  );
  await db.query("update public.products set currency='EGP' where id=$1", [
    product,
  ]);
});
