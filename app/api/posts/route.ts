import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session-helper"
import { createPost, getPosts } from "@/lib/db-helpers"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const rawPosts = await getPosts(user.college_id, limit, offset)

    const postsWithDetails = await Promise.all(
      rawPosts.map(async (p) => {
        const likeResult = await query<{ exists: boolean }>(
          `SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2) as exists`,
          [p.id, user.id],
        )
        const isLiked = likeResult[0]?.exists || false

        const rawComments = await query(
          `SELECT 
            pc.id, pc.post_id, pc.author_id, pc.content, pc.created_at,
            u.first_name, u.last_name, u.role, u.profile_picture
          FROM post_comments pc
          LEFT JOIN users u ON pc.author_id = u.id
          WHERE pc.post_id = $1
          ORDER BY pc.created_at ASC`,
          [p.id],
        )

        const formattedComments = rawComments.map((c: any) => ({
          id: c.id.toString(),
          post_id: c.post_id.toString(),
          content: c.content,
          created_at: c.created_at instanceof Date ? c.created_at.toISOString() : c.created_at,
          createdAt: c.created_at instanceof Date ? c.created_at.toISOString() : c.created_at,
          author_id: c.author_id.toString(),
          author_name: c.first_name ? `${c.first_name} ${c.last_name}` : "Unknown",
          author_role: c.role || "student",
          author_avatar: c.profile_picture,
          authorName: c.first_name ? `${c.first_name} ${c.last_name}` : "Unknown",
          authorRole: c.role || "student",
          authorAvatar: c.profile_picture,
        }))

        return {
          id: p.id.toString(),
          title: p.title,
          content: p.content,
          category: p.category || "general",
          tags: p.tags || [],
          likes_count: Number(p.likes_count) || 0,
          comments_count: Number(p.comments_count) || 0,
          created_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
          createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
          authorName: p.user ? `${p.user.first_name} ${p.user.last_name}` : "Unknown",
          author_name: p.user ? `${p.user.first_name} ${p.user.last_name}` : "Unknown",
          authorRole: p.user?.role || "student",
          author_role: p.user?.role || "student",
          authorAvatar: p.user?.profile_picture,
          author_avatar: p.user?.profile_picture,
          isPinned: p.is_pinned || false,
          is_pinned: p.is_pinned || false,
          isReported: p.is_reported || false,
          is_reported: p.is_reported || false,
          user_id: p.user_id,
          college_id: p.college_id,
          isLiked,
          author_id: p.user_id,
          comments: formattedComments,
        }
      }),
    )

    console.log("[v0] Returning posts with comments:", postsWithDetails.length)
    return NextResponse.json({ posts: postsWithDetails })
  } catch (error) {
    console.error("[v0] Get posts error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, content, category, tags } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    console.log("[v0] Creating post with data:", { title, content, category, tags })

    const post = await createPost({
      user_id: user.id,
      college_id: user.college_id,
      title,
      content,
      category,
      tags,
    })

    console.log("[v0] Post created:", post)

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create post error:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
