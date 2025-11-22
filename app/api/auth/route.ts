import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const password = body?.password

    // Try multiple ways to access the environment variable
    // Cloudflare Pages secrets might be available in different contexts
    const adminPassword =
      process.env.ADMIN_PASSWORD ||
      (globalThis as any).ADMIN_PASSWORD ||
      (request as any).env?.ADMIN_PASSWORD ||
      "admin123"

    // Debug logging - check Cloudflare Pages logs for these
    console.log("=== AUTH DEBUG ===")
    console.log("Password provided:", !!password)
    console.log("Password provided length:", password?.length || 0)
    console.log("Admin password exists:", !!adminPassword)
    console.log("Admin password length:", adminPassword?.length || 0)
    console.log("process.env.ADMIN_PASSWORD:", !!process.env.ADMIN_PASSWORD)

    // Trim both passwords to handle whitespace issues
    const providedPassword = (password || "").trim()
    const expectedPassword = (adminPassword || "").trim()

    console.log("Provided password length:", providedPassword.length)
    console.log("Expected password length:", expectedPassword.length)
    console.log("Passwords match:", providedPassword === expectedPassword)
    console.log("==================")

    // Simple password check (in production, use proper authentication)
    if (providedPassword === expectedPassword) {
      // Use Headers API directly for Edge Runtime compatibility
      // Create response with JSON body
      const response = new NextResponse(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      // Set cookie using Set-Cookie header directly
      const maxAge = 60 * 60 * 24 * 7 // 7 days
      const isSecure = process.env.NODE_ENV === "production"
      const cookieValue = `auth=authenticated; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isSecure ? "; Secure" : ""}`
      response.headers.set("Set-Cookie", cookieValue)

      return response
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  } catch (error: any) {
    console.error("Auth error:", error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    return NextResponse.json(
      { error: "Authentication failed", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}


