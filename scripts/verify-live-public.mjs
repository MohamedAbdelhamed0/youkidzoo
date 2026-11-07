import fs from "node:fs";
import assert from "node:assert/strict";
const config = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const pos = line.indexOf("=");
      return [line.slice(0, pos), line.slice(pos + 1)];
    }),
);
const url = config.VITE_SUPABASE_URL,
  key = config.VITE_SUPABASE_ANON_KEY;
assert.equal(
  new URL(url).hostname,
  "smbwbpgzvbujsrpoekbd.supabase.co",
  "This verifier is scoped to the explicitly authorized YouKidZoo project.",
);
assert.ok(
  key.startsWith("sb_publishable_") ||
    JSON.parse(Buffer.from(key.split(".")[1], "base64url")).role === "anon",
  "Only the public application key may be used.",
);
const headers = { apikey: key, "Content-Type": "application/json" };
const products = await fetch(
  `${url}/rest/v1/products?select=id,currency,stock_quantity`,
  { headers },
);
assert.equal(products.status, 200);
const catalog = await products.json();
assert.ok(catalog.length > 0);
assert.ok(catalog.every((p) => p.currency === "EGP"));
for (const table of ["profiles", "orders", "order_items", "payments"]) {
  const result = await fetch(`${url}/rest/v1/${table}?select=*`, { headers });
  if (result.ok)
    assert.deepEqual(
      await result.json(),
      [],
      `Anonymous ${table} data must be empty.`,
    );
  else assert.ok([401, 403].includes(result.status));
}
const place = await fetch(`${url}/rest/v1/rpc/place_order`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    p_items: [{ productId: catalog[0].id, quantity: 1 }],
    p_address: {
      recipientName: "Anonymous probe",
      phone: "000000",
      country: "Egypt",
      city: "Cairo",
      streetAddress: "Read-only access verification",
    },
    p_notes: "",
    p_request_id: crypto.randomUUID(),
  }),
});
assert.ok(
  [401, 403].includes(place.status),
  "Anonymous checkout must be denied before any order is created.",
);
const preflight = await fetch(`${url}/functions/v1/username-login`, {
  method: "OPTIONS",
  headers: {
    Origin: "http://127.0.0.1:5173",
    "Access-Control-Request-Method": "POST",
  },
});
assert.ok(preflight.ok);
assert.equal(
  preflight.headers.get("access-control-allow-origin"),
  "http://127.0.0.1:5173",
);
const login = await fetch(`${url}/functions/v1/username-login`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    username: "verification_missing_user",
    password: crypto.randomUUID(),
  }),
});
assert.equal(login.status, 401);
assert.deepEqual(await login.json(), {
  error: "Invalid username or password.",
});
console.log(
  JSON.stringify({
    project: "smbwbpgzvbujsrpoekbd",
    checks: {
      publicCatalog: true,
      egpCurrency: true,
      anonymousPrivateDataDenied: true,
      anonymousCheckoutDenied: true,
      usernameFunctionDeployed: true,
      loginCors: true,
      invalidLoginRejected: true,
    },
    products: catalog.length,
  }),
);
