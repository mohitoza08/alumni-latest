import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"
import path from "path"
import fs from "fs"

export const dynamic = "force-dynamic"

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"]
const MAX_SIZE = 2 * 1024 * 1024

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const result = await query(
      `SELECT * FROM onboarding_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    )

    return NextResponse.json({ request: result[0] || null })
  } catch (error) {
    console.error("Get onboarding error:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const graduation_year = formData.get("graduation_year")
    const current_year = formData.get("current_year")
    const semester = formData.get("semester")
    const degree = formData.get("degree")
    const major = formData.get("major")
    const phone = formData.get("phone")
    const bio = formData.get("bio")
    const current_company = formData.get("current_company")
    const current_position = formData.get("current_position")
    const linkedin_url = formData.get("linkedin_url")
    const type = formData.get("type") || "student"
    const certificate = formData.get("certificate") as File | null

    let certificateUrl = ""

    if (certificate && certificate.size > 0) {
      if (certificate.size > MAX_SIZE) {
        return NextResponse.json({ error: "File size must be under 2MB" }, { status: 400 })
      }
      if (!ALLOWED_TYPES.includes(certificate.type)) {
        return NextResponse.json({ error: "Only PDF, JPG, and PNG files allowed" }, { status: 400 })
      }

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "onboarding")
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      const ext = certificate.name.split(".").pop()
      const filename = `${user.id}_${Date.now()}.${ext}`
      const filepath = path.join(uploadsDir, filename)

      const buffer = Buffer.from(await certificate.arrayBuffer())
      fs.writeFileSync(filepath, buffer)
      certificateUrl = `/uploads/onboarding/${filename}`
    }

    const result = await query(
      `INSERT INTO onboarding_requests 
       (user_id, college_id, type, graduation_year, current_year, semester, degree, major, phone, bio, 
        current_company, current_position, linkedin_url, certificate_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
       RETURNING *`,
      [
        Number(user.id),
        Number(user.college_id),
        type,
        graduation_year ? Number(graduation_year) : null,
        current_year || null,
        semester || null,
        degree || null,
        major || null,
        phone || null,
        bio || null,
        current_company || null,
        current_position || null,
        linkedin_url || null,
        certificateUrl || null,
      ]
    )

    await query(
      `UPDATE users SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [Number(user.id)]
    )

    return NextResponse.json({ request: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Submit onboarding error:", error)
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 })
  }
}
