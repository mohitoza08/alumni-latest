import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"
import { sendVerificationResultEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const applicationId = Number.parseInt(id)

    const body = await req.json().catch(() => ({}))
    const adminNotes = body.admin_notes || ""

    console.log("[v0] Rejecting application:", applicationId)

    const application = await query(
      `SELECT a.student_id, a.email, a.full_name, u.first_name 
       FROM applications a 
       LEFT JOIN users u ON a.student_id = u.id 
       WHERE a.id = $1`,
      [applicationId]
    )

    if (application.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const { student_id: studentId, email, full_name, first_name } = application[0]

    await query(
      `UPDATE applications 
       SET status = 'rejected', admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [applicationId, adminNotes || null, user.id],
    )

    if (studentId) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES ($1, 'application', 'Application Rejected', 'Your alumni application has been reviewed. Please check your email for details or contact administration.', CURRENT_TIMESTAMP)`,
        [studentId],
      )

      const emailSent = await sendVerificationResultEmail(email, first_name || full_name, "rejected", adminNotes || undefined)
      console.log(`[Applications] Rejection email for ${email}: ${emailSent ? "sent" : "failed"}`)
    }

    console.log("[v0] Application rejected:", studentId)
    return NextResponse.json({ message: "Application rejected successfully" })
  } catch (error) {
    console.error("[v0] Reject application error:", error)
    return NextResponse.json({ error: "Failed to reject application" }, { status: 500 })
  }
}
