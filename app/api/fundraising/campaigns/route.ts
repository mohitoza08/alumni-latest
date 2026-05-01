import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { createFundraisingCampaign, getFundraisingCampaigns } from "@/lib/db-helpers"
import { validateTitle, validateContent, validateDateRange, validatePositiveNumber } from "@/lib/validation"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaigns = await getFundraisingCampaigns(user.college_id, user.role)
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("[v0] Get campaigns error:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create fundraising campaigns" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, goal_amount, start_date, end_date } = body

    const validationErrors: string[] = []

    const titleResult = validateTitle(title)
    if (!titleResult.valid) {
      validationErrors.push(titleResult.error!)
    }

    const descriptionResult = validateContent(description, 20)
    if (!descriptionResult.valid) {
      validationErrors.push(descriptionResult.error!)
    }

    const amountResult = validatePositiveNumber(goal_amount, "Goal amount", 100)
    if (!amountResult.valid) {
      validationErrors.push(amountResult.error!)
    }

    if (!start_date || !end_date) {
      validationErrors.push("Both start and end dates are required")
    } else {
      const dateRangeResult = validateDateRange(start_date, end_date)
      if (!dateRangeResult.valid) {
        validationErrors.push(dateRangeResult.error!)
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 })
    }

    const campaign = await createFundraisingCampaign({
      college_id: user.college_id,
      creator_id: user.id,
      title,
      description,
      goal_amount: Number.parseFloat(goal_amount),
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create campaign error:", error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}
