import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { getConversationById, getConversationMessages, updateConversationTitle, markConversationAsRead, getUnreadCount } from "@/lib/db-helpers"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const conversationId = Number(id)
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit")) || 50
    const offset = Number(searchParams.get("offset")) || 0

    const conversation = await getConversationById(conversationId)
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    await markConversationAsRead(conversationId, Number(user.id))

    const messages = await getConversationMessages(conversationId, limit, offset)

    const unreadCount = await getUnreadCount(Number(user.id), conversationId)

    return NextResponse.json({ conversation, messages, unread_count: unreadCount })
  } catch (error) {
    console.error("[v0] Get conversation error:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const conversationId = Number(id)
    const body = await req.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    await updateConversationTitle(conversationId, title)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update conversation error:", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}