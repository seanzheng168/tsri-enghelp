"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ArrowLeft, Plus, Edit, Trash2, Search, Save, X, Clock, MapPin, Users, FileText, CheckCircle, AlertCircle, Settings, Mail, Download, Upload, Wifi, WifiOff, RefreshCw, Cloud, CloudOff, Copy, Eye } from 'lucide-react'
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { supabase, type MeetingRecord, type EmailSettings, checkNetworkStatus, createSyncManager } from "@/lib/supabase"

const defaultMeetingRecord = {
  title: "",
  date: "",
  time: "",
  location: "",
  attendees: [] as string[],
  agenda: "",
  content: "",
  decisions: "",
  action_items: "",
  next_meeting: "",
  status: "scheduled" as const,
  email_notifications: {
    enabled: false,
    recipients: [] as string[],
    notifyOnCreate: true,
    notifyOnUpdate: true,
    reminderBefore: 30,
  },
}

const MeetingPage = () => {
  const handleSendTestEmail = async () => {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: ['luckyid423@gmail.com'],
        subject: '📅 測試 Gmail 通知信',
        content: '這是一封從 Next.js + Gmail 發出的測試信件。',
      }),
    })

    if (!res.ok) {
      alert('❌ 寄信失敗')
    } else {
      alert('✅ 寄信成功')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">TSRI 會議管理</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleSendTestEmail}
      >
        📧 測試寄信
      </button>
    </div>
  )
}

export default MeetingPage
/*
const defaultEmailSettings: EmailSettings = {
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
  smtp_user: "",
  smtp_password: "",
  sender_email: "noreply@tsri.org.tw",
  sender_name: "TSRI 會議系統",
}
*/

const sendNotificationEmail = async (meeting, type) => {
  const subject =
    type === 'meeting_created'
      ? `📅 新會議通知 - ${meeting.title}`
      : `📅 會議更新通知 - ${meeting.title}`

  const content = `
會議標題：${meeting.title}
時間：${meeting.date} ${meeting.time}
地點：${meeting.location || '未指定'}
參與者：${meeting.attendees.join(', ')}
內容：${meeting.content || '無'}
  `.trim()

  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipients: meeting.email_notifications.recipients,
      subject,
      content,
    }),
  })

  if (!res.ok) throw new Error('寄信失敗')
}


export default function MeetingRecordsPage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<MeetingRecord | null>(null)
  const [newMeeting, setNewMeeting] = useState(defaultMeetingRecord)
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(defaultEmailSettings)
  const [attendeeInput, setAttendeeInput] = useState("")
  const [recipientInput, setRecipientInput] = useState("")
  const [isOnline, setIsOnline] = useState(checkNetworkStatus())
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // 網路狀態管理
  useEffect(() => {
    const syncManager = createSyncManager()
    const unsubscribe = syncManager.onStatusChange(setIsOnline)
    return unsubscribe
  }, [])

  // 載入資料
  useEffect(() => {
    if (isOnline) {
      loadMeetings()
      loadEmailSettings()
    }
  }, [isOnline])

  // 複製會議內容
  const copyMeetingContent = async (meeting: MeetingRecord) => {
    const content = `
會議標題: ${meeting.title}
日期時間: ${meeting.date} ${meeting.time}
地點: ${meeting.location || "未指定"}
參與者: ${meeting.attendees.join(", ")}

議程:
${meeting.agenda}

會議內容:
${meeting.content}

決議事項:
${meeting.decisions}

行動項目:
${meeting.action_items}

下次會議:
${meeting.next_meeting || "未安排"}
    `.trim()

    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "✅ 已複製",
        description: "會議內容已複製到剪貼簿",
      })
    } catch (error) {
      toast({
        title: "❌ 複製失敗",
        description: "請手動選取並複製內容",
        variant: "destructive",
      })
    }
  }

  // 複製會議為新記錄
  const copyMeetingAsNew = (meeting: MeetingRecord) => {
    const newMeetingData = {
      title: `${meeting.title} (副本)`,
      date: "",
      time: "",
      location: meeting.location || "",
      attendees: [...meeting.attendees],
      agenda: meeting.agenda,
      content: meeting.content,
      decisions: meeting.decisions,
      action_items: meeting.action_items,
      next_meeting: meeting.next_meeting || "",
      status: "scheduled" as const,
      email_notifications: {
        ...meeting.email_notifications,
        recipients: [...meeting.email_notifications.recipients],
      },
    }
    
    setNewMeeting(newMeetingData)
    setIsAddDialogOpen(true)
    
    toast({
      title: "📋 會議已複製",
      description: "會議內容已複製到新增表單，請設定日期時間後儲存",
    })
  }

  // 查看會議詳情
  const handleViewMeeting = (meeting: MeetingRecord) => {
    setSelectedMeeting(meeting)
    setIsViewDialogOpen(true)
  }

  // 載入會議紀錄
  const loadMeetings = async () => {
    try {
      setIsSyncing(true)
      const { data, error } = await supabase.from("meeting_records").select("*").order("date", { ascending: false })

      if (error) throw error

      setMeetings(data || [])
      setLastSyncTime(new Date())

      toast({
        title: "✅ 同步成功",
        description: `已載入 ${data?.length || 0} 筆會議紀錄`,
      })
    } catch (error) {
      console.error("載入會議紀錄失敗:", error)
      toast({
        title: "❌ 載入失敗",
        description: "無法從雲端載入會議紀錄",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // 載入郵件設定
  const loadEmailSettings = async () => {
    try {
      const { data, error } = await supabase.from("email_settings").select("*").limit(1).single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setEmailSettings(data)
      }
    } catch (error) {
      console.error("載入郵件設定失敗:", error)
    }
  }

  // 手動同步
  const handleManualSync = async () => {
    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "請檢查網路連線後再試",
        variant: "destructive",
      })
      return
    }

    await loadMeetings()
  }

  // 過濾會議紀錄
  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      searchTerm === "" ||
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.attendees.some((attendee) => attendee.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || meeting.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // 新增會議
  const handleAddMeeting = async () => {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time) {
      toast({
        title: "請填寫必要欄位",
        description: "標題、日期和時間為必填欄位",
        variant: "destructive",
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能新增會議紀錄",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase.from("meeting_records").insert([newMeeting]).select().single()

      if (error) throw error

      setMeetings((prev) => [data, ...prev])
      setNewMeeting(defaultMeetingRecord)
      setIsAddDialogOpen(false)

      toast({
        title: "✅ 新增成功",
        description: "會議紀錄已成功新增到雲端",
      })

      // 發送通知郵件
      if (newMeeting.email_notifications.enabled && newMeeting.email_notifications.notifyOnCreate) {
        await sendNotificationEmail(data, "meeting_created")
      }
    } catch (error) {
      console.error("新增會議失敗:", error)
      toast({
        title: "❌ 新增失敗",
        description: "無法新增會議紀錄到雲端",
        variant: "destructive",
      })
    }
  }

  // 編輯會議
  const handleEditMeeting = (meeting: MeetingRecord) => {
    setEditingMeeting(meeting)
    setNewMeeting({
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location || "",
      attendees: meeting.attendees,
      agenda: meeting.agenda,
      content: meeting.content,
      decisions: meeting.decisions,
      action_items: meeting.action_items,
      next_meeting: meeting.next_meeting || "",
      status: meeting.status,
      email_notifications: meeting.email_notifications,
    })
  }

  // 更新會議
  const handleUpdateMeeting = async () => {
    if (!editingMeeting || !newMeeting.title || !newMeeting.date || !newMeeting.time) {
      toast({
        title: "請填寫必要欄位",
        description: "標題、日期和時間為必填欄位",
        variant: "destructive",
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能更新會議紀錄",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("meeting_records")
        .update(newMeeting)
        .eq("id", editingMeeting.id)
        .select()
        .single()

      if (error) throw error

      setMeetings((prev) => prev.map((m) => (m.id === editingMeeting.id ? data : m)))
      setEditingMeeting(null)
      setNewMeeting(defaultMeetingRecord)

      toast({
        title: "✅ 更新成功",
        description: "會議紀錄已成功更新到雲端",
      })

      // 發送通知郵件
      if (newMeeting.email_notifications.enabled && newMeeting.email_notifications.notifyOnUpdate) {
        await sendNotificationEmail(data, "meeting_updated")
      }
    } catch (error) {
      console.error("更新會議失敗:", error)
      toast({
        title: "❌ 更新失敗",
        description: "無法更新會議紀錄到雲端",
        variant: "destructive",
      })
    }
  }

  // 刪除會議
  const handleDeleteMeeting = async (id: string) => {
    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能刪除會議紀錄",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("meeting_records").delete().eq("id", id)

      if (error) throw error

      setMeetings((prev) => prev.filter((m) => m.id !== id))

      toast({
        title: "✅ 刪除成功",
        description: "會議紀錄已從雲端刪除",
      })
    } catch (error) {
      console.error("刪除會議失敗:", error)
      toast({
        title: "❌ 刪除失敗",
        description: "無法從雲端刪除會議紀錄",
        variant: "destructive",
      })
    }
  }

  // 儲存郵件設定
  const handleSaveEmailSettings = async () => {
    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能儲存設定",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase.from("email_settings").upsert(emailSettings).select().single()

      if (error) throw error

      setEmailSettings(data)
      setIsSettingsDialogOpen(false)

      toast({
        title: "✅ 設定已儲存",
        description: "郵件設定已成功儲存到雲端",
      })
    } catch (error) {
      console.error("儲存郵件設定失敗:", error)
      toast({
        title: "❌ 儲存失敗",
        description: "無法儲存郵件設定到雲端",
        variant: "destructive",
      })
    }
  }

  // 發送通知郵件
  const sendNotificationEmail = async (meeting: MeetingRecord, type: string) => {
    // 這裡應該實作實際的郵件發送邏輯
    // 目前只是模擬
    console.log(`發送 ${type} 通知給:`, meeting.email_notifications.recipients)

    toast({
      title: "📧 通知已發送",
      description: `已發送會議通知給 ${meeting.email_notifications.recipients.length} 位收件人`,
    })
  }

  // 新增參與者
  const addAttendee = () => {
    if (attendeeInput.trim() && !newMeeting.attendees.includes(attendeeInput.trim())) {
      setNewMeeting((prev) => ({
        ...prev,
        attendees: [...prev.attendees, attendeeInput.trim()],
      }))
      setAttendeeInput("")
    }
  }

  // 移除參與者
  const removeAttendee = (attendee: string) => {
    setNewMeeting((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((a) => a !== attendee),
    }))
  }

  // 新增收件人
  const addRecipient = () => {
    if (recipientInput.trim() && !newMeeting.email_notifications.recipients.includes(recipientInput.trim())) {
      setNewMeeting((prev) => ({
        ...prev,
        email_notifications: {
          ...prev.email_notifications,
          recipients: [...prev.email_notifications.recipients, recipientInput.trim()],
        },
      }))
      setRecipientInput("")
    }
  }

  // 移除收件人
  const removeRecipient = (recipient: string) => {
    setNewMeeting((prev) => ({
      ...prev,
      email_notifications: {
        ...prev.email_notifications,
        recipients: prev.email_notifications.recipients.filter((r) => r !== recipient),
      },
    }))
  }

  // 匯出資料
  const handleExport = async () => {
    try {
      const exportData = {
        meetings,
        emailSettings,
        exportDate: new Date().toISOString(),
        version: "1.0",
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `meeting-records-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "✅ 匯出成功",
        description: "會議紀錄已匯出到檔案",
      })
    } catch (error) {
      toast({
        title: "❌ 匯出失敗",
        description: "無法匯出會議紀錄",
        variant: "destructive",
      })
    }
  }

  // 匯入資料
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)

        if (!isOnline) {
          toast({
            title: "🔌 網路未連線",
            description: "需要網路連線才能匯入資料到雲端",
            variant: "destructive",
          })
          return
        }

        // 匯入會議紀錄
        if (importData.meetings && Array.isArray(importData.meetings)) {
          const { error } = await supabase.from("meeting_records").upsert(
            importData.meetings.map((m: any) => ({
              ...m,
              id: undefined, // 讓資料庫生成新的 ID
            })),
          )

          if (error) throw error
        }

        // 重新載入資料
        await loadMeetings()

        toast({
          title: "✅ 匯入成功",
          description: `已匯入 ${importData.meetings?.length || 0} 筆會議紀錄到雲端`,
        })
      } catch (error) {
        console.error("匯入失敗:", error)
        toast({
          title: "❌ 匯入失敗",
          description: "檔案格式錯誤或匯入過程發生問題",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首頁
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">會議紀錄管理</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>智能會議管理系統</span>
                    <div className="flex items-center space-x-1">
                      {isOnline ? (
                        <>
                          <Wifi className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">已連線</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">離線模式</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* 同步狀態 */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? (
                  <Cloud className="w-4 h-4 text-blue-500" />
                ) : (
                  <CloudOff className="w-4 h-4 text-gray-400" />
                )}
                {lastSyncTime && <span>最後同步: {lastSyncTime.toLocaleTimeString()}</span>}
              </div>

              {/* 手動同步 */}
              <Button variant="outline" size="sm" onClick={handleManualSync} disabled={!isOnline || isSyncing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "同步中..." : "同步"}
              </Button>

              {/* 匯入匯出 */}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                匯出
              </Button>

              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                匯入
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

              {/* 郵件設定 */}
              <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    設定
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>郵件通知設定</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="smtp-host">SMTP 主機</Label>
                      <Input
                        id="smtp-host"
                        value={emailSettings.smtp_host}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-port">SMTP 埠號</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={emailSettings.smtp_port}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtp_port: Number.parseInt(e.target.value) })
                        }
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-user">SMTP 使用者</Label>
                      <Input
                        id="smtp-user"
                        value={emailSettings.smtp_user}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-password">SMTP 密碼</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        value={emailSettings.smtp_password}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                        placeholder="應用程式密碼"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sender-email">寄件人信箱</Label>
                      <Input
                        id="sender-email"
                        value={emailSettings.sender_email}
                        onChange={(e) => setEmailSettings({ ...emailSettings, sender_email: e.target.value })}
                        placeholder="noreply@tsri.org.tw"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sender-name">寄件人名稱</Label>
                      <Input
                        id="sender-name"
                        value={emailSettings.sender_name}
                        onChange={(e) => setEmailSettings({ ...emailSettings, sender_name: e.target.value })}
                        placeholder="TSRI 會議系統"
                      />
                    </div>
                    <Button onClick={handleSaveEmailSettings} className="w-full" disabled={!isOnline}>
                      <Save className="w-4 h-4 mr-2" />
                      儲存設定
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* 新增會議 */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600" disabled={!isOnline}>
                    <Plus className="w-4 h-4 mr-2" />
                    新增會議
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>新增會議紀錄</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 基本資訊 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">基本資訊</h3>
                      <div>
                        <Label htmlFor="title">會議標題 *</Label>
                        <Input
                          id="title"
                          value={newMeeting.title}
                          onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                          placeholder="例如：週會 - 系統維護討論"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date">日期 *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newMeeting.date}
                            onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="time">時間 *</Label>
                          <Input
                            id="time"
                            type="time"
                            value={newMeeting.time}
                            onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="location">地點</Label>
                        <Input
                          id="location"
                          value={newMeeting.location}
                          onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                          placeholder="例如：會議室A"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">狀態</Label>
                        <Select
                          value={newMeeting.status}
                          onValueChange={(value: any) => setNewMeeting({ ...newMeeting, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">已排程</SelectItem>
                            <SelectItem value="completed">已完成</SelectItem>
                            <SelectItem value="cancelled">已取消</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 參與者 */}
                      <div>
                        <Label>參與者</Label>
                        <div className="flex space-x-2 mt-2">
                          <Input
                            value={attendeeInput}
                            onChange={(e) => setAttendeeInput(e.target.value)}
                            placeholder="輸入參與者姓名"
                            onKeyPress={(e) => e.key === "Enter" && addAttendee()}
                          />
                          <Button type="button" onClick={addAttendee}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newMeeting.attendees.map((attendee, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => removeAttendee(attendee)}
                            >
                              {attendee} <X className="w-3 h-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 會議內容 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">會議內容</h3>
                      <div>
                        <Label htmlFor="agenda">議程</Label>
                        <Textarea
                          id="agenda"
                          value={newMeeting.agenda}
                          onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                          placeholder="會議議程..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="content">會議內容</Label>
                        <Textarea
                          id="content"
                          value={newMeeting.content}
                          onChange={(e) => setNewMeeting({ ...newMeeting, content: e.target.value })}
                          placeholder="會議討論內容..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="decisions">決議事項</Label>
                        <Textarea
                          id="decisions"
                          value={newMeeting.decisions}
                          onChange={(e) => setNewMeeting({ ...newMeeting, decisions: e.target.value })}
                          placeholder="會議決議..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="action-items">行動項目</Label>
                        <Textarea
                          id="action-items"
                          value={newMeeting.action_items}
                          onChange={(e) => setNewMeeting({ ...newMeeting, action_items: e.target.value })}
                          placeholder="待辦事項..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="next-meeting">下次會議</Label>
                        <Input
                          id="next-meeting"
                          value={newMeeting.next_meeting}
                          onChange={(e) => setNewMeeting({ ...newMeeting, next_meeting: e.target.value })}
                          placeholder="下次會議安排..."
                        />
                      </div>
                    </div>

                    {/* 郵件通知設定 */}
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="text-lg font-semibold">郵件通知設定</h3>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newMeeting.email_notifications.enabled}
                          onCheckedChange={(checked) =>
                            setNewMeeting({
                              ...newMeeting,
                              email_notifications: { ...newMeeting.email_notifications, enabled: checked },
                            })
                          }
                        />
                        <Label>啟用郵件通知</Label>
                      </div>

                      {newMeeting.email_notifications.enabled && (
                        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <Label>通知收件人</Label>
                            <div className="flex space-x-2 mt-2">
                              <Input
                                value={recipientInput}
                                onChange={(e) => setRecipientInput(e.target.value)}
                                placeholder="輸入收件人信箱"
                                onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                              />
                              <Button type="button" onClick={addRecipient}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {newMeeting.email_notifications.recipients.map((recipient, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="cursor-pointer"
                                  onClick={() => removeRecipient(recipient)}
                                >
                                  {recipient} <X className="w-3 h-3 ml-1" />
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={newMeeting.email_notifications.notifyOnCreate}
                                onCheckedChange={(checked) =>
                                  setNewMeeting({
                                    ...newMeeting,
                                    email_notifications: { ...newMeeting.email_notifications, notifyOnCreate: checked },
                                  })
                                }
                              />
                              <Label>建立時通知</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={newMeeting.email_notifications.notifyOnUpdate}
                                onCheckedChange={(checked) =>
                                  setNewMeeting({
                                    ...newMeeting,
                                    email_notifications: { ...newMeeting.email_notifications, notifyOnUpdate: checked },
                                  })
                                }
                              />
                              <Label>更新時通知</Label>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="reminder-before">提前提醒 (分鐘)</Label>
                            <Input
                              id="reminder-before"
                              type="number"
                              value={newMeeting.email_notifications.reminderBefore}
                              onChange={(e) =>
                                setNewMeeting({
                                  ...newMeeting,
                                  email_notifications: {
                                    ...newMeeting.email_notifications,
                                    reminderBefore: Number.parseInt(e.target.value),
                                  },
                                })
                              }
                              min="0"
                              max="1440"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      <X className="w-4 h-4 mr-2" />
                      取消
                    </Button>
                    <Button onClick={handleAddMeeting} disabled={!isOnline}>
                      <Save className="w-4 h-4 mr-2" />
                      新增會議
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* 搜尋和篩選 */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              搜尋與篩選
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">搜尋會議</Label>
                <Input
                  id="search"
                  placeholder="搜尋標題、地點或參與者..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status-filter">狀態篩選</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部狀態</SelectItem>
                    <SelectItem value="scheduled">已排程</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{meetings.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">總會議數</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {meetings.filter((m) => m.status === "completed").length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">已完成</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {meetings.filter((m) => m.status === "scheduled").length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">已排程</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{filteredMeetings.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">篩選結果</div>
            </CardContent>
          </Card>
        </div>

        {/* 會議列表 */}
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(meeting.status)}>
                      {getStatusIcon(meeting.status)}
                      <span className="ml-1">
                        {meeting.status === "scheduled" && "已排程"}
                        {meeting.status === "completed" && "已完成"}
                        {meeting.status === "cancelled" && "已取消"}
                      </span>
                    </Badge>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{meeting.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    {meeting.email_notifications.enabled && (
                      <Badge variant="outline" className="text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        通知已啟用
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewMeeting(meeting)}
                      className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyMeetingAsNew(meeting)}
                      className="hover:bg-green-100 dark:hover:bg-green-900/30"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyMeetingContent(meeting)}
                      className="hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEditMeeting(meeting)} disabled={!isOnline}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={!isOnline}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{meeting.date}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span>{meeting.time}</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{meeting.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{meeting.attendees.length} 人參與</span>
                  </div>
                </div>

                {meeting.attendees.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">參與者:</div>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendees.map((attendee, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {attendee}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {meeting.agenda && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">議程:</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{meeting.agenda}</p>
                  </div>
                )}

                {meeting.content && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">會議內容:</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{meeting.content}</p>
                  </div>
                )}

                {meeting.decisions && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">決議事項:</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{meeting.decisions}</p>
                  </div>
                )}

                {meeting.action_items && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">行動項目:</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{meeting.action_items}</p>
                  </div>
                )}

                {meeting.email_notifications.enabled && meeting.email_notifications.recipients.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                      <Mail className="w-4 h-4" />
                      <span>通知收件人: {meeting.email_notifications.recipients.join(", ")}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span>建立於: {new Date(meeting.created_at).toLocaleString()}</span>
                  <span>更新於: {new Date(meeting.updated_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredMeetings.length === 0 && (
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter !== "all" ? "找不到符合條件的會議紀錄" : "暫無會議紀錄"}
                </p>
                {!searchTerm && statusFilter === "all" && isOnline && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新增第一個會議
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* 編輯對話框 */}
      {editingMeeting && (
        <Dialog open={!!editingMeeting} onOpenChange={() => setEditingMeeting(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>編輯會議紀錄</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本資訊 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">基本資訊</h3>
                <div>
                  <Label htmlFor="edit-title">會議標題 *</Label>
                  <Input
                    id="edit-title"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    placeholder="例如：週會 - 系統維護討論"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-date">日期 *</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-time">時間 *</Label>
                    <Input
                      id="edit-time"
                      type="time"
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-location">地點</Label>
                  <Input
                    id="edit-location"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                    placeholder="例如：會議室A"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">狀態</Label>
                  <Select
                    value={newMeeting.status}
                    onValueChange={(value: any) => setNewMeeting({ ...newMeeting, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">已排程</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 參與者 */}
                <div>
                  <Label>參與者</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      value={attendeeInput}
                      onChange={(e) => setAttendeeInput(e.target.value)}
                      placeholder="輸入參與者姓名"
                      onKeyPress={(e) => e.key === "Enter" && addAttendee()}
                    />
                    <Button type="button" onClick={addAttendee}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newMeeting.attendees.map((attendee, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeAttendee(attendee)}
                      >
                        {attendee} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 會議內容 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">會議內容</h3>
                <div>
                  <Label htmlFor="edit-agenda">議程</Label>
                  <Textarea
                    id="edit-agenda"
                    value={newMeeting.agenda}
                    onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                    placeholder="會議議程..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-content">會議內容</Label>
                  <Textarea
                    id="edit-content"
                    value={newMeeting.content}
                    onChange={(e) => setNewMeeting({ ...newMeeting, content: e.target.value })}
                    placeholder="會議討論內容..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-decisions">決議事項</Label>
                  <Textarea
                    id="edit-decisions"
                    value={newMeeting.decisions}
                    onChange={(e) => setNewMeeting({ ...newMeeting, decisions: e.target.value })}
                    placeholder="會議決議..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-action-items">行動項目</Label>
                  <Textarea
                    id="edit-action-items"
                    value={newMeeting.action_items}
                    onChange={(e) => setNewMeeting({ ...newMeeting, action_items: e.target.value })}
                    placeholder="待辦事項..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-next-meeting">下次會議</Label>
                  <Input
                    id="edit-next-meeting"
                    value={newMeeting.next_meeting}
                    onChange={(e) => setNewMeeting({ ...newMeeting, next_meeting: e.target.value })}
                    placeholder="下次會議安排..."
                  />
                </div>
              </div>

              {/* 郵件通知設定 */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">郵件通知設定</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newMeeting.email_notifications.enabled}
                    onCheckedChange={(checked) =>
                      setNewMeeting({
                        ...newMeeting,
                        email_notifications: { ...newMeeting.email_notifications, enabled: checked },
                      })
                    }
                  />
                  <Label>啟用郵件通知</Label>
                </div>

                {newMeeting.email_notifications.enabled && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <Label>通知收件人</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={recipientInput}
                          onChange={(e) => setRecipientInput(e.target.value)}
                          placeholder="輸入收件人信箱"
                          onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                        />
                        <Button type="button" onClick={addRecipient}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newMeeting.email_notifications.recipients.map((recipient, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeRecipient(recipient)}
                          >
                            {recipient} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newMeeting.email_notifications.notifyOnCreate}
                          onCheckedChange={(checked) =>
                            setNewMeeting({
                              ...newMeeting,
                              email_notifications: { ...newMeeting.email_notifications, notifyOnCreate: checked },
                            })
                          }
                        />
                        <Label>建立時通知</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newMeeting.email_notifications.notifyOnUpdate}
                          onCheckedChange={(checked) =>
                            setNewMeeting({
                              ...newMeeting,
                              email_notifications: { ...newMeeting.email_notifications, notifyOnUpdate: checked },
                            })
                          }
                        />
                        <Label>更新時通知</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-reminder-before">提前提醒 (分鐘)</Label>
                      <Input
                        id="edit-reminder-before"
                        type="number"
                        value={newMeeting.email_notifications.reminderBefore}
                        onChange={(e) =>
                          setNewMeeting({
                            ...newMeeting,
                            email_notifications: {
                              ...newMeeting.email_notifications,
                              reminderBefore: Number.parseInt(e.target.value),
                            },
                          })
                        }
                        min="0"
                        max="1440"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setEditingMeeting(null)}>
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button onClick={handleUpdateMeeting} disabled={!isOnline}>
                <Save className="w-4 h-4 mr-2" />
                更新會議
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* 查看會議詳情對話框 */}
      {selectedMeeting && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                會議詳情
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 會議基本資訊 */}
              <Card className="bg-gray-50 dark:bg-gray-800/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{selectedMeeting.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(selectedMeeting.status)}>
                        {getStatusIcon(selectedMeeting.status)}
                        <span className="ml-1">
                          {selectedMeeting.status === "scheduled" && "已排程"}
                          {selectedMeeting.status === "completed" && "已完成"}
                          {selectedMeeting.status === "cancelled" && "已取消"}
                        </span>
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyMeetingAsNew(selectedMeeting)}
                        className="hover:bg-green-50 dark:hover:bg-green-900/30"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        複製為新會議
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">日期：</span>
                      <span>{selectedMeeting.date}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="font-medium">時間：</span>
                      <span>{selectedMeeting.time}</span>
                    </div>
                    {selectedMeeting.location && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="font-medium">地點：</span>
                        <span>{selectedMeeting.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">參與者：</span>
                      <span>{selectedMeeting.attendees.length} 人</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 參與者列表 */}
              {selectedMeeting.attendees.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      參與者
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeeting.attendees.map((attendee, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1">
                          {attendee}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 會議內容區域 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 議程 */}
                {selectedMeeting.agenda && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        議程
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedMeeting.agenda}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 會議內容 */}
                {selectedMeeting.content && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        會議內容
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedMeeting.content}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 決議事項 */}
                {selectedMeeting.decisions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        決議事項
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedMeeting.decisions}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 行動項目 */}
                {selectedMeeting.action_items && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        行動項目
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedMeeting.action_items}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* 下次會議 */}
              {selectedMeeting.next_meeting && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      下次會議
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-700 dark:text-gray-300">
                      {selectedMeeting.next_meeting}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 郵件通知資訊 */}
              {selectedMeeting.email_notifications.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      郵件通知設定
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          通知已啟用
                        </Badge>
                        {selectedMeeting.email_notifications.notifyOnCreate && (
                          <Badge variant="outline">建立時通知</Badge>
                        )}
                        {selectedMeeting.email_notifications.notifyOnUpdate && (
                          <Badge variant="outline">更新時通知</Badge>
                        )}
                      </div>
                      {selectedMeeting.email_notifications.recipients.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">收件人：</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedMeeting.email_notifications.recipients.map((recipient, index) => (
                              <Badge key={index} variant="secondary">
                                {recipient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        提前提醒：{selectedMeeting.email_notifications.reminderBefore} 分鐘
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 時間資訊 */}
              <Card className="bg-gray-50 dark:bg-gray-800/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>建立時間: {new Date(selectedMeeting.created_at).toLocaleString()}</span>
                    <span>更新時間: {new Date(selectedMeeting.updated_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => copyMeetingContent(selectedMeeting)}
                className="hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
              >
                <FileText className="w-4 h-4 mr-2" />
                複製內容
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  copyMeetingAsNew(selectedMeeting)
                  setIsViewDialogOpen(false)
                }}
                className="hover:bg-green-50 dark:hover:bg-green-900/30"
              >
                <Copy className="w-4 h-4 mr-2" />
                複製為新會議
              </Button>
              <Button
                onClick={() => {
                  handleEditMeeting(selectedMeeting)
                  setIsViewDialogOpen(false)
                }}
                disabled={!isOnline}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                編輯會議
              </Button>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                關閉
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
