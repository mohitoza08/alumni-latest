import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getServerSession } from "@/lib/session-helper"

export const dynamic = "force-dynamic"
import { getUserBySession } from "@/lib/auth-db"

async function getSessionUser() {
  // First try cookie-based session
  let user = await getServerSession()
  console.log("[v0] Cookie session result:", user?.id, user?.role, user?.college_id)
  
  // If no cookie session, try header-based token (for client-side calls)
  if (!user) {
    const headers = await import("next/headers")
    const headersList = await headers.headers()
    const token = headersList.get("x-session-token")
    console.log("[v0] Header token:", token ? token.substring(0, 20) + "..." : "null")
    
    if (token) {
      user = await getUserBySession(token)
      console.log("[v0] Header session result:", user?.id, user?.role, user?.college_id)
    }
  }
  
  return user
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaignId = Number.parseInt(params.id)
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 })
    }

    let queryStr = `
      SELECT dr.*, u.first_name, u.last_name, u.email
      FROM donation_requests dr
      LEFT JOIN users u ON dr.donor_id = u.id
      WHERE dr.campaign_id = $1
    `
    const params_arr: any[] = [campaignId]

    if (user.role !== "admin") {
      queryStr += ` AND dr.donor_id = $2`
      params_arr.push(user.id)
    }

    queryStr += ` ORDER BY dr.created_at DESC`

    const items = await query(queryStr, params_arr)
    return NextResponse.json({ items })
  } catch (error) {
    console.error("[v0] Get donation requests error:", error)
    return NextResponse.json({ error: "Failed to fetch donation requests" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser()
    console.log("[v0] Session user:", user?.id, user?.role, user?.first_name)
    
    if (!user) {
      return NextResponse.json({ error: "Please login to make a donation" }, { status: 401 })
    }

    if (user.role !== "alumni" && user.role !== "student") {
      return NextResponse.json({ error: "Only alumni/students can submit donation requests" }, { status: 403 })
    }

    const campaignId = Number.parseInt(params.id)
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 })
    }

    // Check if campaign exists and is active
    const campaigns = await query(
      `SELECT id, title, status, end_date FROM fundraising_campaigns WHERE id = $1`,
      [campaignId]
    )
    
    if (campaigns.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const campaign = campaigns[0]
    const now = new Date()
    const endDate = new Date(campaign.end_date)
    
    if (campaign.status !== "active" || now > endDate) {
      return NextResponse.json({ error: "Campaign is no longer active" }, { status: 400 })
    }

    // Check content-type to handle both JSON and FormData
    const contentType = req.headers.get("content-type") || ""
    let amount: number, message: string, transactionRef: string, isAnonymous: boolean, paymentMethod: string
    let receiptUrl: string | null = null

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (with file upload)
      const formData = await req.formData()
      amount = Number(formData.get("amount"))
      message = formData.get("message")?.toString() || ""
      transactionRef = formData.get("transactionRef")?.toString() || ""
      isAnonymous = formData.get("isAnonymous") === "true"
      paymentMethod = formData.get("paymentMethod")?.toString() || "UPI"
      
      // Handle file upload - Vercel is read-only, just store a marker
      const receiptFile = formData.get("receipt") as File | null
      if (receiptFile && receiptFile.size > 0) {
        receiptUrl = "receipt_stored"
      }
    } else {
      // Handle JSON (without file)
      const body = await req.json()
      console.log("[v0] Donation request body:", body)
      
      amount = Number(body.amount)
      message = body.message || ""
      transactionRef = body.transactionRef || ""
      isAnonymous = body.isAnonymous || false
      paymentMethod = body.paymentMethod || "UPI"
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Please enter a valid amount" }, { status: 400 })
    }

    const donorName = isAnonymous ? "Anonymous" : `${user.first_name} ${user.last_name}`
    const donorEmail = isAnonymous ? "anonymous@alumni.edu" : (user.email || `${user.first_name}.${user.last_name}@alumni.edu`)
    const transactionReference = transactionRef || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const result = await query(
      `INSERT INTO donation_requests (
        campaign_id, donor_id, donor_name, donor_email, amount, currency, 
        is_anonymous, payment_method, transaction_reference, receipt_url, message, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *`,
      [
        campaignId, 
        user.id, 
        donorName,
        donorEmail,
        amount, 
        'USD',
        isAnonymous, 
        paymentMethod,
        transactionReference, 
        receiptUrl,
        message,
      ],
    )

    console.log("[v0] Donation request created:", result[0]?.id)
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Create donation request error:", error)
    return NextResponse.json({ error: "Failed to create donation request" }, { status: 500 })
  }
}
