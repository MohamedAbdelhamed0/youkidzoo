// Explicitly scoped live verification. Temporary fixtures are removed in finally.
import fs from "node:fs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
assert.ok(
  process.argv.includes("--allow-temporary-fixtures"),
  "Pass --allow-temporary-fixtures to run this explicitly authorized live verification.",
);
const project = "smbwbpgzvbujsrpoekbd",
  url = `https://${project}.supabase.co`;
const run = crypto.randomUUID().replaceAll("-", "").slice(0, 12),
  users = [],
  orders = [],
  checks = {};
let stage = "read project credentials",
  service,
  admin,
  shopId,
  categoryId,
  productId,
  objectPath;
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
const required = (result) => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
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
  const serviceKey = keys.find((key) => key.name === "service_role")?.api_key;
  const publicKey =
    keys.find((key) => key.type === "publishable")?.api_key ||
    keys.find((key) => key.name === "anon")?.api_key;
  assert.ok(serviceKey && publicKey, "Required project keys unavailable.");
  assert.equal(
    JSON.parse(Buffer.from(serviceKey.split(".")[1], "base64url")).role,
    "service_role",
  );
  service = createClient(url, serviceKey, options);
  try {
    stage = "create temporary verification identities";
    for (let i = 0; i < 3; i++) {
      const username = `verify_${run}_${i}`,
        password = crypto.randomUUID() + "Aa1!";
      const data = required(
        await service.auth.admin.createUser({
          email: `youkidzoo-verify-${run}-${i}@example.com`,
          password,
          email_confirm: true,
          user_metadata: {
            username,
            full_name: "Temporary YouKidZoo verification",
            role: "admin",
          },
        }),
      );
      users.push({
        id: data.user.id,
        username,
        password,
        email: data.user.email,
        client: createClient(url, publicKey, options),
      });
    }
    stage = "verify Auth and the profile trigger";
    for (const user of users) {
      required(
        await user.client.auth.signInWithPassword({
          email: user.email,
          password: user.password,
        }),
      );
      const profile = required(
        await user.client
          .from("profiles")
          .select("id,username,role")
          .eq("id", user.id)
          .single(),
      );
      assert.equal(profile.username, user.username);
      assert.equal(
        profile.role,
        "user",
        "Signup metadata must never grant administrator access.",
      );
    }
    checks.emailLogin = true;
    checks.profileTrigger = true;
    checks.signupRoleEscalationDenied = true;
    const usernameResult = required(
      await users[0].client.functions.invoke("username-login", {
        body: { username: users[0].username, password: users[0].password },
      }),
    );
    assert.ok(usernameResult.access_token && usernameResult.refresh_token);
    assert.equal(
      required(await users[0].client.auth.setSession(usernameResult)).user.id,
      users[0].id,
    );
    checks.usernameLogin = true;
    stage = "verify customer profile isolation";
    const attempt = await users[1].client
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", users[1].id)
      .select("id");
    assert.ok(attempt.error || attempt.data.length === 0);
    assert.deepEqual(
      required(
        await users[1].client
          .from("profiles")
          .select("id")
          .eq("id", users[2].id),
      ),
      [],
    );
    checks.customerRoleAndProfileIsolation = true;
    // This identity exists only for this verification run; the real owner is untouched.
    required(
      await service
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", users[0].id),
    );
    admin = users[0].client;
    stage = "verify administrative catalog CRUD";
    shopId = crypto.randomUUID();
    categoryId = crypto.randomUUID();
    productId = crypto.randomUUID();
    required(
      await admin
        .from("shops")
        .insert({
          id: shopId,
          slug: `verify-${run}`,
          name_en: "Temporary verification shop",
          name_ar: "متجر تحقق مؤقت",
          logo_url: "",
          is_active: true,
        }),
    );
    required(
      await admin
        .from("categories")
        .insert({
          id: categoryId,
          slug: `verify-${run}`,
          name_en: "Temporary verification category",
          name_ar: "فئة تحقق مؤقتة",
          icon_url: "🧪",
          shop_id: shopId,
          is_active: true,
        }),
    );
    required(
      await admin.rpc("set_shop_categories", {
        p_shop_id: shopId,
        p_category_ids: [categoryId],
      }),
    );
    required(
      await admin
        .from("products")
        .insert({
          id: productId,
          sku: `VERIFY-${run}`,
          shop_id: shopId,
          category_id: categoryId,
          name_en: "Temporary verification item",
          name_ar: "منتج تحقق مؤقت",
          description_en: "Automated test fixture, removed after verification.",
          description_ar: "بيانات تحقق مؤقتة تُحذف بعد الاختبار.",
          price: 29,
          currency: "EGP",
          thumbnail_url: "",
          stock_quantity: 1,
          is_active: true,
        }),
    );
    checks.adminCreate = true;
    stage = "verify concurrent stock reservation";
    const address = {
      recipientName: "Temporary automated verification",
      phone: "0000000000",
      country: "Egypt",
      city: "Verification fixture",
      streetAddress: "No shipment — temporary automated fixture",
    };
    const input = {
      p_items: [{ productId, quantity: 1 }],
      p_address: address,
      p_notes: `YouKidZoo verification:${run}`,
      p_request_id: crypto.randomUUID(),
    };
    const race = await Promise.all(
      users
        .slice(1)
        .map((user) =>
          user.client.rpc("place_order", {
            ...input,
            p_request_id: crypto.randomUUID(),
          }),
        ),
    );
    const winners = race
      .map((result, index) => ({ result, user: users[index + 1] }))
      .filter(({ result }) => !result.error);
    assert.equal(
      winners.length,
      1,
      "Exactly one competing checkout may reserve the final unit.",
    );
    const winner = winners[0];
    orders.push(winner.result.data);
    const loser = users.slice(1).find((user) => user.id !== winner.user.id);
    const saved = required(
      await winner.user.client
        .from("orders")
        .select("id,total_amount,currency,order_items(*),payments(*)")
        .eq("id", winner.result.data)
        .single(),
    );
    assert.equal(Number(saved.total_amount), 36);
    assert.equal(saved.currency, "EGP");
    assert.equal(saved.payments[0].method, "cash_on_delivery");
    assert.equal(saved.payments[0].status, "pending");
    for (const [table, key] of [
      ["orders", "id"],
      ["order_items", "order_id"],
      ["payments", "order_id"],
    ])
      assert.deepEqual(
        required(await loser.client.from(table).select("*").eq(key, saved.id)),
        [],
      );
    checks.concurrentStockSafety = true;
    checks.egpCodCheckout = true;
    checks.customerOrderIsolation = true;
    stage = "verify order snapshots and fulfillment";
    required(
      await admin
        .from("products")
        .update({ name_en: "Updated verification item" })
        .eq("id", productId),
    );
    assert.equal(
      required(
        await winner.user.client
          .from("order_items")
          .select("product_name_en")
          .eq("order_id", saved.id)
          .single(),
      ).product_name_en,
      "Temporary verification item",
    );
    assert.ok(
      (
        await admin.rpc("set_order_status", {
          p_order_id: saved.id,
          p_status: "delivered",
        })
      ).error,
    );
    for (const status of ["processing", "shipped", "delivered"])
      required(
        await admin.rpc("set_order_status", {
          p_order_id: saved.id,
          p_status: status,
        }),
      );
    assert.equal(
      required(
        await admin
          .from("payments")
          .select("status")
          .eq("order_id", saved.id)
          .single(),
      ).status,
      "paid",
    );
    required(
      await admin.rpc("set_order_status", {
        p_order_id: saved.id,
        p_status: "refunded",
      }),
    );
    assert.equal(
      required(
        await admin
          .from("payments")
          .select("status")
          .eq("order_id", saved.id)
          .single(),
      ).status,
      "refunded",
    );
    checks.orderSnapshots = true;
    checks.fulfillmentAndCodLedger = true;
    stage = "verify checkout retries and cancellation stock restoration";
    required(
      await admin
        .from("products")
        .update({ stock_quantity: 2 })
        .eq("id", productId),
    );
    const repeat = { ...input, p_request_id: crypto.randomUUID() };
    const first = required(await users[1].client.rpc("place_order", repeat));
    orders.push(first);
    assert.equal(
      required(await users[1].client.rpc("place_order", repeat)),
      first,
    );
    assert.equal(
      required(
        await admin
          .from("products")
          .select("stock_quantity")
          .eq("id", productId)
          .single(),
      ).stock_quantity,
      1,
    );
    required(
      await admin.rpc("set_order_status", {
        p_order_id: first,
        p_status: "cancelled",
      }),
    );
    required(
      await admin.rpc("set_order_status", {
        p_order_id: first,
        p_status: "cancelled",
      }),
    );
    assert.equal(
      required(
        await admin
          .from("products")
          .select("stock_quantity")
          .eq("id", productId)
          .single(),
      ).stock_quantity,
      2,
    );
    checks.checkoutIdempotency = true;
    checks.cancellationRestocksOnce = true;
    stage = "verify image storage policies and gallery persistence";
    objectPath = `verification/${run}.png`;
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfAAAAABJRU5ErkJggg==",
      "base64",
    );
    assert.ok(
      (
        await users[1].client.storage
          .from("store-images")
          .upload(`verification/denied-${run}.png`, image, {
            contentType: "image/png",
          })
      ).error,
    );
    required(
      await admin.storage
        .from("store-images")
        .upload(objectPath, image, { contentType: "image/png" }),
    );
    const photo = admin.storage.from("store-images").getPublicUrl(objectPath)
      .data.publicUrl;
    assert.equal((await fetch(photo)).status, 200);
    required(
      await admin
        .from("products")
        .update({ thumbnail_url: photo, gallery_urls: [photo] })
        .eq("id", productId),
    );
    assert.deepEqual(
      required(
        await admin
          .from("products")
          .select("gallery_urls")
          .eq("id", productId)
          .single(),
      ).gallery_urls,
      [photo],
    );
    checks.adminImageUpload = true;
    checks.customerImageUploadDenied = true;
    checks.publicProductImages = true;
    checks.galleryPersistence = true;
    stage = "verify catalog deletion retains order snapshots";
    required(await admin.from("products").delete().eq("id", productId));
    const archived = required(
      await winner.user.client
        .from("order_items")
        .select("product_id,product_name_en")
        .eq("order_id", saved.id)
        .single(),
    );
    assert.equal(archived.product_id, null);
    assert.equal(archived.product_name_en, "Temporary verification item");
    required(await admin.from("categories").delete().eq("id", categoryId));
    required(await admin.from("shops").delete().eq("id", shopId));
    checks.adminEditAndDelete = true;
    checks.archivedOrderHistory = true;
  } finally {
    const failures = [];
    const clean = async (label, action) => {
      try {
        const result = await action();
        if (result?.error) throw new Error(result.error.message);
      } catch {
        failures.push(label);
      }
    };
    if (service) {
      if (objectPath)
        await clean("storage", () =>
          service.storage
            .from("store-images")
            .remove([objectPath, `verification/denied-${run}.png`]),
        );
      if (users.length) {
        const query = await service
          .from("orders")
          .select("id")
          .in(
            "user_id",
            users.map((user) => user.id),
          );
        const ids = [
          ...new Set([
            ...orders,
            ...(query.data || []).map((order) => order.id),
          ]),
        ];
        if (ids.length) {
          await clean("payments", () =>
            service.from("payments").delete().in("order_id", ids),
          );
          await clean("order_items", () =>
            service.from("order_items").delete().in("order_id", ids),
          );
          await clean("orders", () =>
            service.from("orders").delete().in("id", ids),
          );
        }
      }
      if (productId)
        await clean("product", () =>
          service.from("products").delete().eq("id", productId),
        );
      if (categoryId)
        await clean("category", () =>
          service.from("categories").delete().eq("id", categoryId),
        );
      if (shopId)
        await clean("shop", () =>
          service.from("shops").delete().eq("id", shopId),
        );
      for (const user of users)
        await clean("auth_user", () => service.auth.admin.deleteUser(user.id));
    }
    if (failures.length) {
      fs.mkdirSync(".supabase-inspection", { recursive: true });
      fs.writeFileSync(
        ".supabase-inspection/verification-cleanup.json",
        JSON.stringify(
          {
            run,
            failures,
            userIds: users.map((user) => user.id),
            orders,
            shopId,
            categoryId,
            productId,
            objectPath,
          },
          null,
          2,
        ),
      );
      throw new Error(
        "Temporary fixture cleanup requires attention: " + failures.join(", "),
      );
    }
  }
  console.log(
    JSON.stringify({
      project,
      checks,
      temporaryFixturesRemoved: true,
      privilegedCredentialsPersisted: false,
    }),
  );
}
main().catch((error) => {
  console.error(
    JSON.stringify({ project, failedStage: stage, message: error.message }),
  );
  process.exitCode = 1;
});
