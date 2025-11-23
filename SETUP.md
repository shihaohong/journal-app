# Setup Guide

This guide will help you set up the journal app for the first time.

## Prerequisites

- **Bun** installed on your system ([install Bun](https://bun.sh))
- **Cloudflare account** with D1 and R2 enabled
- **Wrangler CLI** (will be installed if needed)

## Step 1: Install Dependencies

```bash
bun install
```

## Step 2: Configure Wrangler

1. Copy the example wrangler configuration:
   ```bash
   cp wrangler.toml.example wrangler.toml
   ```

2. Edit `wrangler.toml` and replace `YOUR_DATABASE_ID_HERE` with your actual database ID (you'll get this in the next step).

## Step 3: Create Cloudflare Resources

### 3.1 Create D1 Database

```bash
wrangler d1 create journal-db
```

The output will include a `database_id`. Copy it and update `wrangler.toml`:
- Replace `YOUR_DATABASE_ID_HERE` with the actual `database_id`
- Update it in both the main `[[d1_databases]]` section and the `[env.production]` section

### 3.2 Create R2 Bucket

```bash
wrangler r2 bucket create journal-storage
```

**Note:** If R2 is not enabled in your Cloudflare account, you may need to:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Enable R2 (may require adding a payment method, but R2 has a generous free tier)

### 3.3 Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with Cloudflare.

## Step 4: Initialize Databases

```bash
# Initialize remote database (for production)
bun run db:remote:init

# Initialize local database (for development)
bun run db:local:init
```

This creates the `posts` table in both databases.

## Step 5: Set Environment Variables

Create a `.env.local` file in the project root:

```bash
ADMIN_PASSWORD=your-secure-password-here
```

**Important:** Never commit `.env.local` to git. It's already in `.gitignore`.

## Step 6: Verify Setup

1. **Check you're logged in:**
   ```bash
   wrangler whoami
   ```

2. **Verify databases exist:**
   ```bash
   wrangler d1 list
   ```

3. **Verify R2 bucket exists:**
   ```bash
   wrangler r2 bucket list
   ```

## Step 7: Start Development

You're ready to start developing! Choose one of these options:

### Option A: In-Memory Storage (Fastest)

```bash
bun run dev
```

Best for rapid development and testing UI changes. Data is stored in memory and lost on restart.

### Option B: Local D1 + Remote R2

```bash
bun run dev:cf
```

Uses a local D1 database (persisted in `.wrangler/state/`) and your remote R2 bucket. Good for testing database operations locally.

**Note:** `wrangler pages dev` only supports local D1 databases. To test with your remote D1 database, you need to deploy (see [DEPLOY_REMOTE.md](./DEPLOY_REMOTE.md)).

## Next Steps

- **Ready to deploy?** See [DEPLOY_REMOTE.md](./DEPLOY_REMOTE.md) for deployment instructions
- **Need help?** Check the [troubleshooting section](#troubleshooting) below

## Troubleshooting

### Database Not Found

If you get "database not found" errors:

```bash
# Verify database exists
wrangler d1 list

# Check database ID matches wrangler.toml
wrangler d1 info journal-db
```

### R2 Bucket Not Found

```bash
# Verify bucket exists
wrangler r2 bucket list

# Create it if missing
wrangler r2 bucket create journal-storage
```

### Wrangler Not Found

If `wrangler` command is not found:

```bash
# Install wrangler globally
bun add -g wrangler

# Or use npx
npx wrangler --version
```

### Build Errors

If you encounter build errors:

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
bun install

# Try building again
bun run build:cf
```

## Important Notes

- **Database IDs:** The `database_id` in `wrangler.toml` is not highly sensitive, but you can keep your actual `wrangler.toml` private if you prefer (it's optional in `.gitignore`)
- **Secrets:** Never commit `.env.local` or secrets to git
- **R2 Bucket:** Make sure the bucket name matches in `wrangler.toml`
- **Local D1:** Local database is stored in `.wrangler/state/v3/d1/` (already in `.gitignore`)
