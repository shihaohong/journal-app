# Journal App

A personal journaling application built with Next.js, shadcn/ui, and Cloudflare services.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **shadcn/ui** - UI component library
- **Bun** - Runtime and package manager
- **Cloudflare D1** - SQLite database
- **Cloudflare R2** - Object storage for images
- **Cloudflare Workers** - Serverless runtime

## Features

- **Write Page** - Protected admin interface for creating journal posts
- **Read Page** - Public interface for viewing all posts
- **Image Upload** - Support for attaching images to posts (stored in R2)

## Getting Started

### Prerequisites

- Bun installed on your system
- Cloudflare account with D1 and R2 enabled

### Installation

1. Install dependencies:
```bash
bun install
```

2. Set up Cloudflare D1 database:
```bash
# Create the database
wrangler d1 create journal-db

# Update wrangler.toml with your database_id

# Run migrations
wrangler d1 execute journal-db --file=./schema.sql
```

3. Set up environment variables:
Create a `.env.local` file:
```
ADMIN_PASSWORD=your-secure-password-here
```

4. Run the development server:
```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Local Development with Cloudflare Services

By default, `bun run dev` uses in-memory storage for faster iteration. To test against Cloudflare D1 and R2 services locally:

### Option 1: Test with Local D1 Database (Recommended for Development)

**Note:** `wrangler pages dev` only supports **local** D1 databases, not remote ones. This is a limitation of the tool.

```bash
# First, ensure you're logged in to Cloudflare
wrangler login

# Initialize local D1 database (first time only)
bun run db:local:init

# Run with local D1 and remote R2
bun run dev:cf
```

This will:
- Build your Next.js app for Cloudflare Pages
- Start a local server that connects to your **local** D1 database and **remote** R2 bucket
- Allow you to test locally before deploying

**Important:**
- Local D1 is stored in `.wrangler/state/v3/d1/`
- R2 will still use your remote bucket (R2 doesn't have a local mode)
- To test with remote D1, you need to deploy to Cloudflare Pages

### Option 2: Test with Remote D1 (Deploy to Cloudflare Pages)

To test against your **remote** D1 database, you need to deploy to Cloudflare Pages:

```bash
# Deploy to Cloudflare Pages (uses remote D1 and R2)
bun run deploy
```

Or create a preview deployment:

```bash
# Build for Cloudflare
bun run build:cf

# Deploy to preview
wrangler pages deploy .vercel/output/static
```

**Note:** `wrangler pages dev` cannot connect to remote D1 databases - this is a limitation of the tool. Use local D1 for development, and deploy to test with remote D1.

### Database Management

Query your databases:

```bash
# Query local D1 database
bun run db:local:query "SELECT * FROM posts"

# Query remote D1 database
bun run db:remote:query "SELECT * FROM posts"
```

### Quick Reference

- `bun run dev` - Standard Next.js dev server (in-memory storage)
- `bun run dev:cf` - Cloudflare Pages dev server with **local** D1 and **remote** R2
- `bun run dev:cf:local` - Same as `dev:cf` (uses local persistence)
- `bun run deploy` - Deploy to Cloudflare Pages (uses **remote** D1 and R2)

**Important:** `wrangler pages dev` only supports local D1 databases. To test with remote D1, deploy to Cloudflare Pages.

## Cloudflare Deployment

This app is configured to work with Cloudflare Pages with D1 database and R2 storage.

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deployment Steps:

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   # or
   bun add -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Create D1 Database**:
   ```bash
   wrangler d1 create journal-db
   # Update wrangler.toml with the database_id
   wrangler d1 execute journal-db --file=./schema.sql
   ```

4. **Create R2 Bucket**:
   ```bash
   wrangler r2 bucket create journal-storage
   ```

5. **Set Environment Variables**:
   ```bash
   wrangler pages secret put ADMIN_PASSWORD
   ```

6. **Build and Deploy**:
   ```bash
   bun run build:cf
   bun run deploy
   ```

For complete deployment guide with troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**To deploy and test with remote D1 database**, see [DEPLOY_REMOTE.md](./DEPLOY_REMOTE.md) for a step-by-step guide.

## Project Structure

- `/app` - Next.js app directory
  - `/write` - Write page (protected)
  - `/read` - Read page (public)
  - `/api` - API routes
- `/components/ui` - shadcn/ui components
- `/lib` - Utility functions and database helpers
- `schema.sql` - Database schema

## Notes

- The write page requires authentication via password
- Posts are stored in Cloudflare D1 database
- Images are stored in Cloudflare R2
- By default, `bun run dev` uses in-memory storage for faster iteration
- Use `bun run dev:cf` or `bun run dev:cf:local` to test with actual Cloudflare services


