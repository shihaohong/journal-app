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
- The app currently uses in-memory storage for local development


