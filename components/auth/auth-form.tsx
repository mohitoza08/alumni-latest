"use client"

import { useState, useMemo, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { GraduationCap, Mail, Lock, User, Building2, Calendar, AlertCircle, CheckCircle, LogOut } from "lucide-react"
import { DEGREES, getMajorsByDegree, MAJORS } from "@/lib/degree-major-data"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const MOBILE_REGEX = /^\d{10}$/
const CURRENT_YEAR = new Date().getFullYear()

const YEAR_LEVELS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
]

const SAFFRONY_COLLEGE_ID = "1"

interface ValidationErrors {
  email?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  college?: string
  role?: string
  phone?: string
  graduationYear?: string
  currentYearLevel?: string
  degree?: string
  major?: string
  certificate?: string
  professionalType?: string
  companyName?: string
  position?: string
  businessName?: string
  businessType?: string
  freelancerSkills?: string
}

function getPasswordStrength(password: string): { score: number; level: string; color: string } {
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  let level = "weak"
  let color = "bg-red-500"
  if (score <= 2) { level = "weak"; color = "bg-red-500" }
  else if (score <= 4) { level = "fair"; color = "bg-yellow-500" }
  else if (score <= 5) { level = "good"; color = "bg-green-400" }
  else { level = "strong"; color = "bg-green-600" }

  return { score, level, color }
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Email is required"
  if (!EMAIL_REGEX.test(email)) return "Invalid email format"
  if (email.length > 254) return "Email too long"
  return undefined
}

function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!PASSWORD_REGEX.test(password)) return "Must contain uppercase, lowercase, and number"
  return undefined
}

function validateMobile(mobile: string): string | undefined {
  if (!mobile) return undefined
  const cleaned = mobile.replace(/\D/g, "")
  if (!MOBILE_REGEX.test(cleaned)) return "Mobile must be exactly 10 digits"
  return undefined
}

function validateGraduationYear(year: string): string | undefined {
  if (!year) return undefined
  const yearNum = parseInt(year, 10)
  if (isNaN(yearNum)) return "Invalid year"
  if (yearNum < 1950 || yearNum > CURRENT_YEAR) return `Year must be between 1950 and ${CURRENT_YEAR}`
  return undefined
}

function validateName(name: string, fieldName: string): string | undefined {
  if (!name || !name.trim()) return `${fieldName} is required`
  if (name.length < 2) return `${fieldName} must be at least 2 characters`
  if (name.length > 100) return `${fieldName} too long`
  return undefined
}

function validateStudentEmail(email: string): string | undefined {
  const emailErr = validateEmail(email)
  if (emailErr) return emailErr
  const lower = email.toLowerCase()
  if (!lower.endsWith("@saffrony.ac.in")) {
    return "Student email must be in format: enrolment@saffrony.ac.in"
  }
  return undefined
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

export function AuthForm() {
  const router = useRouter()
  const { data: sessionData } = useSWR("/api/session", fetcher, { refreshInterval: 0, revalidateOnFocus: false })

  const [isLogin, setIsLogin] = useState(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [college, setCollege] = useState<string>("")
  const [role, setRole] = useState<"student" | "alumni" | "admin" | "">("")
  const [graduationYear, setGraduationYear] = useState("")
  const [currentYearLevel, setCurrentYearLevel] = useState("")
  const [degree, setDegree] = useState("")
  const [major, setMajor] = useState("")
  const [phone, setPhone] = useState("")

  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [certFile, setCertFile] = useState<File | null>(null)
  const [professionalType, setProfessionalType] = useState<"corporate" | "business" | "freelancer" | "other" | "">("")
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [freelancerSkills, setFreelancerSkills] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: "none", color: "" })

  const [regStep, setRegStep] = useState(1)
  const [otpValue, setOtpValue] = useState("")
  const [resendTimer, setResendTimer] = useState(0)

  const availableMajors = useMemo(() => {
    return degree ? getMajorsByDegree(degree) : MAJORS
  }, [degree])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      localStorage.removeItem("session_token")
      window.location.href = "/"
    } catch (err) {
      console.error("[v0] Logout error:", err)
      localStorage.removeItem("session_token")
      window.location.href = "/"
    }
  }

  if (sessionData?.user) {
    const user = sessionData.user
    const dashboardPath = user.role === "admin" ? "/admin/dashboard" : user.role === "alumni" ? "/alumni/dashboard" : "/student/dashboard"
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Alumni Connect
            </CardTitle>
            <CardDescription className="text-base">
              You are already logged in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Signed in as <span className="font-medium text-foreground">{user.email}</span></p>
              <p>Role: <span className="font-medium text-foreground capitalize">{user.role}</span></p>
            </div>
            <Button className="w-full h-11 text-base font-semibold" onClick={() => router.push(dashboardPath)}>
              Go to Dashboard
            </Button>
            <Button variant="outline" className="w-full h-11" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const validateField = (field: string, value: string) => {
    let err: string | undefined
    switch (field) {
      case "email": err = role === "student" && college === SAFFRONY_COLLEGE_ID ? validateStudentEmail(value) : validateEmail(value); break
      case "password": err = validatePassword(value); if (value) setPasswordStrength(getPasswordStrength(value)); break
      case "confirmPassword": if (value !== password) err = "Passwords do not match"; break
      case "firstName": err = validateName(value, "First name"); break
      case "lastName": err = validateName(value, "Last name"); break
      case "phone": err = validateMobile(value); break
      case "graduationYear": err = validateGraduationYear(value); break
      case "currentYearLevel": if (!value) err = "Current year level is required"; break
    }
    setErrors((prev) => ({ ...prev, [field]: err }))
    return err
  }

  const handleChange = (field: string, value: string, formatter?: (v: string) => string) => {
    const formattedValue = formatter ? formatter(value) : value
    switch (field) {
      case "email": setEmail(formattedValue); break
      case "password": setPassword(formattedValue); break
      case "confirmPassword": setConfirmPassword(formattedValue); break
      case "firstName": setFirstName(formattedValue); break
      case "lastName": setLastName(formattedValue); break
      case "phone": setPhone(formattedValue); break
      case "graduationYear": setGraduationYear(formattedValue); break
      case "currentYearLevel": setCurrentYearLevel(formattedValue); break
    }
    if (touched[field]) validateField(field, formattedValue)
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = field === "email" ? email : field === "password" ? password : field === "confirmPassword" ? confirmPassword : field === "firstName" ? firstName : field === "lastName" ? lastName : field === "phone" ? phone : field === "graduationYear" ? graduationYear : field === "currentYearLevel" ? currentYearLevel : ""
    validateField(field, value)
  }

  const validateRegisterForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let hasErrors = false

    const emailError = role === "student" && college === SAFFRONY_COLLEGE_ID ? validateStudentEmail(email) : validateEmail(email)
    if (emailError) { newErrors.email = emailError; hasErrors = true }

    const passwordError = validatePassword(password)
    if (passwordError) { newErrors.password = passwordError; hasErrors = true }

    if (password !== confirmPassword) { newErrors.confirmPassword = "Passwords do not match"; hasErrors = true }

    const firstNameError = validateName(firstName, "First name")
    if (firstNameError) { newErrors.firstName = firstNameError; hasErrors = true }

    const lastNameError = validateName(lastName, "Last name")
    if (lastNameError) { newErrors.lastName = lastNameError; hasErrors = true }

    if (!college) { newErrors.college = "College is required"; hasErrors = true }
    if (!role) { newErrors.role = "Role is required"; hasErrors = true }

    const phoneCleaned = phone.replace(/\D/g, "")
    if (phoneCleaned.length > 0 && phoneCleaned.length < 10) { newErrors.phone = "Mobile must be exactly 10 digits"; hasErrors = true }

    if (role === "student") {
      if (!currentYearLevel) { newErrors.currentYearLevel = "Current year level is required"; hasErrors = true }
    } else if (role === "alumni") {
      if (!graduationYear) { newErrors.graduationYear = "Graduation year is required"; hasErrors = true }
      else {
        const yearError = validateGraduationYear(graduationYear)
        if (yearError) { newErrors.graduationYear = yearError; hasErrors = true }
      }
      if (!certFile) { newErrors.certificate = "Certificate is required for verification"; hasErrors = true }
      else if (certFile.size > 2 * 1024 * 1024) { newErrors.certificate = "Certificate must be under 2MB"; hasErrors = true }
      else if (![".pdf", ".jpg", ".jpeg", ".png"].some(ext => certFile.name.toLowerCase().endsWith(ext))) { newErrors.certificate = "Only PDF, JPG, PNG accepted"; hasErrors = true }
      if (!professionalType) { newErrors.professionalType = "Professional type is required"; hasErrors = true }
      else {
        if (professionalType === "corporate") {
          if (!company) { newErrors.companyName = "Company name is required"; hasErrors = true }
          if (!position) { newErrors.position = "Position is required"; hasErrors = true }
        } else if (professionalType === "business") {
          if (!businessName) { newErrors.businessName = "Business name is required"; hasErrors = true }
          if (!businessType) { newErrors.businessType = "Business type is required"; hasErrors = true }
        } else if (professionalType === "freelancer") {
          if (!freelancerSkills) { newErrors.freelancerSkills = "Skills/services are required"; hasErrors = true }
        }
      }
    }

    if (!degree) { newErrors.degree = "Degree is required"; hasErrors = true }
    if (!major) { newErrors.major = "Major is required"; hasErrors = true }

    setErrors(newErrors)
    return !hasErrors
  }

  const sendOTP = async () => {
    if (!validateRegisterForm()) return false

    setError("")
    setLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role || "student",
          email,
          firstName, lastName, password,
          degree, major,
          phone: phone.replace(/\D/g, "") || undefined,
          graduation_year: graduationYear ? Number.parseInt(graduationYear) : undefined,
          current_year_level: role === "student" ? currentYearLevel : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Failed to send OTP")
        setLoading(false)
        return false
      }

      setLoading(false)
      setResendTimer(60)
      setRegStep(2)
      return true
    } catch (err) {
      console.error("[v0] Send OTP error:", err)
      setError("An error occurred. Please try again.")
      setLoading(false)
      return false
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendOTP()
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return
    setOtpValue("")
    setError("")
    await sendOTP()
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (otpValue.length !== 6) {
      setError("Please enter the full 6-digit OTP")
      return
    }

    setLoading(true)
    try {
      let certificateBase64: string | undefined
      let certificateName: string | undefined

      if (role === "alumni" && certFile) {
        certificateBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(certFile)
        })
        certificateName = certFile.name
      }

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpValue,
          role: role || "student",
          firstName, lastName, password,
          degree, major,
          phone: phone.replace(/\D/g, "") || undefined,
          graduation_year: graduationYear ? Number.parseInt(graduationYear) : undefined,
          current_year_level: role === "student" ? currentYearLevel : undefined,
          company: role === "alumni" ? company : undefined,
          position: role === "alumni" ? position : undefined,
          linkedin: role === "alumni" ? linkedin : undefined,
          professionalType: role === "alumni" ? professionalType : undefined,
          businessName: role === "alumni" ? businessName : undefined,
          businessType: role === "alumni" ? businessType : undefined,
          freelancerSkills: role === "alumni" ? freelancerSkills : undefined,
          certificateBase64,
          certificateName,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Invalid OTP")
        setLoading(false)
        return
      }

      localStorage.setItem("session_token", data.token)
      const userRole = data.user.role
      switch (userRole) {
        case "admin": router.push("/admin/dashboard"); break
        case "alumni": router.push("/alumni/dashboard?review=true"); break
        case "student": router.push("/student/dashboard"); break
      }
      router.refresh()
    } catch (err) {
      console.error("[v0] Verify OTP error:", err)
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const emailError = validateEmail(email)
    if (emailError) { setError(emailError); return }
    const passwordError = validatePassword(password)
    if (passwordError) { setError(passwordError); return }
    if (!college) { setError("College is required"); return }
    if (!role) { setError("Role is required"); return }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, college, role }),
      })

      const data = await response.json()
      if (!response.ok) { setError(data.error || "Invalid credentials"); setLoading(false); return }

      localStorage.setItem("session_token", data.token)
      switch (data.user.role) {
        case "admin": router.push("/admin/dashboard"); break
        case "alumni": router.push("/alumni/dashboard"); break
        case "student": router.push("/student/dashboard"); break
      }
      router.refresh()
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const getInputClass = (field: keyof ValidationErrors) => {
    if (!touched[field]) return "h-11"
    if (errors[field]) return "h-11 border-red-500 focus-visible:ring-red-500"
    return "h-11 border-green-500 focus-visible:ring-green-500"
  }

  const yearOptions = []
  for (let year = CURRENT_YEAR; year >= 1950; year--) yearOptions.push(year)

  const handleTabChange = (v: string) => {
    setIsLogin(v === "login")
    if (v === "register") {
      setLoading(false)
      setRegStep(1)
      setOtpValue("")
      setResendTimer(0)
      setError("")
      setCertFile(null)
      setCompany("")
      setPosition("")
      setLinkedin("")
      setProfessionalType("")
      setBusinessName("")
      setBusinessType("")
      setFreelancerSkills("")
    }
  }

  const emailPlaceholder = role === "student" && college === SAFFRONY_COLLEGE_ID
    ? "enrolment@saffrony.ac.in"
    : role === "student"
    ? "you@college.edu"
    : "you@gmail.com"

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Alumni Connect
          </CardTitle>
          <CardDescription className="text-base">
            Connect with alumni, find mentors, and grow your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" /> Email
                  </Label>
                  <div className="relative">
                    <Input id="login-email" type="email" value={email} onChange={(e) => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")} placeholder="your.email@university.edu" className={getInputClass("email")} />
                    {touched.email && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {errors.email ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    )}
                  </div>
                  {touched.email && errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" /> Password
                  </Label>
                  <div className="relative">
                    <Input id="login-password" type="password" value={password} onChange={(e) => handleChange("password", e.target.value)} onBlur={() => handleBlur("password")} placeholder="Enter your password" className={getInputClass("password")} />
                    {touched.password && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {errors.password ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    )}
                  </div>
                  {touched.password && errors.password && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-college" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" /> College
                  </Label>
                  <select id="login-college" value={college} onChange={(e) => setCollege(e.target.value)} className={`w-full h-11 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 ${touched.college && errors.college ? "border-red-500 focus-visible:ring-red-500" : "border-input focus-visible:ring-ring"}`}>
                    <option value="" disabled>Select your college</option>
                    <option value="1">Saffrony</option>
                    <option value="2">Itr</option>
                    <option value="3">SK</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-role" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" /> Role
                  </Label>
                  <select id="login-role" value={role} onChange={(e) => setRole(e.target.value as any)} className={`w-full h-11 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 ${touched.role && errors.role ? "border-red-500 focus-visible:ring-red-500" : "border-input focus-visible:ring-ring"}`}>
                    <option value="" disabled>Select your role</option>
                    <option value="student">Student</option>
                    <option value="alumni">Alumni</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {error && <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">{error}</div>}
                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
              {regStep === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-firstname">First Name *</Label>
                      <Input id="reg-firstname" value={firstName} onChange={(e) => handleChange("firstName", e.target.value)} onBlur={() => handleBlur("firstName")} placeholder="John" className={getInputClass("firstName")} />
                      {touched.firstName && errors.firstName && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-lastname">Last Name *</Label>
                      <Input id="reg-lastname" value={lastName} onChange={(e) => handleChange("lastName", e.target.value)} onBlur={() => handleBlur("lastName")} placeholder="Doe" className={getInputClass("lastName")} />
                      {touched.lastName && errors.lastName && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" /> Email *
                    </Label>
                    <Input id="reg-email" type="email" value={email} onChange={(e) => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")} placeholder={emailPlaceholder} className={getInputClass("email")} />
                    {touched.email && errors.email && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.email}</p>}
                    {role === "student" && college === SAFFRONY_COLLEGE_ID && !errors.email && <p className="text-xs text-muted-foreground">Must be your Saffrony enrolment email</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" /> Password *
                    </Label>
                    <Input id="reg-password" type="password" value={password} onChange={(e) => handleChange("password", e.target.value)} onBlur={() => handleBlur("password")} placeholder="Create a strong password" className={getInputClass("password")} />
                    {password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map((level) => (
                            <div key={level} className={`h-1 flex-1 rounded-full ${level <= passwordStrength.score ? passwordStrength.color : "bg-gray-200 dark:bg-gray-700"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Strength: <span className={passwordStrength.color.replace("bg-", "text-")}>{passwordStrength.level}</span></p>
                      </div>
                    )}
                    {touched.password && errors.password && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" /> Confirm Password *
                    </Label>
                    <Input id="reg-confirm-password" type="password" value={confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} onBlur={() => handleBlur("confirmPassword")} placeholder="Re-enter password" className={getInputClass("confirmPassword")} />
                    {touched.confirmPassword && errors.confirmPassword && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.confirmPassword}</p>}
                    {touched.confirmPassword && !errors.confirmPassword && confirmPassword && <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Passwords match</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-college" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" /> College *
                    </Label>
                    <select id="reg-college" value={college} onChange={(e) => { setCollege(e.target.value); setTouched((prev) => ({ ...prev, college: true })); if (e.target.value !== SAFFRONY_COLLEGE_ID && role === "student") setErrors((prev) => ({ ...prev, email: undefined })) }} className={`w-full h-11 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 ${touched.college && errors.college ? "border-red-500 focus-visible:ring-red-500" : "border-input focus-visible:ring-ring"}`}>
                      <option value="" disabled>Select your college</option>
                      <option value="1">Saffrony</option>
                      <option value="2">Itr</option>
                      <option value="3">SK</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-role" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" /> Role *
                    </Label>
                    <select id="reg-role" value={role} onChange={(e) => { setRole(e.target.value as any); setTouched((prev) => ({ ...prev, role: true })) }} className={`w-full h-11 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 ${touched.role && errors.role ? "border-red-500 focus-visible:ring-red-500" : "border-input focus-visible:ring-ring"}`}>
                      <option value="" disabled>Select your role</option>
                      <option value="student">Student</option>
                      <option value="alumni">Alumni</option>
                    </select>
                  </div>

                  {role === "student" && (
                    <div className="space-y-2">
                      <Label htmlFor="reg-current-year" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" /> Current Year Level *
                      </Label>
                      <select id="reg-current-year" value={currentYearLevel} onChange={(e) => handleChange("currentYearLevel", e.target.value)} onBlur={() => handleBlur("currentYearLevel")} className={`w-full h-11 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 ${touched.currentYearLevel && errors.currentYearLevel ? "border-red-500 focus-visible:ring-red-500" : "border-input focus-visible:ring-ring"}`}>
                        <option value="">Select year</option>
                        {YEAR_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                      </select>
                      {touched.currentYearLevel && errors.currentYearLevel && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.currentYearLevel}</p>}
                    </div>
                  )}

                  {role === "alumni" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="reg-year" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" /> Graduation Year *
                        </Label>
                        <select id="reg-year" value={graduationYear} onChange={(e) => handleChange("graduationYear", e.target.value)} onBlur={() => handleBlur("graduationYear")} className={`w-full h-11 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 ${touched.graduationYear && errors.graduationYear ? "border-red-500 focus-visible:ring-red-500" : "border-input focus-visible:ring-ring"}`}>
                          <option value="">Select year</option>
                          {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                        {touched.graduationYear && errors.graduationYear && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.graduationYear}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-certificate">Certificate (PDF/JPG/PNG, max 2MB) *</Label>
                        <Input id="reg-certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { setCertFile(e.target.files?.[0] || null); setTouched((prev) => ({ ...prev, certificate: true })) }} />
                        {certFile && <p className="text-xs text-muted-foreground">Selected: {certFile.name} ({(certFile.size / 1024 / 1024).toFixed(2)}MB)</p>}
                        {touched.certificate && errors.certificate && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.certificate}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">Professional Type *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(["corporate", "business", "freelancer", "other"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setProfessionalType(type)}
                              className={`h-11 rounded-md border text-sm font-medium capitalize transition-colors ${
                                professionalType === type
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-input bg-background hover:bg-accent"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        {errors.professionalType && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.professionalType}</p>}
                      </div>

                      {professionalType === "corporate" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="reg-company">Company Name *</Label>
                            <Input id="reg-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Google, Microsoft" />
                            {errors.companyName && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.companyName}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-position">Position *</Label>
                            <Input id="reg-position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g., Software Engineer" />
                            {errors.position && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.position}</p>}
                          </div>
                        </>
                      )}

                      {professionalType === "business" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="reg-business-name">Business Name *</Label>
                            <Input id="reg-business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Acme Solutions" />
                            {errors.businessName && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.businessName}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-business-type">Business Type/Industry *</Label>
                            <Input id="reg-business-type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g., Technology, Consulting" />
                            {errors.businessType && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.businessType}</p>}
                          </div>
                        </>
                      )}

                      {professionalType === "freelancer" && (
                        <div className="space-y-2">
                          <Label htmlFor="reg-freelancer-skills">Skills/Services *</Label>
                          <Input id="reg-freelancer-skills" value={freelancerSkills} onChange={(e) => setFreelancerSkills(e.target.value)} placeholder="e.g., Web Development, Graphic Design" />
                          {errors.freelancerSkills && <p className="text-xs text-red-500"><AlertCircle className="w-3 h-3 inline mr-1" />{errors.freelancerSkills}</p>}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="reg-linkedin">LinkedIn URL</Label>
                        <Input id="reg-linkedin" type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reg-degree">Degree *</Label>
                    <select id="reg-degree" value={degree} onChange={(e) => { setDegree(e.target.value); setMajor("") }} className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="">Select degree</option>
                      {DEGREES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-major">Major *</Label>
                    <select id="reg-major" value={major} onChange={(e) => setMajor(e.target.value)} disabled={!degree} className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">{degree ? "Select major" : "Select degree first"}</option>
                      {availableMajors.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Phone (Optional)</Label>
                    <Input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} placeholder="(555) 123-4567" maxLength={14} />
                  </div>

                  {error && <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">{error}</div>}

                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                    {loading ? "Sending OTP..." : <><Mail className="w-4 h-4 mr-2" />Send OTP</>}
                  </Button>
                </form>
              )}

              {regStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                    <p className="text-sm text-muted-foreground">
                      Verification code sent to <span className="font-medium text-foreground">{email}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Check your inbox and spam folder</p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otpValue} onChange={(v) => { setOtpValue(v); setError("") }}>
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

                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || otpValue.length !== 6}>
                    {loading ? "Verifying..." : <><CheckCircle className="w-4 h-4 mr-2" />Verify & Create Account</>}
                  </Button>

                  <Button type="button" variant="ghost" className="w-full" disabled={resendTimer > 0} onClick={handleResendOTP}>
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </Button>

                  <Button type="button" variant="ghost" onClick={() => { setRegStep(1); setOtpValue(""); setError("") }} className="w-full">
                    Back to form
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
