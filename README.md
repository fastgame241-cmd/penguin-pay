# Penguin Pay

Login → verification → success flow, with TiDB storage and an admin dashboard. Hosted as a Netlify site plus serverless functions.

## Flow

1. User signs in with a 10-digit phone and password (min 6). First visit creates the account; later visits check the password.
2. Verification form is saved to TiDB (name, problem, experience). Password and PIN are **hashed**, not stored in plaintext.
3. Success page confirms submit.
4. Admin panel at `/admin.html` lists users and verification records.

## Local run

```bash
npm install
npx netlify login
npx netlify dev
```

Copy `.env.example` to `.env` and fill TiDB + admin values. Netlify Dev reads them automatically.

## TiDB Cloud

1. Create a TiDB Serverless cluster.
2. Create database `penguin_pay` (or any name you set in `TIDB_DATABASE`).
3. Optional: run `schema.sql` in the TiDB SQL editor. Tables are also created automatically on first request.
4. Use the cluster **host, port (4000), user, password**.

## GitHub

```bash
git init -b main
git add .
git commit -m "Add Penguin Pay app with TiDB and admin panel"
gh repo create penguin-pay --public --source=. --remote=origin --push
```

## Netlify

1. Import the GitHub repo in [Netlify](https://app.netlify.com).
2. Build settings: publish directory `.` (from `netlify.toml`).
3. Site environment variables:

| Variable | Example |
|---|---|
| `TIDB_HOST` / `DB_HOST` | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `TIDB_PORT` / `DB_PORT` | `4000` |
| `TIDB_USER` / `DB_USER` | `xxxxx.root` |
| `TIDB_PASSWORD` / `DB_PASSWORD` | cluster password |
| `TIDB_DATABASE` / `DB_NAME` | `penguin_pay` |
| `ADMIN_PASSWORD` | password for `/admin.html` |
| `ADMIN_SECRET` | long random string for admin session tokens |

4. Deploy. Open the site URL, then `/admin.html`.

TiDB Cloud must allow connections from the internet (default for Serverless). Use TLS — this app already enables SSL.
