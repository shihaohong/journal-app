// Cloudflare integration helpers
// These functions will be used when deployed to Cloudflare Pages/Workers

import type { D1Database, R2Bucket } from "@cloudflare/workers-types"

export interface CloudflareEnv {
  DB: D1Database
  STORAGE: R2Bucket
}

// Helper to get Cloudflare environment from runtime
// This works when deployed to Cloudflare Pages/Workers
export function getCloudflareEnv(): CloudflareEnv | null {
  if (typeof process !== "undefined" && process.env) {
    // In development or Node.js runtime, return null
    // In production on Cloudflare, this will be injected by the runtime
    return null
  }

  // @ts-ignore - Cloudflare runtime types
  if (typeof globalThis !== "undefined" && globalThis.ENV) {
    // @ts-ignore
    return globalThis.ENV as CloudflareEnv
  }

  return null
}

// Helper to get database
export async function getDatabase(): Promise<D1Database | null> {
  const env = getCloudflareEnv()
  return env?.DB || null
}

// Helper to get R2 storage
export async function getR2Storage(): Promise<R2Bucket | null> {
  const env = getCloudflareEnv()
  return env?.STORAGE || null
}


