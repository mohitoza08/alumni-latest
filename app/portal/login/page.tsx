"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, User, Shield, Loader2 } from "lucide-react"

type Role = "student" | "alumni" | "admin"

const COLLEGES = [
  "Saffrony University",
]

const COLLEGE_DOMAINS = [".edu", ".ac.in", ".ac.uk", ".edu.in"]

function detectRole(email: string): Role {
  const lower = email.toLowerCase()
  const isCollegeDomain = COLLEGE_DOMAINS.some((d) => lower.endsWith(d))
  return isCollegeDomain ? "student" : "alumni"
}

export default function PortalLogin() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Role>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [college, setCollege] = useState("")
  const [role, setRole] = useState<Role>("student")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmail(val)
    const detected = detectRole(val)
    setRole(detected)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password || !college) {
      setError("Please fill all fields.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, role: activeTab, college }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Login failed")
      }
      const { token, user } = await res.json()
      localStorage.setItem("session_token", token)

      const acctStatus = user?.account_status || user?.status

      if (acctStatus === "rejected") {
        router.push(`/${activeTab}/dashboard`)
      } else if (acctStatus === "pending") {
        router.push(`/${activeTab}/dashboard?review=true`)
      } else {
        router.push(`/${activeTab}/dashboard`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md w-full">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as Role); setRole(v as Role) }} className="mb-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="student" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Student
              </TabsTrigger>
              <TabsTrigger value="alumni" className="gap-2">
                <User className="h-4 w-4" />
                Alumni
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">Use your college email (e.g., you@college.edu)</p>
            </TabsContent>
            <TabsContent value="alumni" className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">Use your personal email</p>
            </TabsContent>
            <TabsContent value="admin" className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">Admin access only</p>
            </TabsContent>
          </Tabs>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={activeTab === "student" ? "you@college.edu" : "you@gmail.com"}
                required
              />
              {email && (
                <p className="text-xs text-muted-foreground">
                  Detected as: <span className="font-medium capitalize">{role}</span>
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>College</Label>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="" disabled>
                  Select your college
                </option>
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Sign in as {activeTab === "student" ? "Student" : "Alumni"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a href="/portal/register" className="text-sm text-primary hover:underline">
              Don't have an account? Register here
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
