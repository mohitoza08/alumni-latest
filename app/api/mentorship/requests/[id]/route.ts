import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { query } from "@/lib/db"
import { deleteMentorshipRequest } from "@/lib/db-helpers"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: requestId } = await params
    const body = await req.json()
    const { status, response_message } = body

    if (!status || !["accepted", "rejected", "cancelled", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const userId = Number(user.id)

    // First get the request to check authorization
    const checkResult = await query(`SELECT * FROM mentorship_requests WHERE id = $1`, [requestId])

    if (checkResult.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const requestData = checkResult[0]
    const isMentor = Number(requestData.mentor_id) === userId
    const isMentee = Number(requestData.mentee_id) === userId

    if (!isMentor && !isMentee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (["accepted", "rejected", "cancelled"].includes(status) && !isMentor) {
      return NextResponse.json({ error: "Only mentor can accept/reject/cancel requests" }, { status: 403 })
    }

    // For "completed", allow both mentor and mentee to update
    // For other statuses, only mentor can update
    let result;
    if (status === "completed") {
      result = await query(
        `UPDATE mentorship_requests 
         SET status = $1, response_message = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, response_message || null, requestId],
      )
    } else {
      result = await query(
        `UPDATE mentorship_requests 
         SET status = $1, response_message = $2, updated_at = NOW()
         WHERE id = $3 AND mentor_id = $4
         RETURNING *`,
        [status, response_message || null, requestId, userId],
      )
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Request not found or unauthorized" }, { status: 404 })
    }

    if (status === "accepted") {
      const request = result[0]
      await query(
        `INSERT INTO mentorships (college_id, mentor_id, mentee_id, status, start_date)
         VALUES ($1, $2, $3, 'active', NOW())
         ON CONFLICT DO NOTHING`,
        [request.college_id, request.mentor_id, request.mentee_id],
      )
    }

    if (status === "completed") {
      const request = result[0]
      await query(
        `UPDATE mentorships 
         SET status = 'completed', end_date = NOW()
         WHERE mentor_id = $1 AND mentee_id = $2 AND status = 'active'
         RETURNING *`,
        [request.mentor_id, request.mentee_id],
      )
    }

    return NextResponse.json({ request: result[0] })
  } catch (error) {
    console.error("[v0] Update mentorship request error:", error)
    return NextResponse.json({ error: "Failed to update mentorship request" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const requestId = Number(id)
    const userId = Number(user.id)

    await deleteMentorshipRequest(requestId, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete mentorship request error:", error)
    return NextResponse.json({ error: "Failed to delete mentorship request" }, { status: 500 })
  }
}
