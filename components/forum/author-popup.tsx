"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ProfilePreview } from "@/components/forum/profile-preview"
import { QuickMessageDialog } from "@/components/forum/quick-message-dialog"
import { User, MessageSquare } from "lucide-react"

interface AuthorPopupProps {
  authorId: number
  authorName: string
  authorRole: string
  authorAvatar?: string
  trigger?: React.ReactNode
}

export function AuthorPopup({ authorId, authorName, authorRole, authorAvatar, trigger }: AuthorPopupProps) {
  const [showProfile, setShowProfile] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [open, setOpen] = useState(false)

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "alumni":
        return "bg-blue-100 text-blue-800"
      case "student":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger || (
            <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8">
                <AvatarImage src={authorAvatar || "/placeholder.svg"} />
                <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{authorName}</span>
              <Badge variant="secondary" className={`text-xs ${getRoleColor(authorRole)}`}>
                {authorRole}
              </Badge>
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" side="bottom" align="start">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false)
                setShowProfile(true)
              }}
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false)
                setShowMessage(true)
              }}
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <ProfilePreview
        userId={authorId}
        userName={authorName}
        userRole={authorRole}
        userAvatar={authorAvatar}
        open={showProfile}
        onOpenChange={setShowProfile}
        onMessage={() => {
          setShowProfile(false)
          setShowMessage(true)
        }}
      />

      <QuickMessageDialog
        recipientId={authorId}
        recipientName={authorName}
        recipientRole={authorRole}
        open={showMessage}
        onOpenChange={setShowMessage}
      />
    </>
  )
}
