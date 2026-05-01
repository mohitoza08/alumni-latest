import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { getActiveMentorshipConversations, getConversations } from "@/lib/db-helpers"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "active" or "all"

    let conversations
    
    if (type === "active" && user.role === "student") {
      // For students, only show active mentorship conversations
      conversations = await getActiveMentorshipConversations(Number(user.id), Number(user.college_id))
    } else {
      // For alumni or when "all" is requested, show all conversations
      conversations = await getConversations(Number(user.id), Number(user.college_id))
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("[v0] Get conversations error:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}