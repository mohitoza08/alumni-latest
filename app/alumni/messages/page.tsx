"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/components/layout/auth-checker"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Send, MessageSquare, Archive, Clock, Plus, UserPlus, ChevronDown, ChevronRight, CheckCheck, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

const fetcher = (url: string) => {
  const token = localStorage.getItem("session_token") || ""
  return fetch(url, {
    credentials: "include",
    headers: { "x-session-token": token },
  }).then((r) => r.json())
}

const formatTime = (date: Date | string) => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const formatBubbleTime = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function MessageTick({ isRead }: { isRead: boolean }) {
  if (isRead) {
    return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
  }
  return <Check className="h-3.5 w-3.5 text-muted-foreground/60" />
}

export default function AlumniMessagesPage() {
  const { user, isLoading: authLoading } = useAuth("alumni")
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatMessage, setNewChatMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [expandedPersonId, setExpandedPersonId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { data: conversationsData, mutate: mutateConversations } = useSWR(
    user ? "/api/conversations" : null,
    fetcher,
    { refreshInterval: 3000 }
  )

  const { data: conversationData, mutate: mutateConversation } = useSWR(
    selectedConversation ? `/api/conversations/${selectedConversation}` : null,
    fetcher,
    { refreshInterval: 1000, enabled: !!selectedConversation }
  )

  const { data: completedData } = useSWR(
    user ? "/api/conversations/completed" : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  const rawConversations = conversationsData?.conversations || []
  const dedupedConversations = Array.from(new Map(rawConversations.map((c: any) => [c.id, c])).values())
  const conversations = dedupedConversations
  const rawCompletedConversations = completedData?.conversations || []
  const dedupedCompletedConversations = Array.from(new Map(rawCompletedConversations.map((c: any) => [c.id, c])).values())
  const completedConversations = dedupedCompletedConversations
  const currentConversation = conversationData?.conversation
  const messages = conversationData?.messages || []

  const totalUnread = conversations.reduce((sum: number, c: any) => sum + (Number(c.unread_count) || 0), 0)

  const groupedConversations: Record<string, { person: any; conversations: any[] }> = conversations.reduce((acc: Record<string, { person: any; conversations: any[] }>, conv: any) => {
    const pid = conv.other_user_id
    if (!pid) return acc
    const key = `person_${pid}`
    if (!acc[key]) {
      acc[key] = { person: conv, conversations: [] }
    }
    const alreadyExists = acc[key].conversations.some((c: any) => c.id === conv.id)
    if (!alreadyExists) {
      acc[key].conversations.push(conv)
    }
    if (conv.last_message_at && acc[key].person.last_message_at) {
      if (new Date(conv.last_message_at) > new Date(acc[key].person.last_message_at)) {
        acc[key].person = conv
      }
    } else if (conv.last_message_at) {
      acc[key].person = conv
    }
    return acc
  }, {} as Record<string, { person: any; conversations: any[] }>)

  const groupedPeople = Object.values(groupedConversations).sort((a: any, b: any) => {
    const aTime = a.person.last_message_at ? new Date(a.person.last_message_at).getTime() : 0
    const bTime = b.person.last_message_at ? new Date(b.person.last_message_at).getTime() : 0
    const aUnread = a.person.unread_count || 0
    const bUnread = b.person.unread_count || 0
    if (aUnread > 0 && bUnread === 0) return -1
    if (aUnread === 0 && bUnread > 0) return 1
    return bTime - aTime
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversation_id: selectedConversation,
          content: message.trim(),
        }),
      })

      if (response.ok) {
        setMessage("")
        toast.success("Message sent")
        await mutateConversation()
        await mutateConversations()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to send message")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleStartNewChat = async () => {
    if (!selectedStudent || !newChatMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipient_id: selectedStudent.id,
          title: `Chat with ${selectedStudent.first_name}`,
          content: newChatMessage.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversation_id)
        setShowNewChat(false)
        setSearchQuery("")
        setSearchResults([])
        setSelectedStudent(null)
        setNewChatMessage("")
        await mutateConversations()
        toast.success("Message sent")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to send message")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("session_token") || ""
        const response = await fetch(`/api/students/search?q=${encodeURIComponent(q)}`, {
          headers: { "x-session-token": token },
        })
        const data = await response.json()
        setSearchResults(data.students || [])
      } catch (error) {
        console.error("Search failed:", error)
      }
    }, 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    )
  }

  const userName = `${user.first_name} ${user.last_name}`
  const otherUserData = selectedConversation ? conversationData : null

  return (
    <div className="flex h-screen">
      <Sidebar userRole={user.role} userName={userName} userBadges={[]} userPoints={0} />

      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Left Panel */}
          <div className="w-80 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Messages</h2>
                <div className="flex items-center gap-2">
                  {totalUnread > 0 && (
                    <Badge className="bg-green-500 text-white">{totalUnread}</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowNewChat(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="active">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                  <TabsTrigger value="past" className="text-xs">
                    Past
                    {completedConversations.length > 0 && (
                      <span className="ml-1">{completedConversations.length}</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-2">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    {groupedPeople.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No active conversations</p>
                        <Button variant="link" className="mt-2" onClick={() => setShowNewChat(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Start New Chat
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {groupedPeople.map(({ person, conversations: convs }) => {
                          const hasUnread = person.unread_count > 0
                          return (
                            <div key={`person-${person.other_user_id}`}>
                              <button
                                onClick={() => setExpandedPersonId(expandedPersonId === person.other_user_id ? null : person.other_user_id)}
                                className={`w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
                                  expandedPersonId === person.other_user_id ? "bg-muted" : ""
                                }`}
                              >
                                <div className="mt-0.5">
                                  {expandedPersonId === person.other_user_id ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="relative">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={person.other_user_picture} />
                                    <AvatarFallback>{getInitials(person.other_user_name || "U")}</AvatarFallback>
                                  </Avatar>
                                  {hasUnread && (
                                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className={`truncate ${hasUnread ? "font-bold" : "font-medium"}`}>{person.other_user_name}</span>
                                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                      {person.last_message_at ? formatTime(person.last_message_at) : ""}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {person.title || person.last_message || "No messages"}
                                  </p>
                                </div>
                              </button>
                              {expandedPersonId === person.other_user_id && (
                                <div className="bg-muted/30">
                                  {convs.map((conv: any) => {
                                    const convUnread = conv.unread_count || 0
                                    return (
                                      <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv.id)}
                                        className={`w-full p-3 pl-12 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-t border-border/50 ${
                                          selectedConversation === conv.id ? "bg-muted" : ""
                                        }`}
                                      >
                                        <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className={`text-sm truncate ${convUnread > 0 ? "font-semibold" : "font-medium"}`}>
                                              {conv.title || `Chat #${conv.id}`}
                                            </span>
                                            {convUnread > 0 && (
                                              <Badge className="ml-2 bg-green-500 text-white text-xs h-5 min-w-5 px-1">
                                                {convUnread}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {conv.last_message || "No messages"}
                                            {conv.last_message_at ? ` • ${formatTime(conv.last_message_at)}` : ""}
                                          </p>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="past" className="mt-2">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="p-3 text-xs text-muted-foreground border-b">
                      <Archive className="h-3 w-3 inline mr-1" />
                      Past chats - you can re-message students anytime
                    </div>
                    {completedConversations.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No past chats</p>
                        <p className="text-xs mt-1">Completed mentorships appear here</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {completedConversations.map((conv: any) => (
                          <button
                            key={`past-${conv.id}`}
                            onClick={() => setSelectedConversation(conv.id)}
                            className={`w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
                              selectedConversation === conv.id ? "bg-muted" : ""
                            }`}
                          >
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={conv.other_user_picture} />
                                <AvatarFallback>{getInitials(conv.other_user_name || "U")}</AvatarFallback>
                              </Avatar>
                              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                                <Archive className="h-2 w-2 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">{conv.other_user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {conv.last_message_at ? formatTime(conv.last_message_at) : ""}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.title || conv.last_message || "No messages"}
                              </p>
                              <span className="text-xs text-green-600 mt-1 inline-block">
                                Completed {formatTime(conv.completed_at)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col">
            {selectedConversation && currentConversation ? (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={otherUserData?.other_user_picture} />
                        <AvatarFallback>
                          {getInitials(otherUserData?.other_user_name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{otherUserData?.other_user_name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {otherUserData?.other_user_role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-1">
                    {messages.map((msg: any) => {
                      const isCurrentUser = msg.sender_id === user.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-3 py-2 ${
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isCurrentUser ? "text-primary-foreground/60" : "text-muted-foreground"
                            }`}>
                              <span className="text-[10px]">{formatBubbleTime(msg.created_at)}</span>
                              {isCurrentUser && (
                                <MessageTick isRead={msg.is_read} />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                    <Button onClick={handleSend} disabled={!message.trim() || sending}>
                      {sending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">Choose from your active or past chats</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={(open) => {
        setShowNewChat(open)
        if (!open) {
          setSearchQuery("")
          setSearchResults([])
          setSelectedStudent(null)
          setNewChatMessage("")
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Search for a student to start a new chat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedStudent ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Students</label>
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <ScrollArea className="h-48 border rounded-md">
                    <div>
                      {searchResults.map((student: any) => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-muted transition-colors border-b last:border-b-0 text-left"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.profile_picture} />
                            <AvatarFallback>{getInitials(`${student.first_name} ${student.last_name}`)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.email}
                              {student.major ? ` • ${student.major}` : ""}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedStudent.profile_picture} />
                    <AvatarFallback>{getInitials(`${selectedStudent.first_name} ${selectedStudent.last_name}`)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedStudent.email}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                    Change
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Input
                    placeholder="Type your message..."
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleStartNewChat()
                      }
                    }}
                    autoFocus
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewChat(false)
              setSearchQuery("")
              setSearchResults([])
              setSelectedStudent(null)
              setNewChatMessage("")
            }}>
              Cancel
            </Button>
            {!selectedStudent ? null : (
              <Button onClick={handleStartNewChat} disabled={!newChatMessage.trim() || sending}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
