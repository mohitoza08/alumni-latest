import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { createEvent, getEvents } from "@/lib/db-helpers"
import { query } from "@/lib/db"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawEvents = await getEvents(user.college_id)

    const eventsWithDetails = await Promise.all(
      rawEvents.map(async (e) => {
        const now = new Date()
        const startDate = new Date(e.start_date)
        const endDate = e.end_date ? new Date(e.end_date) : startDate

        let status = e.status
        if (status === "upcoming" && startDate <= now && endDate >= now) {
          status = "ongoing"
        } else if (status === "upcoming" && endDate < now) {
          status = "completed"
        }

        const organizerResult = await query(`SELECT first_name, last_name, role FROM users WHERE id = $1`, [
          e.organizer_id,
        ])
        const organizer = organizerResult[0]

        const registrationResult = await query(
          `SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
          [e.id, user.id],
        )
        const isRegistered = registrationResult.length > 0

        // Fetch participants
        const participantsResult = await query(
          `SELECT er.*, u.first_name, u.last_name, u.email, u.role, u.profile_picture
           FROM event_registrations er
           JOIN users u ON er.user_id = u.id
           WHERE er.event_id = $1
           ORDER BY er.created_at ASC`,
          [e.id],
        )
        const participants = participantsResult.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
          role: p.role,
          profile_picture: p.profile_picture,
          status: p.status,
          registered_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
        }))

        // Check if current user is organizer or admin for edit permissions
        const canEdit = user.role === "admin" || user.id === e.organizer_id

        return {
          id: e.id,
          title: e.title,
          description: e.description,
          type: e.event_type || "networking",
          event_type: e.event_type || "networking",
          date: e.start_date instanceof Date ? e.start_date.toISOString() : e.start_date,
          start_date: e.start_date instanceof Date ? e.start_date.toISOString() : e.start_date,
          endDate: e.end_date ? (e.end_date instanceof Date ? e.end_date.toISOString() : e.end_date) : null,
          end_date: e.end_date ? (e.end_date instanceof Date ? e.end_date.toISOString() : e.end_date) : null,
          location: e.location,
          isVirtual: e.is_virtual || false,
          is_virtual: e.is_virtual || false,
          meetingLink: e.virtual_link,
          virtual_link: e.virtual_link,
          capacity: e.max_attendees || 0,
          max_attendees: e.max_attendees || 0,
          registeredCount: participants.length || 0,
          attendees_count: participants.length || 0,
          organizerId: e.organizer_id,
          organizer_id: e.organizer_id,
          organizerName: organizer ? `${organizer.first_name} ${organizer.last_name}` : "Unknown",
          organizerRole: organizer?.role || "admin",
          organizer_name: organizer ? `${organizer.first_name} ${organizer.last_name}` : "Unknown",
          organizer_role: organizer?.role || "admin",
          registrationDeadline: e.registration_deadline
            ? e.registration_deadline instanceof Date
              ? e.registration_deadline.toISOString()
              : e.registration_deadline
            : null,
          registration_deadline: e.registration_deadline
            ? e.registration_deadline instanceof Date
              ? e.registration_deadline.toISOString()
              : e.registration_deadline
            : null,
          status: status,
          isRegistrationOpen: status === "upcoming" || status === "ongoing",
          college_id: e.college_id,
          createdAt: e.created_at instanceof Date ? e.created_at.toISOString() : e.created_at,
          created_at: e.created_at instanceof Date ? e.created_at.toISOString() : e.created_at,
          isRegistered,
          attendees: participants,
          participants: participants,
          canEdit,
          isPremium: false,
          paymentRequired: false,
          tags: [],
        }
      }),
    )

    console.log("[v0] Returning events with participants:", eventsWithDetails.length)
    return NextResponse.json({ events: eventsWithDetails })
  } catch (error) {
    console.error("[v0] Get events error:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "alumni") {
      return NextResponse.json({ error: "Only admins and alumni can create events" }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      description,
      start_date,
      end_date,
      location,
      max_attendees,
      registration_deadline,
      is_virtual,
      virtual_link,
      event_type,
    } = body

    if (!title || !description || !start_date || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Creating event:", { title, start_date, location, event_type })

    const event = await createEvent({
      college_id: user.college_id,
      organizer_id: user.id,
      title,
      description,
      start_date: new Date(start_date),
      end_date: end_date ? new Date(end_date) : undefined,
      location,
      max_attendees,
      registration_deadline: registration_deadline ? new Date(registration_deadline) : undefined,
      is_virtual: is_virtual || false,
      virtual_link,
      event_type: event_type || "networking",
    })

    console.log("[v0] Event created successfully:", event.id)

    return NextResponse.json({ event }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create event error:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json(
      {
        error: "Failed to create event",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
