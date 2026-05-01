import { query } from "@/lib/db"
import { getServerSession } from "@/lib/session-helper"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split("T")[0]

    // Get or create user streak record
    const existingStreak = await query(`SELECT * FROM user_streaks WHERE user_id = $1`, [user.id])

    let currentStreak = 0
    let alreadyCheckedIn = false

    if (existingStreak.length === 0) {
      // Create new streak record
      await query(
        `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_checkin, total_points)
         VALUES ($1, 1, 1, $2, 10)`,
        [user.id, today],
      )
      currentStreak = 1
    } else {
      const streak = existingStreak[0]
      const lastCheckin = streak.last_checkin
        ? new Date(streak.last_checkin).toISOString().split("T")[0]
        : null

      if (lastCheckin === today) {
        // Already checked in today
        alreadyCheckedIn = true
        currentStreak = streak.current_streak
      } else {
        // Check if yesterday or streak broken
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
        const isConsecutive = lastCheckin === yesterday

        const newStreak = isConsecutive ? streak.current_streak + 1 : 1
        const newMaxStreak = Math.max(streak.longest_streak, newStreak)

        await query(
          `UPDATE user_streaks 
           SET current_streak = $1, longest_streak = $2, last_checkin = $3, total_points = total_points + 10
           WHERE user_id = $4`,
          [newStreak, newMaxStreak, today, user.id],
        )

        currentStreak = newStreak

        // Send notification
        await query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, 'streak')`,
          [user.id, "Daily check-in", `Nice! Your streak is now ${currentStreak} day(s). +10 points!`],
        )
      }
    }

    return NextResponse.json({
      alreadyCheckedIn,
      streak: currentStreak,
      lastActiveISO: today,
    })
  } catch (error) {
    console.error("[v0] Check-in error:", error)
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 })
  }
}
