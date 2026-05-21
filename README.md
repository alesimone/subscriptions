# Family Subscriptions

A private subscription tracker for Cloudflare Pages with D1 persistence.

## Features

- Add monthly, annual, quarterly, or weekly subscriptions.
- Renewal date can be left empty when it is not known.
- Cloudflare D1 database persistence through a Pages Function.
- Local browser fallback for quick development without Cloudflare.
- Dashboard totals for monthly pace, yearly total, due soon, top category, average cost, and unknown renewals.
- Family owner and category breakdowns.
- Automatic logo lookup from the service domain, with favicon fallback.
- Smart category suggestion from common service names and domains.
- Search, filter, sort, JSON export, and JSON import.

## Deploy on Cloudflare Pages with persistent data

This app has no build step, but it does use a `/functions` API route. Deploy it with Git integration or Wrangler Direct Upload. Cloudflare dashboard drag-and-drop upload does not compile Pages Functions.

### 1. Create a D1 database

```sh
npx wrangler d1 create family-subscriptions
```

Copy the returned `database_id`.

### 2. Add the schema

```sh
npx wrangler d1 execute family-subscriptions --remote --file=./schema.sql
```

The API also creates the table automatically, but running the schema once is cleaner.

### 3. Bind D1 to Pages

This repository already includes a `wrangler.toml` with the `DB` binding for the `family-subscriptions` D1 database. If you deploy from GitHub, Cloudflare Pages can read that configuration during deploy.

You can also verify or add the same binding from the dashboard.

Dashboard path:

1. Open your Pages project in Cloudflare.
2. Go to `Settings > Bindings`.
3. Add a `D1 database` binding.
4. Set the variable name to `DB`.
5. Choose the `family-subscriptions` database.
6. Redeploy the Pages project.

Wrangler config, if you ever need to recreate it:

```sh
cp wrangler.example.toml wrangler.toml
```

Then replace `database_id` in `wrangler.toml` with the real ID.

### 4. Deploy

With Git integration:

1. Push these files to a Git repository.
2. Create a Cloudflare Pages project from the repository.
3. Leave build command empty.
4. Use the project root as the output directory.

With Wrangler Direct Upload:

```sh
npx wrangler pages deploy .
```

## Run locally

Run a tiny local server:

```sh
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

For local D1 testing, use Wrangler Pages dev:

```sh
npx wrangler pages dev . --d1 DB=<database_id>
```

## Data note

On Cloudflare Pages with the `DB` binding configured, data is stored in D1 and shared across browsers/devices. Without that binding, the app falls back to browser-local storage and will show `Local browser storage` in the header.

Cloudflare Access can be added in front of the Pages app later. Once Access protects the site, both the UI and `/api/subscriptions` endpoint are protected by the same access policy.
