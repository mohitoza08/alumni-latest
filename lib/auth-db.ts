import { query } from "./db"
import bcrypt from "bcryptjs"

export type UserRole = "student" | "alumni" | "admin"

export interface User {
  id: number
  college_id: number
  role: UserRole
  email: string
  first_name: string
  last_name: string
  phone?: string
  profile_picture?: string
  bio?: string
  graduation_year?: number
  current_year_level?: string
  degree?: string
  major?: string
  current_company?: string
  current_position?: string
  linkedin_url?: string
  location?: string
  status: "active" | "inactive" | "pending" | "suspended"
  email_verified: boolean
  last_login?: Date
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: number
  user_id: number
  token: string
  expires_at: Date
  created_at: Date
}

export async function createUser(data: {
  college_id: number
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  graduation_year?: number
  current_year_level?: string
  degree?: string
  major?: string
}): Promise<User> {
  const password_hash = await bcrypt.hash(data.password, 10)

  const initialStatus = data.role === "admin" ? "active" : "pending"

  const result = await query<User>(
    `INSERT INTO users (
      college_id, email, password_hash, first_name, last_name, role, phone,
      graduation_year, current_year_level, degree, major, status, email_verified
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      data.college_id,
      data.email,
      password_hash,
      data.first_name,
      data.last_name,
      data.role,
      data.phone || null,
      data.graduation_year || null,
      data.current_year_level || null,
      data.degree || null,
      data.major || null,
      initialStatus,
      false,
    ],
  )

  return result[0]
}

export async function authenticateUser(
  email: string,
  password: string,
  college_id: number | null,
): Promise<User | null> {
  if (college_id === null) {
    return null
  }

  const result = await query<User & { password_hash: string }>(
    "SELECT * FROM users WHERE email = $1 AND college_id = $2 AND status = 'active'",
    [email, college_id],
  )

  if (result.length === 0) {
    return null
  }

  const user = result[0]

  const isValidPassword = await bcrypt.compare(password, user.password_hash)

  if (!isValidPassword) {
    return null
  }

  await query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [user.id])

  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword as User
}

export async function createSession(user_id: number): Promise<Session> {
  const token = generateToken()
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const result = await query<Session>(
    "INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *",
    [user_id, token, expires_at],
  )

  return result[0]
}

export async function getUserBySession(token: string): Promise<User | null> {
  const result = await query<User>(
    `SELECT u.* FROM users u
     INNER JOIN user_sessions s ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
    [token],
  )

  return result[0] || null
}

export async function deleteSession(token: string): Promise<void> {
  await query("DELETE FROM user_sessions WHERE token = $1", [token])
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await query<User>("SELECT * FROM users WHERE id = $1", [id])
  return result[0] || null
}

export async function updateUserProfile(
  id: number,
  updates: Partial<Omit<User, "id" | "email" | "password_hash">>,
): Promise<User> {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = $${paramIndex}`)
    values.push(value)
    paramIndex++
  })

  fields.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(id)

  const result = await query<User>(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )

  return result[0]
}

function generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  )
}
