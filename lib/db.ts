import { config } from "dotenv"

config({ path: ".env.local" })

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined!")
}

import { Pool } from "pg"

const globalPool = global as any

// Detect if using local connection (localhost/127.0.0.1)
const isLocalConnection = process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1")

if (!globalPool.pgPool) {
  globalPool.pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    min: 0,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
    // Disable SSL for local connections, enable for remote (Supabase, etc.)
    ssl: isLocalConnection ? false : {
      rejectUnauthorized: false,
    },
  })

  globalPool.pgPool.on("error", (err: any) => {
    console.error("[v0] Unexpected pool error:", err.message)
  })
}

const pool = globalPool.pgPool

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const maxRetries = 3
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await pool.query(text, params)
      return result.rows as T[]
    } catch (error: any) {
      lastError = error
      if (error.code === 'XX000' || error.message.includes('MaxClients') || error.message.includes('too many clients')) {
        console.log(`[v0] Connection limit hit, retry ${i + 1}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)))
        continue
      }
      throw error
    }
  }

  console.error("[v0] Query failed after retries:", lastError.message)
  throw lastError
}

export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export { pool }
