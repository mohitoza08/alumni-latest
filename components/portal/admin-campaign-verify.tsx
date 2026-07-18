"use client"
import useSWR from "swr"
import { useMemo, useState } from "react"
import { Trash2, Check, X, FileText, DollarSign, Calendar, User, Mail, CreditCard, Eye, Plus } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AdminCampaignVerify() {
  const { data: campaignsData, mutate: mutateCampaigns } = useSWR("/api/campaigns", fetcher)
  const campaigns = Array.isArray(campaignsData) ? campaignsData : []

  const [activeTab, setActiveTab] = useState<"campaigns" | "requests">("campaigns")
  const [campaignId, setCampaignId] = useState<string>("")
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showDeleteCampaignModal, setShowDeleteCampaignModal] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null)
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<any>(null)
  
  const { data, mutate } = useSWR(campaignId ? `/api/campaigns/${campaignId}/donation-requests` : null, fetcher)

  const items = useMemo(() => {
    const allItems = Array.isArray(data?.items) ? data.items : []
    return allItems.sort((a: any, b: any) => {
      if (a.status === "pending" && b.status !== "pending") return -1
      if (a.status !== "pending" && b.status === "pending") return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [data])

  const pendingCount = items.filter((i: any) => i.status === "pending").length

  async function verify(campId: string, request: any) {
    try {
      const response = await fetch(`/api/campaigns/${campId}/donation-requests/${request.id}/verify`, {
        method: "POST",
      })
      
      if (response.ok) {
        await mutate()
        await mutateCampaigns()
        alert(`Donation of $${Number(request.amount).toLocaleString()} verified successfully!`)
      } else {
        const err = await response.json()
        alert(err.error || "Failed to verify donation")
      }
    } catch (error) {
      console.error("[v0] Verify donation error:", error)
      alert("Failed to verify donation")
    }
  }

  async function reject(campId: string, requestId: string) {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }
    
    try {
      const response = await fetch(`/api/campaigns/${campId}/donation-requests/${requestId}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: rejectReason }),
      })
      
      if (response.ok) {
        await mutate()
        setShowRejectModal(false)
        setRejectReason("")
        setSelectedRequest(null)
      } else {
        const err = await response.json()
        alert(err.error || "Failed to reject donation")
      }
    } catch (error) {
      console.error("[v0] Reject donation error:", error)
      alert("Failed to reject donation")
    }
  }

  async function deleteCampaign(campaign: any) {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" })
      
      if (response.ok) {
        await mutateCampaigns()
        setShowDeleteCampaignModal(false)
        setCampaignToDelete(null)
        if (campaignId === campaign.id) {
          setCampaignId("")
        }
        alert("Campaign deleted successfully!")
      } else {
        const err = await response.json()
        alert(err.error || "Failed to delete campaign")
      }
    } catch (error) {
      console.error("[v0] Delete campaign error:", error)
      alert("Failed to delete campaign")
    }
  }

  async function deleteDonationRequest(campId: string, request: any) {
    try {
      const response = await fetch(`/api/campaigns/${campId}/donation-requests/${request.id}`, { method: "DELETE" })
      
      if (response.ok) {
        await mutate()
        setShowDeleteRequestModal(false)
        setRequestToDelete(null)
        alert("Donation request deleted!")
      } else {
        const err = await response.json()
        alert(err.error || "Failed to delete request")
      }
    } catch (error) {
      console.error("[v0] Delete request error:", error)
      alert("Failed to delete request")
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "campaigns"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="inline h-4 w-4 mr-1" />
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "requests"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign className="inline h-4 w-4 mr-1" />
          Donation Requests
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">{pendingCount}</span>
          )}
        </button>
      </div>

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="rounded-lg border">
          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No campaigns yet</div>
          ) : (
            <div className="divide-y">
              {campaigns.map((c: any) => {
                const progress = c.goalAmount ? Math.min(100, (Number(c.currentAmount || c.collectedAmount || 0) / Number(c.goalAmount)) * 100) : 0
                return (
                  <div key={c.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{c.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            c.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        {c.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            ${Number(c.currentAmount || c.collectedAmount || 0).toLocaleString()} / ${Number(c.goalAmount || c.goal_amount || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Ends: {c.endDate ? new Date(c.endDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCampaignToDelete(c)
                          setShowDeleteCampaignModal(true)
                        }}
                        className="rounded-md p-2 text-muted-foreground hover:bg-red-100 hover:text-red-600"
                        title="Delete campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Donation Requests Tab */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 flex-1"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border">
            {!campaignId ? (
              <div className="p-8 text-center text-muted-foreground">Select a campaign to view requests</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No donation requests for this campaign</div>
            ) : (
              <div className="divide-y">
                {items.map((r: any) => (
                  <div key={r.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">${Number(r.amount).toLocaleString()}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                            r.status === "verified" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {r.is_anonymous ? "Anonymous" : r.donor_name || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {r.is_anonymous ? "Hidden" : r.donor_email || "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {r.payment_method || "UPI"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {r.message && (
                          <p className="mt-2 text-sm italic text-muted-foreground">"{r.message}"</p>
                        )}

                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <span className="font-mono text-muted-foreground">Ref: {r.transaction_reference}</span>
                          {r.receipt_url && r.receipt_url !== "receipt_stored" ? (
                            <a href={r.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <Eye className="h-3 w-3" /> View Receipt
                            </a>
                          ) : r.receipt_url === "receipt_stored" ? (
                            <span className="text-xs text-muted-foreground">Receipt uploaded</span>
                          ) : null}
                        </div>

                        {r.admin_notes && (
                          <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-800">
                            <strong>Rejection reason:</strong> {r.admin_notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {r.status === "pending" ? (
                          <>
                            <button
                              onClick={() => verify(campaignId, r)}
                              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(r)
                                setShowRejectModal(true)
                              }}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 flex items-center gap-1"
                            >
                              <X className="h-3 w-3" /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setRequestToDelete(r)
                              setShowDeleteRequestModal(true)
                            }}
                            className="rounded-md p-2 text-muted-foreground hover:bg-red-100 hover:text-red-600"
                            title="Delete request"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-bold">Reject Donation Request</h3>
            <div className="mb-4 rounded-lg bg-muted p-4">
              <p><strong>Amount:</strong> ${Number(selectedRequest.amount).toLocaleString()}</p>
              <p><strong>Donor:</strong> {selectedRequest.is_anonymous ? "Anonymous" : selectedRequest.donor_name}</p>
              <p><strong>Reference:</strong> {selectedRequest.transaction_reference}</p>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Reason for rejection <span className="text-destructive">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2"
                rows={3}
                placeholder="e.g., Invalid transaction reference..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); setSelectedRequest(null); }}
                className="flex-1 rounded-md border px-4 py-2 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => reject(campaignId, selectedRequest.id)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Campaign Modal */}
      {showDeleteCampaignModal && campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-bold text-red-600">Delete Campaign</h3>
            <div className="mb-4 rounded-lg bg-muted p-4">
              <p>Are you sure you want to delete this campaign?</p>
              <p className="mt-2 font-semibold">"{campaignToDelete.title}"</p>
              <p className="text-sm text-muted-foreground mt-1">This will also delete all associated donation requests and donations.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteCampaignModal(false); setCampaignToDelete(null); }}
                className="flex-1 rounded-md border px-4 py-2 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCampaign(campaignToDelete)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Modal */}
      {showDeleteRequestModal && requestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-bold text-red-600">Delete Donation Request</h3>
            <div className="mb-4 rounded-lg bg-muted p-4">
              <p>Are you sure you want to delete this donation request?</p>
              <p className="mt-2 font-semibold">${Number(requestToDelete.amount).toLocaleString()} - {requestToDelete.is_anonymous ? "Anonymous" : requestToDelete.donor_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteRequestModal(false); setRequestToDelete(null); }}
                className="flex-1 rounded-md border px-4 py-2 hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDonationRequest(campaignId, requestToDelete)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
