import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const tables = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('users', 'user_sessions', 'email_otps', 'applications', 'notifications', 'colleges')
       ORDER BY table_name`
    )

    const requiredTables = ["users", "user_sessions", "email_otps", "applications", "notifications", "colleges"]
    const existingTables = tables.map((t) => t.table_name)
    const missingTables = requiredTables.filter((t) => !existingTables.includes(t))

    return NextResponse.json({
      status: "connected",
      existingTables,
      missingTables,
      allPresent: missingTables.length === 0,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
      code: error.code,
    }, { status: 500 })
  }
}
