# Deploy and Test with Remote D1 Database

This guide shows you how to deploy your app to Cloudflare Pages and test it with your remote D1 database.

## Prerequisites

Before deploying, make sure you've completed the [SETUP.md](./SETUP.md) guide:
- ✅ Cloudflare resources created (D1 database and R2 bucket)
- ✅ Remote database initialized
- ✅ Logged in to Cloudflare (`wrangler login`)

## Quick Start

```bash
# 1. Ensure remote database is initialized
bun run db:remote:init

# 2. Set admin password secret
wrangler pages secret put ADMIN_PASSWORD

# 3. Deploy to Cloudflare Pages
bun run deploy

# 4. Configure bindings in Cloudflare Dashboard (see Step 5)
# 5. Redeploy after configuring bindings
bun run deploy
```

## Step-by-Step Guide

### Step 1: Verify Remote Database Setup

Make sure your remote D1 database exists and is initialized:

```bash
# Check if database exists
wrangler d1 list

# Initialize the database schema (if not already done)
bun run db:remote:init

# Verify the posts table exists
bun run db:remote:query "SELECT name FROM sqlite_master WHERE type='table';"
```

### Step 2: Verify You're Logged In

```bash
# Check if you're logged in
wrangler whoami

# If not logged in, login
wrangler login
```

### Step 3: Set Environment Variables (Secrets)

Set your admin password as a secret:

```bash
# Set the admin password secret
wrangler pages secret put ADMIN_PASSWORD
# Enter your password when prompted

# Verify it's set
wrangler pages secret list
```

**Note:** Secrets are only available after deployment. You may need to redeploy after setting secrets.

### Step 4: Build and Deploy

```bash
# Build for Cloudflare Pages
bun run build:cf

# Deploy to Cloudflare Pages
bun run deploy
```

Or use the combined command:
```bash
bun run deploy
```

After deployment, you'll see output like:
```
✨ Deployment complete! Take a sneak peek at your worker:
https://journal-app-xxxxx.pages.dev
```

**Save this URL** - you'll need it to test your deployment.

### Step 5: Configure D1 and R2 Bindings

After the first deployment, you need to configure the bindings in the Cloudflare Dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **journal-app** (or your project name)
3. Go to **Settings** → **Functions**
4. Scroll to **D1 Database bindings**:
   - Click **Add binding**
   - **Variable name**: `DB`
   - **D1 database**: Select `journal-db`
   - Click **Save**
5. Scroll to **R2 Bucket bindings**:
   - Click **Add binding**
   - **Variable name**: `STORAGE`
   - **R2 bucket**: Select `journal-storage`
   - Click **Save**

**Important:** After adding bindings, you need to trigger a new deployment for them to take effect.

### Step 6: Redeploy After Adding Bindings

After configuring bindings, redeploy:

```bash
bun run deploy
```

### Step 7: Test Your Deployment

1. Visit your deployment URL (from Step 4)
2. Test the application:
   - Visit the home page - should show empty state or posts
   - Click "Write Post" - should prompt for password
   - Enter your `ADMIN_PASSWORD`
   - Create a test post with an image
   - Verify it appears on the home page
   - Verify the image displays correctly

### Step 8: Verify Remote Database

Check that your post was saved to the remote database:

```bash
# Query the remote database
bun run db:remote:query "SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;"
```

Or use the convenience script:
```bash
bun run db:remote:list
```

## Preview Deployments

You can create preview deployments to test changes before going to production:

```bash
# Create a preview deployment
bun run deploy:preview
```

**Warning:** Preview deployments use the same remote D1 and R2 as production, so be careful when testing!

## Troubleshooting

### Bindings Not Working

If your app can't access D1 or R2:

1. **Verify bindings are configured:**
   - Go to Cloudflare Dashboard → Pages → journal-app → Settings → Functions
   - Check that D1 and R2 bindings are listed

2. **Redeploy after adding bindings:**
   ```bash
   bun run deploy
   ```

3. **Check deployment logs:**
   - Go to Cloudflare Dashboard → Pages → journal-app → Deployments
   - Click on a deployment → View logs
   - Look for binding-related errors

### Database Not Found

If you get "database not found" errors:

```bash
# Verify database exists
wrangler d1 list

# Check database ID matches wrangler.toml
wrangler d1 info journal-db

# Re-initialize if needed
bun run db:remote:init
```

### Password Not Working

If authentication fails:

1. **Verify secret is set:**
   ```bash
   wrangler pages secret list
   ```

2. **Redeploy after setting secret:**
   ```bash
   bun run deploy
   ```

3. **Update the secret if needed:**
   ```bash
   wrangler pages secret put ADMIN_PASSWORD
   bun run deploy
   ```

### Images Not Displaying

If images aren't showing:

1. **Check R2 binding is configured** (Step 5)
2. **Verify images are being uploaded:**
   - Check deployment logs for image upload errors
   - Verify R2 bucket has objects: `wrangler r2 object list journal-storage`
3. **Check image URLs in database:**
   ```bash
   bun run db:remote:query "SELECT id, title, image_url FROM posts;"
   ```
   Image URLs should be in format: `https://your-domain.com/api/images/filename.jpg`

### Check Deployment Logs

View real-time logs from your deployment:

```bash
# Stream logs from your deployment
bun run deploy:logs
```

Or view logs in the dashboard:
- Go to Cloudflare Dashboard → Pages → journal-app → Deployments
- Click on a deployment → View logs

## Useful Commands

```bash
# List all deployments
bun run deploy:list

# Stream deployment logs
bun run deploy:logs

# Query remote database
bun run db:remote:query "SELECT * FROM posts;"

# List recent posts
bun run db:remote:list

# Initialize remote database
bun run db:remote:init
```

## Workflow Summary

1. **Development:** Use local D1 with `bun run dev:cf` for faster iteration
2. **Testing:** Deploy to Cloudflare Pages to test with remote D1
3. **Production:** Deploy to production when ready

**Remember:** `wrangler pages dev` only supports local D1. To test with remote D1, you must deploy to Cloudflare Pages.

## Next Steps

- Set up a custom domain in Cloudflare Pages settings
- Configure R2 public access if you want direct image URLs (optional - API route works fine)
- Set up database backups for production data
- Consider adding rate limiting in Cloudflare dashboard
