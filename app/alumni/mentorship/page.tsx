"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, User, Calendar, Trash2, MessageSquare } from "lucide-react"
import { useAuth } from "@/components/layout/auth-checker"
import useSWR from "swr"
import { useState } from "react"
import { ChatDialog } from "@/components/mentorship/chat-dialog"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

export default function AlumniMentorshipPage() {
  const { user, isLoading: authLoading } = useAuth("alumni")
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedMentee, setSelectedMentee] = useState<any>(null)

  const { data: requestsData, mutate } = useSWR(
    user ? `/api/mentorship/requests?as_mentor=true` : null,
    fetcher,
    {
      refreshInterval: 2000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  )

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    )
  }

  const requests = requestsData?.requests || []
  const pendingRequests = requests.filter((req: any) => req.status === "pending")
  const activeRequests = requests.filter((req: any) => req.status === "accepted")
  const completedRequests = requests.filter((req: any) => req.status === "completed")

  const handleAccept = async (requestId: string) => {
    try {
      await fetch(`/api/mentorship/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "accepted" }),
      })
      await mutate()
    } catch (error) {
      console.error("Failed to accept request:", error)
    }
  }

  const handleDecline = async (requestId: string) => {
    try {
      await fetch(`/api/mentorship/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "rejected" }),
      })
      await mutate()
    } catch (error) {
      console.error("Failed to decline request:", error)
    }
  }

  const handleDelete = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this mentorship request?")) return

    try {
      await fetch(`/api/mentorship/requests/${requestId}`, {
        method: "DELETE",
        credentials: "include",
      })
      await mutate()
    } catch (error) {
      console.error("Failed to delete request:", error)
    }
  }

  const handleComplete = async (requestId: string) => {
    if (!confirm("Mark this mentorship as completed?")) return

    try {
      console.log("[v0] Marking mentorship as complete:", requestId)

      const response = await fetch(`/api/mentorship/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "completed" }),
      })

      console.log("[v0] Complete response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Complete failed:", errorData)
        alert(`Failed to mark as completed: ${errorData.error || "Unknown error"}`)
        return
      }

      const data = await response.json()
      console.log("[v0] Completed successfully:", data)

      await mutate()
      alert("Mentorship marked as completed successfully!")
    } catch (error) {
      console.error("[v0] Failed to complete mentorship:", error)
      alert("Failed to complete mentorship. Please try again.")
    }
  }

  const handleChat = (request: any) => {
    setSelectedMentee({
      id: request.mentee_id,
      name: `${request.mentee_first_name} ${request.mentee_last_name}`,
      picture: request.mentee_profile_picture,
    })
    setChatOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const RequestCard = ({ request }: { request: any }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={request.mentee_profile_picture || "/placeholder.svg"} />
              <AvatarFallback>{request.mentee_first_name?.charAt(0) || "M"}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{request.topic}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {request.mentee_first_name} {request.mentee_last_name}
                {request.mentee_department && ` • ${request.mentee_department}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(request.status)}
            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{request.message}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Requested:</span>
            <span>
              {request.created_at
                ? new Date(request.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Date unavailable"}
            </span>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleAccept(request.id)} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Accept
            </Button>
            <Button variant="destructive" onClick={() => handleDecline(request.id)} className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
            <Button variant="outline" onClick={() => handleDelete(request.id)} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}

        {request.status === "accepted" && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Active Mentorship
            </Badge>
            <Button onClick={() => handleChat(request)} variant="outline" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            <Button onClick={() => handleComplete(request.id)} variant="outline" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </Button>
            <Button variant="outline" onClick={() => handleDelete(request.id)} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}

        {(request.status === "completed" || request.status === "rejected") && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleDelete(request.id)} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={user.role} userName={user.name} userBadges={user.badges || []} userPoints={user.points || 0} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Mentorship Dashboard</h1>
            <p className="text-muted-foreground">
              Manage student requests seeking your mentorship and guide the next generation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Mentorships</p>
                    <p className="text-2xl font-bold">{activeRequests.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedRequests.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{requests.length}</p>
                  </div>
                  <User className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pending Requests ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="active">Active Mentorships ({activeRequests.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No pending mentorship requests from students</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((request: any) => <RequestCard key={request.id} request={request} />)
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No active mentorships</p>
                  </CardContent>
                </Card>
              ) : (
                activeRequests.map((request: any) => <RequestCard key={request.id} request={request} />)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No completed mentorships</p>
                  </CardContent>
                </Card>
              ) : (
                completedRequests.map((request: any) => <RequestCard key={request.id} request={request} />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {selectedMentee && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          recipientId={selectedMentee.id}
          recipientName={selectedMentee.name}
          recipientPicture={selectedMentee.picture}
          currentUserId={Number(user.id)}
        />
      )}
    </div>
  )
}
