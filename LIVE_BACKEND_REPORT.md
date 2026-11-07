# Live backend verification

Project: `smbwbpgzvbujsrpoekbd` (YouKidZoo).

The authenticated Supabase CLI provided access when the chat's MCP tools were unavailable. A read-only inspection ran before migrations. The project initially had no public tables, policies, functions, migration history, Auth users, storage buckets, or objects.

Six migrations are now applied. The frontend uses a public publishable key, and the username-login Edge Function is deployed. The production Auth site URL is `https://mohamedabdelhamed0.github.io/youkidzoo/`, with the `/youkidzoo/account` redirect allowed alongside local development redirects. Username-login CORS accepts the GitHub Pages origin and both local development origins; email confirmation remains enabled. The user-designated confirmed account was promoted to administrator after its exact identity was verified.

The starter seed created 2 shops, 12 categories and 13 EGP products. Subsequent verification observed 14 products, so current inventory must be treated as user-managed; it must not be reset to the seed count.

Live checks passed for:

- Public catalog reads and EGP currency; denied anonymous private-data reads and checkout.
- Email and username login; profile creation and ignored signup role escalation.
- Customer profile/order isolation and denied role changes.
- Administrator product/category/shop creation, editing, assignment and deletion.
- Competing customer checkouts for the final stock unit: exactly one succeeded.
- Server-calculated EGP COD totals, pending payment records and retained item snapshots.
- Checkout retries, valid fulfillment transitions, delivery/refund ledger states, and cancellation restoring stock once.
- Administrator image upload, public product image reads, gallery persistence and denied customer uploads.
- Historical item snapshots after product deletion.

All test fixtures were removed afterward. Final read-only checks found one Auth user and one active administrator, zero verification users, zero orders/items/payments, zero stored image objects, RLS enabled on every public table, EGP catalog data, and no public SECURITY DEFINER functions. Existing user-managed inventory was preserved. No real payment was collected.

The database advisor's remaining warning is the Supabase platform's disabled leaked-password-protection setting. Internal helper/trigger implementations were moved out of exposed schemas; protected public RPC wrappers retain the application's API.

GitHub Pages is live, deployed by GitHub Actions after tests and build on pushes to `main`. The first deployment succeeded. Live checks confirmed HTTP 200 for the site and hero image, correctly configured production JavaScript, the deep-link fallback, production username-login CORS, public EGP catalog reads, and denied anonymous private data/checkout. No migrations or inventory changes run in the Pages workflow.

Remaining verification: real-browser desktop/mobile layout, RTL layout and invoice printing.
