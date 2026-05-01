"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, MapPin, Users, Video, Clock, Plus, Search, Filter, Edit, Trash2, MoreVertical, Eye, X, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Event {
  id: number
  title: string
  description: string
  start_date: string
  end_date: string | null
  location: string
  max_attendees: number | null
  attendees_count: number
  is_virtual: boolean
  virtual_link: string | null
  event_type: string
  status: string
  organizer_id: number
  registration_deadline: string | null
  isRegistered?: boolean
}

interface EventsClientProps {
  initialEvents: Event[]
  userId: number
  userRole: string
}

export function EventsClient({ initialEvents, userId, userRole }: EventsClientProps) {
  const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((res) => res.json())

  const { data, mutate } = useSWR("/api/events", fetcher, {
    fallbackData: { events: initialEvents },
    refreshInterval: 5000,
    revalidateOnFocus: true,
  })

  const events = data?.events || initialEvents

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("All")
  const [sortBy, setSortBy] = useState("date")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [location, setLocation] = useState("")
  const [maxAttendees, setMaxAttendees] = useState("")
  const [registrationDeadline, setRegistrationDeadline] = useState("")
  const [isVirtual, setIsVirtual] = useState(false)
  const [virtualLink, setVirtualLink] = useState("")
  const [eventType, setEventType] = useState("networking")
  const [formErrors, setFormErrors] = useState<string[]>([])

  const filteredEvents = events
    .filter((event: Event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === "All" || event.event_type === selectedType
      return matchesSearch && matchesType
    })
    .sort((a: Event, b: Event) => {
      switch (sortBy) {
        case "date":
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        case "popularity":
          return (b.attendees_count || 0) - (a.attendees_count || 0)
        case "capacity":
          return (b.max_attendees || 0) - (a.max_attendees || 0)
        default:
          return 0
      }
    })

  const handleRegister = async (eventId: number, isCurrentlyRegistered: boolean) => {
    try {
      const method = isCurrentlyRegistered ? "DELETE" : "POST"

      const response = await fetch(`/api/events/${eventId}/register`, {
        method,
        credentials: "include",
      })

      if (response.ok) {
        await mutate()
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${isCurrentlyRegistered ? "unregister" : "register"} for event`)
      }
    } catch (error) {
      console.error("[v0] Registration error:", error)
      alert("Failed to register for event. Please try again.")
    }
  }

  const getEventTypeColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    }
  }

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event)
    setTitle(event.title)
    setDescription(event.description)
    setStartDate(new Date(event.start_date).toISOString().slice(0, 16))
    setEndDate(event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "")
    setLocation(event.location)
    setMaxAttendees(event.max_attendees?.toString() || "")
    setRegistrationDeadline(
      event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : "",
    )
    setIsVirtual(event.is_virtual)
    setVirtualLink(event.virtual_link || "")
    setEventType(event.event_type || "networking")
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event)
    setIsDeleteDialogOpen(true)
  }

  const handleViewParticipants = async (event: Event) => {
    setSelectedEvent(event)
    setIsParticipantsDialogOpen(true)
    setLoadingParticipants(true)
    
    try {
      const response = await fetch(`/api/events/${event.id}/participants`, {
        credentials: "include",
      })
      
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
      } else {
        const data = await response.json()
        alert(data.error || "Failed to load participants")
        setParticipants([])
      }
    } catch (error) {
      console.error("[v0] Fetch participants error:", error)
      setParticipants([])
    } finally {
      setLoadingParticipants(false)
    }
  }

  const handleRemoveParticipant = async (participantId: number) => {
    if (!selectedEvent) return
    if (!confirm("Remove this participant from the event?")) return
    
    try {
      const response = await fetch(
        `/api/events/${selectedEvent.id}/participants?participant_id=${participantId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )
      
      if (response.ok) {
        await mutate()
        const data = await response.json()
        setParticipants(participants.filter(p => p.user_id !== participantId))
        alert(data.message || "Participant removed")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to remove participant")
      }
    } catch (error) {
      console.error("[v0] Remove participant error:", error)
      alert("Failed to remove participant")
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        await mutate()
        setIsDeleteDialogOpen(false)
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
    }
  }

  const handleCreateEvent = async () => {
    setFormErrors([])
    
    const errors: string[] = []
    if (!title || title.length < 3) errors.push("Title must be at least 3 characters")
    if (!description || description.length < 10) errors.push("Description must be at least 10 characters")
    
    if (!startDate) {
      errors.push("Event date is required")
    } else if (new Date(startDate) <= new Date()) {
      errors.push("Event date must be in the future")
    }
    
    if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
      errors.push("End date must be after start date")
    }
    
    if (!location) errors.push("Location is required")
    
    if (registrationDeadline && new Date(registrationDeadline) <= new Date()) {
      errors.push("Registration deadline must be in the future")
    }
    
    if (isVirtual && virtualLink) {
      try {
        new URL(virtualLink)
      } catch {
        errors.push("Invalid meeting link URL")
      }
    }
    
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          start_date: startDate,
          end_date: endDate || null,
          location,
          max_attendees: maxAttendees ? Number.parseInt(maxAttendees) : null,
          registration_deadline: registrationDeadline || null,
          is_virtual: isVirtual,
          virtual_link: virtualLink || null,
          event_type: eventType,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        await mutate()
        setIsCreateDialogOpen(false)
        resetForm()
      } else if (data.details) {
        setFormErrors(data.details)
      } else {
        setFormErrors([data.error || "Failed to create event"])
      }
    } catch (error) {
      console.error("[v0] Create error:", error)
      setFormErrors(["Failed to create event. Please try again."])
    }
  }

  const handleEditEvent = async () => {
    if (!selectedEvent) return
    
    setFormErrors([])
    
    const errors: string[] = []
    if (!title || title.length < 3) errors.push("Title must be at least 3 characters")
    if (!description || description.length < 10) errors.push("Description must be at least 10 characters")
    
    if (!startDate) {
      errors.push("Event date is required")
    } else if (new Date(startDate) <= new Date() && selectedEvent.status === "upcoming") {
      errors.push("Event date must be in the future")
    }
    
    if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
      errors.push("End date must be after start date")
    }
    
    if (!location) errors.push("Location is required")
    
    if (registrationDeadline && new Date(registrationDeadline) <= new Date()) {
      errors.push("Registration deadline must be in the future")
    }
    
    if (isVirtual && virtualLink) {
      try {
        new URL(virtualLink)
      } catch {
        errors.push("Invalid meeting link URL")
      }
    }
    
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          start_date: startDate,
          end_date: endDate || null,
          location,
          max_attendees: maxAttendees ? Number.parseInt(maxAttendees) : null,
          registration_deadline: registrationDeadline || null,
          is_virtual: isVirtual,
          virtual_link: virtualLink || null,
          event_type: eventType,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        await mutate()
        setIsEditDialogOpen(false)
        setSelectedEvent(null)
        resetForm()
      } else if (data.details) {
        setFormErrors(data.details)
      } else {
        setFormErrors([data.error || "Failed to update event"])
      }
    } catch (error) {
      console.error("[v0] Edit error:", error)
      setFormErrors(["Failed to update event. Please try again."])
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStartDate("")
    setEndDate("")
    setLocation("")
    setMaxAttendees("")
    setRegistrationDeadline("")
    setIsVirtual(false)
    setVirtualLink("")
    setEventType("networking")
    setFormErrors([])
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground">Discover and register for upcoming alumni events</p>
        </div>
        {(userRole === "admin" || userRole === "alumni") && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>Fill in the details to create a new event for the community.</DialogDescription>
              </DialogHeader>
              {formErrors.length > 0 && (
                <div className="mx-6 mt-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date & Time</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="isVirtual" checked={isVirtual} onCheckedChange={setIsVirtual} />
                  <Label htmlFor="isVirtual">Virtual Event</Label>
                </div>
                {isVirtual ? (
                  <div>
                    <Label htmlFor="virtualLink">Meeting Link</Label>
                    <Input
                      id="virtualLink"
                      type="url"
                      value={virtualLink}
                      onChange={(e) => setVirtualLink(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxAttendees">Max Attendees</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                    <Input
                      id="registrationDeadline"
                      type="datetime-local"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent}>Create Event</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="networking">Networking</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="seminar">Seminar</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="career">Career</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="popularity">Sort by Popularity</SelectItem>
              <SelectItem value="capacity">Sort by Capacity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event: Event) => (
          <Card key={event.id} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getEventTypeColor(event.status)}>{event.status}</Badge>
                  {(userRole === "admin" || (userRole === "alumni" && event.organizer_id === userId)) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewParticipants(event)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Participants ({event.attendees_count || 0})
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(event)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(event)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(event.start_date).toLocaleDateString()} at{" "}
                  {new Date(event.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {event.is_virtual ? (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Virtual Event
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  {event.attendees_count || 0} {event.max_attendees ? `/ ${event.max_attendees}` : ""} registered
                </div>
                {event.registration_deadline && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    Registration closes: {new Date(event.registration_deadline).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleRegister(event.id, !!event.isRegistered)}
                  disabled={
                    event.status === "completed" ||
                    event.status === "cancelled" ||
                    (event.max_attendees !== null && (event.attendees_count || 0) >= event.max_attendees) ||
                    (event.registration_deadline !== null && new Date() > new Date(event.registration_deadline))
                  }
                  className="w-full"
                  variant={event.isRegistered ? "outline" : "default"}
                >
                  {event.isRegistered
                    ? "Registered ✓"
                    : event.status === "completed"
                      ? "Event Completed"
                      : event.status === "cancelled"
                        ? "Event Cancelled"
                        : event.max_attendees && (event.attendees_count || 0) >= event.max_attendees
                          ? "Event Full"
                          : event.registration_deadline && new Date() > new Date(event.registration_deadline)
                            ? "Registration Closed"
                            : "Register for Event"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events found matching your criteria.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update the event details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Event Title</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date & Time</Label>
                <Input
                  id="edit-startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">End Date & Time</Label>
                <Input
                  id="edit-endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-eventType">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-isVirtual" checked={isVirtual} onCheckedChange={setIsVirtual} />
              <Label htmlFor="edit-isVirtual">Virtual Event</Label>
            </div>
            {isVirtual ? (
              <div>
                <Label htmlFor="edit-virtualLink">Meeting Link</Label>
                <Input
                  id="edit-virtualLink"
                  type="url"
                  value={virtualLink}
                  onChange={(e) => setVirtualLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-maxAttendees">Max Attendees</Label>
                <Input
                  id="edit-maxAttendees"
                  type="number"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-registrationDeadline">Registration Deadline</Label>
                <Input
                  id="edit-registrationDeadline"
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditEvent}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog open={isParticipantsDialogOpen} onOpenChange={setIsParticipantsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Participants</DialogTitle>
            <DialogDescription>
              {selectedEvent?.title} - {participants.length} registered
            </DialogDescription>
          </DialogHeader>
          
          {loadingParticipants ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No participants registered yet
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.profile_picture} />
                      <AvatarFallback>
                        {participant.first_name?.charAt(0) || "U"}
                        {participant.last_name?.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.name}</p>
                      <p className="text-sm text-muted-foreground">{participant.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {participant.phone && `Phone: ${participant.phone}`}
                        {participant.role && ` | Role: ${participant.role}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={participant.status === "registered" ? "default" : "secondary"}>
                      {participant.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParticipant(participant.user_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
