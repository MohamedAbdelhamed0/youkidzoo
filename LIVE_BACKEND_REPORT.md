# Live backend verification

Project: `smbwbpgzvbujsrpoekbd` (YouKidZoo).

The authenticated Supabase CLI provided access when the chat's MCP tools were unavailable. A read-only inspection ran before migrations. The project initially had no public tables, policies, functions, migration history, Auth users, storage buckets, or objects.

Six migrations are now applied. The frontend uses a public publishable key, and the username-login Edge Function is deployed. Local Auth redirects and login CORS are configured for `http://127.0.0.1:5173`; email confirmation remains enabled. The user-designated confirmed account was promoted to administrator after its exact identity was verified.

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

Remaining verification: real-browser desktop/mobile/reference comparison, RTL layout and invoice printing. Production hosting requires adding the final frontend origin to Auth redirects and username-login CORS.
