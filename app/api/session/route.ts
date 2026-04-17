import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] Session fetch error:", error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
