import { authenticateUser, createSession } from "@/lib/auth-db"
import { query } from "@/lib/db"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, college, role } = body

    console.log("[v0] Login attempt:", { email, college })

    if (!email || !password || !college) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let collegeId: number | null = null

    if (!isNaN(Number(college))) {
      collegeId = Number(college)
    } else {
      const collegeResult = await query<{ id: number }>(
        "SELECT id FROM colleges WHERE name = $1 OR code = $1",
        [college]
      )
      console.log("[v0] College search result:", collegeResult)
      if (collegeResult.length > 0) {
        collegeId = collegeResult[0].id
      }
    }

    if (collegeId === null) {
      return NextResponse.json({ error: "Invalid college - college not found in database" }, { status: 400 })
    }

    console.log("[v0] Using collegeId:", collegeId)

    // Check if user exists
    const userCheck = await query(
      "SELECT id, email, status FROM users WHERE email = $1 AND college_id = $2",
      [email, collegeId]
    )
    console.log("[v0] User check:", userCheck)

    if (userCheck.length === 0) {
      return NextResponse.json({ error: "User not found with this email and college" }, { status: 401 })
    }

    const userData = userCheck[0]
    if (userData.status !== 'active') {
      return NextResponse.json({ error: `Account is ${userData.status}, not active` }, { status: 401 })
    }

    const user = await authenticateUser(email, password, collegeId)

    if (!user) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Create session
    const session = await createSession(user.id)
    console.log("[v0] Login: Session created with token:", session.token.substring(0, 20) + "...")

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("[v0] Login successful for user:", user.id)

    return NextResponse.json({
      user,
      token: session.token,
      message: "Login successful",
    })
  } catch (error: any) {
    console.error("[v0] Login error:", error.message)
    return NextResponse.json({ error: "Login failed: " + error.message }, { status: 500 })
  }
}
