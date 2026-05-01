"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, Info, CornerDownLeft } from "lucide-react"
import { toast } from "sonner"

interface QuickMessageDialogProps {
  recipientId: number
  recipientName: string
  recipientRole?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickMessageDialog({ recipientId, recipientName, recipientRole, open, onOpenChange }: QuickMessageDialogProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipient_id: recipientId,
          title: `Chat with ${recipientName}`,
          content: message.trim(),
        }),
      })

      if (response.ok) {
        toast.success("Message sent")
        setMessage("")
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "alumni":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "student":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">{getInitials(recipientName)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">{recipientName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-0.5">
                {recipientRole && (
                  <Badge variant="outline" className={`text-xs ${getRoleColor(recipientRole)}`}>
                    {recipientRole}
                  </Badge>
                )}
                <span>New conversation</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Starting a new conversation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your message will be the first message in this thread. {recipientName} will be able to reply from their Messages inbox.
              </p>
            </div>
          </div>

          <Textarea
            placeholder={`Write a message to ${recipientName}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[180px] resize-none"
            autoFocus
          />
        </div>

        <div className="p-6 pt-4 border-t bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CornerDownLeft className="h-3 w-3" />
              <span>Ctrl + Enter to send</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={!message.trim() || sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
