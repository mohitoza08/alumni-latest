"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientId: number
  recipientName: string
  recipientPicture?: string
  mentorshipId?: number
  currentUserId: number
}

export function ChatDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientPicture,
  mentorshipId,
  currentUserId,
}: ChatDialogProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const apiUrl = open
    ? `/api/messages?other_user_id=${recipientId}${mentorshipId ? `&mentorship_id=${mentorshipId}` : ""}`
    : null

  const { data, mutate } = useSWR(apiUrl, fetcher, {
    refreshInterval: 1000,
    revalidateOnFocus: true,
    dedupingInterval: 500,
  })

  const messages = data?.messages || []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || sending) return

    setSending(true)

    const payload = {
      recipient_id: recipientId,
      mentorship_id: mentorshipId || null,
      content: message.trim(),
    }

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMessage("")
        await mutate()
      } else {
        const responseData = await response.json()
        toast.error(responseData.error || "Failed to send message")
      }
    } catch {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={recipientPicture || "/placeholder.svg"} />
              <AvatarFallback>{recipientName.charAt(0)}</AvatarFallback>
            </Avatar>
            Chat with {recipientName}
          </DialogTitle>
          <DialogDescription>Send messages to your mentorship partner</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg: any) => {
              const isCurrentUser = msg.sender_id === currentUserId
              return (
                <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isCurrentUser ? "bg-primary text-primary-foreground" : "bg-background border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={2}
            className="resize-none"
          />
          <Button onClick={handleSend} disabled={!message.trim() || sending} size="icon" className="h-full">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
