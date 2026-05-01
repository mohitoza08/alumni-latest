"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { DashboardStats } from "@/components/dashboard/realtime-stats"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { useAuth } from "@/components/layout/auth-checker"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, BookOpen, Trophy, MessageSquare, Send, CheckCircle, XCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"

const fetcher = (url: string) => {
  const token = localStorage.getItem("session_token") || ""
  return fetch(url, {
    credentials: "include",
    headers: { "x-session-token": token },
  }).then((r) => r.json())
}

function StudentDashboardContent() {
  const { user, isLoading: authLoading } = useAuth("student")

  const { data: activityData, error: activityError, isLoading: activityLoading } = useSWR("/api/activity/student", fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    )
  }

  const userName = `${user.first_name} ${user.last_name}`
  const activities = activityData?.activities || []
  const errorMsg = activityData?.error

  console.log("[v0] Student Dashboard - activityData:", activityData)

  const quickActions = [
    {
      title: "Apply for Alumni Status",
      description: "Submit your application",
      icon: CheckCircle,
      href: "/student/apply",
      variant: "default" as const,
    },
    {
      title: "Find a Mentor",
      description: "Connect with alumni",
      icon: BookOpen,
      href: "/student/mentorship",
    },
    {
      title: "Join Community",
      description: "Participate in discussions",
      icon: MessageSquare,
      href: "/student/community",
    },
    {
      title: "Browse Events",
      description: "Discover upcoming events",
      icon: Calendar,
      href: "/student/events",
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "mentorship":
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case "event":
      case "event_registered":
        return <Calendar className="h-4 w-4 text-green-500" />
      case "post":
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      case "comment":
        return <Send className="h-4 w-4 text-orange-500" />
      default:
        return <Trophy className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "accepted":
        return <Badge variant="default" className="bg-green-500 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>
      case "rejected":
        return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case "completed":
        return <Badge variant="default" className="bg-blue-500 text-xs"><Trophy className="h-3 w-3 mr-1" />Completed</Badge>
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
        <Sidebar userRole={user.role} userName={userName} userBadges={user.badges || []} userPoints={user.points || 0} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {userName}!</h1>
              <p className="text-muted-foreground">Track your mentorship journey and activities</p>
            </div>

            <DashboardStats userRole="student" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <div className="space-y-6">
                <QuickActions actions={quickActions} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    My Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                    </div>
                  ) : errorMsg ? (
                    <div className="text-center py-8">
                      <p className="text-destructive">Error: {errorMsg}</p>
                      <p className="text-sm text-muted-foreground mt-1">Please check console for details</p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No activity yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Start by requesting a mentor or joining events!</p>
                      <p className="text-xs text-muted-foreground mt-2">User ID: {user.id}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity: any, index: number) => (
                        <div key={activity.id || index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(activity.status)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  )
}
