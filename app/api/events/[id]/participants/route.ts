import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"
import { getUserBySession } from "@/lib/auth-db"

export const dynamic = "force-dynamic"

async function getSessionUser(req: NextRequest) {
  let user = await getServerSession()
  if (!user) {
    const token = req.headers.get("x-session-token")
    if (token) {
      user = await getUserBySession(token)
    }
  }
  return user
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: eventId } = await params

    // Check if user is the organizer or admin
    const eventCheck = await query(
      `SELECT organizer_id FROM events WHERE id = $1 AND college_id = $2`,
      [eventId, user.college_id],
    )

    if (eventCheck.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const isOrganizer = eventCheck[0].organizer_id === user.id
    const isAdmin = user.role === "admin"

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Only event organizer or admin can view participants" }, { status: 403 })
    }

    // Get all participants
    const participants = await query(
      `SELECT er.*, u.first_name, u.last_name, u.email, u.role, u.profile_picture, u.phone
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.created_at ASC`,
      [eventId],
    )

    const formattedParticipants = participants.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      name: `${p.first_name} ${p.last_name}`,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone,
      role: p.role,
      profile_picture: p.profile_picture,
      status: p.status,
      registered_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
    }))

    return NextResponse.json({ participants: formattedParticipants })
  } catch (error) {
    console.error("[v0] Get participants error:", error)
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: eventId } = await params
    const { searchParams } = new URL(req.url)
    const participantId = searchParams.get("participant_id")

    if (!participantId) {
      return NextResponse.json({ error: "participant_id is required" }, { status: 400 })
    }

    // Check if user is the organizer or admin
    const eventCheck = await query(
      `SELECT organizer_id FROM events WHERE id = $1 AND college_id = $2`,
      [eventId, user.college_id],
    )

    if (eventCheck.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const isOrganizer = eventCheck[0].organizer_id === user.id
    const isAdmin = user.role === "admin"

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Only event organizer or admin can remove participants" }, { status: 403 })
    }

    // Remove participant
    const result = await query(
      `DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2 RETURNING id`,
      [eventId, participantId],
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    console.log("[v0] Participant removed from event:", eventId, "user:", participantId)
    return NextResponse.json({ message: "Participant removed successfully" })
  } catch (error) {
    console.error("[v0] Remove participant error:", error)
    return NextResponse.json({ error: "Failed to remove participant" }, { status: 500 })
  }
}
