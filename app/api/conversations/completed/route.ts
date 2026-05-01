import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { getCompletedMentorshipConversations } from "@/lib/db-helpers"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = Number(searchParams.get("days")) || 30

    const conversations = await getCompletedMentorshipConversations(
      Number(user.id),
      Number(user.college_id),
      days
    )

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("[v0] Get completed conversations error:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}