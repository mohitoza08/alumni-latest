import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    console.log("[v0] Alumni activity - user:", user?.id)
    
    if (!user) {
      return NextResponse.json({ activities: [], error: "Unauthorized" })
    }

    const userId = Number(user.id)
    const activities: any[] = []

    // Get mentorship requests (as mentor)
    try {
      const mentorshipRequests = await query(
        `SELECT mr.id, mr.status, mr.topic, mr.created_at, mr.updated_at, 
                u.first_name as mentee_first_name, u.last_name as mentee_last_name
         FROM mentorship_requests mr
         JOIN users u ON mr.mentee_id = u.id
         WHERE mr.mentor_id = $1
         ORDER BY mr.created_at DESC
         LIMIT 5`,
        [userId],
      )

      for (const req of mentorshipRequests || []) {
        activities.push({
          id: `mentorship-${req.id}`,
          type: "mentorship",
          title: `Request from ${req.mentee_first_name} ${req.mentee_last_name}`,
          description: req.topic || "Mentorship",
          timestamp: req.updated_at || req.created_at,
          status: req.status,
        })
      }
    } catch (e) {
      console.log("[v0] Mentorship query error:", e)
    }

    // Get organized events
    try {
      const organizedEvents = await query(
        `SELECT id, title, start_date, status, created_at
         FROM events 
         WHERE organizer_id = $1 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [userId],
      )

      for (const event of organizedEvents || []) {
        activities.push({
          id: `event-org-${event.id}`,
          type: "event",
          title: `Organized: ${event.title}`,
          description: new Date(event.start_date).toLocaleDateString(),
          timestamp: event.created_at,
          status: event.status,
        })
      }
    } catch (e) {
      console.log("[v0] Organized events query error:", e)
    }

    // Get registered events
    try {
      const registeredEvents = await query(
        `SELECT e.title, e.start_date, e.status, er.created_at as registered_at
         FROM event_registrations er
         JOIN events e ON er.event_id = e.id
         WHERE er.user_id = $1
         ORDER BY er.created_at DESC
         LIMIT 5`,
        [userId],
      )

      for (const event of registeredEvents || []) {
        activities.push({
          id: `event-reg-${event.start_date}`,
          type: "event",
          title: `Registered: ${event.title}`,
          description: new Date(event.start_date).toLocaleDateString(),
          timestamp: event.registered_at,
          status: event.status,
        })
      }
    } catch (e) {
      console.log("[v0] Registered events query error:", e)
    }

    // Get community posts
    try {
      const posts = await query(
        `SELECT id, title, created_at FROM community_posts 
         WHERE author_id = $1 
         ORDER BY created_at DESC 
         LIMIT 3`,
        [userId],
      )

      for (const post of posts || []) {
        activities.push({
          id: `post-${post.id}`,
          type: "post",
          title: post.title,
          description: "Your post",
          timestamp: post.created_at,
        })
      }
    } catch (e) {
      console.log("[v0] Posts query error:", e)
    }

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ activities: activities.slice(0, 10) })
  } catch (error) {
    console.error("[v0] Alumni activity error:", error)
    return NextResponse.json({ activities: [], error: "Server error" })
  }
}
