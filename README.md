# YouKidZoo

React + TypeScript kids marketplace based on `youkidzoo_architecture_system_specification.md` and the supplied screenshot. The current payment scope is **cash on delivery only**, as requested.

The store currency is **Egyptian pounds (EGP)**. Sample numeric prices and the shipping amounts are unchanged; no exchange-rate conversion is performed. The EGP migration preserves historical order/payment currencies. Previously stored USD products must be explicitly repriced in EGP before they can be ordered.

## Run locally

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`. In PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

```sh
npm test
npm run build
npm run preview
```

The production output is `dist/`. For hosts with SPA rewrites, return `index.html` for application routes such as `/products/:id`, `/checkout`, and `/admin`. GitHub Pages uses the dedicated fallback described below.

## GitHub Pages deployment

Repository: https://github.com/MohamedAbdelhamed0/youkidzoo

Site: https://mohamedabdelhamed0.github.io/youkidzoo/

Every push to `main` runs `.github/workflows/deploy-pages.yml`: install the locked dependencies with Node 24, run all tests, build, upload the Pages artifact, and deploy. A failed test/build prevents deployment. You can also run the workflow manually. No database migrations or sample inventory scripts run during website deployment.

Pages must use GitHub Actions as its publishing source. The workflow reads the repository variable `VITE_SUPABASE_URL` and secret `VITE_SUPABASE_ANON_KEY` (the public publishable application key, never a service-role key). Local `.env.local` is ignored by Git. The live Supabase Auth site URL and account redirect include the Pages address; username login accepts that origin and the existing local development origins.

The workflow sets `VITE_BASE_PATH` from the repository name. Vite assets, the router, hero photo, and Auth redirects respect this base. `npm run build:pages` writes `dist/404.html`; direct links redirect to the entry page, then restore their original path, query, and Auth fragment before React loads. To build this target locally in PowerShell:

```powershell
$env:VITE_BASE_PATH = '/youkidzoo/'
npm.cmd run build:pages
```

To publish later edits, commit them and run `git push origin main`. Deployment progress is visible under the repository's Actions tab.

## Implemented application

- Reference-style responsive homepage, live deal countdown tied to catalog data, category sidebar, search, product filters, product detail/gallery pages, and related products.
- Shop directory, individual shop pages, global and shop-specific categories, adopted category filters, and nested category filtering.
- Persistent device-local cart and wishlist, quantity validation, stock limits, and removal of unavailable items.
- English/Arabic switching with persisted language, document direction, bilingual content, and localized order/payment labels.
- Email/password and username/password authentication, registration, profile editing, sign-out, protected checkout, and customer order history.
- COD checkout with server-calculated prices and shipping (EGP 7, free at EGP 100), stock reservation, order-item snapshots, payment recording, and idempotent retries.
- Protected administration: overview metrics; product/category/shop creation, editing and deletion; bilingual fields; product dimensions; image galleries; category assignment; fulfillment status changes; invoice printing; and payment ledger.
- Database RLS, isolated customer records, admin authorization, category ownership/hierarchy checks, and admin-only image uploads.

With no Supabase configuration, the public catalog uses the sample inventory in `src/shared/data/demo-data.json`. Authentication and order placement require a connected backend; the app does not simulate successful accounts or orders.

## Connect Supabase

Target project: `smbwbpgzvbujsrpoekbd` ([dashboard](https://supabase.com/dashboard/project/smbwbpgzvbujsrpoekbd)). The project was inspected before deployment: it had no public tables, Auth users, or storage data. Authenticated Supabase CLI access was available even though MCP tools were not exposed in the chat. Six migrations are now applied, the starter catalog is loaded, the username-login function is deployed, and the user-designated confirmed administrator is enabled. `.env.local` contains only the public project URL and publishable application key; it is ignored by Git.

1. Use a new Supabase development project. Copy `.env.example` to `.env.local` and fill in its public project URL and anon/publishable key. Never put a service-role key in a Vite environment variable.
2. Apply **all** migrations in filename order:
   - `202611070001_store.sql`: complete base schema.
   - `202611070002_security_checkout.sql`: profiles, RLS, checkout and order status procedures.
   - `202611070003_storage_admin.sql`: storage bucket, image policies, shop-category assignment.
   - `202611070004_domain_invariants.sql`: category hierarchy, shop consistency, financial constraints and Auth email synchronization.
   - `202611070005_egp_currency.sql`: EGP defaults, order currency snapshots, and EGP-only checkout.
   - `202611070006_guarded_rpc_surface.sql`: private implementation schema and authenticated public RPC wrappers; internal trigger/helper functions are not exposed as API endpoints.
3. For sample inventory, run `supabase/seed.sql` explicitly. It contains 2 shops, 13 categories, and 19 products, and can be run again without replacing existing records. Regenerate it with `node scripts/generate-seed.mjs` after editing the demo JSON. The additive `supabase/seeds/kids-clothing.sql` adds only the Kids Clothing category and six starter clothes (EGP 179–449). These have sample sizes in their descriptions and placeholder illustrations; each product currently represents one size, without a size selector.
4. Deploy `supabase/functions/username-login`. Configure its `APP_ORIGIN` secret to the exact frontend origin, e.g. `http://127.0.0.1:5173`. Supabase supplies the function's project URL, anon key and service-role key at runtime. This function verifies credentials and returns a session; it never exposes profile email addresses to anonymous clients. Its public invocation setting is in `supabase/config.toml`.
5. In Auth settings, set the site URL and allowed redirect URLs to include the frontend origin and `/account`. Keep email confirmation enabled for production. Restart Vite after changing environment variables.
6. Register an account and confirm its email. In a trusted SQL editor, promote the intended store administrator:

```sql
update public.profiles
set role = 'admin'
where username = 'replace_with_your_registered_username';
```

7. Sign in at `/login` and open `/admin`. Test account access, a product upload, checkout, customer order history, and the complete processing → shipped → delivered flow on the connected project.

If an earlier prototype schema was already applied to your project, do not replay the rewritten initial migration over it or reset its data. Reconcile that existing schema with these migrations first. This repository's migrations have been tested against a fresh PostgreSQL-compatible database, not upgraded over an unknown existing project.

## Order and payment behavior

Only authenticated active customers can place orders. A transactional database function verifies products, availability, quantities, current discounts, and shipping, locks products in deterministic order, and records order snapshots and a pending COD payment. Client-supplied prices are ignored. The request ID survives retries and page remounts for unchanged order contents.

Administrators can advance orders through permitted fulfillment states. Cancellation restores reserved stock once and marks the pending payment failed. Delivery marks a pending COD payment paid. Marking a delivered order refunded updates the ledger; administrators must return the cash outside the application. There is no online payment provider integration in the current user-approved scope.

## Architecture and verification

Each feature has pure domain contracts, explicit datasource interfaces, database adapters, repository implementations and state controllers. `src/app/di/container.ts` selects the implementations for auth, products, categories, shops, orders, payments and administration. Supabase calls are confined to datasource adapters. Presentation components use controllers and domain rules, without calling repositories or SDKs. Demo product/category/shop sources can be replaced independently.

Architecture tests enforce those boundaries, and contract tests exercise repositories with alternative sources. List adapters read successive ranges, including when a server row cap is smaller than the requested range. Controllers ignore stale query results after scope changes, preserve partial gallery uploads after failures, and preserve cart additions made during checkout. Cart totals use integer cents at the free-shipping boundary. These are source-level and automated-test guarantees; they do not establish cloud deployment or visual fidelity.

The local automated suite covers all migrations using PGlite, RLS and storage policy decisions, trusted COD checkout, stock restoration, request idempotency, hierarchy validation, repeatable seed data, cart persistence, pricing/filtering, and React route/form workflows using a simulated DOM. Unit tests explicitly clear backend configuration so a local `.env.local` cannot turn them into live tests.

Live verification has also passed against the target project: email and username login, signup/profile trigger, denied role escalation, customer profile/order isolation, administrator catalog CRUD, concurrent reservation of the final stock unit, EGP COD checkout, snapshots, retries, fulfillment/refund ledger states, cancellation restocking, image policies and gallery persistence. Temporary accounts, products, orders, payments and images were removed afterward. No real payment was collected. Re-run `node scripts/verify-live-public.mjs` for public read/access checks. `node scripts/verify-live-workflows.mjs --allow-temporary-fixtures` explicitly creates and then removes test fixtures, retrieves privileged credentials through the authenticated CLI only in process memory, and must only be used for this authorized project.

The database security advisor reports no exposed security-definer API functions after the sixth migration. Its remaining warning is the platform setting for leaked-password protection; it is not enabled by the application. Email confirmation remains enabled. The application accepts passwords from 8 to 72 characters, matching the current Auth password constraint.

The landing section uses an original AI-generated lifestyle image, crisp bilingual copy, clothing/toy collection links, COD/shipping information, and an offer countdown driven by catalog expiry. See `public/images/GENERATION.md` for the image prompt and provenance. Clothing starting prices are calculated from available catalog products. Product illustrations and inventory remain samples. A real-browser visual/responsive audit is still outstanding because browser control was previously stopped by its URL-verification safeguard.

See `IMPLEMENTATION_STATUS.md` for the remaining completion gates.
