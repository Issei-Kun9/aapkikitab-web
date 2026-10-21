# Running AapkiKitab without Shopify

The shop runs entirely on Cloudflare (website, server functions, database, photo storage),
with Razorpay for payments and Resend for emails. The owner manages everything at
**aapkikitab.in/admin**.

| Part | Where it lives |
| --- | --- |
| Website pages | Cloudflare Pages project `aapkikitab` (built from this repo) |
| Server functions (`functions/`) | Same Pages project |
| Database: products, content, orders, customers, reviews, chats | Cloudflare D1 `aapkikitab-db` |
| Photos and videos | Cloudflare KV `aapkikitab-media` |
| Payments | Razorpay (UPI, cards, net banking) |
| Sign-in codes and order emails | Resend |

The deploy workflow (`.github/workflows/deploy.yml`) creates the database and storage the first
time, applies `migrations/`, copies everything from Shopify once (while the database is empty),
builds the site from `/api/catalog`, and deploys. It runs on every push and every 15 minutes, so
changes made in the admin panel go live by themselves.

## One-time setup

### 1. Cloudflare API token
The `CLOUDFLARE_API_TOKEN` repo secret must be allowed to:
**Cloudflare Pages: Edit**, **D1: Edit** and **Workers KV Storage: Edit** (Account level).
Cloudflare dashboard → My Profile → API Tokens → edit the token → add the two missing permissions.

### 2. Emails (Resend)
1. Sign up at resend.com (free: 3,000 emails/month).
2. Domains → Add `aapkikitab.in` → add the DNS records it shows in Cloudflare DNS → Verify.
3. API Keys → Create (sending access) → save it as the repo secret **`RESEND_API_KEY`**.
Emails are sent from `AapkiKitab <orders@aapkikitab.in>` (change with the repo variable `EMAIL_FROM`).

### 3. Payments (Razorpay)
1. Razorpay Dashboard → Account & Settings → Website and app settings: add `https://aapkikitab.in`.
2. Settings → API Keys → Generate (Live mode) → repo secrets **`RAZORPAY_KEY_ID`** and **`RAZORPAY_KEY_SECRET`**.
3. Settings → Webhooks → Add: URL `https://aapkikitab.in/api/razorpay-webhook`, events
   `payment.captured` and `order.paid`, choose a secret → repo secret **`RAZORPAY_WEBHOOK_SECRET`**.

### 4. Admin sign-in
- People who may open the admin panel: repo **variable** `ADMIN_EMAILS` (comma-separated).
  Default: `himanshushar1890@gmail.com`. They sign in with a code sent to that email.
- Optional backup: repo secret **`ADMIN_PASSWORD`** (a long password) for signing in without email.

### 5. Optional: "Publish now" button
A fine-grained GitHub token with **Actions: Read and write** on this repo, saved as the repo
secret **`PUBLISH_TOKEN`**, lets the admin panel rebuild the site straight away.

## Local testing

```bash
npm ci
cp wrangler.example.toml wrangler.toml      # local only, ignored by git
npx wrangler d1 migrations apply aapkikitab-db --local
npm run build                                # uses the content already in src/data
npx wrangler pages dev out --port 8788
```
With `DEV_MODE = "1"` (in the example file) sign-in codes appear on screen and payments are
simulated, so nothing real is charged or emailed.
