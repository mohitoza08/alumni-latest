import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"
import { sendVerificationResultEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerSession()
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const result = await query(
      `SELECT o.*, u.first_name, u.last_name, u.email, u.role as user_role
       FROM onboarding_requests o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [Number(id)]
    )

    if (!result.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ request: result[0] })
  } catch (error) {
    console.error("Get onboarding request error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let action = ""
  try {
    const user = await getServerSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    action = body.action
    const { admin_notes } = body

    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'approved' or 'rejected'." }, { status: 400 })
    }

    const onboardingResult = await query(
      `SELECT o.id, o.user_id, u.email, u.first_name, u.last_name
       FROM onboarding_requests o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [Number(id)]
    )

    if (!onboardingResult.length) {
      return NextResponse.json({ error: "Onboarding request not found." }, { status: 404 })
    }

    const { user_id: userId, email, first_name: firstName } = onboardingResult[0]

    await query(
      `UPDATE onboarding_requests 
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [action, admin_notes || null, Number(user.id), Number(id)]
    )

    if (action === "approved") {
      await query(
        `UPDATE users SET status = 'active', onboarding_completed = TRUE, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [Number(userId)]
      )
    } else {
      await query(
        `UPDATE users SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [Number(userId)]
      )
    }

    const emailSent = await sendVerificationResultEmail(email, firstName, action as "approved" | "rejected", admin_notes)
    console.log(`[Onboarding] Email result for ${email}: ${emailSent ? "sent" : "failed"}`)

    return NextResponse.json({
      success: true,
      message: `Request ${action} successfully`,
      email_sent: emailSent,
    })
  } catch (error: any) {
    console.error("Update onboarding error:", error)
    const errorMessage = error.message || "Unknown database error"
    const errorDetail = error.detail || error.code || ""
    return NextResponse.json(
      { error: `Failed to ${action === "approved" ? "approve" : "reject"} request: ${errorMessage}`, details: errorDetail },
      { status: 500 }
    )
  }
}
