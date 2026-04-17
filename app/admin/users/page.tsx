"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AuthChecker } from "@/components/layout/auth-checker"
import useSWR from "swr"
import { format } from "date-fns"
import { BanUserDialog, SuspendUserDialog, DeleteUserDialog } from "@/components/admin/user-action-dialogs"
import { Search, UserCheck, UserX, Shield, Edit, MoreVertical, Ban, Clock, Trash2, CheckCircle, Check } from "lucide-react"

const fetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : ""
  const res = await fetch(url, {
    headers: { "x-session-token": token || "" },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }
  return res.json()
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  profileImage?: string
  department?: string
  graduationYear?: number
  company?: string
  points: number
  streak: number
  badges: string[]
  lastLoginAt?: Date
  isApproved: boolean
  suspendedUntil?: Date
  banReason?: string
}

export default function AdminUsersPage() {
  const { data: sessionData } = useSWR("/api/session", fetcher)
  const { data: usersData, mutate } = useSWR("/api/users", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds for real-time updates
  })

  const user = sessionData?.user
  const users: AdminUser[] = usersData?.users || []

  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.company && u.company.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRole = roleFilter === "All" || u.role === roleFilter
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "active" && u.status === "active") ||
      (statusFilter === "suspended" && u.status === "suspended") ||
      (statusFilter === "banned" && u.status === "banned") ||
      (statusFilter === "pending" && u.status === "pending")

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleToggleStatus = (userId: string) => {
    mutate()
  }

  const handleRoleChange = async (userId: string, newRole: "student" | "alumni" | "admin") => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error("Error updating user role:", error)
    }
  }

  const handleUserUpdate = (updatedUser: any) => {
    mutate()
  }

  const handleUserDeleted = () => {
    mutate()
  }

  const handleActivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/activate`, {
        method: "POST",
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error("Error activating user:", error)
    }
  }

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

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)))
    }
  }

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) return
    
    setBulkLoading(true)
    try {
      const token = localStorage.getItem("session_token") || ""
      const response = await fetch("/api/users/bulk-activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
        },
        body: JSON.stringify({ user_ids: Array.from(selectedUsers) }),
      })

      if (response.ok) {
        setSelectedUsers(new Set())
        mutate()
      }
    } catch (error) {
      console.error("Error activating users:", error)
    } finally {
      setBulkLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      case "banned":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const UserCard = ({ userData }: { userData: any }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={selectedUsers.has(userData.id)}
              onCheckedChange={() => toggleUserSelection(userData.id)}
              className="mr-2"
            />
            <Avatar>
              <AvatarImage src={userData.profileImage || "/placeholder.svg"} />
              <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{userData.name}</CardTitle>
              <CardDescription>{userData.email}</CardDescription>
              {userData.lastLoginAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last login: {format(userData.lastLoginAt, "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getRoleColor(userData.role)}>{userData.role}</Badge>
            <Badge className={getStatusColor(userData.status)}>{userData.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {userData.status === "suspended" && userData.suspendedUntil && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm font-medium text-yellow-800">
              Suspended until: {format(userData.suspendedUntil, "PPP")}
            </p>
            {userData.banReason && <p className="text-sm text-yellow-700 mt-1">Reason: {userData.banReason}</p>}
          </div>
        )}

        {userData.status === "banned" && userData.banReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-800">Banned</p>
            <p className="text-sm text-red-700 mt-1">Reason: {userData.banReason}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            {userData.department && (
              <div className="text-sm">
                <span className="font-medium">Department:</span> {userData.department}
              </div>
            )}
            {userData.graduationYear && (
              <div className="text-sm">
                <span className="font-medium">Graduation:</span> {userData.graduationYear}
              </div>
            )}
            {userData.company && (
              <div className="text-sm">
                <span className="font-medium">Company:</span> {userData.company}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Points:</span> {userData.points.toLocaleString()}
            </div>
            <div className="text-sm">
              <span className="font-medium">Streak:</span> {userData.streak} days
            </div>
            <div className="text-sm">
              <span className="font-medium">Badges:</span> {userData.badges.length}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogDescription>Update the role for {userData.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select
                  defaultValue={userData.role}
                  onValueChange={(value) => handleRoleChange(userData.id, value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userData.status !== "active" && (
                <DropdownMenuItem onClick={() => handleActivateUser(userData.id)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activate User
                </DropdownMenuItem>
              )}
              {userData.status === "active" && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedUser(userData)
                      setSuspendDialogOpen(true)
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Suspend User
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedUser(userData)
                      setBanDialogOpen(true)
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban User
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(userData)
                  setDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )

  const students = filteredUsers.filter((u) => u.role === "student")
  const alumni = filteredUsers.filter((u) => u.role === "alumni")
  const admins = filteredUsers.filter((u) => u.role === "admin")

  return (
    <AuthChecker requiredRole="admin">
      <div className="flex h-screen bg-background">
        <Sidebar
          userRole={user?.role || "admin"}
          userName={user ? `${user.first_name} ${user.last_name}` : "Admin"}
          userBadges={[]}
          userPoints={0}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                      <p className="text-2xl font-bold">{users.filter((u) => u.status === "suspended").length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Banned</p>
                      <p className="text-2xl font-bold">{users.filter((u) => u.status === "banned").length}</p>
                    </div>
                    <Ban className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{users.filter((u) => u.status === "pending").length}</p>
                    </div>
                    <UserX className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllUsers}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {selectedUsers.size === filteredUsers.length ? "Deselect All" : "Select All"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedUsers.size} of {filteredUsers.length} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkActivate}
                      disabled={selectedUsers.size === 0 || bulkLoading}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {bulkLoading ? "Activating..." : `Accept Selected (${selectedUsers.size})`}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Users Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Users ({filteredUsers.length})</TabsTrigger>
                <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
                <TabsTrigger value="alumni">Alumni ({alumni.length})</TabsTrigger>
                <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filteredUsers.map((userData) => (
                  <UserCard key={userData.id} userData={userData} />
                ))}
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                {students.map((userData) => (
                  <UserCard key={userData.id} userData={userData} />
                ))}
              </TabsContent>

              <TabsContent value="alumni" className="space-y-4">
                {alumni.map((userData) => (
                  <UserCard key={userData.id} userData={userData} />
                ))}
              </TabsContent>

              <TabsContent value="admins" className="space-y-4">
                {admins.map((userData) => (
                  <UserCard key={userData.id} userData={userData} />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {selectedUser && (
          <>
            <BanUserDialog
              user={selectedUser}
              open={banDialogOpen}
              onOpenChange={setBanDialogOpen}
              onUserUpdate={handleUserUpdate}
            />
            <SuspendUserDialog
              user={selectedUser}
              open={suspendDialogOpen}
              onOpenChange={setSuspendDialogOpen}
              onUserUpdate={handleUserUpdate}
            />
            <DeleteUserDialog
              user={selectedUser}
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onUserDeleted={handleUserDeleted}
            />
          </>
        )}
      </div>
    </AuthChecker>
  )
}
