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


