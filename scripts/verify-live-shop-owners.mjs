// Temporary fixtures only; keys stay in process memory and cleanup runs in finally.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
assert.ok(
  process.argv.includes("--allow-temporary-fixtures"),
  "Pass --allow-temporary-fixtures.",
);
const project = "smbwbpgzvbujsrpoekbd",
  url = `https://${project}.supabase.co`;
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
const run = crypto.randomUUID().slice(0, 8),
  users = [],
  shops = [],
  paths = [];
let service, category, product;
function required(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
function denied(result) {
  assert.ok(result.error, "Expected permission denial");
}
async function main() {
  const raw = execFileSync(
    "cmd.exe",
    [
      "/d",
      "/s",
      "/c",
      `npx.cmd --yes supabase projects api-keys --remote=${project} --reveal --output json`,
    ],
    { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  const parsed = JSON.parse(raw),
    keys = Array.isArray(parsed) ? parsed : parsed.keys;
  const secret = keys.find((k) => k.name === "service_role")?.api_key;
  const publicKey =
    keys.find((k) => k.type === "publishable")?.api_key ||
    keys.find((k) => k.name === "anon")?.api_key;
  assert.ok(secret && publicKey, "Project keys unavailable");
  service = createClient(url, secret, options);
  try {
    for (let i = 0; i < 3; i++) {
      const email = `owner-check-${run}-${i}@example.com`,
        password = crypto.randomUUID() + "Aa1!";
      const { user } = required(
        await service.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username: `owner_check_${run}_${i}` },
        }),
      );
      users.push(user.id);
      const client = createClient(url, publicKey, options);
      required(await client.auth.signInWithPassword({ email, password }));
      users[i] = { id: user.id, client };
    }
    const [admin, owner, customer] = users;
    required(
      await service
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", admin.id),
    );
    const details = (slug) => ({
      slug,
      name_en: slug,
      name_ar: slug,
      logo_url: "",
      is_active: false,
      is_verified: false,
    });
    const save = (id, owners, slug) =>
      admin.client.rpc("save_shop_with_owners", {
        p_id: id,
        p_owners: owners,
        p_shop: details(slug),
      });
    const slug = `owner-check-${run}`;
    const shop = required(await save(null, [owner.id, admin.id], slug));
    shops.push(shop);
    const other = required(await save(null, [], slug + "-other"));
    shops.push(other);
    assert.equal(
      required(
        await service
          .from("profiles")
          .select("role")
          .eq("id", owner.id)
          .single(),
      ).role,
      "shop_owner",
    );
    assert.equal(
      required(
        await service
          .from("profiles")
          .select("role")
          .eq("id", admin.id)
          .single(),
      ).role,
      "admin",
    );
    // Assignment takes effect with the owner's pre-promotion access token.
    assert.equal(
      required(await owner.client.from("shop_owners").select("*")).length,
      1,
    );
    denied(await save(shop, [customer.id], slug + "-other"));
    assert.equal(
      required(
        await service
          .from("profiles")
          .select("role")
          .eq("id", customer.id)
          .single(),
      ).role,
      "user",
    );
    category = required(
      await service
        .from("categories")
        .insert({
          slug: slug + "-category",
          name_en: "Owner check",
          name_ar: "Owner check",
          icon_url: "",
        })
        .select("id")
        .single(),
    ).id;
    required(
      await service.from("shop_categories").insert([
        { shop_id: shop, category_id: category },
        { shop_id: other, category_id: category },
      ]),
    );
    const fields = {
      sku: slug,
      shop_id: shop,
      category_id: category,
      name_en: "Owner test",
      name_ar: "Owner test",
      description_en: "",
      description_ar: "",
      price: 10,
      thumbnail_url: "",
      stock_quantity: 5,
      is_active: false,
    };
    product = required(
      await owner.client.from("products").insert(fields).select("id").single(),
    ).id;
    required(
      await owner.client
        .from("products")
        .update({ price: 12 })
        .eq("id", product)
        .select("id")
        .single(),
    );
    assert.equal(
      required(
        await owner.client.from("products").select("*").eq("id", product),
      ).length,
      1,
    );
    denied(
      await customer.client
        .from("products")
        .insert({ ...fields, sku: slug + "-customer" }),
    );
    denied(
      await owner.client
        .from("products")
        .update({ shop_id: other })
        .eq("id", product)
        .select("id")
        .single(),
    );
    denied(
      await owner.client.rpc("save_shop_with_owners", {
        p_id: shop,
        p_shop: details(slug),
        p_owners: [customer.id],
      }),
    );
    denied(
      await owner.client
        .from("shop_owners")
        .insert({ shop_id: other, user_id: owner.id }),
    );
    denied(
      await owner.client
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", owner.id)
        .select("id")
        .single(),
    );
    const path = `shops/${shop}/${run}.png`,
      bad = `shops/${other}/${run}.png`;
    paths.push(path, bad);
    const bytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
      "base64",
    );
    required(
      await owner.client.storage
        .from("store-images")
        .upload(path, bytes, { contentType: "image/png" }),
    );
    denied(
      await owner.client.storage
        .from("store-images")
        .upload(bad, bytes, { contentType: "image/png" }),
    );
    required(await save(shop, [], slug));
    denied(
      await owner.client
        .from("products")
        .update({ price: 99 })
        .eq("id", product)
        .select("id")
        .single(),
    );
    denied(
      await owner.client.storage
        .from("store-images")
        .upload(path, bytes, { contentType: "image/png", upsert: true }),
    );
    required(await save(shop, [owner.id], slug));
    required(
      await service
        .from("profiles")
        .update({ is_active: false })
        .eq("id", owner.id),
    );
    denied(
      await owner.client
        .from("products")
        .update({ price: 99 })
        .eq("id", product)
        .select("id")
        .single(),
    );
    required(
      await service
        .from("profiles")
        .update({ is_active: true })
        .eq("id", owner.id),
    );
    required(
      await owner.client
        .from("products")
        .delete()
        .eq("id", product)
        .select("id")
        .single(),
    );
    product = null;
    console.log(
      "Live shop-owner checks passed: assignments, promotion, atomic rollback, hidden products, CRUD, isolation, storage, revocation, inactive accounts.",
    );
  } finally {
    const errors = [];
    const clean = async (result) => {
      if (result.error) errors.push(result.error.message);
    };
    if (paths.length)
      await clean(await service.storage.from("store-images").remove(paths));
    if (product)
      await clean(await service.from("products").delete().eq("id", product));
    if (shops.length)
      await clean(await service.from("shops").delete().in("id", shops));
    if (category)
      await clean(await service.from("categories").delete().eq("id", category));
    for (const user of users)
      await clean(
        await service.auth.admin.deleteUser(
          typeof user === "string" ? user : user.id,
        ),
      );
    assert.deepEqual(errors, [], "Fixture cleanup failed");
    console.log("Temporary shop-owner fixtures removed.");
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
