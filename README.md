# Balvanz Cattle website

The site for **balvanzcattle.com**. It's a static site served by a Cloudflare Worker, and the Worker also handles the contact form. Everything runs on Cloudflare's free tier.

```
public/          the website (HTML, CSS, JS, images, fonts)
  images/        site photos (resized, location data removed)
src/worker.js    contact form handler → emails stevejr@ via Resend (free)
wrangler.toml    Cloudflare config (edit the two inbox lines before deploying)
logo/            brand mark + logo lockups, SVG (vector) and PNG (transparent)
```

---

## Setup, in order

### 1. Put the code on GitHub
Create a private repo (e.g. `balvanz-cattle`) and push this folder to it.

### 2. Move the domain's DNS from GoDaddy to Cloudflare (keep Google Workspace email working)
balvanzcattle.com email runs on **Google Workspace**. Nothing in this setup should change it.
1. **Before you start**, screenshot the DNS records at GoDaddy, especially every **MX** record (Google), the **TXT** records starting `v=spf1` and `google-site-verification`, the **google._domainkey** DKIM TXT, and any **_dmarc** TXT.
2. Cloudflare dashboard → **Add a domain** → `balvanzcattle.com` → Free plan.
3. On Cloudflare's "review DNS records" screen, check that **every Google record from step 1 is there and identical**. Add any that are missing. Delete only GoDaddy parking/forwarding records (A records pointing at GoDaddy, "WebsiteBuilder" CNAMEs).
4. GoDaddy → Domain → DNS: **turn off DNSSEC** if it's on.
5. GoDaddy → Domain → **Nameservers** → "I'll use my own nameservers" → enter the two Cloudflare nameservers.
6. When Cloudflare shows **Active**, send a test email to stevejr@balvanzcattle.com from another account to confirm mail still arrives.

*Optional, later:* transfer the registration itself to Cloudflare Registrar (renews at cost). Unlock at GoDaddy, get the auth code, start the transfer in Cloudflare → Domain Registration. Requires the domain to be 60+ days past registration or its last transfer.

### 3. Contact form email (Resend, free)
Cloudflare Email Routing can't be used here: it would replace Google's MX records on balvanzcattle.com. The form sends through **Resend** (free: 3,000 emails/month) from `website@notify.balvanzcattle.com` instead. Only the `notify` subdomain gets new DNS records; Google is untouched.
1. Sign up at resend.com (free).
2. **Domains → Add domain** → `notify.balvanzcattle.com`. Use Resend's **Cloudflare auto-configure** if offered, or add the records it lists in Cloudflare DNS. Every record must be on `notify.balvanzcattle.com` (or a name ending in it). Wait for **Verified**.
3. **API Keys → Create** → permission **Sending access**, domain `notify.balvanzcattle.com`. Copy the key.
4. Cloudflare → Workers → **balvanz-cattle → Settings → Variables and Secrets → Add** → type **Secret**, name `RESEND_API_KEY`, paste the key → Deploy.

### 4. Deploy the site
1. Nothing to edit: `wrangler.toml` already points the form at stevejr@balvanzcattle.com. Replies go back to the visitor automatically (Reply-To is set).
2. Cloudflare → **Workers & Pages → Create → Import a repository** → pick the repo. Defaults are fine (deploy command `npx wrangler deploy`).
3. Worker → **Settings → Domains & Routes → Add → Custom domain**: `balvanzcattle.com`, then again for `www.balvanzcattle.com`.
4. Every push to `main` redeploys automatically.

### 5. Turn on spam protection (Turnstile, free)
1. Cloudflare → **Turnstile → Add widget** → hostname `balvanzcattle.com` → mode *Managed*.
2. Paste the **site key** into `public/index.html` in place of `YOUR_TURNSTILE_SITE_KEY`.
3. Worker → **Settings → Variables and Secrets → Add** → type *Secret*, name `TURNSTILE_SECRET`, value = the **secret key**. Redeploy.

(Until the secret is set, the form still works and relies on a hidden honeypot field to block bots.)

### 6. Redirect www → balvanzcattle.com
Cloudflare → balvanzcattle.com → **Rules → Redirect Rules → Create** → template "Redirect from WWW to root" → 301.

### 7. Customer portal login (Cloudflare Access, free up to 50 users)
The Customer Portal button goes to `/clients/`. Cloudflare Access protects that page, so clients sign in with their email and a one-time code. There are no passwords to manage.
1. Cloudflare dashboard → **Zero Trust** (pick the Free plan if asked).
2. **Settings → Authentication → Login methods**: make sure **One-time PIN** is on.
3. **Access → Applications → Add an application → Self-hosted**:
   - Name: `Balvanz Cattle Customer Portal`
   - Domain: `balvanzcattle.com`, path: `clients`
   - Add a second destination: `balvanzcattle.com`, path: `bulls` (Bulls now lives inside the customer portal)
   - Policy: **Allow**, Include → **Emails** → add each client's email (and your own).
4. **Settings → Custom pages / Login page**: set the organization name to *Balvanz Cattle*, upload `logo/brand-mark.png` and set the background to `#1d1b18`, so the sign-in screen matches the site.

To add or remove a client, edit that policy's email list. **Do this before launch.** Until Access is on, `/clients/` is public (it holds no private data, but it should still be locked).

### 8. Test
Send yourself a message from the form. It should arrive within a minute with the subject "Website: General question from …". Hit Reply and it goes to the sender.

---

## Cattle page
`public/cattle/index.html` lists Cow-Calf, Feeder Cattle, Finished Cattle and Bulls, with the BQA certification band. It is public.

## Adding bulls
Listings come from `public/bulls/bulls.json`. Until it has entries, the page reads "No bulls are listed at this time." Example:

```json
[
  {
    "name": "Balvanz Ironside 412",
    "status": "Available",
    "tag": "412",
    "registration": "AAA 20xxxxxx",
    "breed": "Angus",
    "born": "March 2025",
    "sire": "…",
    "dam": "…",
    "notes": "Calving ease, docile.",
    "photo": "/images/bulls/412.jpg"
  }
]
```
Every field except `name` is optional. Put bull photos in `public/images/bulls/`.

## Making changes
- **Swap a photo:** replace the file in `public/images/` with one of the same name (both the full and `-sm` sizes). Keep photos ~1800px wide, JPEG quality ~80.
- **Edit text:** it's all in `public/index.html`.
- **Logo files** for print, signs, trucks, apparel: `logo/` has SVG (scales to any size) and transparent PNG, in dark and light versions.
