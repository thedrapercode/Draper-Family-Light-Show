# Draper Family Light Show — Website

An Astro + Tailwind static site with a Decap CMS admin panel, built to replace the GoDaddy site and run free on Cloudflare Pages.

## What's here

- **6 season pages** (Scary On Cherry, Merry On Cherry, LOVE Valentine's Day, May the 4th, Memorial Day, LibertyLights July 4th) — each is one Markdown file in `src/content/shows/`. Add a 7th holiday by adding one more file (or clicking "New Show" in the CMS) — no code changes needed.
- **Event Schedule page** pulls upcoming dates automatically from your Facebook Events feed at build time (`src/pages/event-schedule.astro`, using your iCal URL), so you only post a date once, on Facebook, and it shows up here too. `src/content/events/` still exists as an optional manual add-on for anything you don't want on Facebook (two sample October 2026 dates are in there now — delete or edit them).
- **Listen Now** — embeds your existing PulseMesh web player (106.9 FM simulcast).
- **Now Playing** — embeds your Remote Falcon widget just to show the currently-playing song title (this used to be labeled "Watch Live," which overstated what it does). See "About the Now Playing widget" below for a note on replacing it with something built on FPP's own API.
- **Donate** — United Way of Hardin County + St. Jude, linked exactly as on the old site.
- **Contact** — opens the visitor's email app addressed to you (no backend needed). See "Upgrading the contact form" below if you'd rather it submit in-page.
- **PWA support** — `manifest.json` + icons, so visitors can "Add to Home Screen" on their phone.
- Photos are placeholders (colored blocks/gradients) — the GoDaddy image host wasn't reachable from this build environment. Drop your real photos in through the CMS media library once it's live.

## 1. Push this to GitHub

```
cd draper-family-light-show
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/draper-family-light-show.git
git push -u origin main
```

## 2. Connect Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick this repo.
2. Build settings: **Framework preset: Astro**, build command `npm run build`, output directory `dist`.
3. Deploy. You'll get a `*.pages.dev` URL immediately — the real domain comes later (see step 4).

## 3. Turn on the CMS admin (Decap CMS + GitHub OAuth)

Decap CMS needs a small OAuth relay to let you log in with GitHub. The easiest free option is a one-file Cloudflare Worker:

1. Create a GitHub OAuth App: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Homepage URL: your Pages URL (or `draperlightshow.com` once DNS is switched)
   - Authorization callback URL: `https://<your-worker-subdomain>.workers.dev/callback`
2. Deploy the OAuth worker: `SubhenduX/decap-cms-cloudflare-pages` on GitHub is a ready-made Worker for exactly this — follow its README, plug in your OAuth App's Client ID/Secret as Worker secrets.
3. In `public/admin/config.yml`, update:
   - `repo:` to `YOUR-USERNAME/draper-family-light-show`
   - `base_url:` to your deployed worker URL
4. Commit and push. Visit `https://draperlightshow.com/admin` and log in with GitHub — you'll see a form-based editor for Shows and Events, with image upload built in.

## 4. Move the domain over (do this in December 2026)

Your GoDaddy registration runs through January 2027 — don't transfer early, it doesn't save you anything and can reset your renewal clock. In **December 2026**:

1. Unlock the domain and get the transfer auth code in GoDaddy.
2. Start the transfer to Cloudflare Registrar (~$10.44/yr, at-cost, no markup).
3. Once the transfer completes, add `draperlightshow.com` as a custom domain in your Cloudflare Pages project — Cloudflare will wire up DNS automatically since it's now the registrar and DNS host.
4. Do the same for `scaryoncherry.com` if you want to keep it as a separate redirect (today it 301s into `/scary-on-cherry` on the main site — you can recreate that redirect with a Cloudflare Page Rule or Bulk Redirect).

## Local development

```
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs static site to dist/
```

## Upgrading the contact form

Right now "Send Message" opens the visitor's email app (zero setup, always works). If you'd rather it submit without leaving the page, swap the `<form>` in `src/pages/contact.astro` to POST to a free service like Web3Forms (web3forms.com — free, just needs a signup for an access key, no server to run) or Formspree.

## Adding a 7th show someday

Either: add a new Markdown file to `src/content/shows/` following the pattern of the existing six, or click "New Show" in `/admin` once the CMS is wired up. It'll automatically appear in the nav dropdown and homepage grid — no other code changes required.

## About the Facebook Events feed

`event-schedule.astro` fetches `https://www.facebook.com/events/ical/upcoming/?uid=...&key=...` at build time using `node-ical`, expands any recurring dates, and lists everything sorted by date. Because Cloudflare Pages rebuilds only when you push to GitHub (or hit a deploy hook), the schedule page reflects Facebook's events as of the *last deploy*, not live in real time. Two ways to keep it fresh without you doing anything:

- Add a scheduled GitHub Action (free) that pings your Cloudflare Pages **Deploy Hook** URL once a day — this triggers a rebuild, which re-fetches Facebook and re-bakes the schedule.
- Or just do a quick "Save" in the Decap CMS admin (even on an unrelated field) whenever you post a new Facebook event, which also triggers a rebuild.

If the Facebook feed URL or key ever changes, update the `FB_ICAL_URL` constant at the top of `src/pages/event-schedule.astro`.

## About the Now Playing widget

Right now `/now-playing` just embeds the Remote Falcon page, which is more than you need since all you actually want is "what song is playing." A leaner version you mentioned wanting: poll FPP's own status API directly (FPP exposes `GET /api/fppd/status` on your Falcon Player box, which returns the current playlist/sequence name as JSON) and display just that.

The catch is that FPP's API only listens on your local network by default, so a static site can't call it directly from a visitor's browser. To make this public without much infrastructure, a small always-on relay is needed — for example, a lightweight script on your show computer (or a Raspberry Pi on the same network) that polls FPP every few seconds and pushes the current song name to a tiny public endpoint (a free Cloudflare Worker + KV store works well for this and costs nothing at this scale). The site would then just fetch that one small JSON endpoint instead of embedding Remote Falcon at all. Worth a follow-up project once the site itself is live — happy to help build that relay when you're ready.
