import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { createMentorshipRequest, getMentorshipRequests } from "@/lib/db-helpers"
import { getUserBySession } from "@/lib/auth-db"
import { validateTitle, validateContent } from "@/lib/validation"

export const dynamic = "force-dynamic"
export async function GET(req: NextRequest) {
  try {
    // Try session helper first (checks cookies), then header token
    let user = await getServerSession()
    
    if (!user) {
      const headerToken = req.headers.get("x-session-token")
      if (headerToken) {
        user = await getUserBySession(headerToken)
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const asMentor = searchParams.get("as_mentor") === "true"
    const status = searchParams.get("status") || undefined

    const rawRequests = await getMentorshipRequests(user.id, asMentor, status)

    const requests = rawRequests.map((r: any) => ({
      id: r.id,
      mentee_id: r.mentee_id,
      mentor_id: r.mentor_id,
      topic: r.topic,
      message: r.message,
      status: r.status,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      mentee_first_name: r.mentee_first_name,
      mentee_last_name: r.mentee_last_name,
      mentee_profile_picture: r.mentee_profile_picture,
      mentee_degree: r.mentee_degree,
      mentee_department: r.mentee_department,
      mentor_first_name: r.mentor_first_name,
      mentor_last_name: r.mentor_last_name,
      mentor_profile_picture: r.mentor_profile_picture,
    }))

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get mentorship requests error:", error)
    return NextResponse.json({ error: "Failed to fetch mentorship requests" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Try session helper first (checks cookies), then header token
    let user = await getServerSession()
    
    if (!user) {
      const headerToken = req.headers.get("x-session-token")
      if (headerToken) {
        user = await getUserBySession(headerToken)
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { mentorId, mentor_id, topic, message } = body

    const finalMentorId = mentorId || mentor_id

    const validationErrors: string[] = []

    if (!finalMentorId) {
      validationErrors.push("Mentor is required")
    }

    const topicResult = validateTitle(topic)
    if (!topicResult.valid) {
      validationErrors.push(topicResult.error!)
    }

    if (!topic || !message) {
      console.log("[v0] Missing fields:", { mentorId: finalMentorId, topic, message })
      return NextResponse.json({ error: "Missing required fields: mentorId, topic, and message" }, { status: 400 })
    }

    const messageResult = validateContent(message, 20)
    if (!messageResult.valid) {
      validationErrors.push(messageResult.error!)
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 })
    }

    if (!user.college_id) {
      console.log("[v0] User missing college_id:", user)
      return NextResponse.json({ error: "User college_id not found" }, { status: 400 })
    }

    const rawRequest = await createMentorshipRequest({
      college_id: user.college_id,
      mentee_id: user.id,
      mentor_id: Number.parseInt(finalMentorId.toString()),
      topic,
      message,
    })

    const request = {
      id: rawRequest.id,
      mentee_id: rawRequest.mentee_id,
      mentor_id: rawRequest.mentor_id,
      topic: rawRequest.topic,
      message: rawRequest.message,
      status: rawRequest.status,
      created_at: rawRequest.created_at instanceof Date ? rawRequest.created_at.toISOString() : rawRequest.created_at,
    }

    console.log("[v0] Created mentorship request:", request.id, "status:", request.status)
    return NextResponse.json({ request }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create mentorship request error:", error)
    return NextResponse.json({ error: "Failed to create mentorship request" }, { status: 500 })
  }
}
