import { query } from "./db"
import type { User } from "./auth-db"

// Posts/Community
export interface Post {
  id: number
  user_id: number
  college_id: number
  title: string
  content: string
  category?: string
  tags?: string[]
  likes_count: number
  comments_count: number
  created_at: Date
  updated_at: Date
  is_pinned: boolean
  is_reported: boolean
  user?: {
    first_name: string
    last_name: string
    role: string
    profile_picture?: string
  }
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: Date
  user?: {
    first_name: string
    last_name: string
    profile_picture?: string
    role?: string
  }
}

export async function createPost(data: {
  user_id: number
  college_id: number
  title: string
  content: string
  category?: string
  tags?: string[]
}): Promise<Post> {
  const result = await query<Post>(
    `INSERT INTO community_posts (author_id, college_id, title, content, category, tags)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.user_id, data.college_id, data.title, data.content, data.category || null, JSON.stringify(data.tags || [])],
  )
  return result[0]
}

export async function getPosts(college_id: number, limit = 20, offset = 0): Promise<Post[]> {
  const result = await query<any>(
    `SELECT p.*, 
       u.first_name, u.last_name, u.role, u.profile_picture,
       p.likes_count,
       p.comments_count,
       p.is_pinned,
       p.is_reported
     FROM community_posts p
     JOIN users u ON p.author_id = u.id
     WHERE p.college_id = $1 AND p.is_archived = false
     ORDER BY p.is_pinned DESC, p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [college_id, limit, offset],
  )

  return result.map((row) => ({
    id: row.id,
    user_id: row.author_id,
    college_id: row.college_id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags || [],
    likes_count: row.likes_count || 0,
    comments_count: row.comments_count || 0,
    is_pinned: row.is_pinned || false,
    is_reported: row.is_reported || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role,
      profile_picture: row.profile_picture,
    },
  }))
}

export async function likePost(post_id: number, user_id: number): Promise<void> {
  await query(
    `INSERT INTO post_likes (post_id, user_id) 
     VALUES ($1, $2) 
     ON CONFLICT (post_id, user_id) DO NOTHING`,
    [post_id, user_id],
  )

  await query(
    `UPDATE community_posts 
     SET likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = $1)
     WHERE id = $1`,
    [post_id],
  )
}

export async function unlikePost(post_id: number, user_id: number): Promise<void> {
  await query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [post_id, user_id])

  await query(
    `UPDATE community_posts 
     SET likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = $1)
     WHERE id = $1`,
    [post_id],
  )
}

export async function createComment(post_id: number, user_id: number, content: string): Promise<Comment> {
  const result = await query<Comment>(
    `INSERT INTO post_comments (post_id, author_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [post_id, user_id, content],
  )

  await query(
    `UPDATE community_posts 
     SET comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = $1)
     WHERE id = $1`,
    [post_id],
  )

  return result[0]
}

export async function getComments(post_id: number): Promise<Comment[]> {
  const result = await query<any>(
    `SELECT c.*, u.first_name, u.last_name, u.profile_picture, u.role
     FROM post_comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [post_id],
  )

  return result.map((row) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.author_id,
    content: row.content,
    created_at: row.created_at,
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      profile_picture: row.profile_picture,
      role: row.role,
    },
  }))
}

export async function getNestedComments(post_id: number, parent_comment_id: number): Promise<Comment[]> {
  const result = await query<any>(
    `SELECT c.*, u.first_name, u.last_name, u.profile_picture, u.role
     FROM post_comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.post_id = $1 AND c.parent_comment_id = $2
     ORDER BY c.created_at ASC`,
    [post_id, parent_comment_id],
  )

  return result.map((row) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.author_id,
    content: row.content,
    created_at: row.created_at,
    user: {
      first_name: row.first_name,
      last_name: row.last_name,
      profile_picture: row.profile_picture,
      role: row.role,
    },
  }))
}

// Events
export interface Event {
  id: number
  college_id: number
  organizer_id: number
  title: string
  description: string
  start_date: Date
  end_date?: Date
  location: string
  max_attendees?: number
  registration_deadline?: Date
  is_virtual: boolean
  virtual_link?: string
  event_type?: string
  status: string
  created_at: Date
  attendees_count?: number
}

export async function createEvent(data: {
  college_id: number
  organizer_id: number
  title: string
  description: string
  start_date: Date
  end_date?: Date
  location: string
  max_attendees?: number
  registration_deadline?: Date
  is_virtual?: boolean
  virtual_link?: string
  event_type?: string
}): Promise<Event> {
  const result = await query<Event>(
    `INSERT INTO events (
      college_id, organizer_id, title, description, start_date, end_date, location,
      max_attendees, registration_deadline, is_virtual, virtual_link, event_type, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'upcoming')
    RETURNING *`,
    [
      data.college_id,
      data.organizer_id,
      data.title,
      data.description,
      data.start_date,
      data.end_date || null,
      data.location,
      data.max_attendees || null,
      data.registration_deadline || null,
      data.is_virtual || false,
      data.virtual_link || null,
      data.event_type || "networking",
    ],
  )
  return result[0]
}

export async function getEvents(college_id: number): Promise<Event[]> {
  const result = await query<Event>(
    `SELECT e.*, 
       (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND status IN ('registered', 'attended')) as attendees_count
     FROM events e
     WHERE e.college_id = $1 AND e.status != 'cancelled'
     ORDER BY e.start_date ASC`,
    [college_id],
  )
  return result
}

export async function registerForEvent(
  event_id: number,
  user_id: number,
  paymentReference?: string,
  paymentProof?: string,
): Promise<void> {
  const status = "registered"

  await query(
    `INSERT INTO event_registrations (event_id, user_id, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, user_id) DO NOTHING`,
    [event_id, user_id, status],
  )

  await query(
    `UPDATE events 
     SET registration_count = (SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND status IN ('registered', 'attended'))
     WHERE id = $1`,
    [event_id],
  )
}

export async function unregisterFromEvent(event_id: number, user_id: number): Promise<void> {
  await query(
    `UPDATE event_registrations 
     SET status = 'cancelled', 
         registration_notes = 'Cancelled by user',
         updated_at = CURRENT_TIMESTAMP
     WHERE event_id = $1 AND user_id = $2 AND status IN ('registered', 'waitlisted')`,
    [event_id, user_id],
  )

  await query(
    `UPDATE events 
     SET registration_count = (
       SELECT COUNT(*) 
       FROM event_registrations 
       WHERE event_id = $1 AND status IN ('registered', 'attended')
     )
     WHERE id = $1`,
    [event_id],
  )
}

export async function isUserRegisteredForEvent(event_id: number, user_id: number): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM event_registrations WHERE event_id = $1 AND user_id = $2) as exists`,
    [event_id, user_id],
  )
  return result[0]?.exists || false
}

// Mentorship
export interface MentorshipRequest {
  id: number
  mentee_id: number
  mentor_id: number
  topic: string
  message: string
  status: string
  created_at: Date
}

export async function createMentorshipRequest(data: {
  college_id: number
  mentee_id: number
  mentor_id: number
  topic: string
  message: string
}): Promise<MentorshipRequest> {
  const result = await query<MentorshipRequest>(
    `INSERT INTO mentorship_requests (college_id, mentee_id, mentor_id, topic, message, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [data.college_id, data.mentee_id, data.mentor_id, data.topic, data.message],
  )
  return result[0]
}

export async function getMentorshipRequests(user_id: number, as_mentor = false, status?: string): Promise<any[]> {
  const field = as_mentor ? "mentor_id" : "mentee_id"
  let queryStr = `SELECT mr.*, 
       u1.first_name as mentee_first_name, u1.last_name as mentee_last_name,
       u1.profile_picture as mentee_profile_picture, u1.degree as mentee_degree,
       u1.major as mentee_department,
       u2.first_name as mentor_first_name, u2.last_name as mentor_last_name,
       u2.profile_picture as mentor_profile_picture
     FROM mentorship_requests mr
     JOIN users u1 ON mr.mentee_id = u1.id
     JOIN users u2 ON mr.mentor_id = u2.id
     WHERE mr.${field} = $1`

  const params: any[] = [user_id]

  if (status) {
    params.push(status)
    queryStr += ` AND mr.status = $${params.length}`
  }

  queryStr += ` ORDER BY mr.created_at DESC`

  const result = await query<any>(queryStr, params)
  return result
}

export async function updateMentorshipRequestStatus(
  request_id: number,
  status: "accepted" | "rejected",
): Promise<void> {
  await query(`UPDATE mentorship_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
    status,
    request_id,
  ])
}

export async function deleteMentorshipRequest(request_id: number, user_id: number): Promise<void> {
  await query(`DELETE FROM mentorship_requests WHERE id = $1 AND (mentor_id = $2 OR mentee_id = $2)`, [
    request_id,
    user_id,
  ])
}

export async function completeMentorship(mentorship_id: number): Promise<void> {
  await query(
    `UPDATE mentorships 
     SET status = 'completed', end_date = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [mentorship_id],
  )
}

export async function getMentorshipByRequest(request_id: number): Promise<any> {
  const result = await query<any>(
    `SELECT m.* FROM mentorships m
     JOIN mentorship_requests mr ON m.mentor_id = mr.mentor_id AND m.mentee_id = mr.mentee_id
     WHERE mr.id = $1 AND m.status = 'active'
     LIMIT 1`,
    [request_id],
  )
  return result[0] || null
}

// Messages
export interface Message {
  id: number
  sender_id: number
  recipient_id: number
  mentorship_id?: number
  conversation_id?: number
  subject?: string
  content: string
  is_read: boolean
  created_at: Date
  sender?: {
    first_name: string
    last_name: string
    profile_picture?: string
  }
  recipient?: {
    first_name: string
    last_name: string
    profile_picture?: string
  }
}

export async function createMessage(data: {
  sender_id: number
  recipient_id: number
  mentorship_id?: number
  conversation_id?: number
  subject?: string
  content: string
}): Promise<Message> {
  const result = await query<Message>(
    `INSERT INTO messages (sender_id, recipient_id, mentorship_id, conversation_id, subject, content)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.sender_id, data.recipient_id, data.mentorship_id || null, data.conversation_id || null, data.subject || null, data.content],
  )
  
  if (data.conversation_id) {
    await query(
      `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [data.conversation_id],
    )
  }
  
  return result[0]
}

export async function getMessages(user_id: number, other_user_id: number, mentorship_id?: number): Promise<Message[]> {
  const baseQuery = `
    SELECT m.*,
      u1.first_name as sender_first_name, u1.last_name as sender_last_name, u1.profile_picture as sender_profile_picture,
      u2.first_name as recipient_first_name, u2.last_name as recipient_last_name, u2.profile_picture as recipient_profile_picture
    FROM messages m
    JOIN users u1 ON m.sender_id = u1.id
    JOIN users u2 ON m.recipient_id = u2.id
    WHERE ((m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1))
  `

  let queryStr: string
  const params: any[] = [user_id, other_user_id]

  if (mentorship_id) {
    queryStr = baseQuery + ` AND m.mentorship_id = $3 ORDER BY m.created_at ASC`
    params.push(mentorship_id)
  } else {
    queryStr = baseQuery + ` ORDER BY m.created_at ASC`
  }

  const result = await query<any>(queryStr, params)

  return result.map((row) => ({
    id: row.id,
    sender_id: row.sender_id,
    recipient_id: row.recipient_id,
    mentorship_id: row.mentorship_id,
    subject: row.subject,
    content: row.content,
    is_read: row.is_read,
    created_at: row.created_at,
    sender: {
      first_name: row.sender_first_name,
      last_name: row.sender_last_name,
      profile_picture: row.sender_profile_picture,
    },
    recipient: {
      first_name: row.recipient_first_name,
      last_name: row.recipient_last_name,
      profile_picture: row.recipient_profile_picture,
    },
  }))
}

export async function markMessageAsRead(message_id: number, user_id: number): Promise<void> {
  await query(`UPDATE messages SET is_read = true WHERE id = $1 AND recipient_id = $2`, [message_id, user_id])
}

export async function markConversationAsRead(conversation_id: number, user_id: number): Promise<void> {
  await query(`UPDATE messages SET is_read = true WHERE conversation_id = $1 AND recipient_id = $2 AND is_read = false`, [conversation_id, user_id])
}

export async function getUnreadCount(userId: number, conversationId: number): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1 AND recipient_id = $2 AND is_read = false`,
    [conversationId, userId],
  )
  return Number(result[0]?.count || 0)
}

// Conversations
export interface Conversation {
  id: number
  title?: string
  created_by: number
  college_id: number
  is_archived: boolean
  created_at: Date
  updated_at: Date
  other_user_id?: number
  other_user_name?: string
  other_user_picture?: string
  other_user_role?: string
  last_message?: string
  last_message_at?: Date
  unread_count?: number
  is_mentorship_completed?: boolean
  completed_at?: Date
  mentorship_id?: number
}

export async function createConversation(data: {
  title: string
  created_by: number
  college_id: number
}): Promise<Conversation> {
  const result = await query<Conversation>(
    `INSERT INTO conversations (title, created_by, college_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.title, data.created_by, data.college_id],
  )
  return result[0]
}

export async function findOrCreateDirectConversation(
  userId: number,
  recipientId: number,
  collegeId: number,
  title: string,
): Promise<Conversation> {
  const existingResult = await query<any>(`
    SELECT DISTINCT c.id, c.title, c.created_by, c.college_id, c.is_archived, c.created_at, c.updated_at
    FROM conversations c
    JOIN messages m ON m.conversation_id = c.id
    WHERE c.college_id = $1
      AND m.mentorship_id IS NULL
      AND ((m.sender_id = $2 AND m.recipient_id = $3) OR (m.sender_id = $3 AND m.recipient_id = $2))
    ORDER BY c.created_at DESC
    LIMIT 1
  `, [collegeId, userId, recipientId])

  if (existingResult.length > 0) {
    return {
      id: existingResult[0].id,
      title: existingResult[0].title,
      created_by: existingResult[0].created_by,
      college_id: existingResult[0].college_id,
      is_archived: existingResult[0].is_archived,
      created_at: existingResult[0].created_at,
      updated_at: existingResult[0].updated_at,
    }
  }

  return createConversation({ title, created_by: userId, college_id: collegeId })
}

export async function getActiveMentorshipConversations(userId: number, collegeId: number): Promise<Conversation[]> {
  const result = await query<any>(`
    SELECT DISTINCT ON (c.id)
      c.id, c.title, c.created_by, c.college_id, c.is_archived, c.created_at, c.updated_at,
      last_msg.content as last_message,
      last_msg.created_at as last_message_at,
      (SELECT COUNT(*) FROM messages um WHERE um.conversation_id = c.id AND um.recipient_id = $1 AND um.is_read = false) as unread_count,
      CASE 
        WHEN last_msg.sender_id = $1 THEN last_msg.recipient_id
        ELSE last_msg.sender_id
      END as other_user_id,
      CASE 
        WHEN last_msg.sender_id = $1 THEN u_other.first_name || ' ' || u_other.last_name
        ELSE u_other.first_name || ' ' || u_other.last_name
      END as other_user_name,
      CASE 
        WHEN last_msg.sender_id = $1 THEN u_other.profile_picture
        ELSE u_other.profile_picture
      END as other_user_picture,
      CASE 
        WHEN last_msg.sender_id = $1 THEN u_other.role
        ELSE u_other.role
      END as other_user_role
    FROM conversations c
    JOIN messages last_msg ON last_msg.conversation_id = c.id
    LEFT JOIN users u_other ON u_other.id = (
      CASE WHEN last_msg.sender_id = $1 THEN last_msg.recipient_id ELSE last_msg.sender_id END
    )
    WHERE c.college_id = $2
      AND c.id IN (
        SELECT DISTINCT c2.id FROM conversations c2
        JOIN messages m2 ON m2.conversation_id = c2.id
        WHERE m2.mentorship_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM mentorship_requests mr
          WHERE mr.id = m2.mentorship_id AND mr.status = 'accepted'
          AND (mr.mentor_id = $1 OR mr.mentee_id = $1)
        )
        UNION
        SELECT DISTINCT c3.id FROM conversations c3
        JOIN messages m3 ON m3.conversation_id = c3.id
        WHERE m3.mentorship_id IS NULL
        AND (m3.sender_id = $1 OR m3.recipient_id = $1)
      )
    ORDER BY c.id, last_msg.created_at DESC
    LIMIT 50
  `, [userId, collegeId])

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    created_by: row.created_by,
    college_id: row.college_id,
    is_archived: row.is_archived,
    created_at: row.created_at,
    updated_at: row.updated_at,
    other_user_id: row.other_user_id,
    other_user_name: row.other_user_name,
    other_user_picture: row.other_user_picture,
    other_user_role: row.other_user_role,
    last_message: row.last_message,
    last_message_at: row.last_message_at,
    unread_count: Number(row.unread_count) || 0,
  }))
}

export async function getConversations(userId: number, collegeId: number): Promise<Conversation[]> {
  const result = await query<any>(`
    SELECT DISTINCT ON (c.id)
      c.id, c.title, c.created_by, c.college_id, c.is_archived, c.created_at, c.updated_at,
      last_msg.content as last_message,
      last_msg.created_at as last_message_at,
      (SELECT COUNT(*) FROM messages um WHERE um.conversation_id = c.id AND um.recipient_id = $1 AND um.is_read = false) as unread_count,
      CASE 
        WHEN last_msg.sender_id = $1 THEN last_msg.recipient_id
        ELSE last_msg.sender_id
      END as other_user_id,
      CASE 
        WHEN last_msg.sender_id = $1 THEN u_other.first_name || ' ' || u_other.last_name
        ELSE u_other.first_name || ' ' || u_other.last_name
      END as other_user_name,
      CASE 
        WHEN last_msg.sender_id = $1 THEN u_other.profile_picture
        ELSE u_other.profile_picture
      END as other_user_picture,
      CASE 
        WHEN last_msg.sender_id = $1 THEN u_other.role
        ELSE u_other.role
      END as other_user_role
    FROM conversations c
    JOIN messages last_msg ON last_msg.conversation_id = c.id
    LEFT JOIN users u_other ON u_other.id = (
      CASE WHEN last_msg.sender_id = $1 THEN last_msg.recipient_id ELSE last_msg.sender_id END
    )
    WHERE c.college_id = $2
      AND c.id IN (
        SELECT DISTINCT c2.id FROM conversations c2
        JOIN messages m2 ON m2.conversation_id = c2.id
        WHERE m2.mentorship_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM mentorship_requests mr
          WHERE mr.id = m2.mentorship_id AND mr.status = 'accepted'
          AND (mr.mentor_id = $1 OR mr.mentee_id = $1)
        )
        UNION
        SELECT DISTINCT c3.id FROM conversations c3
        JOIN messages m3 ON m3.conversation_id = c3.id
        WHERE m3.mentorship_id IS NULL
        AND (m3.sender_id = $1 OR m3.recipient_id = $1)
      )
    ORDER BY c.id, last_msg.created_at DESC
    LIMIT 50
  `, [userId, collegeId])

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    created_by: row.created_by,
    college_id: row.college_id,
    is_archived: row.is_archived,
    created_at: row.created_at,
    updated_at: row.updated_at,
    other_user_id: row.other_user_id,
    other_user_name: row.other_user_name,
    other_user_picture: row.other_user_picture,
    other_user_role: row.other_user_role,
    last_message: row.last_message,
    last_message_at: row.last_message_at,
    unread_count: Number(row.unread_count) || 0,
  }))
}

export async function getCompletedMentorshipConversations(
  userId: number,
  collegeId: number,
  daysWindow: number = 30
): Promise<Conversation[]> {
  const result = await query<any>(`
    SELECT c.id, c.title, c.created_by, c.college_id, c.is_archived, c.created_at, c.updated_at,
      mr.id as mentorship_id,
      mr.status as mentorship_status,
      mr.updated_at as completed_at,
      (
        SELECT m2.content FROM messages m2 
        WHERE m2.conversation_id = c.id 
        ORDER BY m2.created_at DESC 
        LIMIT 1
      ) as last_message,
      (
        SELECT m2.created_at FROM messages m2 
        WHERE m2.conversation_id = c.id 
        ORDER BY m2.created_at DESC 
        LIMIT 1
      ) as last_message_at,
      CASE 
        WHEN $1 = mr.mentor_id THEN u_mentee.id
        ELSE u_mentor.id
      END as other_user_id,
      CASE 
        WHEN $1 = mr.mentor_id THEN u_mentee.first_name || ' ' || u_mentee.last_name
        ELSE u_mentor.first_name || ' ' || u_mentor.last_name
      END as other_user_name,
      CASE 
        WHEN $1 = mr.mentor_id THEN u_mentee.profile_picture
        ELSE u_mentor.profile_picture
      END as other_user_picture,
      CASE 
        WHEN $1 = mr.mentor_id THEN u_mentee.role
        ELSE u_mentor.role
      END as other_user_role,
      (SELECT COUNT(*) FROM messages um WHERE um.conversation_id = c.id AND um.recipient_id = $1 AND um.is_read = false) as unread_count
    FROM conversations c
    JOIN messages m ON m.conversation_id = c.id AND m.mentorship_id IS NOT NULL
    JOIN mentorship_requests mr ON mr.id = m.mentorship_id AND mr.status = 'completed'
    LEFT JOIN users u_mentor ON u_mentor.id = mr.mentor_id
    LEFT JOIN users u_mentee ON u_mentee.id = mr.mentee_id
    WHERE c.college_id = $2 
      AND mr.updated_at >= NOW() - ($3 || ' days')::interval
      AND (mr.mentor_id = $1 OR mr.mentee_id = $1)
    ORDER BY c.updated_at DESC
    LIMIT 20
  `, [userId, collegeId, daysWindow])

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    created_by: row.created_by,
    college_id: row.college_id,
    is_archived: row.is_archived,
    created_at: row.created_at,
    updated_at: row.updated_at,
    other_user_id: row.other_user_id,
    other_user_name: row.other_user_name,
    other_user_picture: row.other_user_picture,
    other_user_role: row.other_user_role,
    last_message: row.last_message,
    last_message_at: row.last_message_at,
    unread_count: Number(row.unread_count) || 0,
    is_mentorship_completed: row.mentorship_status === 'completed',
    completed_at: row.completed_at,
    mentorship_id: row.mentorship_id,
  }))
}

export async function getConversationById(conversationId: number): Promise<Conversation | null> {
  const result = await query<Conversation>(
    `SELECT * FROM conversations WHERE id = $1`,
    [conversationId],
  )
  return result[0] || null
}

export async function updateConversationTitle(conversationId: number, title: string): Promise<void> {
  await query(
    `UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [title, conversationId],
  )
}

export async function archiveConversation(conversationId: number): Promise<void> {
  await query(
    `UPDATE conversations SET is_archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [conversationId],
  )
}

export async function getConversationMessages(
  conversationId: number,
  limit: number = 50,
  offset: number = 0,
): Promise<Message[]> {
  const result = await query<any>(`
    SELECT m.*,
      u1.first_name as sender_first_name, u1.last_name as sender_last_name, u1.profile_picture as sender_profile_picture,
      u2.first_name as recipient_first_name, u2.last_name as recipient_last_name, u2.profile_picture as recipient_profile_picture
    FROM messages m
    JOIN users u1 ON m.sender_id = u1.id
    JOIN users u2 ON m.recipient_id = u2.id
    WHERE m.conversation_id = $1
    ORDER BY m.created_at ASC
    LIMIT $2 OFFSET $3
  `, [conversationId, limit, offset])

  return result.map((row) => ({
    id: row.id,
    sender_id: row.sender_id,
    recipient_id: row.recipient_id,
    conversation_id: row.conversation_id,
    mentorship_id: row.mentorship_id,
    subject: row.subject,
    content: row.content,
    is_read: row.is_read,
    created_at: row.created_at,
    sender: {
      first_name: row.sender_first_name,
      last_name: row.sender_last_name,
      profile_picture: row.sender_profile_picture,
    },
    recipient: {
      first_name: row.recipient_first_name,
      last_name: row.recipient_last_name,
      profile_picture: row.recipient_profile_picture,
    },
  }))
}

// Fundraising
export interface FundraisingCampaign {
  id: number
  college_id: number
  creator_id: number
  title: string
  description: string
  goal_amount: number
  current_amount: number
  currency: string
  campaign_type: string
  banner_image: string | null
  is_featured: boolean
  donor_count: number
  start_date: Date
  end_date: Date
  status: string
  created_at: Date
  updated_at: Date
}

export async function createFundraisingCampaign(data: {
  college_id: number
  creator_id: number
  title: string
  description: string
  goal_amount: number
  start_date: Date
  end_date: Date
}): Promise<FundraisingCampaign> {
  const result = await query<FundraisingCampaign>(
    `INSERT INTO fundraising_campaigns (
      college_id, created_by, title, description, goal_amount, 
      current_amount, start_date, end_date, status
    ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, 'active')
    RETURNING *`,
    [data.college_id, data.creator_id, data.title, data.description, data.goal_amount, data.start_date, data.end_date],
  )
  return result[0]
}

export async function getFundraisingCampaigns(college_id: number, role: string = 'student'): Promise<FundraisingCampaign[]> {
  if (role === 'admin') {
    const result = await query<FundraisingCampaign>(
      `SELECT * FROM fundraising_campaigns
       WHERE college_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [college_id],
    )
    return result
  }
  const result = await query<FundraisingCampaign>(
    `SELECT * FROM fundraising_campaigns
     WHERE college_id = $1 AND status IN ('active', 'completed')
     ORDER BY created_at DESC`,
    [college_id],
  )
  return result
}

export async function createDonation(data: {
  campaign_id: number
  donor_id?: number
  amount: number
  donor_name?: string
  donor_email?: string
  is_anonymous: boolean
}): Promise<void> {
  await query(
    `INSERT INTO donations (
      campaign_id, donor_id, amount, donor_name, donor_email, 
      is_anonymous, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
    [
      data.campaign_id,
      data.donor_id || null,
      data.amount,
      data.donor_name || null,
      data.donor_email || null,
      data.is_anonymous,
    ],
  )
}

// Get users by college
export async function getUsersByCollege(college_id: number, role?: string, limit = 50): Promise<Partial<User>[]> {
  const params: any[] = [college_id]
  let queryStr = `
    SELECT id, first_name, last_name, email, role, profile_picture, 
           graduation_year, degree, major, current_company, current_position, 
           linkedin_url, status
    FROM users
    WHERE college_id = $1
  `

  if (role) {
    params.push(role)
    queryStr += ` AND role = $${params.length}`
  }

  params.push(limit)
  queryStr += ` ORDER BY created_at DESC LIMIT $${params.length}`

  const result = await query<Partial<User>>(queryStr, params)
  return result
}

export async function searchStudents(college_id: number, searchQuery: string): Promise<Partial<User>[]> {
  const searchTerm = `%${searchQuery}%`
  return await query<Partial<User>>(
    `SELECT id, first_name, last_name, email, role, profile_picture, 
            graduation_year, degree, major, status
     FROM users
     WHERE college_id = $1 
       AND role = 'student'
       AND (
         LOWER(first_name) LIKE LOWER($2) 
         OR LOWER(last_name) LIKE LOWER($2)
         OR LOWER(first_name || ' ' || last_name) LIKE LOWER($2)
         OR LOWER(email) LIKE LOWER($2)
       )
     ORDER BY first_name, last_name
     LIMIT 20`,
    [college_id, searchTerm],
  )
}

// User management functions for admin approval
export async function getPendingUsers(college_id: number): Promise<Partial<User>[]> {
  const result = await query<Partial<User>>(
    `SELECT id, first_name, last_name, email, role, phone, 
            graduation_year, degree, major, created_at
     FROM users
     WHERE college_id = $1 AND status = 'pending'
     ORDER BY created_at DESC`,
    [college_id],
  )
  return result
}

export async function approveUser(user_id: number): Promise<void> {
  console.log("[v0] Approving user with ID:", user_id)

  const beforeResult = await query<{ status: string; email: string }>(`SELECT status, email FROM users WHERE id = $1`, [
    user_id,
  ])
  console.log("[v0] User before approval:", beforeResult[0])

  await query(`UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [user_id])

  const afterResult = await query<{ status: string; email: string }>(`SELECT status, email FROM users WHERE id = $1`, [
    user_id,
  ])
  console.log("[v0] User after approval:", afterResult[0])
}

export async function rejectUser(user_id: number): Promise<void> {
  await query(`UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [user_id])
}

export async function deleteUser(user_id: number): Promise<void> {
  await query(`DELETE FROM users WHERE id = $1`, [user_id])
}

export async function updateUserRole(user_id: number, role: "student" | "alumni" | "admin"): Promise<void> {
  await query(`UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [role, user_id])
}

export async function banUser(user_id: number, reason: string): Promise<void> {
  await query(
    `UPDATE users 
     SET status = 'banned', 
         ban_reason = $2, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [user_id, reason],
  )
}

export async function suspendUser(user_id: number, until_date: Date, reason: string): Promise<void> {
  await query(
    `UPDATE users 
     SET status = 'suspended', 
         suspended_until = $2, 
         ban_reason = $3, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [user_id, until_date, reason],
  )
}

export async function activateUser(user_id: number): Promise<void> {
  await query(
    `UPDATE users 
     SET status = 'active', 
         suspended_until = NULL, 
         ban_reason = NULL, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [user_id],
  )
}

export async function getAllUsers(college_id: number, status?: string): Promise<Partial<User>[]> {
  let queryStr = `
    SELECT id, first_name, last_name, email, role, profile_picture, 
           graduation_year, degree, major, current_company, current_position, 
           linkedin_url, status, created_at, last_login
    FROM users
    WHERE college_id = $1
  `
  const params: any[] = [college_id]

  if (status) {
    queryStr += ` AND status = $2`
    params.push(status)
  }

  queryStr += ` ORDER BY created_at DESC`

  const result = await query<Partial<User>>(queryStr, params)
  return result
}
