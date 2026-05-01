"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

interface AuthCheckerProps {
  requiredRole?: "admin" | "alumni" | "student"
  children: React.ReactNode
}

export function AuthChecker({ requiredRole, children }: AuthCheckerProps) {
  const router = useRouter()
  const { data, isLoading } = useSWR("/api/session", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (isLoading) return

    if (!data?.user) {
      router.push("/")
      return
    }

    if (requiredRole && data.user.role !== requiredRole) {
      router.push("/")
      return
    }
  }, [data, isLoading, router, requiredRole])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data?.user || (requiredRole && data.user.role !== requiredRole)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function useAuth(requiredRole?: "admin" | "alumni" | "student") {
  const router = useRouter()

  const { data, error, isLoading } = useSWR("/api/session", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (isLoading) return
    if (!data?.user) {
      router.push("/")
      return
    }
    if (data.user.role === "alumni" && data.user.status === "pending") {
      router.push("/pending")
      return
    }
    if (requiredRole && data.user.role !== requiredRole) {
      router.push("/")
      return
    }
  }, [data, isLoading, router, requiredRole])

  return {
    user: data?.user || null,
    isLoading,
    error,
  }
}

