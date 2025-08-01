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
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface IPRecord {
  id: string
  ipAddress: string
  description: string
  category: string
  system: string
  status: string
  createdAt: string
  updatedAt: string
}

const categories = ["伺服器", "工作站", "網路設備", "印表機", "其他"]
const systems = ["Windows", "Linux", "macOS", "網路設備", "嵌入式系統", "其他"]
const statuses = ["使用中", "閒置", "維護中", "已停用"]

const defaultRecords: IPRecord[] = [
  {
    id: "1",
    ipAddress: "192.168.1.100",
    description: "主要檔案伺服器",
    category: "伺服器",
    system: "Linux",
    status: "使用中",
    createdAt: "2025-01-20",
    updatedAt: "2025-01-20",
  },
  {
    id: "2",
    ipAddress: "192.168.1.101",
    description: "開發環境伺服器",
    category: "伺服器",
    system: "Linux",
    status: "使用中",
    createdAt: "2025-01-19",
    updatedAt: "2025-01-19",
  },
  {
    id: "3",
    ipAddress: "192.168.1.50",
    description: "網路印表機 - 辦公室",
    category: "印表機",
    system: "嵌入式系統",
    status: "使用中",
    createdAt: "2025-01-18",
    updatedAt: "2025-01-18",
  },
]

export default function IPManagementPage() {
  const [records, setRecords] = useState<IPRecord[]>(defaultRecords)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [systemFilter, setSystemFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IPRecord | null>(null)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [newRecord, setNewRecord] = useState({
    ipAddress: "",
    description: "",
    category: "伺服器",
    system: "Linux",
    status: "使用中",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // 載入儲存的記錄
  useEffect(() => {
    const savedRecords = localStorage.getItem("ip-management-records")
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords))
      } catch (error) {
        console.error("Failed to load records:", error)
      }
    }
  }, [])

  // 儲存記錄到 localStorage
  const saveRecords = (updatedRecords: IPRecord[]) => {
    setRecords(updatedRecords)
    localStorage.setItem("ip-management-records", JSON.stringify(updatedRecords))
  }

  // 過濾和搜尋記錄
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // 新增記錄
  const handleAddRecord = () => {
    if (!newRecord.ipAddress || !validateIP(newRecord.ipAddress)) {
      toast({
        title: "IP格式錯誤",
        description: "請輸入有效的IP位址",
        variant: "destructive",
      })
      return
    }

    // 檢查IP是否已存在
    if (records.some((record) => record.ipAddress === newRecord.ipAddress)) {
      toast({
        title: "IP已存在",
        description: "此IP位址已被使用",
        variant: "destructive",
      })
      return
    }

    const record: IPRecord = {
      id: Date.now().toString(),
      ...newRecord,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    }

    const updatedRecords = [...records, record]
    saveRecords(updatedRecords)

    setNewRecord({
      ipAddress: "",
      description: "",
      category: "伺服器",
      system: "Linux",
      status: "使用中",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "新增成功",
      description: "IP記錄已成功新增",
    })
  }

  // 編輯記錄
  const handleEditRecord = (record: IPRecord) => {
    setEditingRecord(record)
    setNewRecord({
      ipAddress: record.ipAddress,
      description: record.description,
      category: record.category,
      system: record.system,
      status: record.status,
    })
  }

  // 更新記錄
  const handleUpdateRecord = () => {
    if (!editingRecord || !newRecord.ipAddress || !validateIP(newRecord.ipAddress)) {
      toast({
        title: "IP格式錯誤",
        description: "請輸入有效的IP位址",
        variant: "destructive",
      })
      return
    }

    // 檢查IP是否已存在（排除自己）
    if (records.some((record) => record.ipAddress === newRecord.ipAddress && record.id !== editingRecord.id)) {
      toast({
        title: "IP已存在",
        description: "此IP位址已被其他記錄使用",
        variant: "destructive",
      })
      return
    }

    const updatedRecords = records.map((record) =>
      record.id === editingRecord.id
        ? {
            ...record,
            ...newRecord,
            updatedAt: new Date().toISOString().split("T")[0],
          }
        : record,
    )

    saveRecords(updatedRecords)
    setEditingRecord(null)
    setNewRecord({
      ipAddress: "",
      description: "",
      category: "伺服器",
      system: "Linux",
      status: "使用中",
    })

    toast({
      title: "更新成功",
      description: "IP記錄已成功更新",
    })
  }

  // 刪除記錄
  const handleDeleteRecord = (id: string) => {
    const updatedRecords = records.filter((record) => record.id !== id)
    saveRecords(updatedRecords)

    toast({
      title: "刪除成功",
      description: "IP記錄已成功刪除",
    })
  }

  // 批量刪除
  const handleBatchDelete = () => {
    if (selectedRecords.length === 0) return

    const updatedRecords = records.filter((record) => !selectedRecords.includes(record.id))
    saveRecords(updatedRecords)
    setSelectedRecords([])

    toast({
      title: "批量刪除成功",
      description: `已刪除 ${selectedRecords.length} 筆記錄`,
    })
  }

  // 處理CSV匯入
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
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

      const newRecords: IPRecord[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = line.split(",").map((v) => v.trim())
        const ipAddress = values[headers.indexOf("IP位址")]
        const description = values[headers.indexOf("備註")] || ""
        const category = values[headers.indexOf("類別")] || "其他"
        const system = values[headers.indexOf("系統")] || "其他"
        const status = values[headers.indexOf("狀態")] || "使用中"

        // 驗證IP格式
        if (!validateIP(ipAddress)) {
          errors.push(`第 ${i + 1} 行: IP格式錯誤 (${ipAddress})`)
          continue
        }

        // 檢查IP是否已存在
        if (records.some((record) => record.ipAddress === ipAddress)) {
          errors.push(`第 ${i + 1} 行: IP已存在 (${ipAddress})`)
          continue
        }

        newRecords.push({
          id: `import_${Date.now()}_${i}`,
          ipAddress,
          description,
          category: categories.includes(category) ? category : "其他",
          system: systems.includes(system) ? system : "其他",
          status: statuses.includes(status) ? status : "使用中",
          createdAt: new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString().split("T")[0],
        })
      }

      if (newRecords.length > 0) {
        const updatedRecords = [...records, ...newRecords]
        saveRecords(updatedRecords)

        toast({
          title: "匯入成功",
          description: `成功匯入 ${newRecords.length} 筆記錄${errors.length > 0 ? `，${errors.length} 筆錯誤` : ""}`,
        })
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
    const headers = ["IP位址", "備註", "類別", "系統", "狀態", "建立時間", "更新時間"]
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map((record) =>
        [
          record.ipAddress,
          `"${record.description}"`,
          record.category,
          record.system,
          record.status,
          record.createdAt,
          record.updatedAt,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `ip_management_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    toast({
      title: "匯出成功",
      description: `已匯出 ${filteredRecords.length} 筆記錄`,
    })
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">網路IP位址管理平台</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* CSV匯入 */}
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
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
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-600">
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
                        value={newRecord.ipAddress}
                        onChange={(e) => setNewRecord({ ...newRecord, ipAddress: e.target.value })}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">備註</Label>
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
                    <Button onClick={handleAddRecord} className="w-full">
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
                      <TableCell className="font-mono">{record.ipAddress}</TableCell>
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
                      <TableCell>{record.updatedAt}</TableCell>
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
                  value={newRecord.ipAddress}
                  onChange={(e) => setNewRecord({ ...newRecord, ipAddress: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">備註</Label>
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
                <Button onClick={handleUpdateRecord} className="flex-1">
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
