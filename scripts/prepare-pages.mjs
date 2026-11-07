import fs from "node:fs";

const base = process.env.VITE_BASE_PATH || "/";
if (!/^\/(?:[a-zA-Z0-9._-]+\/)*$/.test(base)) {
  throw new Error(
    "VITE_BASE_PATH must be a root-relative directory ending in /.",
  );
}
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YouKidZoo</title></head>
<body><p>Opening YouKidZoo… <a href="${base}">Go to the shop</a></p>
<script>
const base = ${JSON.stringify(base)};
if (location.pathname.startsWith(base)) {
  const route = location.pathname + location.search;
  location.replace(base + '?__youkidzoo_route=' + encodeURIComponent(route) + location.hash);
}
</script></body></html>`;
fs.writeFileSync(new URL("../dist/404.html", import.meta.url), html);
fs.writeFileSync(new URL("../dist/.nojekyll", import.meta.url), "");
console.log(`Prepared GitHub Pages deep-link fallback for ${base}`);
