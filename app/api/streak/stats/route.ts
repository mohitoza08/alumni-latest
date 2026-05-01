import { query } from "@/lib/db"
import { getServerSession } from "@/lib/session-helper"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's streak
    const userStreak = await query(`SELECT * FROM user_streaks WHERE user_id = $1`, [user.id])

    const currentStreak = userStreak[0]?.current_streak || 0
    const longestStreak = userStreak[0]?.longest_streak || 0
    const totalPoints = userStreak[0]?.total_points || 0
    const lastCheckin = userStreak[0]?.last_checkin

    // Get average streak across all users
    const avgResult = await query(
      `SELECT AVG(current_streak) as avg_streak, MAX(current_streak) as max_streak
       FROM user_streaks
       WHERE current_streak > 0`,
    )

    const averageStreak = Math.round(Number.parseFloat(avgResult[0]?.avg_streak || "0"))
    const maxStreak = avgResult[0]?.max_streak || 0

    // Get user's rank
    const rankResult = await query(
      `SELECT COUNT(*) + 1 as rank
       FROM user_streaks us
       JOIN users u ON us.user_id = u.id
       WHERE u.college_id = $1 AND us.total_points > $2`,
      [user.college_id, totalPoints],
    )

    const userRank = rankResult[0]?.rank || 1

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalPoints,
      averageStreak,
      maxStreak,
      rank: userRank,
      lastCheckin,
    })
  } catch (error) {
    console.error("[v0] Get streak stats error:", error)
    return NextResponse.json({ error: "Failed to fetch streak stats" }, { status: 500 })
  }
}
