"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { CampaignList } from "@/components/portal/campaign-list"
import { AlumniCampaignDonate } from "@/components/portal/alumni-campaign-donate"
import { useAuth } from "@/components/layout/auth-checker"

export default function StudentFundraisingPage() {
  const { user, isLoading } = useAuth("student")

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={user.role} userName={user.name} userBadges={user.badges || []} userPoints={user.points || 0} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Fundraising</h1>
            <p className="text-muted-foreground">
              Support active campaigns. Complete payment externally, then submit your transaction reference here for
              admin verification.
            </p>
          </header>
          <section aria-labelledby="campaigns-heading" className="grid gap-4 mb-8">
            <h2 id="campaigns-heading" className="text-xl font-semibold">
              Active Campaigns
            </h2>
            <CampaignList />
          </section>
          <section aria-labelledby="donate-heading" className="grid gap-4">
            <h2 id="donate-heading" className="text-xl font-semibold">
              Submit Donation
            </h2>
            <AlumniCampaignDonate />
          </section>
        </div>
      </main>
    </div>
  )
}
