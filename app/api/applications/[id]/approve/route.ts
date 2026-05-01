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

    console.log("[v0] Approving application:", applicationId)

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
       SET status = 'approved', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [applicationId, user.id],
    )

    if (studentId) {
      await query(
        `UPDATE users 
         SET status = 'active', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [studentId],
      )

      await query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES ($1, 'application', 'Application Approved', 'Your application has been approved! You can now access the platform.', CURRENT_TIMESTAMP)`,
        [studentId],
      )

      const emailSent = await sendVerificationResultEmail(email, first_name || full_name, "approved")
      console.log(`[Applications] Approval email for ${email}: ${emailSent ? "sent" : "failed"}`)
    }

    console.log("[v0] Application approved and user activated:", studentId)
    return NextResponse.json({ message: "Application approved successfully" })
  } catch (error) {
    console.error("[v0] Approve application error:", error)
    return NextResponse.json({ error: "Failed to approve application" }, { status: 500 })
  }
}
