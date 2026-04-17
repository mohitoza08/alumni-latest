"use client"

import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Users, Calendar, BookOpen, MessageSquare, DollarSign, Heart, UserCheck } from "lucide-react"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; isPositive: boolean }
}

function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            {trend && (
              <p className={`text-xs mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend.isPositive ? "+" : ""}{trend.value}% from last month
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  userRole: "student" | "alumni" | "admin"
}

export function DashboardStats({ userRole }: DashboardStatsProps) {
  const { data: statsData, isLoading } = useSWR("/api/admin/dashboard-stats", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const { data: eventsData } = useSWR(
    userRole === "student" ? "/api/events/registrations" : "/api/events",
    fetcher,
    { refreshInterval: 20000 }
  )

  const { data: mentorshipData } = useSWR(
    userRole === "student" ? "/api/mentorship/requests" : "/api/mentorship/requests?as_mentor=true",
    fetcher,
    { refreshInterval: 15000 }
  )

  const { data: postsData } = useSWR("/api/posts", fetcher, { refreshInterval: 30000 })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-12 w-12 rounded" />
              <Skeleton className="h-4 w-24 mt-4" />
              <Skeleton className="h-8 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (userRole === "student") {
    const eventsCount = eventsData?.registrations?.length || 0
    const mentorshipCount = mentorshipData?.requests?.filter((r: any) => r.status === "accepted").length || 0
    const postsCount = postsData?.posts?.length || 0

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Events Registered"
          value={eventsCount}
          description="Upcoming events"
          icon={Calendar}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Mentorship Sessions"
          value={mentorshipCount}
          description="Active mentorships"
          icon={BookOpen}
        />
        <StatsCard
          title="Community Posts"
          value={postsCount}
          description="Total posts viewed"
          icon={MessageSquare}
        />
        <StatsCard
          title="Achievement Points"
          value={statsData?.points || 0}
          description="Total points earned"
          icon={Trophy}
          trend={{ value: 15, isPositive: true }}
        />
      </div>
    )
  }

  if (userRole === "alumni") {
    const eventsCount = eventsData?.events?.filter((e: any) => e.organizer_id === statsData?.userId).length || 0
    const mentorshipCount = mentorshipData?.requests?.filter((r: any) => r.status === "accepted").length || 0
    const postsCount = postsData?.posts?.length || 0

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Students Mentored"
          value={mentorshipCount}
          description="Active mentorships"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Events Hosted"
          value={eventsCount}
          description="This year"
          icon={Calendar}
          trend={{ value: 1, isPositive: true }}
        />
        <StatsCard
          title="Community Posts"
          value={postsCount}
          description="Total contributions"
          icon={MessageSquare}
        />
        <StatsCard
          title="Donations Made"
          value={`$${(statsData?.donationsTotal || 0).toLocaleString()}`}
          description="Total contributed"
          icon={DollarSign}
          trend={{ value: 25, isPositive: true }}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard title="Total Users" value={statsData?.totalUsers || 0} icon={Users} />
      <StatsCard title="Active Users" value={statsData?.activeUsers || 0} icon={UserCheck} />
      <StatsCard title="Total Posts" value={statsData?.totalPosts || 0} icon={MessageSquare} />
      <StatsCard title="Total Events" value={statsData?.totalEvents || 0} icon={Calendar} />
    </div>
  )
}

export function RecentActivity() {
  const { data: activityData, isLoading } = useSWR("/api/admin/activity", fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const activities = activityData?.activities || []

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity: any, index: number) => (
            <div key={activity.id || index} className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {activity.type === "post" && <MessageSquare className="h-5 w-5" />}
                {activity.type === "event" && <Calendar className="h-5 w-5" />}
                {activity.type === "mentorship" && <UserCheck className="h-5 w-5" />}
                {activity.type === "donation" && <Heart className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
