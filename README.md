# Balvanz Cattle website

The site for **balvanzcattle.com**. It's a static site served by a Cloudflare Worker, and the Worker also handles the contact form. Everything runs on Cloudflare's free tier.

```
public/          the website (HTML, CSS, JS, images, fonts)
  images/        site photos (resized, location data removed)
src/worker.js    contact form handler → emails you via Email Routing
wrangler.toml    Cloudflare config (edit the two inbox lines before deploying)
logo/            brand mark + logo lockups, SVG (vector) and PNG (transparent)
```

---

## Setup, in order

### 1. Put the code on GitHub
Create a private repo (e.g. `balvanz-cattle`) and push this folder to it.

### 2. Move the domain's DNS from GoDaddy to Cloudflare
1. Cloudflare dashboard → **Add a domain** → `balvanzcattle.com` → Free plan.
2. Cloudflare imports the existing DNS records. **Delete** any GoDaddy parking or forwarding records (A records pointing at GoDaddy, "WebsiteBuilder" CNAMEs). If you have email hosted at GoDaddy or Microsoft 365 for this domain, say so before going further, because step 3 replaces the MX records.
3. In GoDaddy → Domain → DNS: **turn off DNSSEC** if it's on.
4. In GoDaddy → Domain → **Nameservers** → "I'll use my own nameservers" → enter the two Cloudflare nameservers.
5. Wait until Cloudflare shows the domain as **Active** (usually under an hour, can take up to 24).

*Optional, later:* transfer the registration itself to Cloudflare Registrar (renews at cost, no markup). The domain must be at least 60 days past registration or its last transfer. Unlock it at GoDaddy, get the auth code, then start the transfer in Cloudflare → Domain Registration.

### 3. Set up email forwarding (stevejr@balvanzcattle.com)
1. Cloudflare → balvanzcattle.com → **Email → Email Routing** → Enable → **Add records and enable**.
2. **Destination addresses** → add the real inbox where mail should land (e.g. your Gmail) → click the link in the verification email.
3. **Routing rules → Custom address**: `stevejr` → forward to that inbox.

Email to stevejr@balvanzcattle.com now arrives in your inbox.

### 4. Deploy the site
1. Edit `wrangler.toml` and replace **both** `YOUR_REAL_INBOX@gmail.com` lines with the verified inbox from step 3. Commit and push.
   > Cloudflare's free form sending can only deliver to a *verified destination* inbox, not to a forwarding alias. So the form sends straight to the same inbox stevejr@ forwards to, and the result is the same. Replies go back to the visitor automatically (Reply-To is set).
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

### 7. Client portal login (Cloudflare Access, free up to 50 users)
The Client Login button goes to `/clients/`. Cloudflare Access protects that page, so clients sign in with their email and a one-time code. There are no passwords to manage.
1. Cloudflare dashboard → **Zero Trust** (pick the Free plan if asked).
2. **Settings → Authentication → Login methods**: make sure **One-time PIN** is on.
3. **Access → Applications → Add an application → Self-hosted**:
   - Name: `Balvanz Cattle Client Portal`
   - Domain: `balvanzcattle.com`, path: `clients`
   - Policy: **Allow**, Include → **Emails** → add each client's email (and your own).
4. **Settings → Custom pages / Login page**: set the organization name to *Balvanz Cattle*, upload `logo/brand-mark.png` and set the background to `#1d1b18`, so the sign-in screen matches the site.

To add or remove a client, edit that policy's email list. **Do this before launch.** Until Access is on, `/clients/` is public (it holds no private data, but it should still be locked).

### 8. Test
Send yourself a message from the form. It should arrive within a minute with the subject "Website: General question from …". Hit Reply and it goes to the sender.

---

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
