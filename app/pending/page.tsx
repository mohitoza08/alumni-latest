"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, LogOut } from "lucide-react"

export default function PendingPage() {
  const handleLogout = () => {
    localStorage.removeItem("session_token")
    window.location.href = "/"
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Account Under Review</CardTitle>
          <CardDescription className="text-base">
            Your registration is being verified by our admin team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                We received your alumni registration along with your certificate.
                Our admin team will verify your details and approve your account.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">What happens next?</p>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Admin verifies your certificate and details</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Account status changes to Active</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>You get full access to Alumni Dashboard</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⏱️ This usually takes <strong>24-48 hours</strong>. Please be patient.
              </p>
            </div>
          </div>

          <Button onClick={handleLogout} variant="outline" className="w-full gap-2">
            <LogOut className="w-4 h-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
