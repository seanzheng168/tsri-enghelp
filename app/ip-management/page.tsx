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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FolderOpen,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Upload,
  Download,
  RefreshCw,
  FileText,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  AlertTriangle,
  Database,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface IPRecord {
  id: string
  ip_address: string
  description: string
  category: string
  system: string
  status: string
  created_at: string
  updated_at: string
}

const categories = ["伺服器", "工作站", "網路設備", "印表機", "其他"]
const systems = ["Windows", "Linux", "macOS", "網路設備", "嵌入式系統", "其他"]
const statuses = ["使用中", "閒置", "維護中", "已停用"]

export default function IPManagementPage() {
  const [records, setRecords] = useState<IPRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [systemFilter, setSystemFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IPRecord | null>(null)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [newRecord, setNewRecord] = useState({
    ip_address: "",
    description: "",
    category: "伺服器",
    system: "Linux",
    status: "使用中",
  })
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [isCheckingTable, setIsCheckingTable] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // 檢查網路狀態
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", checkOnlineStatus)
    window.addEventListener("offline", checkOnlineStatus)

    return () => {
      window.removeEventListener("online", checkOnlineStatus)
      window.removeEventListener("offline", checkOnlineStatus)
    }
  }, [])

  // 檢查表是否存在
  const checkTableExists = async () => {
    try {
      setIsCheckingTable(true)
      const { data, error } = await supabase.from("ip_records").select("id").limit(1)

      if (error) {
        if (error.message.includes("does not exist")) {
          setTableExists(false)
          return false
        }
        throw error
      }

      setTableExists(true)
      return true
    } catch (error) {
      console.error("檢查表存在失敗:", error)
      setTableExists(false)
      return false
    } finally {
      setIsCheckingTable(false)
    }
  }

  // 載入資料
  useEffect(() => {
    if (isOnline) {
      checkTableExists().then((exists) => {
        if (exists) {
          loadRecords()
        }
      })
    }
  }, [isOnline])

  // 載入 IP 記錄
  const loadRecords = async () => {
    try {
      setIsSyncing(true)
      const { data, error } = await supabase.from("ip_records").select("*").order("updated_at", { ascending: false })

      if (error) {
        if (error.message.includes("does not exist")) {
          setTableExists(false)
          toast({
            title: "⚠️ 資料表不存在",
            description: "請先執行資料庫初始化腳本",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setRecords(data || [])
      setLastSyncTime(new Date())
      setTableExists(true)

      toast({
        title: "✅ 同步成功",
        description: `已載入 ${data?.length || 0} 筆 IP 記錄`,
      })
    } catch (error) {
      console.error("載入 IP 記錄失敗:", error)
      toast({
        title: "❌ 載入失敗",
        description: "無法從雲端載入 IP 記錄",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
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

    const exists = await checkTableExists()
    if (exists) {
      await loadRecords()
    }
  }

  // 檢查資料庫表
  const handleCheckDatabase = async () => {
    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "請檢查網路連線後再試",
        variant: "destructive",
      })
      return
    }

    const exists = await checkTableExists()
    if (exists) {
      await loadRecords()
      toast({
        title: "✅ 資料表檢查完成",
        description: "資料表存在且可正常使用",
      })
    } else {
      toast({
        title: "⚠️ 資料表不存在",
        description: "請前往 Supabase SQL Editor 執行建表腳本",
        variant: "destructive",
      })
    }
  }

  // 過濾和搜尋記錄
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || record.category === categoryFilter
    const matchesSystem = systemFilter === "all" || record.system === systemFilter
    const matchesStatus = statusFilter === "all" || record.status === statusFilter

    return matchesSearch && matchesCategory && matchesSystem && matchesStatus
  })

  // 驗證IP格式
  const validateIP = (ip: string) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(ip)
  }

  // 重置新增表單
  const resetNewRecord = () => {
    setNewRecord({
      ip_address: "",
      description: "",
      category: "伺服器",
      system: "Linux",
      status: "使用中",
    })
  }

  // 新增記錄
  const handleAddRecord = async () => {
    if (!newRecord.ip_address || !validateIP(newRecord.ip_address)) {
      toast({
        title: "IP格式錯誤",
        description: "請輸入有效的IP位址 (例如: 192.168.1.100)",
        variant: "destructive",
      })
      return
    }

    if (!newRecord.description.trim()) {
      toast({
        title: "請填寫備註",
        description: "備註欄位不能為空",
        variant: "destructive",
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能新增 IP 記錄",
        variant: "destructive",
      })
      return
    }

    if (tableExists === false) {
      toast({
        title: "⚠️ 資料表不存在",
        description: "請先執行資料庫初始化腳本",
        variant: "destructive",
      })
      return
    }

    try {
      // 檢查IP是否已存在
      const { data: existingRecord } = await supabase
        .from("ip_records")
        .select("id")
        .eq("ip_address", newRecord.ip_address)
        .single()

      if (existingRecord) {
        toast({
          title: "IP已存在",
          description: "此IP位址已被使用，請檢查後重新輸入",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase.from("ip_records").insert([newRecord]).select().single()

      if (error) throw error

      setRecords((prev) => [data, ...prev])
      resetNewRecord()
      setIsAddDialogOpen(false)

      toast({
        title: "✅ 新增成功",
        description: `IP記錄 ${data.ip_address} 已成功新增到雲端`,
      })
    } catch (error) {
      console.error("新增 IP 記錄失敗:", error)
      toast({
        title: "❌ 新增失敗",
        description: "無法新增 IP 記錄到雲端，請稍後再試",
        variant: "destructive",
      })
    }
  }

  // 編輯記錄
  const handleEditRecord = (record: IPRecord) => {
    setEditingRecord(record)
    setNewRecord({
      ip_address: record.ip_address,
      description: record.description,
      category: record.category,
      system: record.system,
      status: record.status,
    })
  }

  // 更新記錄
  const handleUpdateRecord = async () => {
    if (!editingRecord || !newRecord.ip_address || !validateIP(newRecord.ip_address)) {
      toast({
        title: "IP格式錯誤",
        description: "請輸入有效的IP位址",
        variant: "destructive",
      })
      return
    }

    if (!newRecord.description.trim()) {
      toast({
        title: "請填寫備註",
        description: "備註欄位不能為空",
        variant: "destructive",
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能更新 IP 記錄",
        variant: "destructive",
      })
      return
    }

    try {
      // 檢查IP是否已存在（排除自己）
      const { data: existingRecord } = await supabase
        .from("ip_records")
        .select("id")
        .eq("ip_address", newRecord.ip_address)
        .neq("id", editingRecord.id)
        .single()

      if (existingRecord) {
        toast({
          title: "IP已存在",
          description: "此IP位址已被其他記錄使用",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from("ip_records")
        .update(newRecord)
        .eq("id", editingRecord.id)
        .select()
        .single()

      if (error) throw error

      setRecords((prev) => prev.map((r) => (r.id === editingRecord.id ? data : r)))
      setEditingRecord(null)
      resetNewRecord()

      toast({
        title: "✅ 更新成功",
        description: "IP記錄已成功更新到雲端",
      })
    } catch (error) {
      console.error("更新 IP 記錄失敗:", error)
      toast({
        title: "❌ 更新失敗",
        description: "無法更新 IP 記錄到雲端",
        variant: "destructive",
      })
    }
  }

  // 刪除記錄
  const handleDeleteRecord = async (id: string) => {
    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能刪除 IP 記錄",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("ip_records").delete().eq("id", id)

      if (error) throw error

      setRecords((prev) => prev.filter((r) => r.id !== id))

      toast({
        title: "✅ 刪除成功",
        description: "IP記錄已從雲端刪除",
      })
    } catch (error) {
      console.error("刪除 IP 記錄失敗:", error)
      toast({
        title: "❌ 刪除失敗",
        description: "無法從雲端刪除 IP 記錄",
        variant: "destructive",
      })
    }
  }

  // 批量刪除
  const handleBatchDelete = async () => {
    if (selectedRecords.length === 0) return

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能批量刪除",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("ip_records").delete().in("id", selectedRecords)

      if (error) throw error

      setRecords((prev) => prev.filter((r) => !selectedRecords.includes(r.id)))
      setSelectedRecords([])

      toast({
        title: "✅ 批量刪除成功",
        description: `已刪除 ${selectedRecords.length} 筆記錄`,
      })
    } catch (error) {
      console.error("批量刪除失敗:", error)
      toast({
        title: "❌ 批量刪除失敗",
        description: "無法批量刪除記錄",
        variant: "destructive",
      })
    }
  }

  // 處理CSV匯入
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能匯入資料",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const csv = e.target?.result as string
      const lines = csv.split("\n")
      const headers = lines[0].split(",").map((h) => h.trim())

      // 檢查必要欄位
      const requiredHeaders = ["IP位址", "備註", "類別", "系統", "狀態"]
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

      if (missingHeaders.length > 0) {
        toast({
          title: "CSV格式錯誤",
          description: `缺少必要欄位: ${missingHeaders.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      const newRecords: any[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = line.split(",").map((v) => v.trim())
        const ip_address = values[headers.indexOf("IP位址")]
        const description = values[headers.indexOf("備註")] || ""
        const category = values[headers.indexOf("類別")] || "其他"
        const system = values[headers.indexOf("系統")] || "其他"
        const status = values[headers.indexOf("狀態")] || "使用中"

        // 驗證IP格式
        if (!validateIP(ip_address)) {
          errors.push(`第 ${i + 1} 行: IP格式錯誤 (${ip_address})`)
          continue
        }

        newRecords.push({
          ip_address,
          description,
          category: categories.includes(category) ? category : "其他",
          system: systems.includes(system) ? system : "其他",
          status: statuses.includes(status) ? status : "使用中",
        })
      }

      if (newRecords.length > 0) {
        try {
          const { data, error } = await supabase.from("ip_records").insert(newRecords).select()

          if (error) throw error

          setRecords((prev) => [...data, ...prev])

          toast({
            title: "✅ 匯入成功",
            description: `成功匯入 ${data.length} 筆記錄${errors.length > 0 ? `，${errors.length} 筆錯誤` : ""}`,
          })
        } catch (error) {
          console.error("匯入失敗:", error)
          toast({
            title: "❌ 匯入失敗",
            description: "無法匯入資料到雲端",
            variant: "destructive",
          })
        }
      }

      if (errors.length > 0) {
        console.error("Import errors:", errors)
      }

      setIsImportDialogOpen(false)
    }

    reader.readAsText(file)
  }

  // 匯出CSV
  const handleCSVExport = () => {
    try {
      const headers = ["IP位址", "備註", "類別", "系統", "狀態", "建立時間", "更新時間"]
      const csvContent = [
        headers.join(","),
        ...filteredRecords.map((record) =>
          [
            record.ip_address,
            `"${record.description}"`,
            record.category,
            record.system,
            record.status,
            new Date(record.created_at).toLocaleDateString(),
            new Date(record.updated_at).toLocaleDateString(),
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `ip_management_${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)

      toast({
        title: "✅ 匯出成功",
        description: `已匯出 ${filteredRecords.length} 筆記錄`,
      })
    } catch (error) {
      toast({
        title: "❌ 匯出失敗",
        description: "無法匯出記錄",
        variant: "destructive",
      })
    }
  }

  // 清除所有篩選
  const clearFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
    setSystemFilter("all")
    setStatusFilter("all")
  }

  // 選擇記錄
  const toggleSelectRecord = (id: string) => {
    setSelectedRecords((prev) => (prev.includes(id) ? prev.filter((recordId) => recordId !== id) : [...prev, id]))
  }

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(filteredRecords.map((record) => record.id))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "使用中":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "閒置":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "維護中":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "已停用":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
                <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">IP 管理系統</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>網路IP位址管理平台</span>
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

              {/* 檢查資料庫 */}
              <Button variant="outline" size="sm" onClick={handleCheckDatabase} disabled={!isOnline || isCheckingTable}>
                <Database className={`w-4 h-4 mr-2 ${isCheckingTable ? "animate-spin" : ""}`} />
                {isCheckingTable ? "檢查中..." : "檢查資料庫"}
              </Button>

              {/* 手動同步 */}
              <Button variant="outline" size="sm" onClick={handleManualSync} disabled={!isOnline || isSyncing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "同步中..." : "同步"}
              </Button>

              {/* CSV匯入 */}
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!isOnline || tableExists === false}>
                    <Upload className="w-4 h-4 mr-2" />
                    匯入CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>匯入CSV檔案</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>CSV格式要求</Label>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                        <p>必要欄位：IP位址, 備註, 類別, 系統, 狀態</p>
                        <p>類別選項：{categories.join(", ")}</p>
                        <p>系統選項：{systems.join(", ")}</p>
                        <p>狀態選項：{statuses.join(", ")}</p>
                      </div>
                    </div>
                    <div>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCSVImport}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>範例格式：</p>
                      <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                        IP位址,備註,類別,系統,狀態
                        <br />
                        192.168.1.100,主要伺服器,伺服器,Linux,使用中
                      </code>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* CSV匯出 */}
              <Button variant="outline" onClick={handleCSVExport}>
                <Download className="w-4 h-4 mr-2" />
                匯出CSV
              </Button>

              {/* 新增記錄 */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-rose-500 to-pink-600"
                    disabled={!isOnline || tableExists === false}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新增IP
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>新增IP記錄</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ip">IP位址 *</Label>
                      <Input
                        id="ip"
                        value={newRecord.ip_address}
                        onChange={(e) => setNewRecord({ ...newRecord, ip_address: e.target.value })}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">備註 *</Label>
                      <Textarea
                        id="description"
                        value={newRecord.description}
                        onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                        placeholder="設備描述或用途說明"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">類別</Label>
                      <Select
                        value={newRecord.category}
                        onValueChange={(value) => setNewRecord({ ...newRecord, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="system">系統</Label>
                      <Select
                        value={newRecord.system}
                        onValueChange={(value) => setNewRecord({ ...newRecord, system: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {systems.map((system) => (
                            <SelectItem key={system} value={system}>
                              {system}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">狀態</Label>
                      <Select
                        value={newRecord.status}
                        onValueChange={(value) => setNewRecord({ ...newRecord, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddRecord} className="w-full" disabled={!isOnline}>
                      <Save className="w-4 h-4 mr-2" />
                      新增記錄
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
        {/* 資料庫狀態警告 */}
        {tableExists === false && (
          <Card className="mb-6 shadow-lg border-0 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">資料表不存在</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    請前往 Supabase SQL Editor 執行以下腳本來建立 IP 記錄表：
                    <code className="block mt-2 p-2 bg-yellow-100 dark:bg-yellow-800 rounded text-xs">
                      scripts/003-create-ip-records-table.sql
                    </code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 搜尋和篩選 */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              搜尋與篩選
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">搜尋</Label>
                <Input
                  id="search"
                  placeholder="搜尋IP或備註..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category-filter">類別</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部類別</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="system-filter">系統</Label>
                <Select value={systemFilter} onValueChange={setSystemFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部系統</SelectItem>
                    {systems.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">狀態</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部狀態</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  清除篩選
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 統計資訊 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{records.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">總記錄數</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {records.filter((r) => r.status === "使用中").length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">使用中</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {records.filter((r) => r.status === "閒置").length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">閒置</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{filteredRecords.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">篩選結果</div>
            </CardContent>
          </Card>
        </div>

        {/* 批量操作 */}
        {selectedRecords.length > 0 && (
          <Card className="mb-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">已選擇 {selectedRecords.length} 筆記錄</span>
                <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  批量刪除
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* IP記錄表格 */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>IP記錄列表</span>
              <Badge variant="outline">{filteredRecords.length} 筆記錄</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>IP位址</TableHead>
                    <TableHead>備註</TableHead>
                    <TableHead>類別</TableHead>
                    <TableHead>系統</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>更新時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={() => toggleSelectRecord(record.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{record.ip_address}</TableCell>
                      <TableCell className="max-w-xs truncate" title={record.description}>
                        {record.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.system}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(record.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditRecord(record)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRecord(record.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || categoryFilter !== "all" || systemFilter !== "all" || statusFilter !== "all"
                      ? "找不到符合條件的記錄"
                      : tableExists === false
                        ? "請先建立資料表"
                        : "暫無IP記錄"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 編輯對話框 */}
      {editingRecord && (
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>編輯IP記錄</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-ip">IP位址 *</Label>
                <Input
                  id="edit-ip"
                  value={newRecord.ip_address}
                  onChange={(e) => setNewRecord({ ...newRecord, ip_address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">備註 *</Label>
                <Textarea
                  id="edit-description"
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">類別</Label>
                <Select
                  value={newRecord.category}
                  onValueChange={(value) => setNewRecord({ ...newRecord, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-system">系統</Label>
                <Select
                  value={newRecord.system}
                  onValueChange={(value) => setNewRecord({ ...newRecord, system: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">狀態</Label>
                <Select
                  value={newRecord.status}
                  onValueChange={(value) => setNewRecord({ ...newRecord, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateRecord} className="flex-1" disabled={!isOnline}>
                  <Save className="w-4 h-4 mr-2" />
                  更新
                </Button>
                <Button variant="outline" onClick={() => setEditingRecord(null)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
