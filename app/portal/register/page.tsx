"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, User, Loader2, Mail, CheckCircle } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Role = "student" | "alumni"

const COLLEGE_DOMAINS = [".edu", ".ac.in", ".ac.uk", ".edu.in"]
const DEGREES = ["BSc", "BA", "BEng", "MSc", "MA", "MBA", "PhD", "Other"]
const CURRENT_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]
const SEMESTERS = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"]

const currentYear = new Date().getFullYear()
const GRADUATION_YEARS = Array.from({ length: 21 }, (_, i) => currentYear - i)

function isValidCollegeEmail(email: string): boolean {
  const lower = email.toLowerCase()
  return COLLEGE_DOMAINS.some((d) => lower.endsWith(d))
}

export default function PortalRegister() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Role>("student")
  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [devOtp, setDevOtp] = useState("")

  const [sFirstName, setSFirstName] = useState("")
  const [sLastName, setSLastName] = useState("")
  const [sPassword, setSPassword] = useState("")
  const [sConfirmPassword, setSConfirmPassword] = useState("")
  const [sCurrentYear, setSCurrentYear] = useState("")
  const [sSemester, setSSemester] = useState("")
  const [sDegree, setSDegree] = useState("")
  const [sMajor, setSMajor] = useState("")
  const [sPhone, setSPhone] = useState("")

  const [aFirstName, setAFirstName] = useState("")
  const [aLastName, setALastName] = useState("")
  const [aPassword, setAPassword] = useState("")
  const [aConfirmPassword, setAConfirmPassword] = useState("")
  const [aGraduationYear, setAGraduationYear] = useState("")
  const [aDegree, setADegree] = useState("")
  const [aMajor, setAMajor] = useState("")
  const [aPhone, setAPhone] = useState("")
  const [aCompany, setACompany] = useState("")
  const [aPosition, setAPosition] = useState("")
  const [aLinkedin, setALinkedin] = useState("")
  const [aBio, setABio] = useState("")
  const [aCertFile, setACertFile] = useState<File | null>(null)

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setACertFile(e.target.files?.[0] || null)
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Email is required.")
      return
    }

    if (activeTab === "student" && !isValidCollegeEmail(email)) {
      setError("Please use your college email (e.g., enrolmentno@saffrony.ac.in)")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role: activeTab,
          email,
          firstName: "_otp_verify_",
          lastName: "_otp_verify_",
          password: "_otp_verify_",
          degree: "_otp_verify_",
          major: "_otp_verify_",
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to send OTP")
      }

      const data = await res.json()
      setDevOtp(data.otp || "")
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (otp.length !== 6) {
      setError("Please enter the full 6-digit OTP.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          role: activeTab,
          otpOnly: true,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Verification failed")
      }

      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (activeTab === "student") {
      if (!sFirstName || !sLastName || !sPassword || !sDegree || !sMajor) {
        setError("Please fill all required fields.")
        return
      }
      if (sPassword !== sConfirmPassword) {
        setError("Passwords do not match.")
        return
      }
      if (sPassword.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }
    } else {
      if (!aFirstName || !aLastName || !aPassword || !aDegree || !aMajor || !aGraduationYear) {
        setError("Please fill all required fields.")
        return
      }
      if (aPassword !== aConfirmPassword) {
        setError("Passwords do not match.")
        return
      }
      if (aPassword.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }
      if (!aCertFile) {
        setError("Certificate is required for alumni verification.")
        return
      }
      if (aCertFile.size > 2 * 1024 * 1024) {
        setError("Certificate must be under 2MB.")
        return
      }
    }

    setLoading(true)
    try {
      let certBase64: string | undefined
      let certName: string | undefined

      if (activeTab === "alumni" && aCertFile) {
        certBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(aCertFile!)
        })
        certName = aCertFile.name
      }

      const res = await fetch("/api/auth/complete-register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          role: activeTab,
          firstName: activeTab === "student" ? sFirstName : aFirstName,
          lastName: activeTab === "student" ? sLastName : aLastName,
          password: activeTab === "student" ? sPassword : aPassword,
          degree: activeTab === "student" ? sDegree : aDegree,
          major: activeTab === "student" ? sMajor : aMajor,
          phone: activeTab === "student" ? sPhone : aPhone,
          currentYear: sCurrentYear,
          semester: sSemester,
          graduationYear: aGraduationYear,
          company: aCompany,
          position: aPosition,
          linkedin: aLinkedin,
          bio: aBio,
          certificateBase64: certBase64,
          certificateName: certName,
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Registration failed")
      }

      const { token } = await res.json()
      localStorage.setItem("session_token", token)

      if (activeTab === "student") {
        router.push("/student/dashboard")
      } else {
        router.push("/alumni/dashboard?review=true")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 2) { setStep(1); setOtp("") }
    if (step === 3) { setStep(2); setOtp("") }
  }

  return (
    <div className="mx-auto max-w-lg w-full">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {step === 1 && "Verify Email"}
            {step === 2 && "Enter OTP"}
            {step === 3 && "Complete Registration"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Start by verifying your email"}
            {step === 2 && "Check your inbox for the 6-digit code"}
            {step === 3 && (activeTab === "student" ? "Fill in your student details" : "Fill in your alumni details")}
          </CardDescription>
        </CardHeader>
        <CardContent>

          {step !== 3 && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Role)} className="mb-6">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="student" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="alumni" className="gap-2">
                  <User className="h-4 w-4" />
                  Alumni
                </TabsTrigger>
              </TabsList>
              <TabsContent value="student" className="mt-4">
                <p className="text-sm text-muted-foreground">Use your college email for auto-activation</p>
              </TabsContent>
              <TabsContent value="alumni" className="mt-4">
                <p className="text-sm text-muted-foreground">Certificate required for verification</p>
              </TabsContent>
            </Tabs>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="grid gap-4">
              <div className="grid gap-2">
                <Label>{activeTab === "student" ? "College Email" : "Email"}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === "student" ? "you@college.edu" : "you@gmail.com"}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending OTP…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send OTP
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="grid gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Code sent to <span className="font-medium text-foreground">{email}</span>
                </p>
                {devOtp && (
                  <div className="mt-3 inline-block bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">DEV MODE — Your OTP:</p>
                    <p className="text-2xl font-mono font-bold text-yellow-800 dark:text-yellow-200 tracking-widest">{devOtp}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button type="submit" disabled={loading || otp.length !== 6} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <Button type="button" variant="ghost" onClick={handleBack} className="w-full">
                Back
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleCompleteRegistration} className="grid gap-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-600">Email verified — complete your profile</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>First Name *</Label>
                  <Input
                    value={activeTab === "student" ? sFirstName : aFirstName}
                    onChange={(e) => activeTab === "student" ? setSFirstName(e.target.value) : setAFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={activeTab === "student" ? sLastName : aLastName}
                    onChange={(e) => activeTab === "student" ? setSLastName(e.target.value) : setALastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={activeTab === "student" ? sPassword : aPassword}
                    onChange={(e) => activeTab === "student" ? setSPassword(e.target.value) : setAPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Confirm Password *</Label>
                  <Input
                    type="password"
                    value={activeTab === "student" ? sConfirmPassword : aConfirmPassword}
                    onChange={(e) => activeTab === "student" ? setSConfirmPassword(e.target.value) : setAConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Degree *</Label>
                <Select
                  value={activeTab === "student" ? sDegree : aDegree}
                  onValueChange={(v) => activeTab === "student" ? setSDegree(v) : setADegree(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Major *</Label>
                <Input
                  value={activeTab === "student" ? sMajor : aMajor}
                  onChange={(e) => activeTab === "student" ? setSMajor(e.target.value) : setAMajor(e.target.value)}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>

              {activeTab === "student" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Current Year *</Label>
                    <Select value={sCurrentYear} onValueChange={setSCurrentYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENT_YEARS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Semester *</Label>
                    <Select value={sSemester} onValueChange={setSSemester}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTERS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {activeTab === "alumni" && (
                <>
                  <div className="grid gap-2">
                    <Label>Graduation Year *</Label>
                    <Select value={aGraduationYear} onValueChange={setAGraduationYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADUATION_YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Certificate (PDF/JPG/PNG, max 2MB) *</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCertUpload} required />
                    {aCertFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {aCertFile.name} ({(aCertFile.size / 1024 / 1024).toFixed(2)}MB)
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Company</Label>
                    <Input value={aCompany} onChange={(e) => setACompany(e.target.value)} placeholder="Current company" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Position</Label>
                    <Input value={aPosition} onChange={(e) => setAPosition(e.target.value)} placeholder="Current position" />
                  </div>
                  <div className="grid gap-2">
                    <Label>LinkedIn URL</Label>
                    <Input value={aLinkedin} onChange={(e) => setALinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Bio</Label>
                    <Textarea value={aBio} onChange={(e) => setABio(e.target.value)} placeholder="Tell us about yourself" rows={3} />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={activeTab === "student" ? sPhone : aPhone}
                  onChange={(e) => activeTab === "student" ? setSPhone(e.target.value) : setAPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <Button type="button" variant="ghost" onClick={handleBack} className="w-full">
                Back
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <a href="/portal/login" className="text-sm text-primary hover:underline">
              Already have an account? Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
