import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats: Record<string, any> = {
      userId: user.id,
      role: user.role,
      college_id: user.college_id,
    }

    if (user.role === "student") {
      const [eventsCount, mentorshipCount, postsCount, pointsData] = await Promise.all([
        query(
          `SELECT COUNT(*) as count FROM event_registrations WHERE user_id = $1 AND status = 'registered'`,
          [user.id],
        ),
        query(
          `SELECT COUNT(*) as count FROM mentorship_requests WHERE mentee_id = $1 AND status = 'accepted'`,
          [user.id],
        ),
        query(`SELECT COUNT(*) as count FROM community_posts WHERE college_id = $1`, [user.college_id]),
        query(`SELECT COALESCE(us.total_points, 0) as total_points FROM user_streaks us WHERE us.user_id = $1`, [user.id]),
      ])

      stats.eventsCount = Number(eventsCount[0]?.count || 0)
      stats.mentorshipCount = Number(mentorshipCount[0]?.count || 0)
      stats.postsCount = Number(postsCount[0]?.count || 0)
      stats.points = Number(pointsData[0]?.points || 0)
    } else if (user.role === "alumni") {
      const [mentorshipCount, eventsCount, postsCount, donationsTotal] = await Promise.all([
        query(`SELECT COUNT(*) as count FROM mentorships WHERE mentor_id = $1 AND status = 'active'`, [user.id]),
        query(
          `SELECT COUNT(*) as count FROM events WHERE organizer_id = $1 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`,
          [user.id],
        ),
        query(`SELECT COUNT(*) as count FROM community_posts WHERE author_id = $1`, [user.id]),
        query(
          `SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE donor_id = $1 AND status = 'completed'`,
          [user.id],
        ),
      ])

      stats.mentorshipCount = Number(mentorshipCount[0]?.count || 0)
      stats.eventsCount = Number(eventsCount[0]?.count || 0)
      stats.postsCount = Number(postsCount[0]?.count || 0)
      stats.donationsTotal = Number(donationsTotal[0]?.total || 0)
    } else if (user.role === "admin") {
      const [totalUsers, activeUsers, totalPosts, totalEvents] = await Promise.all([
        query(`SELECT COUNT(*) as count FROM users WHERE college_id = $1`, [user.college_id]),
        query(
          `SELECT COUNT(*) as count FROM users WHERE college_id = $1 AND status = 'active'`,
          [user.college_id],
        ),
        query(`SELECT COUNT(*) as count FROM community_posts WHERE college_id = $1`, [user.college_id]),
        query(`SELECT COUNT(*) as count FROM events WHERE college_id = $1`, [user.college_id]),
      ])

      stats.totalUsers = Number(totalUsers[0]?.count || 0)
      stats.activeUsers = Number(activeUsers[0]?.count || 0)
      stats.totalPosts = Number(totalPosts[0]?.count || 0)
      stats.totalEvents = Number(totalEvents[0]?.count || 0)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
