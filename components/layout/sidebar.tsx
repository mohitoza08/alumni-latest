"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Home,
  Users,
  MessageSquare,
  Calendar,
  DollarSign,
  Trophy,
  Settings,
  Menu,
  X,
  UserCheck,
  BookOpen,
  Heart,
  LogOut,
  User,
  Award,
} from "lucide-react"
import type { UserRole } from "@/lib/auth"

interface SidebarProps {
  userRole: UserRole
  userName: string
  userBadges: string[]
  userPoints: number
}

const navigationItems = {
  student: [
    { name: "Dashboard", href: "/student/dashboard", icon: Home },
    { name: "Profile", href: "/student/profile", icon: User },
    { name: "Profile Details", href: "/student/profile-details", icon: Trophy },
    { name: "Achievements", href: "/student/achievements", icon: Award },
    { name: "Apply for Alumni", href: "/student/apply", icon: UserCheck },
    { name: "Community", href: "/student/community", icon: MessageSquare },
    { name: "Messages", href: "/student/messages", icon: MessageSquare },
    { name: "Mentorship", href: "/student/mentorship", icon: BookOpen },
    { name: "Events", href: "/student/events", icon: Calendar },
    { name: "Fundraising", href: "/student/fundraising", icon: Heart },
  ],
  alumni: [
    { name: "Dashboard", href: "/alumni/dashboard", icon: Home },
    { name: "Profile", href: "/alumni/profile", icon: User },
    { name: "Profile Details", href: "/alumni/profile-details", icon: Trophy },
    { name: "Achievements", href: "/alumni/achievements", icon: Award },
    { name: "Community", href: "/alumni/community", icon: MessageSquare },
    { name: "Messages", href: "/alumni/messages", icon: MessageSquare },
    { name: "Mentorship", href: "/alumni/mentorship", icon: BookOpen },
    { name: "Events", href: "/alumni/events", icon: Calendar },
    { name: "Fundraising", href: "/alumni/fundraising", icon: Heart },
  ],
  admin: [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Applications", href: "/admin/applications", icon: UserCheck },
    { name: "Community", href: "/admin/community", icon: MessageSquare },
    { name: "Messages", href: "/admin/messages", icon: MessageSquare },
    { name: "Verifications", href: "/admin/verifications", icon: UserCheck },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Fundraising", href: "/admin/fundraising", icon: DollarSign },
    { name: "Analytics", href: "/admin/analytics", icon: Trophy },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ],
}

export function Sidebar({ userRole, userName, userBadges, userPoints }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const items = navigationItems[userRole]

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    window.location.href = "/"
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-sidebar-primary">Alumni Connect</h2>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <p className="font-medium text-sidebar-foreground">{userName}</p>
          <p className="text-sm text-sidebar-foreground/70 capitalize">{userRole}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {userPoints} pts
            </Badge>
            {userBadges.slice(0, 2).map((badge) => (
              <Badge key={badge} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-sidebar-foreground">Theme</span>
          <ModeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button variant="ghost" size="sm" className="lg:hidden fixed top-4 left-4 z-50" onClick={() => setIsOpen(true)}>
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
