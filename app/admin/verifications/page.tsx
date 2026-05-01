"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/components/layout/auth-checker"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Check, X, Eye, FileText, Clock } from "lucide-react"

const fetcher = (url: string) => {
  const token = localStorage.getItem("session_token") || ""
  return fetch(url, { credentials: "include", headers: { "x-session-token": token } }).then((r) => r.json())
}

const getInitials = (name: string) => (name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

export default function AdminVerificationsPage() {
  const { user, isLoading } = useAuth("admin")
  const [selected, setSelected] = useState<any>(null)
  const [notes, setNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const { data, mutate } = useSWR("/api/onboarding/requests", fetcher, { refreshInterval: 10000 })
  const requests = data?.requests || []

  const handleAction = async (id: number, action: string) => {
    setProcessing(true)
    setProcessingAction(action)
    try {
      const token = localStorage.getItem("session_token") || ""
      const res = await fetch(`/api/onboarding/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-session-token": token },
        body: JSON.stringify({ action, admin_notes: notes }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(`Request ${action === "approved" ? "approved" : "rejected"} successfully`)
        setSelected(null)
        setNotes("")
        mutate()
      } else {
        toast.error(result.error || "Failed to process request")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setProcessing(false)
      setProcessingAction(null)
    }
  }

  if (isLoading || !user) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" /></div>

  const pendingCount = requests.filter((r: any) => r.status === "pending").length
  const approvedCount = requests.filter((r: any) => r.status === "approved").length
  const rejectedCount = requests.filter((r: any) => r.status === "rejected").length

  return (
    <div className="flex h-screen">
      <Sidebar userRole={user.role} userName={`${user.first_name} ${user.last_name}`} userBadges={[]} userPoints={0} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Verifications</h1>
          <p className="text-muted-foreground">Review and approve student and alumni onboarding requests</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingCount}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{approvedCount}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{rejectedCount}</p>
          </div>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          </TabsList>

          {(["pending", "approved", "rejected"] as const).map((status) => (
            <TabsContent key={status} value={status}>
              <div className="space-y-4">
                {requests.filter((r: any) => r.status === status).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No {status} requests</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Name</th>
                            <th className="text-left p-3 text-sm font-medium">Type</th>
                            <th className="text-left p-3 text-sm font-medium">Degree</th>
                            <th className="text-left p-3 text-sm font-medium">Year</th>
                            <th className="text-left p-3 text-sm font-medium">Semester</th>
                            <th className="text-left p-3 text-sm font-medium">Certificate</th>
                            <th className="text-left p-3 text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {requests.filter((r: any) => r.status === status).map((r: any) => (
                            <tr key={r.id} className="hover:bg-muted/50">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(`${r.first_name || ""} ${r.last_name || ""}`)}</AvatarFallback></Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{r.first_name} {r.last_name}</p>
                                    <p className="text-xs text-muted-foreground">{r.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3"><Badge variant="secondary" className={r.user_role === "student" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>{r.user_role}</Badge></td>
                              <td className="p-3 text-sm">{r.degree || "-"}</td>
                              <td className="p-3 text-sm">{r.user_role === "student" ? (r.current_year || "-") : (r.graduation_year || "-")}</td>
                              <td className="p-3 text-sm">{r.user_role === "student" ? (r.semester || "-") : "-"}</td>
                              <td className="p-3">{r.certificate_url ? <a href={r.certificate_url} target="_blank" className="text-blue-600 text-sm hover:underline"><FileText className="h-4 w-4 inline mr-1" />View</a> : <span className="text-muted-foreground text-sm">None</span>}</td>
                              <td className="p-3">
                                {r.status === "pending" ? (
                                  <Button size="sm" onClick={() => setSelected(r)}>
                                    <Eye className="h-4 w-4 mr-1" /> Review
                                  </Button>
                                ) : (
                                  <Badge variant={r.status === "approved" ? "default" : "destructive"}>{r.status}</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setNotes("") } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review: {selected?.first_name} {selected?.last_name}</DialogTitle>
            <DialogDescription>Verify details and approve or reject this onboarding request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Role:</span> <Badge variant="secondary">{selected?.user_role}</Badge></div>
              {selected?.user_role === "student" ? (
                <>
                  <div><span className="text-muted-foreground">Current Year:</span> {selected?.current_year || "-"}</div>
                  <div><span className="text-muted-foreground">Semester:</span> {selected?.semester || "-"}</div>
                </>
              ) : (
                <div><span className="text-muted-foreground">Graduation Year:</span> {selected?.graduation_year || "-"}</div>
              )}
              <div><span className="text-muted-foreground">Degree:</span> {selected?.degree}</div>
              <div><span className="text-muted-foreground">Major:</span> {selected?.major}</div>
              <div><span className="text-muted-foreground">Phone:</span> {selected?.phone || "-"}</div>
              {selected?.current_company && <div className="col-span-2"><span className="text-muted-foreground">Company:</span> {selected?.current_company} {selected?.current_position && ` • ${selected?.current_position}`}</div>}
              {selected?.linkedin_url && <div className="col-span-2"><span className="text-muted-foreground">LinkedIn:</span> <a href={selected.linkedin_url} target="_blank" className="text-blue-600 hover:underline">{selected.linkedin_url}</a></div>}
            </div>
            {selected?.certificate_url && (
              <a href={selected.certificate_url} target="_blank" className="flex items-center gap-2 p-3 bg-muted rounded-lg text-blue-600 hover:underline">
                <FileText className="h-5 w-5" /> View Certificate
              </a>
            )}
            {selected?.bio && (
              <div>
                <span className="text-muted-foreground text-sm">Bio:</span>
                <p className="text-sm mt-1">{selected.bio}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes (optional)" className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => handleAction(selected.id, "rejected")} disabled={processing}>
              <X className="h-4 w-4 mr-1" /> {processingAction === "rejected" ? "Processing..." : "Reject"}
            </Button>
            <Button onClick={() => handleAction(selected.id, "approved")} disabled={processing}>
              <Check className="h-4 w-4 mr-1" /> {processingAction === "approved" ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
