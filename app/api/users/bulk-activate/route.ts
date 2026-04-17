import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { user_ids } = body

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: "user_ids must be a non-empty array" }, { status: 400 })
    }

    const userIds = user_ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))

    if (userIds.length === 0) {
      return NextResponse.json({ error: "No valid user IDs provided" }, { status: 400 })
    }

    const result = await query(
      `UPDATE users 
       SET status = 'active', updated_at = NOW()
       WHERE id = ANY($1)
       RETURNING id`,
      [userIds],
    )

    console.log(`[v0] Bulk activated ${result.length} users`)

    return NextResponse.json({
      success: true,
      activated_count: result.length,
      activated_ids: result.map((r: any) => r.id),
    })
  } catch (error) {
    console.error("[v0] Bulk activate users error:", error)
    return NextResponse.json({ error: "Failed to activate users" }, { status: 500 })
  }
}
