// This replaces the PostgreSQL database for development/demo purposes

import type { User } from "./auth-db"
import type { Event } from "./db-helpers"
import bcrypt from "bcryptjs"

// In-memory storage
interface Database {
  users: Map<number, User & { password_hash: string }>
  sessions: Map<string, { user_id: number; expires_at: Date }>
  events: Map<number, Event>
  eventRegistrations: Map<string, { event_id: number; user_id: number; status: string }>
  posts: any[]
  colleges: Map<
    number,
    {
      id: number
      name: string
      code: string
      city: string
      state: string
      country: string
      website: string
      description: string
    }
  >
  mentorshipRequests: Map<number, { id: number; mentor_id: number; mentee_id: number; status: string }>
  donations: Map<number, { id: number; donor_id: number; amount: number; status: string }>
  nextUserId: number
  nextEventId: number
  nextCollegeId: number
  nextMentorshipId: number
  nextDonationId: number
}

const db: Database = {
  users: new Map(),
  sessions: new Map(),
  events: new Map(),
  eventRegistrations: new Map(),
  posts: [],
  colleges: new Map(),
  mentorshipRequests: new Map(),
  donations: new Map(),
  nextUserId: 1,
  nextEventId: 1,
  nextCollegeId: 1,
  nextMentorshipId: 1,
  nextDonationId: 1,
}

// Seed initial data
function seedDatabase() {
  db.colleges.set(1, {
    id: 1,
    name: "Northbridge University",
    code: "NBU",
    city: "Boston",
    state: "Massachusetts",
    country: "USA",
    website: "https://northbridge.edu",
    description: "Welcome to Northbridge University Alumni Network",
  })
  db.nextCollegeId = 2

  // Create sample admin user (password: admin123)
  const adminHash = bcrypt.hashSync("admin123", 10)
  db.users.set(1, {
    id: 1,
    college_id: 1,
    role: "admin",
    email: "admin@northbridge.edu",
    first_name: "Admin",
    last_name: "User",
    password_hash: adminHash,
    status: "active",
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
  })

  // Create sample alumni user (password: alumni123)
  const alumniHash = bcrypt.hashSync("alumni123", 10)
  db.users.set(2, {
    id: 2,
    college_id: 1,
    role: "alumni",
    email: "alumni@northbridge.edu",
    first_name: "John",
    last_name: "Doe",
    password_hash: alumniHash,
    status: "active",
    email_verified: true,
    graduation_year: 2018,
    degree: "B.S. Computer Science",
    major: "Computer Science",
    current_company: "Tech Corp",
    current_position: "Senior Engineer",
    created_at: new Date(),
    updated_at: new Date(),
  })

  // Create sample student user (password: student123)
  const studentHash = bcrypt.hashSync("student123", 10)
  db.users.set(3, {
    id: 3,
    college_id: 1,
    role: "student",
    email: "student@northbridge.edu",
    first_name: "Jane",
    last_name: "Smith",
    password_hash: studentHash,
    status: "active",
    email_verified: true,
    graduation_year: 2025,
    current_year_level: "3",
    degree: "B.A. Business",
    major: "Business Administration",
    created_at: new Date(),
    updated_at: new Date(),
  })

  db.nextUserId = 4

  // Create sample events
  const sampleEvents: Event[] = [
    {
      id: 1,
      college_id: 1,
      organizer_id: 2,
      title: "Alumni Networking Night",
      description: "Connect with fellow alumni and share experiences",
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      location: "Main Campus Hall",
      max_attendees: 100,
      is_virtual: false,
      event_type: "networking",
      status: "upcoming",
      created_at: new Date(),
      attendees_count: 15,
    },
    {
      id: 2,
      college_id: 1,
      organizer_id: 1,
      title: "Career Development Workshop",
      description: "Learn about career opportunities and professional development",
      start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      location: "https://zoom.us/j/example",
      max_attendees: 50,
      is_virtual: true,
      virtual_link: "https://zoom.us/j/example",
      event_type: "workshop",
      status: "upcoming",
      created_at: new Date(),
      attendees_count: 32,
    },
  ]

  sampleEvents.forEach((event) => db.events.set(event.id, event))
  db.nextEventId = 3
}

// Initialize database
seedDatabase()

// Database query function that mimics PostgreSQL query interface
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  console.log("[v0] Mock DB Query:", text.substring(0, 100) + "...")

  // Parse SQL and execute mock operations
  const upperText = text.toUpperCase().trim()

  if (upperText.includes("FROM COLLEGES") || upperText.includes("INTO COLLEGES")) {
    return handleCollegeOperations(text, params, upperText) as T[]
  }

  if (upperText.includes("FROM MENTORSHIP_REQUESTS") || upperText.includes("INTO MENTORSHIP_REQUESTS")) {
    return handleMentorshipOperations(text, params, upperText) as T[]
  }

  if (upperText.includes("FROM DONATIONS") || upperText.includes("INTO DONATIONS")) {
    return handleDonationOperations(text, params, upperText) as T[]
  }

  if (upperText.includes("FROM POSTS") || upperText.includes("INTO POSTS")) {
    return handlePostOperations(text, params, upperText) as T[]
  }

  if (upperText.includes("FROM EVENT_REGISTRATIONS") || upperText.includes("INTO EVENT_REGISTRATIONS")) {
    return handleEventRegistrationOperations(text, params, upperText) as T[]
  }

  // Handle INSERT operations
  if (upperText.startsWith("INSERT INTO USERS")) {
    return handleUserInsert(text, params) as T[]
  }

  if (upperText.startsWith("INSERT INTO USER_SESSIONS")) {
    return handleSessionInsert(text, params) as T[]
  }

  if (upperText.startsWith("INSERT INTO EVENTS")) {
    return handleEventInsert(text, params) as T[]
  }

  // if (upperText.startsWith("INSERT INTO EVENT_REGISTRATIONS")) {
  //   return handleEventRegistration(text, params) as T[]
  // }

  // Handle SELECT operations
  if (upperText.includes("SELECT") && upperText.includes("FROM USERS")) {
    return handleUserSelect(text, params) as T[]
  }

  if (upperText.includes("FROM USER_SESSIONS")) {
    return handleSessionSelect(text, params) as T[]
  }

  if (upperText.includes("FROM EVENTS")) {
    return handleEventSelect(text, params) as T[]
  }

  // Handle UPDATE operations
  if (upperText.startsWith("UPDATE USERS")) {
    return handleUserUpdate(text, params) as T[]
  }

  // Handle DELETE operations
  if (upperText.startsWith("DELETE FROM USER_SESSIONS")) {
    handleSessionDelete(text, params)
    return []
  }

  // Handle COUNT operations
  if (upperText.includes("COUNT(*)")) {
    return handleCount(text, params) as T[]
  }

  console.log("[v0] Unhandled query type")
  return []
}

function handleCollegeOperations(text: string, params: any[] | undefined, upperText: string): any[] {
  // SELECT from colleges
  if (upperText.includes("SELECT") && upperText.includes("FROM COLLEGES")) {
    if (!params) return []

    // SELECT by code
    if (upperText.includes("WHERE CODE = $1")) {
      const code = params[0]
      for (const college of db.colleges.values()) {
        if (college.code === code) {
          return [college]
        }
      }
      return []
    }

    // SELECT all colleges
    return Array.from(db.colleges.values())
  }

  // INSERT into colleges
  if (upperText.startsWith("INSERT INTO COLLEGES")) {
    if (!params) return []

    const [name, code, city, state, country, website, description] = params

    // Check for duplicate code
    for (const college of db.colleges.values()) {
      if (college.code === code) {
        const error: any = new Error("Duplicate college code")
        error.code = "23505"
        throw error
      }
    }

    const newCollege = {
      id: db.nextCollegeId++,
      name,
      code,
      city,
      state,
      country,
      website,
      description,
    }

    db.colleges.set(newCollege.id, newCollege)

    // Handle RETURNING clause
    if (upperText.includes("RETURNING")) {
      return [newCollege]
    }

    return []
  }

  return []
}

function handleUserInsert(text: string, params?: any[]): any[] {
  if (!params) return []

  const [
    college_id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    phone,
    graduation_year,
    degree,
    major,
    status,
    email_verified,
  ] = params

  // Check for duplicate email
  for (const user of db.users.values()) {
    if (user.email === email && user.college_id === college_id) {
      const error: any = new Error("Duplicate email")
      error.code = "23505"
      throw error
    }
  }

  const newUser: User & { password_hash: string } = {
    id: db.nextUserId++,
    college_id,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    phone,
    graduation_year,
    degree,
    major,
    status,
    email_verified,
    created_at: new Date(),
    updated_at: new Date(),
  }

  db.users.set(newUser.id, newUser)

  const { password_hash: _, ...userWithoutPassword } = newUser
  return [userWithoutPassword]
}

function handleSessionInsert(text: string, params?: any[]): any[] {
  if (!params) return []
  const [user_id, token, expires_at] = params

  db.sessions.set(token, { user_id, expires_at: new Date(expires_at) })

  return [{ id: db.sessions.size, user_id, token, expires_at, created_at: new Date() }]
}

function handleEventInsert(text: string, params?: any[]): any[] {
  if (!params) return []

  const newEvent: Event = {
    id: db.nextEventId++,
    college_id: params[0],
    organizer_id: params[1],
    title: params[2],
    description: params[3],
    start_date: new Date(params[4]),
    end_date: params[5] ? new Date(params[5]) : undefined,
    location: params[6],
    max_attendees: params[7],
    registration_deadline: params[8] ? new Date(params[8]) : undefined,
    is_virtual: params[9],
    virtual_link: params[10],
    event_type: params[11],
    status: params[12] || "upcoming",
    created_at: new Date(),
    attendees_count: 0,
  }

  db.events.set(newEvent.id, newEvent)
  return [newEvent]
}

function handleEventRegistration(text: string, params?: any[]): any[] {
  if (!params) return []
  const [event_id, user_id, status] = params

  const key = `${event_id}-${user_id}`
  db.eventRegistrations.set(key, { event_id, user_id, status })

  // Update attendees count
  const event = db.events.get(event_id)
  if (event) {
    event.attendees_count = (event.attendees_count || 0) + 1
  }

  return []
}

function handleUserSelect(text: string, params?: any[]): any[] {
  if (!params) return []

  // Login query (email + college_id + active status)
  if (text.includes("password_hash") && text.includes("status = 'active'")) {
    const [email, college_id] = params
    for (const user of db.users.values()) {
      if (user.email === email && user.college_id === college_id && user.status === "active") {
        return [user]
      }
    }
    return []
  }

  // Get user by ID
  if (text.includes("WHERE id = $1")) {
    const user = db.users.get(params[0])
    if (user) {
      const { password_hash, ...userWithoutPassword } = user
      return [userWithoutPassword]
    }
    return []
  }

  // Get all users by college
  if (text.includes("WHERE college_id = $1")) {
    const college_id = params[0]
    const status = params[1]
    const results: any[] = []

    for (const user of db.users.values()) {
      if (user.college_id === college_id) {
        if (!status || user.status === status) {
          const { password_hash, ...userWithoutPassword } = user
          results.push(userWithoutPassword)
        }
      }
    }
    return results
  }

  return []
}

function handleSessionSelect(text: string, params?: any[]): any[] {
  if (!params) return []

  const [token] = params
  const session = db.sessions.get(token)

  if (!session) return []

  // Check if session is expired
  if (session.expires_at < new Date()) {
    db.sessions.delete(token)
    return []
  }

  const user = db.users.get(session.user_id)
  if (!user || user.status !== "active") return []

  const { password_hash, ...userWithoutPassword } = user
  return [userWithoutPassword]
}

function handleEventSelect(text: string, params?: any[]): any[] {
  if (!params) return []

  const college_id = params[0]
  const results: any[] = []

  for (const event of db.events.values()) {
    if (event.college_id === college_id && event.status !== "cancelled") {
      // Count registrations
      let attendees_count = 0
      for (const reg of db.eventRegistrations.values()) {
        if (reg.event_id === event.id && reg.status === "confirmed") {
          attendees_count++
        }
      }

      // Return in format compatible with both db-helpers Event and lib/events Event
      results.push({
        ...event,
        attendees_count,
        // Add compatibility fields for lib/events.ts
        type: event.event_type || "networking",
        date: event.start_date,
        endDate: event.end_date,
        isVirtual: event.is_virtual,
        meetingLink: event.virtual_link,
        capacity: event.max_attendees || 100,
        registeredCount: attendees_count,
        organizerId: event.organizer_id.toString(),
        organizerName: "Admin User",
        organizerRole: "admin",
        tags: [],
        registrationDeadline: event.registration_deadline || event.start_date,
        isRegistrationOpen: true,
        attendees: [],
        isPremium: false,
        paymentRequired: false,
      })
    }
  }

  return results.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
}

function handleUserUpdate(text: string, params?: any[]): any[] {
  if (!params) return []

  // Update last login
  if (text.includes("last_login") && text.includes("WHERE id = $1")) {
    const user = db.users.get(params[0])
    if (user) {
      user.last_login = new Date()
    }
    return []
  }

  // Update status
  if (text.includes("SET status")) {
    const status = params[0]
    const id = params[1]
    const user = db.users.get(id)
    if (user) {
      user.status = status
      user.updated_at = new Date()
    }
  }

  return []
}

function handleSessionDelete(text: string, params?: any[]): void {
  if (!params) return
  const [token] = params
  db.sessions.delete(token)
}

function handleCount(text: string, params?: any[]): any[] {
  if (!params) return [{ count: 0 }]

  const college_id = params[0]

  // Count total users
  if (text.includes("FROM users") && !text.includes("role")) {
    let count = 0
    for (const user of db.users.values()) {
      if (user.college_id === college_id && user.status === "active") {
        count++
      }
    }
    return [{ count }]
  }

  // Count by role
  if (text.includes("role =")) {
    const role = text.includes("alumni") ? "alumni" : text.includes("student") ? "student" : null
    let count = 0
    for (const user of db.users.values()) {
      if (user.college_id === college_id && user.role === role && user.status === "active") {
        count++
      }
    }
    return [{ count }]
  }

  // Count pending users
  if (text.includes("status = 'pending'")) {
    let count = 0
    for (const user of db.users.values()) {
      if (user.college_id === college_id && user.status === "pending") {
        count++
      }
    }
    return [{ count }]
  }

  // Count events
  if (text.includes("FROM events")) {
    let count = 0
    for (const event of db.events.values()) {
      if (event.college_id === college_id && event.status === "upcoming") {
        // Check if in current month
        const now = new Date()
        const eventDate = new Date(event.start_date)
        if (eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()) {
          count++
        }
      }
    }
    return [{ count }]
  }

  return [{ count: 0 }]
}

function handleMentorshipOperations(text: string, params: any[] | undefined, upperText: string): any[] {
  if (!params) return []

  // COUNT mentorship requests
  if (upperText.includes("COUNT")) {
    const [userId] = params

    if (upperText.includes("MENTOR_ID")) {
      // Count as mentor
      let count = 0
      for (const request of db.mentorshipRequests.values()) {
        if (request.mentor_id === userId && request.status === "accepted") {
          count++
        }
      }
      return [{ count }]
    }

    if (upperText.includes("MENTEE_ID")) {
      // Count as mentee
      let count = 0
      for (const request of db.mentorshipRequests.values()) {
        if (request.mentee_id === userId && request.status === "accepted") {
          count++
        }
      }
      return [{ count }]
    }

    if (upperText.includes("DISTINCT MENTOR_ID")) {
      // Count unique mentors for a mentee
      const mentors = new Set()
      for (const request of db.mentorshipRequests.values()) {
        if (request.mentee_id === userId && request.status === "accepted") {
          mentors.add(request.mentor_id)
        }
      }
      return [{ count: mentors.size }]
    }
  }

  return []
}

function handleDonationOperations(text: string, params: any[] | undefined, upperText: string): any[] {
  if (!params) return []

  // SUM donations
  if (upperText.includes("SUM(AMOUNT)") || upperText.includes("COALESCE(SUM(AMOUNT)")) {
    const [userId] = params
    let total = 0

    for (const donation of db.donations.values()) {
      if (donation.donor_id === userId && donation.status === "verified") {
        total += donation.amount
      }
    }

    return [{ total }]
  }

  return []
}

function handlePostOperations(text: string, params: any[] | undefined, upperText: string): any[] {
  if (!params) return []

  // COUNT posts
  if (upperText.includes("COUNT")) {
    const [userId] = params
    return [{ count: 0 }] // Mock: no posts yet
  }

  return []
}

function handleEventRegistrationOperations(text: string, params: any[] | undefined, upperText: string): any[] {
  if (!params) return []

  // INSERT event registration
  if (upperText.startsWith("INSERT INTO EVENT_REGISTRATIONS")) {
    const [event_id, user_id, status] = params
    const key = `${event_id}-${user_id}`

    // Check if already registered (ON CONFLICT DO NOTHING simulation)
    if (db.eventRegistrations.has(key)) {
      return []
    }

    db.eventRegistrations.set(key, { event_id, user_id, status })

    // Update attendees count
    const event = db.events.get(event_id)
    if (event) {
      event.attendees_count = (event.attendees_count || 0) + 1
    }

    return []
  }

  // DELETE event registration
  if (upperText.startsWith("DELETE FROM EVENT_REGISTRATIONS")) {
    const [event_id, user_id] = params
    const key = `${event_id}-${user_id}`

    if (db.eventRegistrations.has(key)) {
      db.eventRegistrations.delete(key)

      // Update attendees count
      const event = db.events.get(event_id)
      if (event && event.attendees_count && event.attendees_count > 0) {
        event.attendees_count -= 1
      }
    }

    return []
  }

  // COUNT event registrations
  if (upperText.includes("COUNT(*)") && upperText.includes("WHERE USER_ID")) {
    const [user_id] = params
    let count = 0

    for (const reg of db.eventRegistrations.values()) {
      if (reg.user_id === user_id && reg.status === "confirmed") {
        count++
      }
    }

    return [{ count }]
  }

  // CHECK if user is registered (EXISTS)
  if (upperText.includes("EXISTS") || upperText.includes("SELECT 1")) {
    const [event_id, user_id] = params
    const key = `${event_id}-${user_id}`
    const exists = db.eventRegistrations.has(key)

    return [{ exists }]
  }

  // SELECT event registrations
  if (upperText.includes("SELECT") && upperText.includes("FROM EVENT_REGISTRATIONS")) {
    // For now, return empty array for SELECT queries we haven't specifically handled
    return []
  }

  return []
}

// Export the database for direct access if needed
export { db }
