const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

async function sendBrevoEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    console.log(`[DEV MODE - No BREVO_API_KEY] Email to ${to}: ${subject}`)
    return true
  }

  const body = {
    sender: {
      email: "kingorwot007@gmail.com",
      name: "Alumni Connect",
    },
    to: [{ email: to }],
    subject,
    htmlContent,
    ...(textContent ? { textContent } : {}),
    tags: ["alumni-connect"],
  }

  try {
    console.log(`[Email] Sending to ${to} | Subject: ${subject}`)

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`[Email] Brevo API error ${response.status}:`, JSON.stringify(data, null, 2))
      throw new Error(data.message || `HTTP ${response.status}`)
    }

    console.log(`[Email] Sent to ${to} | MessageId: ${data.messageId || "unknown"}`)
    return true
  } catch (error: any) {
    console.error(`[Email] Failed for ${to}:`, error.message)
    return false
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  return sendBrevoEmail(
    email,
    "Your Alumni Connect Verification Code",
    `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Verify Your Email</h2>
        <p style="color: #555; margin-bottom: 24px;">Enter this code to complete your registration:</p>
        <div style="background: #f0f0f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace; color: #1a1a2e;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 14px;">This code expires in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
        <p style="color: #aaa; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
    `Verify Your Email\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.`
  )
}

export async function sendVerificationResultEmail(
  email: string,
  firstName: string,
  action: "approved" | "rejected",
  adminNotes?: string
): Promise<boolean> {
  if (action === "approved") {
    return sendBrevoEmail(
      email,
      "Your Alumni Connect Application Has Been Approved!",
      `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: #e8f5e9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: #2e7d32; margin: 0 0 8px 0;">Congratulations!</h1>
          </div>
          <p style="color: #333; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">
            Great news! Your onboarding application has been <strong style="color: #2e7d32;">approved</strong> by the admin team.
            You now have full access to the Alumni Connect platform.
          </p>
          <div style="background: #f0f0f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1a1a2e; margin: 0 0 12px 0;">What you can do now:</h3>
            <ul style="color: #555; padding-left: 20px; margin: 0;">
              <li>Access your alumni dashboard</li>
              <li>Connect with fellow alumni</li>
              <li>Participate in community discussions</li>
              <li>Join and create events</li>
              <li>Access mentorship programs</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://alumni-connect.com" style="background: #1a1a2e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          ${adminNotes ? `
            <div style="background: #fff3e0; border-left: 4px solid #f57c00; padding: 12px 16px; margin-top: 16px;">
              <p style="color: #555; margin: 0; font-size: 14px;"><strong>Admin Note:</strong> ${adminNotes}</p>
            </div>
          ` : ""}
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
          <p style="color: #aaa; font-size: 12px;">Alumni Connect Team</p>
        </div>
      `,
      `Congratulations ${firstName}!\n\nYour onboarding application has been approved. You now have full access to the Alumni Connect platform.\n\nYou can access your alumni dashboard, connect with fellow alumni, participate in community discussions, join events, and access mentorship programs.\n\n${adminNotes ? `Admin Note: ${adminNotes}\n` : ""}\nAlumni Connect Team`
    )
  } else {
    return sendBrevoEmail(
      email,
      "Update on Your Alumni Connect Application",
      `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: #fce4ec; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: #c62828; margin: 0 0 8px 0;">Application Update</h1>
          </div>
          <p style="color: #333; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">
            We regret to inform you that your onboarding application has been <strong style="color: #c62828;">rejected</strong> after review by our admin team.
          </p>
          <div style="background: #fff3e0; border-left: 4px solid #f57c00; padding: 16px; margin: 20px 0;">
            <p style="color: #555; margin: 0; font-size: 14px;">
              <strong>What happens next?</strong>
            </p>
            <ul style="color: #555; padding-left: 20px; margin: 8px 0 0 0;">
              <li>You can re-apply with corrected information</li>
              <li>Contact admin for clarification on the rejection</li>
              <li>Check your account status on the login page</li>
            </ul>
          </div>
          ${adminNotes ? `
            <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #555; margin: 0; font-size: 14px;"><strong>Admin's feedback:</strong></p>
              <p style="color: #333; margin: 8px 0 0 0; font-size: 14px;">${adminNotes}</p>
            </div>
          ` : ""}
          <div style="text-align: center; margin: 24px 0;">
            <a href="mailto:kingorwot007@gmail.com?subject=Rejection%20Inquiry%20-%20${encodeURIComponent(firstName)}" style="background: #757575; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Contact Admin
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
          <p style="color: #aaa; font-size: 12px;">Alumni Connect Team</p>
        </div>
      `,
      `Application Update\n\nHi ${firstName},\n\nWe regret to inform you that your onboarding application has been rejected after review by our admin team.\n\nWhat happens next:\n- You can re-apply with corrected information\n- Contact admin for clarification\n- Check your account status on the login page\n\n${adminNotes ? `Admin's feedback: ${adminNotes}\n` : ""}\nAlumni Connect Team`
    )
  }
}
