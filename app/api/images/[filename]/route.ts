import { NextRequest, NextResponse } from "next/server"
import type { R2Bucket } from "@cloudflare/workers-types"

export const runtime = 'edge'

// Helper to get Cloudflare runtime (same as in posts route)
function getCloudflareRuntime(request?: NextRequest): { STORAGE?: R2Bucket } | null {
  // @ts-ignore - Runtime bindings are not available at compile time
  const env = typeof process !== 'undefined' && process.env ? process.env : {}

  // @ts-ignore
  const globalEnv = typeof globalThis !== 'undefined' ? (globalThis as any).ENV : null

  // @ts-ignore
  const cfRuntime = typeof globalThis !== 'undefined' ? (globalThis as any).__CF_RUNTIME : null

  // @ts-ignore
  const requestEnv = request ? (request as any).env || (request as any).cf?.env : null

  // @ts-ignore
  let storage = env.STORAGE || null

  if (requestEnv?.STORAGE) {
    storage = requestEnv.STORAGE
  }

  if (!storage && globalEnv?.STORAGE) {
    storage = globalEnv.STORAGE
  }

  if (cfRuntime && !storage && cfRuntime.env?.STORAGE) {
    storage = cfRuntime.env.STORAGE
  }

  if (storage) {
    return { STORAGE: storage as R2Bucket }
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> | { filename: string } }
) {
  try {
    // Handle both sync and async params (Next.js 14+)
    const resolvedParams = await Promise.resolve(params)
    const { filename } = resolvedParams
    const runtime = getCloudflareRuntime(request)

    if (!runtime?.STORAGE) {
      return NextResponse.json(
        { error: "R2 storage not available" },
        { status: 503 }
      )
    }

    // Get the object from R2
    const object = await runtime.STORAGE.get(filename)

    if (!object) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      )
    }

    // Get the content type from the object metadata
    const contentType = object.httpMetadata?.contentType || 'image/jpeg'

    // Get the body as an array buffer
    const arrayBuffer = await object.arrayBuffer()

    // Return the image with proper headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error("Error serving image:", error)
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    )
  }
}

