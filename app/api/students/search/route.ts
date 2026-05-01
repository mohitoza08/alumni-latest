import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { searchStudents } from "@/lib/db-helpers"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")

    if (!q || q.length < 2) {
      return NextResponse.json({ students: [] })
    }

    const students = await searchStudents(Number(user.college_id), q)
    return NextResponse.json({ students })
  } catch (error) {
    console.error("[v0] Search students error:", error)
    return NextResponse.json({ error: "Failed to search students" }, { status: 500 })
  }
}
