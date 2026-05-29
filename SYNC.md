# Presenter-driven sync (audience screens follow you)

Slidev syncs navigation across **every browser connected to the same running server** — you
drive from `/presenter`, the audience on `/` follows live. This needs a **running Node server**
(the static GitHub Pages build cannot sync). Pick one:

## Option 1 — Free cloud host (recommended; works behind a VPN)

A `Dockerfile` is included. These free tiers run a long-lived Node server with WebSockets
(needed for sync). **Serverless hosts like Vercel/Netlify do NOT work** — no persistent socket.

| Host | Free tier | Notes |
|------|-----------|-------|
| **Render** | Free web service, 750 h/mo | Easiest. Deploys the Dockerfile from GitHub. Sleeps after ~15 min idle (cold start ~30–60 s) — open it once before the talk to warm it. |
| **Koyeb** | 1 free web service | WebSockets supported, global. |
| **Fly.io** | Small free allowance | `fly launch` detects the Dockerfile; needs a card on file. |

### Render, step by step
1. https://render.com → **New → Web Service** → connect `salamaashoush/graphql-slides`.
2. Runtime: **Docker** (it picks up the `Dockerfile`).
3. **Environment** → add:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your `sb_publishable_…` key
   - *(optional)* `PRESENT_PASS` is not used here; for a presenter password run with `--remote=PASS` (edit the Dockerfile CMD).
4. Deploy. You get `https://<name>.onrender.com`.
   - **Presenter:** `https://<name>.onrender.com/presenter`
   - **Audience:** `https://<name>.onrender.com/`
5. Warm it up a minute before you start (free instances sleep when idle).

> Free instances are single-instance, which is exactly what sync needs (all clients hit one
> server). Don't enable autoscaling — multiple instances would split the WebSocket state.

## Option 2 — Your laptop + a tunnel (only without a VPN)

```bash
npm ci
./present.sh            # or: PRESENT_PASS=secret ./present.sh
```
Runs `slidev --remote` and a cloudflared tunnel, printing a public URL. **A corporate VPN
usually blocks this** — use Option 1 instead.

## Notes
- Sync is automatic: connect to the same server, navigate from `/presenter`, everyone follows.
  A viewer can detach with the per-client sync toggle in the toolbar.
- The quiz/leaderboard are independent of sync — they talk to Supabase directly, so they work
  on the hosted server and on the static Pages build alike (as long as the two env vars are set).
- The static Pages build (`https://salamaashoush.github.io/graphql-slides/`) stays as the
  self-paced / fallback version; use the hosted server only for the live, synced session.
