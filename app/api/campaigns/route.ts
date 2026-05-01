import { NextResponse } from "next/server"
import { getFundraisingCampaigns, createFundraisingCampaign } from "@/lib/db-helpers"
import { getServerSession } from "@/lib/session-helper"

export const dynamic = "force-dynamic"
import { getUserBySession } from "@/lib/auth-db"

async function getSessionUser() {
  let user = await getServerSession()
  if (!user) {
    const headers = await import("next/headers")
    const headersList = await headers.headers()
    const token = headersList.get("x-session-token")
    if (token) {
      user = await getUserBySession(token)
    }
  }
  return user
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaigns = await getFundraisingCampaigns(user.college_id, user.role)

    const transformedCampaigns = campaigns.map((campaign: any) => ({
      id: campaign.id,
      collegeId: campaign.college_id,
      creatorId: campaign.creator_id || campaign.created_by,
      title: campaign.title,
      description: campaign.description,
      goalAmount: Number(campaign.goal_amount) || 0,
      collectedAmount: Number(campaign.current_amount) || 0,
      currentAmount: Number(campaign.current_amount) || 0,
      goal_amount: Number(campaign.goal_amount) || 0,
      current_amount: Number(campaign.current_amount) || 0,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      status: campaign.status,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
    }))

    console.log("[v0] Fetched campaigns for college:", user.college_id, "Count:", transformedCampaigns.length)
    return NextResponse.json(transformedCampaigns)
  } catch (error) {
    console.error("[v0] Get campaigns error:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const body = await req.json()
    console.log("[v0] Campaign creation request body:", body)

    const { title, description, goal_amount, end_date } = body

    if (!title || !goal_amount || goal_amount <= 0) {
      return NextResponse.json({ error: "Invalid payload: title and goal_amount are required" }, { status: 400 })
    }

    if (!end_date) {
      return NextResponse.json({ error: "Invalid payload: end_date is required" }, { status: 400 })
    }

    console.log("[v0] Creating campaign for user:", user.id, "college:", user.college_id)

    const campaign = await createFundraisingCampaign({
      college_id: user.college_id,
      creator_id: user.id,
      title,
      description,
      goal_amount: Number(goal_amount),
      start_date: new Date(),
      end_date: new Date(end_date),
    })

    const transformedCampaign = {
      id: campaign.id,
      collegeId: campaign.college_id,
      creatorId: campaign.creator_id,
      title: campaign.title,
      description: campaign.description,
      goalAmount: Number(campaign.goal_amount) || 0,
      collectedAmount: Number(campaign.current_amount) || 0,
      currentAmount: Number(campaign.current_amount) || 0,
      goal_amount: Number(campaign.goal_amount) || 0,
      current_amount: Number(campaign.current_amount) || 0,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      status: campaign.status,
      createdAt: campaign.created_at,
    }

    console.log("[v0] Campaign created successfully:", transformedCampaign)
    return NextResponse.json(transformedCampaign)
  } catch (error) {
    console.error("[v0] Create campaign error:", error)
    return NextResponse.json(
      {
        error: "Failed to create campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
