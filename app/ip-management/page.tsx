"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  Globe,
  Server,
  Code,
  Wifi,
  Monitor,
} from "lucide-react"
import { supabase, type IPRecord } from "@/lib/supabase"

export default function IPManagementPage() {
  const [records, setRecords] = useState<IPRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<IPRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IPRecord | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const [checkingDatabase, setCheckingDatabase] = useState(false)

  const [newRecord, setNewRecord] = useState({
    ip_address: "",
    description: "",
    category: "server",
    system: "",
    status: "active",
  })

  const categories = [
    { value: "server", label: "伺服器", icon: Server, color: "bg-blue-500" },
    { value: "network", label: "網路設備", icon: Wifi, color: "bg-green-500" },
    { value: "database", label: "資料庫", icon: Database, color: "bg-purple-500" },
    { value: "development", label: "開發環境", icon: Code, color: "bg-orange-500" },
    { value: "monitoring", label: "監控系統", icon: Monitor, color: "bg-red-500" },
    { value: "other", label: "其他", icon: Globe, color: "bg-gray-500" },
  ]

  const statuses = [
    { value: "active", label: "運行中", color: "bg-green-100 text-green-800" },
    { value: "maintenance", label: "維護中", color: "bg-yellow-100 text-yellow-800" },
    { value: "inactive", label: "停用", color: "bg-red-100 text-red-800" },
    { value: "testing", label: "測試中", color: "bg-blue-100 text-blue-800" },
  ]

  // 檢查資料庫表是否存在
  const checkTableExists = async () => {
    setCheckingDatabase(true)
    try {
      const { data, error } = await supabase.from("ip_records").select("count", { count: "exact", head: true })

      if (error) {
        console.error("Table check error:", error)
        setTableExists(false)
        return false
      }

      setTableExists(true)
      return true
    } catch (error) {
      console.error("Database check failed:", error)
      setTableExists(false)
      return false
    } finally {
      setCheckingDatabase(false)
    }
  }

  // 載入記錄
  const loadRecords = async () => {
    try {
      setLoading(true)

      // 先檢查表是否存在
      const exists = await checkTableExists()
      if (!exists) {
        return
      }

      const { data, error } = await supabase.from("ip_records").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setRecords(data || [])
      setFilteredRecords(data || [])
    } catch (error) {
      console.error("載入 IP 記錄失敗:", error)
      toast({
        title: "❌ 載入失敗",
        description: "無法載入 IP 記錄，請檢查資料庫連接",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 驗證 IP 地址格式
  const validateIP = (ip: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  // 新增記錄
  const handleAddRecord = async () => {
    try {
      // 驗證必填欄位
      if (!newRecord.ip_address.trim()) {
        toast({
          title: "❌ 驗證失敗",
          description: "請輸入 IP 地址",
          variant: "destructive",
        })
        return
      }

      if (!newRecord.description.trim()) {
        toast({
          title: "❌ 驗證失敗",
          description: "請輸入備註說明",
          variant: "destructive",
        })
        return
      }

      // 驗證 IP 格式
      if (!validateIP(newRecord.ip_address)) {
        toast({
          title: "❌ 格式錯誤",
          description: "請輸入有效的 IP 地址格式",
          variant: "destructive",
        })
        return
      }

      // 檢查 IP 是否已存在
      const { data: existingRecord } = await supabase
        .from("ip_records")
        .select("id")
        .eq("ip_address", newRecord.ip_address)
        .single()

      if (existingRecord) {
        toast({
          title: "❌ 重複記錄",
          description: "此 IP 地址已存在",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("ip_records").insert([newRecord])

      if (error) {
        throw error
      }

      toast({
        title: "✅ 新增成功",
        description: `IP 記錄 ${newRecord.ip_address} 已新增`,
      })

      // 重置表單
      setNewRecord({
        ip_address: "",
        description: "",
        category: "server",
        system: "",
        status: "active",
      })
      setIsAddDialogOpen(false)
      loadRecords()
    } catch (error) {
      console.error("新增記錄失敗:", error)
      toast({
        title: "❌ 新增失敗",
        description: "無法新增 IP 記錄，請稍後再試",
        variant: "destructive",
      })
    }
  }

  // 編輯記錄
  const handleEditRecord = (record: IPRecord) => {
    setEditingRecord(record)
    setIsEditDialogOpen(true)
  }

  // 更新記錄
  const handleUpdateRecord = async () => {
    if (!editingRecord) return

    try {
      // 驗證必填欄位
      if (!editingRecord.description.trim()) {
        toast({
          title: "❌ 驗證失敗",
          description: "請輸入備註說明",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("ip_records")
        .update({
          description: editingRecord.description,
          category: editingRecord.category,
          system: editingRecord.system,
          status: editingRecord.status,
        })
        .eq("id", editingRecord.id)

      if (error) {
        throw error
      }

      toast({
        title: "✅ 更新成功",
        description: `IP 記錄已更新`,
      })

      setIsEditDialogOpen(false)
      setEditingRecord(null)
      loadRecords()
    } catch (error) {
      console.error("更新記錄失敗:", error)
      toast({
        title: "❌ 更新失敗",
        description: "無法更新 IP 記錄，請稍後再試",
        variant: "destructive",
      })
    }
  }

  // 刪除記錄
  const handleDeleteRecord = async (id: string, ipAddress: string) => {
    if (!confirm(`確定要刪除 IP 記錄 ${ipAddress} 嗎？`)) {
      return
    }

    try {
      const { error } = await supabase.from("ip_records").delete().eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "✅ 刪除成功",
        description: `IP 記錄 ${ipAddress} 已刪除`,
      })

      loadRecords()
    } catch (error) {
      console.error("刪除記錄失敗:", error)
      toast({
        title: "❌ 刪除失敗",
        description: "無法刪除 IP 記錄，請稍後再試",
        variant: "destructive",
      })
    }
  }

  // 複製 IP 地址
  const copyIPAddress = async (ipAddress: string) => {
    try {
      await navigator.clipboard.writeText(ipAddress)
      toast({
        title: "✅ 複製成功",
        description: `IP 地址 ${ipAddress} 已複製到剪貼板`,
      })
    } catch (error) {
      console.error("複製失敗:", error)
      toast({
        title: "❌ 複製失敗",
        description: "無法複製到剪貼板",
        variant: "destructive",
      })
    }
  }

  // 匯出 CSV
  const exportToCSV = () => {
    const headers = ["IP地址", "備註", "分類", "系統", "狀態", "建立時間"]
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map((record) =>
        [
          record.ip_address,
          `"${record.description}"`,
          record.category,
          `"${record.system || ""}"`,
          record.status,
          new Date(record.created_at).toLocaleString("zh-TW"),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `ip_records_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "✅ 匯出成功",
      description: `已匯出 ${filteredRecords.length} 筆記錄`,
    })
  }

  // 匯入 CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.split("\n")
        const headers = lines[0].split(",")

        // 簡單的 CSV 解析（實際應用中建議使用專業的 CSV 解析庫）
        const records = lines.slice(1).map((line) => {
          const values = line.split(",")
          return {
            ip_address: values[0]?.trim(),
            description: values[1]?.replace(/"/g, "").trim(),
            category: values[2]?.trim() || "server",
            system: values[3]?.replace(/"/g, "").trim(),
            status: values[4]?.trim() || "active",
          }
        })

        // 過濾空行和無效記錄
        const validRecords = records.filter((record) => record.ip_address && validateIP(record.ip_address))

        if (validRecords.length === 0) {
          toast({
            title: "❌ 匯入失敗",
            description: "CSV 檔案中沒有有效的記錄",
            variant: "destructive",
          })
          return
        }

        // 批量插入
        const { error } = await supabase.from("ip_records").insert(validRecords)

        if (error) {
          throw error
        }

        toast({
          title: "✅ 匯入成功",
          description: `已匯入 ${validRecords.length} 筆記錄`,
        })

        loadRecords()
      } catch (error) {
        console.error("匯入失敗:", error)
        toast({
          title: "❌ 匯入失敗",
          description: "CSV 檔案格式錯誤或包含重複記錄",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // 重置 input
    event.target.value = ""
  }

  // 搜尋和篩選
  useEffect(() => {
    let filtered = records

    // 搜尋篩選
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.system?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // 分類篩選
    if (categoryFilter !== "all") {
      filtered = filtered.filter((record) => record.category === categoryFilter)
    }

    // 狀態篩選
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter)
    }

    setFilteredRecords(filtered)
  }, [records, searchTerm, categoryFilter, statusFilter])

  // 初始載入
  useEffect(() => {
    loadRecords()
  }, [])

  const getCategoryInfo = (category: string) => {
    return categories.find((cat) => cat.value === category) || categories[categories.length - 1]
  }

  const getStatusInfo = (status: string) => {
    return statuses.find((stat) => stat.value === status) || statuses[0]
  }

  if (!tableExists) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <CardTitle className="text-orange-800">資料庫設置未完成</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-orange-700">IP 管理系統需要先建立資料庫表格。請按照以下步驟完成設置：</p>
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">設置步驟：</h4>
                <ol className="list-decimal list-inside space-y-2 text-orange-700">
                  <li>前往 Supabase SQL Editor</li>
                  <li>
                    執行腳本：
                    <code className="bg-orange-100 px-2 py-1 rounded">scripts/003-create-ip-records-table.sql</code>
                  </li>
                  <li>返回此頁面並點擊「檢查資料庫」按鈕</li>
                </ol>
              </div>
              <div className="flex space-x-2">
                <Button onClick={checkTableExists} disabled={checkingDatabase}>
                  {checkingDatabase ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      檢查中...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      檢查資料庫
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={loadRecords}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新載入
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IP 管理系統</h1>
            <p className="text-gray-600">管理和追蹤網路 IP 位址配置</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button onClick={loadRecords} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              重新整理
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              匯出 CSV
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  匯入 CSV
                </span>
              </Button>
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  新增 IP
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>新增 IP 記錄</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ip-address">IP 地址 *</Label>
                    <Input
                      id="ip-address"
                      value={newRecord.ip_address}
                      onChange={(e) => setNewRecord({ ...newRecord, ip_address: e.target.value })}
                      placeholder="例如：192.168.1.100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">備註說明 *</Label>
                    <Textarea
                      id="description"
                      value={newRecord.description}
                      onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                      placeholder="描述此 IP 的用途..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">分類</Label>
                    <Select
                      value={newRecord.category}
                      onValueChange={(value) => setNewRecord({ ...newRecord, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="system">系統資訊</Label>
                    <Input
                      id="system"
                      value={newRecord.system}
                      onChange={(e) => setNewRecord({ ...newRecord, system: e.target.value })}
                      placeholder="例如：Ubuntu 20.04, Windows Server 2019"
                    />
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
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleAddRecord} className="flex-1">
                      新增記錄
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                      取消
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">總計 IP</p>
                  <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                </div>
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">運行中</p>
                  <p className="text-2xl font-bold text-green-600">
                    {records.filter((r) => r.status === "active").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">維護中</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {records.filter((r) => r.status === "maintenance").length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">停用</p>
                  <p className="text-2xl font-bold text-red-600">
                    {records.filter((r) => r.status === "inactive").length}
                  </p>
                </div>
                <Server className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜尋 IP 地址、備註或系統..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="分類篩選" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有分類</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="狀態篩選" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有狀態</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>IP 記錄列表 ({filteredRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                載入中...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "沒有符合條件的記錄"
                  : "尚無 IP 記錄"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP 地址</TableHead>
                      <TableHead>備註</TableHead>
                      <TableHead>分類</TableHead>
                      <TableHead>系統</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>建立時間</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const categoryInfo = getCategoryInfo(record.category)
                      const statusInfo = getStatusInfo(record.status)
                      const CategoryIcon = categoryInfo.icon

                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                {record.ip_address}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyIPAddress(record.ip_address)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={record.description}>
                              {record.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${categoryInfo.color}`}></div>
                              <CategoryIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{categoryInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{record.system || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {new Date(record.created_at).toLocaleString("zh-TW")}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditRecord(record)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRecord(record.id, record.ip_address)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>編輯 IP 記錄</DialogTitle>
            </DialogHeader>
            {editingRecord && (
              <div className="space-y-4">
                <div>
                  <Label>IP 地址</Label>
                  <Input value={editingRecord.ip_address} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label htmlFor="edit-description">備註說明 *</Label>
                  <Textarea
                    id="edit-description"
                    value={editingRecord.description}
                    onChange={(e) => setEditingRecord({ ...editingRecord, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">分類</Label>
                  <Select
                    value={editingRecord.category}
                    onValueChange={(value) => setEditingRecord({ ...editingRecord, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-system">系統資訊</Label>
                  <Input
                    id="edit-system"
                    value={editingRecord.system || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, system: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">狀態</Label>
                  <Select
                    value={editingRecord.status}
                    onValueChange={(value) => setEditingRecord({ ...editingRecord, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateRecord} className="flex-1">
                    更新記錄
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                    取消
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
