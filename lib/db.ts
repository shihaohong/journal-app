import { env } from "@/lib/env"
import type { D1Database, R2Bucket } from "@cloudflare/workers-types"

export interface Post {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
  image_url?: string | null
}

export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
}

// Helper function to get database from runtime
export function getDb(env: Env): D1Database {
  return env.DB
}

// Helper function to get R2 storage from runtime
export function getStorage(env: Env): R2Bucket {
  return env.STORAGE
}


