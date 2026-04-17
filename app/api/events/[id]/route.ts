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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req)
    if (!user || (user.role !== "admin" && user.role !== "alumni")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: eventId } = await params
    const body = await req.json()
    const { title, description, start_date, location, max_attendees, is_virtual, virtual_link, event_type, status } =
      body

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
      return NextResponse.json({ error: "Only event organizer or admin can edit this event" }, { status: 403 })
    }

    console.log("[v0] Updating event:", eventId, body)

    const result = await query(
      `UPDATE events 
       SET title = $1, description = $2, start_date = $3, location = $4, 
           max_attendees = $5, is_virtual = $6, virtual_link = $7, event_type = $8, status = $9, updated_at = NOW()
       WHERE id = $10 AND college_id = $11
       RETURNING *`,
      [
        title,
        description,
        start_date,
        location,
        max_attendees,
        is_virtual,
        virtual_link,
        event_type,
        status || "upcoming",
        eventId,
        user.college_id,
      ],
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log("[v0] Event updated successfully")
    return NextResponse.json({ event: result[0] })
  } catch (error) {
    console.error("[v0] Update event error:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req)
    if (!user || (user.role !== "admin" && user.role !== "alumni")) {
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
      return NextResponse.json({ error: "Only event organizer or admin can delete this event" }, { status: 403 })
    }

    console.log("[v0] Deleting event:", eventId)

    // First delete all event registrations
    await query("DELETE FROM event_registrations WHERE event_id = $1", [eventId])

    // Then delete the event
    const result = await query("DELETE FROM events WHERE id = $1 AND college_id = $2 RETURNING id", [
      eventId,
      user.college_id,
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log("[v0] Event deleted successfully")
    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete event error:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
