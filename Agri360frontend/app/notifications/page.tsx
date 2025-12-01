"use client"

import { useState, useEffect } from "react"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Trash2, CheckCircle, AlertCircle, Info } from "lucide-react"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated notifications - In a real app, this would come from the API
    const demoNotifications = [
      {
        id: 1,
        type: "marketplace",
        title: "New Marketplace Listing",
        description: "Premium Wheat listing has been posted in Dakahlia",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        icon: AlertCircle,
      },
      {
        id: 2,
        type: "farm",
        title: "Farm Update",
        description: "Your wheat harvest is ready for collection",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: false,
        icon: Info,
      },
      {
        id: 3,
        type: "price",
        title: "Price Alert",
        description: "Wheat prices have increased by 15% in your region",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        read: true,
        icon: CheckCircle,
      },
      {
        id: 4,
        type: "order",
        title: "Order Confirmed",
        description: "Your fertilizer order has been confirmed and will arrive in 3 days",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: true,
        icon: CheckCircle,
      },
      {
        id: 5,
        type: "weather",
        title: "Weather Alert",
        description: "Heavy rainfall expected in your area within 24 hours",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        read: true,
        icon: AlertCircle,
      },
    ]
    setNotifications(demoNotifications)
    setLoading(false)
  }, [])

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-2">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'No unread notifications'}
            </p>
          </div>
          <Bell className="h-12 w-12 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const IconComponent = notification.icon
              return (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all ${!notification.read ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <IconComponent className={`h-6 w-6 ${!notification.read ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">{notification.title}</h3>
                            <p className="text-muted-foreground mt-1">{notification.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>

                          {!notification.read && (
                            <Badge variant="default" className="flex-shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
