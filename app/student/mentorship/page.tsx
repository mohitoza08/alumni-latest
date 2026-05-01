"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Users, Briefcase, MapPin, MessageSquare } from "lucide-react"
import { useAuth } from "@/components/layout/auth-checker"
import useSWR from "swr"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChatDialog } from "@/components/mentorship/chat-dialog"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

export default function StudentMentorshipPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth("student")
  const {
    data: alumniData,
    mutate,
  } = useSWR("/api/users?role=alumni&status=active", fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const { data: requestsData, mutate: mutateRequests } = useSWR(
    user ? `/api/mentorship/requests?as_mentor=false` : null,
    fetcher,
    {
      refreshInterval: 2000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  )

  // Fetch completed mentorships for Past Chats
  const { data: completedData } = useSWR(
    user ? `/api/mentorship/requests?as_mentor=false&status=completed` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  const [requesting, setRequesting] = useState<number | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<any>(null)
  const [topic, setTopic] = useState("")
  const [message, setMessage] = useState("")

  const [chatOpen, setChatOpen] = useState(false)
  const [selectedChatMentor, setSelectedChatMentor] = useState<any>(null)

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    )
  }

  const alumni = alumniData?.users || []
  const requests = requestsData?.requests || []

  const acceptedRequestsMap = new Map()
  requests
    .filter((req: any) => req.status === "accepted")
    .forEach((req: any) => {
      if (
        !acceptedRequestsMap.has(req.mentor_id) ||
        new Date(req.created_at) > new Date(acceptedRequestsMap.get(req.mentor_id).created_at)
      ) {
        acceptedRequestsMap.set(req.mentor_id, req)
      }
    })
  const acceptedRequests = Array.from(acceptedRequestsMap.values())

  const pendingRequests = requests.filter((req: any) => req.status === "pending")
  const pendingMentorIds = new Set(pendingRequests.map((req: any) => req.mentor_id))
  const acceptedMentorIds = new Set(acceptedRequests.map((req: any) => req.mentor_id))

  const handleOpenDialog = (mentor: any) => {
    setSelectedMentor(mentor)
    setShowDialog(true)
    setTopic("")
    setMessage("")
  }

  const handleRequestMentorship = async () => {
    if (!selectedMentor || !topic.trim() || !message.trim()) {
      alert("Please fill in all fields")
      return
    }

    setRequesting(selectedMentor.id)

    try {
      const response = await fetch("/api/mentorship/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mentorId: selectedMentor.id,
          topic: topic.trim(),
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await mutate()
        await mutateRequests()
        setShowDialog(false)
        setSelectedMentor(null)
        setTopic("")
        setMessage("")
        alert("Mentorship request sent successfully!")
      } else {
        alert(data.error || "Failed to send request")
      }
    } catch (error) {
      console.error("Mentorship request error:", error)
      alert("Failed to send request")
    } finally {
      setRequesting(null)
    }
  }

  const handleOpenChat = (request: any) => {
    const mentorName = `${request.mentor_first_name || ""} ${request.mentor_last_name || ""}`.trim()

    setSelectedChatMentor({
      id: request.mentor_id,
      name: mentorName || "Mentor",
      picture: request.mentor_profile_picture,
    })
    setChatOpen(true)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={user.role} userName={user.name} userBadges={user.badges || []} userPoints={user.points || 0} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Mentorship Program</h1>
            <p className="text-muted-foreground">Connect with experienced alumni for career guidance and support</p>
          </div>

          {acceptedRequests.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Your Active Mentorships</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {acceptedRequests.map((request: any) => {
                  const mentorName = `${request.mentor_first_name || ""} ${request.mentor_last_name || ""}`.trim()
                  const mentorInitials = `${request.mentor_first_name?.[0] || ""}${request.mentor_last_name?.[0] || ""}`

                  return (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.mentor_profile_picture || "/placeholder.svg"} />
                            <AvatarFallback>{mentorInitials || "M"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{mentorName || "Mentor"}</CardTitle>
                            <CardDescription>{request.topic}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Badge className="mb-3 bg-green-100 text-green-800">Active Mentorship</Badge>
                        <Button onClick={() => handleOpenChat(request)} className="w-full" variant="default">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat with Mentor
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past Chats Section */}
          {completedData?.requests?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Past Chats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedData.requests.slice(0, 6).map((request: any) => {
                  const mentorName = `${request.mentor_first_name || ""} ${request.mentor_last_name || ""}`.trim()
                  const mentorInitials = `${request.mentor_first_name?.[0] || ""}${request.mentor_last_name?.[0] || ""}`

                  return (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.mentor_profile_picture || "/placeholder.svg"} />
                            <AvatarFallback>{mentorInitials || "M"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{mentorName || "Mentor"}</CardTitle>
                            <CardDescription>{request.topic}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Badge className="mb-3 bg-gray-100 text-gray-800">Completed</Badge>
                        <Button onClick={() => router.push("/student/messages")} className="w-full" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View in Messages
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-4">Find a Mentor</h2>

          {alumni.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Alumni Available</h3>
                <p className="text-muted-foreground">
                  There are currently no alumni available for mentorship. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alumni.map((mentor: any) => {
                const hasPendingRequest = pendingMentorIds.has(mentor.id)
                const hasAcceptedRequest = acceptedMentorIds.has(mentor.id)
                const mentorInitials = `${mentor.first_name?.[0] || ""}${mentor.last_name?.[0] || ""}`

                return (
                  <Card key={mentor.id}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={mentor.profile_picture || "/placeholder.svg"} />
                          <AvatarFallback>{mentorInitials || "A"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {mentor.first_name} {mentor.last_name}
                          </CardTitle>
                          <CardDescription>
                            {mentor.current_position && mentor.current_company
                              ? `${mentor.current_position} at ${mentor.current_company}`
                              : "Alumni"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mentor.current_position && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4 mr-2" />
                          {mentor.current_position}
                        </div>
                      )}
                      {mentor.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {mentor.location}
                        </div>
                      )}
                      {mentor.major && (
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{mentor.major}</Badge>
                        </div>
                      )}
                      <Button
                        onClick={() => handleOpenDialog(mentor)}
                        disabled={requesting === mentor.id || hasPendingRequest || hasAcceptedRequest}
                        className="w-full"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {hasAcceptedRequest ? "Request Accepted" : hasPendingRequest ? "Request Sent" : "Request Mentorship"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              Send a mentorship request to {selectedMentor?.first_name} {selectedMentor?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium">
                Topic
              </label>
              <Input
                id="topic"
                placeholder="e.g., Career guidance in software engineering"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                placeholder="Tell the mentor why you'd like their guidance..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestMentorship}
              disabled={requesting !== null || !topic.trim() || !message.trim()}
            >
              {requesting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedChatMentor && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          recipientId={selectedChatMentor.id}
          recipientName={selectedChatMentor.name}
          recipientPicture={selectedChatMentor.picture}
          currentUserId={Number(user.id)}
        />
      )}
    </div>
  )
}
