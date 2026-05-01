"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Pin, Flag, Send } from "lucide-react"
import { toast } from "sonner"
import { AuthorPopup } from "@/components/forum/author-popup"

interface PostCardProps {
  post: any
  onUpdate?: () => void
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isLiking, setIsLiking] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    try {
      const isLiked = post.isLiked || false
      const method = isLiked ? "DELETE" : "POST"

      const response = await fetch(`/api/posts/${post.id}/like`, {
        method,
      })

      if (!response.ok) {
        throw new Error("Failed to like post")
      }

      console.log("[v0] Post like updated, refreshing data")
      toast.success(isLiked ? "Post unliked" : "Post liked")
      onUpdate?.()
    } catch (error) {
      console.error("[v0] Like post error:", error)
      toast.error("Failed to update like")
    } finally {
      setIsLiking(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return

    setIsCommenting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        throw new Error("Failed to create comment")
      }

      console.log("[v0] Comment added, refreshing data")
      toast.success("Comment added")
      setNewComment("")
      onUpdate?.()
    } catch (error) {
      console.error("[v0] Create comment error:", error)
      toast.error("Failed to add comment")
    } finally {
      setIsCommenting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "alumni":
        return "bg-blue-100 text-blue-800"
      case "student":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const createdDate = post.created_at || post.createdAt
  const postComments = post.comments || []
  const likesCount = Number(post.likes_count) || Number(post.likes) || 0
  const commentsCount = Number(post.comments_count) || postComments.length || 0
  const isLiked = post.isLiked || false

  const CommentComponent = ({ comment }: { comment: any }) => (
    <div className="mt-4 border-l-2 border-muted pl-4">
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.authorAvatar || comment.author_avatar || "/placeholder.svg"} />
          <AvatarFallback>{(comment.authorName || comment.author_name || "U").charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">{comment.authorName || comment.author_name}</span>
            <Badge
              variant="secondary"
              className={`text-xs ${getRoleColor(comment.authorRole || comment.author_role || "student")}`}
            >
              {comment.authorRole || comment.author_role || "student"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at || comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-foreground">{comment.content}</p>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <AuthorPopup
                authorId={post.author_id || post.user_id || 0}
                authorName={post.authorName || post.author_name || "Unknown"}
                authorRole={post.authorRole || post.author_role || "student"}
                authorAvatar={post.authorAvatar || post.author_avatar}
              />
              {post.isPinned && <Pin className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{createdDate ? new Date(createdDate).toLocaleDateString() : "Recently"}</span>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {post.category || "general"}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
        <p className="text-foreground mb-4">{post.content}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-4 pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleLike} disabled={isLiking}>
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            {likesCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {commentsCount}
          </Button>
        </div>

        {showComments && (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px]"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim() || isCommenting}>
                <Send className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </div>

            {postComments.map((comment: any) => (
              <CommentComponent key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
