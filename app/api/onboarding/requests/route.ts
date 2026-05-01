import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const result = await query(
      `SELECT o.*, u.first_name, u.last_name, u.email, u.role as user_role
       FROM onboarding_requests o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    )

    return NextResponse.json({ requests: result })
  } catch (error) {
    console.error("Get onboarding requests error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
