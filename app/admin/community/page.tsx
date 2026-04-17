"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthChecker } from "@/components/layout/auth-checker"
import useSWR from "swr"
import { Flag, Eye, Trash2, Pin, MessageSquare, Heart, Calendar } from "lucide-react"

const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : ""
  return fetch(url, {
    headers: { "x-session-token": token || "" },
  }).then((r) => r.json())
}

export default function AdminCommunityPage() {
  const { data: sessionData } = useSWR("/api/session", fetcher)
  const { data: postsData, mutate } = useSWR("/api/posts", fetcher, {
    refreshInterval: 15000,
  })

  const user = sessionData?.user
  const posts = postsData?.posts || []

  const reportedPosts = posts.filter((post: any) => post.isReported || post.is_reported)
  const pinnedPosts = posts.filter((post: any) => post.isPinned || post.is_pinned)
  const recentPosts = posts.slice(0, 10)

  const handleTogglePin = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}/pin`, { method: "POST" })
      mutate()
    } catch (error) {
      console.error("[v0] Failed to toggle pin:", error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}`, { method: "DELETE" })
      mutate()
    } catch (error) {
      console.error("[v0] Failed to delete post:", error)
    }
  }

  const handleResolveReport = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}/resolve`, { method: "POST" })
      mutate()
    } catch (error) {
      console.error("[v0] Failed to resolve report:", error)
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

  const PostCard = ({ post, showActions = true }: { post: (typeof posts)[0]; showActions?: boolean }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.author_avatar || post.authorAvatar || "/placeholder.svg"} />
              <AvatarFallback>{(post.author_name || post.authorName || "U").charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{post.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{post.author_name || post.authorName}</span>
                <Badge variant="secondary" className={getRoleColor(post.author_role || post.authorRole || "student")}>
                  {post.author_role || post.authorRole || "student"}
                </Badge>
                {(post.isPinned || post.is_pinned) && <Pin className="h-4 w-4 text-primary" />}
                {(post.isReported || post.is_reported) && <Flag className="h-4 w-4 text-red-500" />}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {post.category || "general"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.content}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{post.likes_count || post.likes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4" />
              <span>{post.comments_count || post.comments?.length || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.createdAt || post.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {(post.tags || []).slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>

        {showActions && post.comments && post.comments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Recent Comments:</p>
            <div className="space-y-2">
              {post.comments.slice(0, 3).map((comment: any) => (
                <div key={comment.id} className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.author_avatar || comment.authorAvatar || "/placeholder.svg"} />
                    <AvatarFallback>{(comment.author_name || comment.authorName || "U").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-xs">
                      {comment.author_name || comment.authorName}
                      <span className="text-muted-foreground ml-2">({comment.author_role || comment.authorRole || "student"})</span>
                    </p>
                    <p className="text-muted-foreground text-xs line-clamp-2">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showActions && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleTogglePin(post.id)}>
              <Pin className="h-4 w-4 mr-2" />
              {post.isPinned || post.is_pinned ? "Unpin" : "Pin"}
            </Button>
            {(post.isReported || post.is_reported) && (
              <Button variant="outline" size="sm" onClick={() => handleResolveReport(post.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Resolve Report
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={() => handleDeletePost(post.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <AuthChecker requiredRole="admin">
      <div className="flex h-screen bg-background">
        <Sidebar
          userRole={user?.role || "admin"}
          userName={user ? `${user.first_name} ${user.last_name}` : "Admin"}
          userBadges={[]}
          userPoints={0}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Community Management</h1>
              <p className="text-muted-foreground">Moderate posts, manage content, and maintain community standards</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                      <p className="text-2xl font-bold">{posts.length}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Reported Posts</p>
                      <p className="text-2xl font-bold">{reportedPosts.length}</p>
                    </div>
                    <Flag className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pinned Posts</p>
                      <p className="text-2xl font-bold">{pinnedPosts.length}</p>
                    </div>
                    <Pin className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Engagement</p>
                      <p className="text-2xl font-bold">
                        {posts.reduce(
                          (sum: number, post: any) => sum + (post.likes_count || post.likes || 0) + (post.comments_count || post.comments?.length || 0),
                          0,
                        )}
                      </p>
                    </div>
                    <Heart className="h-8 w-8 text-pink-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="reported" className="space-y-4">
              <TabsList>
                <TabsTrigger value="reported">Reported ({reportedPosts.length})</TabsTrigger>
                <TabsTrigger value="pinned">Pinned ({pinnedPosts.length})</TabsTrigger>
                <TabsTrigger value="recent">Recent Posts ({recentPosts.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="reported" className="space-y-4">
                {reportedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No reported posts</p>
                    </CardContent>
                  </Card>
                ) : (
                  reportedPosts.map((post: any) => <PostCard key={post.id} post={post} />)
                )}
              </TabsContent>

              <TabsContent value="pinned" className="space-y-4">
                {pinnedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No pinned posts</p>
                    </CardContent>
                  </Card>
                ) : (
                  pinnedPosts.map((post: any) => <PostCard key={post.id} post={post} />)
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                {recentPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthChecker>
  )
}
