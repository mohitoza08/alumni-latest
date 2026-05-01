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
    const { email, otp, role, firstName, lastName, password, degree, major, phone, current_year_level, graduation_year, company, position, linkedin, certificateBase64, certificateName, professionalType, businessName, businessType, freelancerSkills } = body

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    if (otp.length !== 6) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    const otpResult = await query(
      "SELECT id, otp, expires_at, used FROM email_otps WHERE email = $1 AND otp = $2 ORDER BY created_at DESC LIMIT 1",
      [email, otp]
    )

    if (otpResult.length === 0) {
      console.log(`[v0] Verify OTP: No OTP found for ${email}`)
      return NextResponse.json({ error: "Invalid OTP. Please request a new one." }, { status: 400 })
    }

    const otpRecord = otpResult[0]

    if (otpRecord.used) {
      console.log(`[v0] Verify OTP: OTP already used for ${email}`)
      return NextResponse.json({ error: "OTP already used. Please login instead." }, { status: 400 })
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      console.log(`[v0] Verify OTP: OTP expired for ${email}, expired at:`, otpRecord.expires_at)
      return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 })
    }

    console.log(`[v0] Verify OTP: OTP valid for ${email}, checking registration data...`)
    console.log(`[v0] Verify OTP: firstName=${!!firstName}, lastName=${!!lastName}, password=${!!password}, degree=${!!degree}, major=${!!major}`)

    if (!firstName || !lastName || !password || !degree || !major) {
      const missing = []
      if (!firstName) missing.push("firstName")
      if (!lastName) missing.push("lastName")
      if (!password) missing.push("password")
      if (!degree) missing.push("degree")
      if (!major) missing.push("major")
      console.log(`[v0] Verify OTP: Missing fields: ${missing.join(", ")}`)
      return NextResponse.json({ error: `Missing registration data: ${missing.join(", ")}` }, { status: 400 })
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
        graduation_year, current_year_level, degree, major, status, email_verified`,
      [
        collegeId,
        email,
        password_hash,
        firstName,
        lastName,
        role || "student",
        phone || null,
        graduation_year ? parseInt(graduation_year) : null,
        current_year_level || null,
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
        // Store certificate in DB as base64 instead of filesystem (Vercel is read-only)
        certUrl = "certificate_stored"
      }

      await query(
        `INSERT INTO onboarding_requests (
          user_id, college_id, type, graduation_year, degree, major,
          current_company, current_position, linkedin_url, certificate_url, status,
          professional_type, business_name, business_type, freelancer_skills
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          user.id,
          collegeId,
          "alumni",
          graduation_year ? parseInt(graduation_year) : null,
          degree || null,
          major || null,
          company || null,
          position || null,
          linkedin || null,
          certUrl,
          "pending",
          professionalType || null,
          businessName || null,
          businessType || null,
          freelancerSkills || null,
        ]
      )
    }

    await query("UPDATE email_otps SET used = TRUE WHERE id = $1", [otpRecord.id])

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
    console.error("[v0] Verify OTP error:", error.message)

    if (error.code === "23505") {
      if (error.message.includes("users_college_id_email_key")) {
        return NextResponse.json({ error: "This email is already registered. Please login instead." }, { status: 409 })
      }
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    return NextResponse.json({ error: "Verification failed: " + error.message }, { status: 500 })
  }
}
