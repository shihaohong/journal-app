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

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Follow the setup guide:**
   See [SETUP.md](./SETUP.md) for detailed setup instructions.

3. **Run the development server:**
   ```bash
   bun run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide for first-time users
- **[DEPLOY_REMOTE.md](./DEPLOY_REMOTE.md)** - Guide to deploy and test with remote D1 database

## Development

### Local Development Options

**Option 1: In-Memory Storage (Fastest)**
```bash
bun run dev
```
Uses in-memory storage for faster iteration during development.

**Option 2: Local D1 + Remote R2**
```bash
# Initialize local database (first time only)
bun run db:local:init

# Run with local D1 and remote R2
bun run dev:cf
```
Uses a local D1 database and remote R2 bucket. **Note:** `wrangler pages dev` only supports local D1 databases, not remote ones.

**Option 3: Deploy to Test with Remote D1**
```bash
bun run deploy
```
Deploy to Cloudflare Pages to test with your remote D1 database. See [DEPLOY_REMOTE.md](./DEPLOY_REMOTE.md) for details.

### Database Management

```bash
# Query local database
bun run db:local:query "SELECT * FROM posts"

# Query remote database
bun run db:remote:query "SELECT * FROM posts"

# Initialize databases
bun run db:local:init    # Local database
bun run db:remote:init   # Remote database

# Clear all posts (⚠️ DESTRUCTIVE - requires --confirm flag)
bun run db:clear:remote:dry        # Preview what would be deleted (remote)
bun run db:clear:remote --confirm  # Delete posts from remote database
bun run db:clear:local:dry         # Preview what would be deleted (local)
bun run db:clear:local --confirm   # Delete posts from local database

# Note: R2 objects are not deleted by this script. Delete them manually from the Cloudflare dashboard.
```

## Available Scripts

- `bun run dev` - Standard Next.js dev server (in-memory storage)
- `bun run dev:cf` - Cloudflare Pages dev server (local D1, remote R2)
- `bun run build:cf` - Build for Cloudflare Pages
- `bun run deploy` - Deploy to Cloudflare Pages
- `bun run deploy:preview` - Create a preview deployment
- `bun run deploy:list` - List all deployments
- `bun run deploy:logs` - Stream deployment logs

## Project Structure

```
/app
  /api          - API routes (posts, images, auth)
  /write        - Write page (protected)
  /read         - Read page (public)
/components/ui  - shadcn/ui components
/lib            - Utility functions and database helpers
schema.sql      - Database schema
```

## Important Notes

- **Local vs Remote D1:** `wrangler pages dev` only supports local D1 databases. To test with remote D1, you must deploy to Cloudflare Pages.
- **R2 Storage:** R2 doesn't have a local mode, so even local development uses your remote R2 bucket.
- **Authentication:** The write page requires a password set via `ADMIN_PASSWORD` environment variable or Cloudflare Pages secret.
- **Images:** Images are served through an API route (`/api/images/[filename]`) that fetches from R2 storage.

## Troubleshooting

For deployment issues, see [DEPLOY_REMOTE.md](./DEPLOY_REMOTE.md#troubleshooting).

For general setup issues, see [SETUP.md](./SETUP.md).
