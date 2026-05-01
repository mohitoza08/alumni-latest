"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Loader2, Mail, Briefcase, GraduationCap, MapPin, ExternalLink, Linkedin } from "lucide-react"

interface ProfilePreviewProps {
  userId: number
  userName: string
  userRole: string
  userAvatar?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMessage: () => void
}

export function ProfilePreview({ userId, userName, userRole, userAvatar, open, onOpenChange, onMessage }: ProfilePreviewProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && userId) {
      setLoading(true)
      fetch(`/api/users/${userId}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setProfile(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [open, userId])

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

  const getRoleGradient = (role: string) => {
    switch (role) {
      case "admin":
        return "from-red-500 to-red-700"
      case "alumni":
        return "from-blue-500 to-blue-700"
      case "student":
        return "from-green-500 to-green-700"
      default:
        return "from-gray-500 to-gray-700"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <div className="overflow-y-auto">
          <DialogHeader className="relative">
          <div className={`h-28 bg-gradient-to-r ${getRoleGradient(profile?.role || userRole)}`}>
            <div className="absolute inset-0 bg-black/10" />
          </div>
          <div className="absolute -bottom-12 left-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.profilePicture || userAvatar || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile?.firstName ? `${profile.firstName} ${profile.lastName}` : userName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </DialogHeader>

        <div className="px-6 pt-16 pb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : profile ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <Badge variant="outline" className={`${getRoleColor(profile.role || userRole)}`}>
                    {profile.role || userRole}
                  </Badge>
                </div>

                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {profile.currentPosition && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Position</p>
                      <p className="text-sm font-medium">{profile.currentPosition}</p>
                      {profile.currentCompany && (
                        <p className="text-xs text-muted-foreground mt-0.5">at {profile.currentCompany}</p>
                      )}
                    </div>
                  </div>
                )}

                {profile.graduationYear && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <GraduationCap className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Graduation Year</p>
                      <p className="text-sm font-medium">{profile.graduationYear}</p>
                    </div>
                  </div>
                )}

                {profile.major && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Major</p>
                      <p className="text-sm font-medium">{profile.major}</p>
                    </div>
                  </div>
                )}

                {profile.degree && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Degree</p>
                      <p className="text-sm font-medium">{profile.degree}</p>
                    </div>
                  </div>
                )}

                {profile.email && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg col-span-2">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{profile.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                >
                  <Linkedin className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">LinkedIn</p>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                      {profile.linkedinUrl}
                    </p>
                  </div>
                </a>
              )}

              <Button className="w-full" onClick={onMessage}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Could not load profile</p>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
