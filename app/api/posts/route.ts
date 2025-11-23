import { NextRequest, NextResponse } from "next/server"
import type { D1Database, R2Bucket } from "@cloudflare/workers-types"

export const runtime = 'edge'

// For local development, we'll use a simple in-memory store
// In production with Cloudflare, this will use D1
// Using a module-level variable that persists across requests in development
declare global {
  // eslint-disable-next-line no-var
  var __posts: Array<{
    id: number
    title: string
    content: string
    created_at: string
    updated_at: string
    image_url?: string | null
  }> | undefined
  // eslint-disable-next-line no-var
  var __nextId: number | undefined
}

// Use global to persist across hot-reloads in development
// Initialize globals if they don't exist
if (!globalThis.__posts) {
  globalThis.__posts = []
}
if (!globalThis.__nextId) {
  globalThis.__nextId = 1
}

// Helper to get Cloudflare runtime (works with @cloudflare/next-on-pages)
// On Cloudflare Pages, bindings from wrangler.toml are injected at runtime
// With @cloudflare/next-on-pages, bindings are available in process.env when deployed
function getCloudflareRuntime(request?: NextRequest): { DB?: D1Database; STORAGE?: R2Bucket } | null {
  // Try multiple ways to access bindings for @cloudflare/next-on-pages
  // @ts-ignore - Runtime bindings are not available at compile time
  const env = typeof process !== 'undefined' && process.env ? process.env : {}

  // Also check globalThis for bindings (some Cloudflare runtimes inject here)
  // @ts-ignore
  const globalEnv = typeof globalThis !== 'undefined' ? (globalThis as any).ENV : null

  // Check if we're in Cloudflare runtime by looking for Cloudflare-specific globals
  // @ts-ignore
  const cfRuntime = typeof globalThis !== 'undefined' ? (globalThis as any).__CF_RUNTIME : null

  // Try accessing through request context (for wrangler pages dev)
  // @ts-ignore
  const requestEnv = request ? (request as any).env || (request as any).cf?.env : null

  // Access bindings - try multiple locations
  // @ts-ignore
  let db = env.DB || null
  // @ts-ignore
  let storage = env.STORAGE || null

  // Try request context first (for wrangler pages dev)
  if (requestEnv) {
    if (!db && requestEnv.DB) db = requestEnv.DB
    if (!storage && requestEnv.STORAGE) storage = requestEnv.STORAGE
  }

  // Try globalThis.ENV if process.env didn't have them
  if (!db && globalEnv?.DB) {
    db = globalEnv.DB
  }
  if (!storage && globalEnv?.STORAGE) {
    storage = globalEnv.STORAGE
  }

  // Try accessing through cfRuntime if available
  if (cfRuntime) {
    // @ts-ignore
    if (!db && cfRuntime.env?.DB) db = cfRuntime.env.DB
    // @ts-ignore
    if (!storage && cfRuntime.env?.STORAGE) storage = cfRuntime.env.STORAGE
  }

  // Return runtime if at least one binding is available
  if (db || storage) {
    const runtime: { DB?: D1Database; STORAGE?: R2Bucket } = {}
    if (db) runtime.DB = db as D1Database
    if (storage) runtime.STORAGE = storage as R2Bucket

    // Log binding detection (but only once to avoid spam)
    if (!(globalThis as any).__bindingCheckLogged) {
      (globalThis as any).__bindingCheckLogged = true
      console.log("✓ Cloudflare bindings detected - DB:", !!db, "STORAGE:", !!storage)
    }

    return runtime
  }

  // Log what we found for debugging (but only once to avoid log spam)
  if (!(globalThis as any).__bindingCheckLogged) {
    (globalThis as any).__bindingCheckLogged = true
    console.log("⚠ No Cloudflare bindings found")
    console.log("⚠ DB available:", !!db, "STORAGE available:", !!storage)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      const allEnvKeys = Object.keys(process.env)
      // @ts-ignore
      const relevantKeys = allEnvKeys.filter(k =>
        k.includes('DB') || k.includes('STORAGE') || k.includes('BUCKET') || k.includes('D1') || k.includes('R2')
      )
      if (relevantKeys.length > 0) {
        console.log("⚠ Relevant env keys found:", relevantKeys.join(', '))
      } else {
        console.log("⚠ No relevant env keys found in process.env")
        console.log("⚠ Total env keys:", allEnvKeys.length)
        console.log("⚠ IMPORTANT: Bindings must be configured in Cloudflare Pages dashboard:")
        console.log("   1. Go to Pages → journal-app → Settings → Functions")
        console.log("   2. Add D1 binding: name='DB', database='journal-db'")
        console.log("   3. Add R2 binding: name='STORAGE', bucket='journal-storage'")
      }
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const runtime = getCloudflareRuntime(request)

    if (runtime?.DB) {
      console.log("✓ Using D1 database")
      try {
        // Use Cloudflare D1 in production
        const result = await runtime.DB.prepare(
          "SELECT * FROM posts ORDER BY created_at DESC"
        ).all()
        console.log("✓ D1 query successful, returning", result.results?.length || 0, "posts")
        return NextResponse.json(result.results || [])
      } catch (dbError: any) {
        console.error("D1 database error:", dbError)
        console.error("Error details:", {
          message: dbError?.message,
          cause: dbError?.cause,
          stack: dbError?.stack
        })
        // If it's a table doesn't exist error, return empty array
        if (dbError?.message?.includes("no such table") || dbError?.message?.includes("does not exist")) {
          console.log("⚠ Posts table doesn't exist yet, returning empty array")
          return NextResponse.json([])
        }
        throw dbError
      }
    }

    // Fallback to in-memory for local development
    console.log("⚠ Using in-memory storage (D1 not available)")
    const allPosts = globalThis.__posts || []
    console.log("Fetching posts (in-memory), total:", allPosts.length)
    const sortedPosts = [...allPosts].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return NextResponse.json(sortedPosts)
  } catch (error: any) {
    console.error("Error fetching posts:", error)
    console.error("Error details:", {
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      {
        error: "Failed to fetch posts",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authCookie = request.cookies.get("auth")
    console.log("Auth cookie:", authCookie?.value)
    if (!authCookie || authCookie.value !== "authenticated") {
      console.log("Unauthorized request - no valid auth cookie")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const imageFile = formData.get("image") as File | null

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const runtime = getCloudflareRuntime(request)
    const now = new Date().toISOString()
    let imageUrl: string | null = null

    // Handle image upload
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()

      if (runtime?.STORAGE) {
        console.log("✓ Using R2 storage for image upload")
        // Upload to Cloudflare R2 in production
        const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        await runtime.STORAGE.put(fileName, bytes, {
          httpMetadata: { contentType: imageFile.type }
        })
        // Use our API route to serve the image
        // This works both locally and in production
        const baseUrl = request.nextUrl.origin
        imageUrl = `${baseUrl}/api/images/${fileName}`
        console.log("✓ Image uploaded to R2:", fileName)
        console.log("✓ Image URL:", imageUrl)
      } else {
        console.log("⚠ Using data URL for image (R2 not available)")
        // For local development, create a data URL
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString("base64")
        imageUrl = `data:${imageFile.type};base64,${base64}`
      }
    }

    if (runtime?.DB) {
      console.log("✓ Using D1 database for post creation")
      try {
        // Use Cloudflare D1 in production
        // D1/SQLite doesn't support RETURNING, so we insert and then select
        const insertResult = await runtime.DB.prepare(
          "INSERT INTO posts (title, content, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(title, content, imageUrl, now, now).run()

        if (!insertResult.success) {
          throw new Error("Failed to insert post into database")
        }

        // Get the inserted row using last_insert_rowid()
        const result = await runtime.DB.prepare(
          "SELECT * FROM posts WHERE id = ?"
        ).bind(insertResult.meta.last_row_id).first()

        if (!result) {
          throw new Error("Failed to retrieve created post from database")
        }

        console.log("✓ Post created in D1:", result)
        return NextResponse.json(result, { status: 201 })
      } catch (dbError: any) {
        console.error("D1 database error:", dbError)
        console.error("Error details:", {
          message: dbError?.message,
          cause: dbError?.cause,
          stack: dbError?.stack
        })
        throw dbError
      }
    }

    // Fallback to in-memory for local development
    console.log("⚠ Using in-memory storage (D1 not available)")
    const currentId = globalThis.__nextId!
    const newPost = {
      id: currentId,
      title,
      content,
      created_at: now,
      updated_at: now,
      image_url: imageUrl,
    }

    globalThis.__posts!.push(newPost)
    globalThis.__nextId = currentId + 1
    console.log("Post created (in-memory):", newPost)
    console.log("Total posts:", globalThis.__posts!.length)

    return NextResponse.json(newPost, { status: 201 })
  } catch (error: any) {
    console.error("Error creating post:", error)
    console.error("Error details:", {
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json(
      {
        error: "Failed to create post",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}


