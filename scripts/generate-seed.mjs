import fs from "node:fs";
const data = JSON.parse(
  fs.readFileSync(
    new URL("../src/shared/data/demo-data.json", import.meta.url),
    "utf8",
  ),
);
const quote = (value) =>
  value === null
    ? "null"
    : typeof value === "boolean" || typeof value === "number"
      ? String(value)
      : Array.isArray(value)
        ? `array[${value.map(quote).join(",")}]::text[]`
        : `'${String(value).replaceAll("'", "''")}'`;
let sql =
  "-- Sample catalog only. Run explicitly for a new development store.\n-- Existing records are retained; seed is safe to run again.\n";
for (const table of ["shops", "categories", "products"]) {
  const rows = data[table],
    keys = Object.keys(rows[0]);
  sql +=
    `insert into public.${table} (${keys.join(",")}) values\n` +
    rows
      .map((row) => "(" + keys.map((key) => quote(row[key])).join(",") + ")")
      .join(",\n") +
    "\non conflict(id) do nothing;\n\n";
}
sql +=
  "insert into public.shop_categories(shop_id,category_id)\nselect shop_id,category_id from public.products group by shop_id,category_id\non conflict do nothing;\n";
fs.writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(
  `Prepared ${data.shops.length} shops, ${data.categories.length} categories, ${data.products.length} sample products.`,
);
