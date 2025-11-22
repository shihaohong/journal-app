# Deployment Guide for Journal App

This guide will walk you through deploying your journal app to Cloudflare Pages with D1 database and R2 storage.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install Cloudflare's CLI tool
   ```bash
   npm install -g wrangler
   # or with bun
   bun add -g wrangler
   ```
3. **Cloudflare Login**: Authenticate with Cloudflare
   ```bash
   wrangler login
   ```

## Step 1: Create Cloudflare D1 Database

1. Create a D1 database:
   ```bash
   wrangler d1 create journal-db
   ```

2. The output will include a `database_id`. Copy it and update `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "journal-db"
   database_id = "YOUR_DATABASE_ID_HERE"  # Replace with actual ID
   ```

3. Run the database migration:
   ```bash
   wrangler d1 execute journal-db --file=./schema.sql
   ```

## Step 2: Create R2 Bucket

1. **First, enable R2 in Cloudflare Dashboard** (if not already enabled):
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **R2** in the left sidebar
   - Click **Get Started** or **Enable R2** if prompted
   - Accept the terms if needed
   - You may need to add a payment method (R2 has a generous free tier)

2. Create an R2 bucket:
   ```bash
   wrangler r2 bucket create journal-storage
   ```

3. The bucket name should match what's in your `wrangler.toml` (it already does).

3. **Optional**: Set up a public domain for R2 if you want direct image URLs:
   - Go to Cloudflare Dashboard → R2 → journal-storage → Settings
   - Create a custom domain or use R2.dev public access

## Step 3: Build and Deploy (Create the Project)

**Important**: You must deploy first to create the Pages project before setting secrets.

1. Build the application:
   ```bash
   bun run build:cf
   ```

2. Deploy to create the project:
   ```bash
   wrangler pages deploy .vercel/output/static
   ```
   This will create the Pages project and give you a URL like `https://journal-app.pages.dev`

## Step 4: Configure Environment Variables

**After deployment**, set up environment variables. **Important**: Use "Secrets" for sensitive data like passwords.

### Option A: Via Wrangler CLI (Recommended)
```bash
wrangler pages secret put ADMIN_PASSWORD
# Enter your password when prompted
```

**Note**: After setting the secret, you may need to wait a minute or trigger a new deployment for it to take effect.

### Option B: Via Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **journal-app** → **Settings** → **Environment Variables**
3. Click on the **Secrets** tab (not the regular Environment Variables tab)
4. Click **Add secret**
5. Add:
   - **Variable name**: `ADMIN_PASSWORD`
   - **Value**: Your secure password
6. Make sure it's enabled for **Production** environment
7. Save

**Troubleshooting**:
- If the password still doesn't work, check the browser console and Cloudflare Pages logs for errors
- You may need to trigger a new deployment after setting the secret
- Verify the secret is set: `wrangler pages secret list`

## Step 5: Set Compatibility Flag

The `nodejs_compat` compatibility flag is required for Next.js apps on Cloudflare Pages.

### Option A: Set via wrangler.toml (Recommended)
The `wrangler.toml` already includes this flag. After updating it, redeploy:
```bash
bun run deploy
```

### Option B: Set via Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **journal-app**
2. Navigate to **Settings** → **Functions**
3. Scroll to **Compatibility Flags**
4. Add `nodejs_compat` to both **Production** and **Preview** environments
5. Save changes

## Step 6: Configure D1 and R2 Bindings in Dashboard

### Option A: Deploy via Wrangler CLI

```bash
bun run deploy
```

Or manually:
```bash
wrangler pages deploy .vercel/output/static
```

### Option B: Deploy via Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
3. Click **Create a project** → **Connect to Git**
4. Select your repository
5. Configure build settings:
   - **Framework preset**: Next.js (or None)
   - **Build command**: `bun run build:cf` or `npm run build:cf`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (or your project root)
6. Add environment variables:
   - `ADMIN_PASSWORD`: Your password
7. Configure D1 and R2 bindings in the Pages settings:
   - Go to **Settings** → **Functions** → **D1 Database bindings**
     - Binding name: `DB`
     - Database: `journal-db`
   - Go to **Settings** → **Functions** → **R2 Bucket bindings**
     - Binding name: `STORAGE`
     - Bucket: `journal-storage`

## Step 7: Verify Deployment

1. Visit your Cloudflare Pages URL (provided after deployment)
2. Test the application:
   - Visit the home page - should show empty state or posts
   - Click "Write Post" - should prompt for password
   - Enter your `ADMIN_PASSWORD`
   - Create a test post
   - Verify it appears on the home page

## Troubleshooting

### Database Issues

If posts aren't saving:
```bash
# Check database
wrangler d1 execute journal-db --command="SELECT * FROM posts"

# Re-run migrations if needed
wrangler d1 execute journal-db --file=./schema.sql
```

### Build Issues

If build fails:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install

# Try building again
bun run build:cf
```

### Environment Variables

Verify environment variables are set:
```bash
# List secrets (for Pages)
wrangler pages secret list
```

### R2 Image Upload Issues

If images aren't uploading:
1. Verify R2 bucket exists: `wrangler r2 bucket list`
2. Check bucket name matches `wrangler.toml`
3. Ensure R2 binding is configured in Pages settings
4. If using custom domain, verify it's configured correctly

## Updating the Deployment

After making changes:
1. Commit and push to your Git repository (if using Git integration), OR
2. Run `bun run deploy` again for CLI deployments

## Production Considerations

1. **Custom Domain**: Add a custom domain in Cloudflare Pages settings
2. **HTTPS**: Automatically handled by Cloudflare
3. **Analytics**: Enable in Cloudflare Pages dashboard
4. **Password Security**: Consider using a more secure authentication method in production
5. **Database Backups**: Set up regular D1 database backups
6. **Rate Limiting**: Configure rate limits in Cloudflare dashboard if needed

## Local Development with Cloudflare Services

To test with actual Cloudflare services locally:

```bash
# Start local D1 database
wrangler d1 execute journal-db --local --file=./schema.sql

# Run development server with Wrangler
wrangler pages dev .vercel/output/static --d1=DB=journal-db --r2=STORAGE=journal-storage
```

Note: For local development, you might still want to use `bun run dev` which uses in-memory storage for faster iteration.

