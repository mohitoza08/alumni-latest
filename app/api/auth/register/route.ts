import { query } from "@/lib/db"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { sendOTPEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

const COLLEGE_DOMAINS = [".edu", ".ac.in", ".ac.uk", ".edu.in"]

function isValidCollegeEmail(email: string): boolean {
  const lower = email.toLowerCase()
  return COLLEGE_DOMAINS.some((d) => lower.endsWith(d))
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { role, email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (role === "student" && !isValidCollegeEmail(email)) {
      return NextResponse.json({ error: "Please use your college email" }, { status: 400 })
    }

    const emailCheck = await query("SELECT id FROM users WHERE email = $1", [email])
    if (emailCheck.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    await query("DELETE FROM email_otps WHERE email = $1", [email])

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await query(
      "INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)",
      [email, otp, expiresAt]
    )

    console.log(`[REGISTER] Sending OTP to: ${email}, Code: ${otp}`)

    const emailSent = await sendOTPEmail(email, otp)
    console.log(`[REGISTER] Email sent result: ${emailSent ? "SUCCESS" : "FAILED"}`)

    if (!emailSent) {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`)
    }

    return NextResponse.json({
      message: "OTP sent to your email",
      email,
      expires_in: 600,
    })
  } catch (error: any) {
    console.error("[v0] Register error:", error.message, error.code)
    return NextResponse.json({ error: "Failed to send OTP", details: error.message, code: error.code }, { status: 500 })
  }
}
