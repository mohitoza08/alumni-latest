import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"
import { createMessage, getMessages, createConversation, findOrCreateDirectConversation } from "@/lib/db-helpers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    let { recipient_id, mentorship_id, conversation_id, subject, content, title } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    let finalConversationId = conversation_id ? Number(conversation_id) : undefined
    let finalRecipientId = recipient_id ? Number(recipient_id) : undefined

    if (finalConversationId && !finalRecipientId) {
      const convResult = await query(
        `SELECT sender_id, recipient_id FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [finalConversationId]
      )
      if (convResult.length > 0) {
        const firstMsg = convResult[0]
        const currentUserId = Number(user.id)
        if (firstMsg.sender_id === currentUserId) {
          finalRecipientId = Number(firstMsg.recipient_id)
        } else {
          finalRecipientId = Number(firstMsg.sender_id)
        }
      }
    }

    if (!finalRecipientId) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 })
    }

    if (!finalConversationId) {
      const conv = await findOrCreateDirectConversation(
        Number(user.id),
        finalRecipientId,
        Number(user.college_id),
        title || `Chat with ${subject || "User"}`,
      )
      finalConversationId = conv.id
    }

    const messageData = {
      sender_id: Number(user.id),
      recipient_id: finalRecipientId,
      mentorship_id: mentorship_id ? Number(mentorship_id) : undefined,
      conversation_id: finalConversationId,
      subject,
      content,
    }

    const message = await createMessage(messageData)

    return NextResponse.json({ message, conversation_id: finalConversationId })
  } catch (error) {
    console.error("[v0] Create message error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const other_user_id = searchParams.get("other_user_id")
    const mentorship_id = searchParams.get("mentorship_id")

    if (!other_user_id) {
      return NextResponse.json({ error: "Missing other_user_id" }, { status: 400 })
    }

    const messages = await getMessages(
      Number(user.id),
      Number(other_user_id),
      mentorship_id ? Number(mentorship_id) : undefined,
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[v0] Get messages error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
