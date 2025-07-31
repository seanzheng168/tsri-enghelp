import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 用於服務端的客戶端
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// 資料類型定義
export interface MeetingRecord {
  id: string
  title: string
  date: string
  time: string
  location?: string
  attendees: string[]
  agenda?: string
  content?: string
  decisions?: string
  action_items?: string
  next_meeting?: string
  status: "scheduled" | "completed" | "cancelled"
  email_notifications: {
    enabled: boolean
    recipients: string[]
    notifyOnCreate: boolean
    notifyOnUpdate: boolean
    reminderBefore: number
  }
  notification_history: NotificationRecord[]
  created_at: string
  updated_at: string
}

export interface NotificationRecord {
  id: string
  type: "meeting_created" | "meeting_updated" | "meeting_reminder" | "meeting_cancelled"
  sentAt: string
  recipients: string[]
  status: "sent" | "failed"
  subject: string
}

export interface EmailSettings {
  id?: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  sender_email: string
  sender_name: string
  created_at?: string
  updated_at?: string
}

export interface KBArticle {
  id: string
  title: string
  content: string
  images: { id: string; data: string }[]
  category: string
  views: number
  created_at: string
  updated_at: string
}

export interface Command {
  id: string
  title: string
  command: string
  description: string
  category: string
  created_at: string
  updated_at: string
}

export interface IPRecord {
  id: string
  ip_address: string
  description: string
  category: string
  system?: string
  status: string
  created_at: string
  updated_at: string
}

// 網路狀態檢查
export const checkNetworkStatus = () => {
  if (typeof window !== "undefined") {
    return navigator.onLine
  }
  return true
}

// 同步管理器
export const createSyncManager = () => {
  let isOnline = checkNetworkStatus()
  const listeners: ((status: boolean) => void)[] = []

  const updateStatus = (status: boolean) => {
    isOnline = status
    listeners.forEach((listener) => listener(status))
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => updateStatus(true))
    window.addEventListener("offline", () => updateStatus(false))
  }

  return {
    isOnline: () => isOnline,
    onStatusChange: (callback: (status: boolean) => void) => {
      listeners.push(callback)
      return () => {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    },
  }
}
