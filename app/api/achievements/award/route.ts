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

    const body = await req.json()
    const { achievementType, value } = body

    const newAchievements = []

    if (achievementType === "streak" || !achievementType) {
      // Get user's current streak
      const streakResult = await query(`SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = $1`, [
        user.id,
      ])

      const streak = streakResult[0]?.current_streak || 0

      // Define streak milestones
      const milestones = [
        { days: 7, badge: "week-warrior", name: "Week Warrior", points: 100 },
        { days: 30, badge: "streak-master", name: "Streak Master", points: 300 },
        { days: 100, badge: "century-club", name: "Century Club", points: 500 },
        { days: 365, badge: "year-champion", name: "Year Champion", points: 1000 },
      ]

      for (const milestone of milestones) {
        if (streak >= milestone.days) {
          // Check if user already has this achievement
          const existingBadge = await query(`SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2`, [
            user.id,
            milestone.badge,
          ])

          if (existingBadge.length === 0) {
            await query(
              `INSERT INTO user_badges (user_id, badge_id, unlocked_at)
               VALUES ($1, $2, CURRENT_TIMESTAMP)`,
              [user.id, milestone.badge],
            )

            // Update user's total points
            await query(`UPDATE user_streaks SET total_points = total_points + $1 WHERE user_id = $2`, [
              milestone.points,
              user.id,
            ])

            // Send notification
            await query(
              `INSERT INTO notifications (user_id, title, message, type)
               VALUES ($1, $2, $3, 'achievement')`,
              [
                user.id,
                `Achievement Unlocked: ${milestone.name}!`,
                `Congratulations on your ${milestone.days}-day streak! You earned ${milestone.points} points.`,
              ],
            )

            newAchievements.push({
              id: milestone.badge,
              name: milestone.name,
              points: milestone.points,
              unlockedAt: new Date().toISOString(),
            })
          }
        }
      }
    }

    return NextResponse.json({
      newAchievements,
      message: newAchievements.length > 0 ? "New achievements unlocked!" : "No new achievements",
    })
  } catch (error) {
    console.error("[v0] Award achievement error:", error)
    return NextResponse.json({ error: "Failed to award achievement" }, { status: 500 })
  }
}
