import { createSession } from "@/lib/auth-db"
import { query } from "@/lib/db"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, role, firstName, lastName, password, degree, major, phone, currentYear, semester, graduationYear, company, position, linkedin, bio, certificateBase64, certificateName } = body

    if (!email || !role || !firstName || !lastName || !password || !degree || !major) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const otpCheck = await query(
      "SELECT id FROM email_otps WHERE email = $1 AND used = TRUE ORDER BY created_at DESC LIMIT 1",
      [email]
    )

    if (otpCheck.length === 0) {
      return NextResponse.json({ error: "Please verify your email first" }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const collegeResult = await query("SELECT id FROM colleges LIMIT 1")
    if (collegeResult.length === 0) {
      return NextResponse.json({ error: "No college configured" }, { status: 500 })
    }
    const collegeId = collegeResult[0].id

    const initialStatus = role === "student" ? "active" : "pending"

    const userResult = await query(
      `INSERT INTO users (
        college_id, email, password_hash, first_name, last_name, role, phone,
        graduation_year, current_year_level, degree, major, status, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, college_id, role, email, first_name, last_name, phone,
        graduation_year, current_year_level, degree, major, status, email_verified, created_at`,
      [
        collegeId,
        email,
        password_hash,
        firstName,
        lastName,
        role,
        phone || null,
        graduationYear ? parseInt(graduationYear) : null,
        currentYear || null,
        degree || null,
        major || null,
        initialStatus,
        true,
      ]
    )

    const user = userResult[0]

    if (role === "alumni") {
      let certUrl = null

      if (certificateBase64) {
        certUrl = "certificate_stored"
      }

      await query(
        `INSERT INTO onboarding_requests (
          user_id, college_id, type, graduation_year, degree, major,
          current_company, current_position, linkedin_url, bio, certificate_url, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          user.id,
          collegeId,
          "alumni",
          graduationYear ? parseInt(graduationYear) : null,
          degree || null,
          major || null,
          company || null,
          position || null,
          linkedin || null,
          bio || null,
          certUrl,
          "pending",
        ]
      )
    }

    const session = await createSession(user.id)

    const cookieStore = await cookies()
    cookieStore.set("session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json({
      message: "Account created successfully",
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error: any) {
    console.error("[v0] Complete register error:", error.message)

    if (error.code === "23505") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    return NextResponse.json({ error: "Registration failed: " + error.message }, { status: 500 })
  }
}
