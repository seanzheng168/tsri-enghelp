"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Server, ArrowLeft, Plus, Edit, Trash2, Search, Save, X, Terminal, Copy, CheckCircle, Wifi, WifiOff, RefreshCw, Cloud, CloudOff, AlertTriangle, Database, ExternalLink, Info } from 'lucide-react'
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface NetAppCommand {
  id: string
  title: string
  command: string
  description: string
  category: string
  created_at: string
  updated_at: string
}

const categories = ["Volume", "Aggregate", "Network", "Security", "System", "Backup", "Performance", "Other"]

const SQL_SCRIPT = `-- 建立 NetApp 指令表
CREATE TABLE IF NOT EXISTS netapp_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    command TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Volume',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 建立更新時間觸發器
DROP TRIGGER IF EXISTS update_netapp_commands_updated_at ON netapp_commands;
CREATE TRIGGER update_netapp_commands_updated_at 
    BEFORE UPDATE ON netapp_commands 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_netapp_commands_category ON netapp_commands(category);`

export default function NetAppCommandsPage() {
  const [commands, setCommands] = useState<NetAppCommand[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCommand, setEditingCommand] = useState<NetAppCommand | null>(null)
  const [newCommand, setNewCommand] = useState({
    title: "",
    command: "",
    description: "",
    category: "Volume",
  })
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [tableExists, setTableExists] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [sqlCopied, setSqlCopied] = useState(false)
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

  // 初始化資料庫和載入資料
  useEffect(() => {
    if (isOnline) {
      checkDatabaseStatus()
    }
  }, [isOnline])

  // 檢查資料庫狀態
  const checkDatabaseStatus = async () => {
    try {
      setIsInitializing(true)

      // 嘗試查詢資料表是否存在
      const { data, error } = await supabase.from("netapp_commands").select("count", { count: "exact" }).limit(1)

      if (error && error.code === "42P01") {
        // 資料表不存在
        setTableExists(false)
        setShowSetupDialog(true)
        toast({
          title: "🔧 需要設定資料庫",
          description: "NetApp 指令資料表尚未建立，請按照指示設定",
        })
      } else if (error) {
        throw error
      } else {
        setTableExists(true)
        await loadCommands()
      }
    } catch (error) {
      console.error("檢查資料庫狀態失敗:", error)
      setTableExists(false)
      toast({
        title: "❌ 資料庫連線失敗",
        description: "請檢查資料庫連線設定",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // 載入指令
  const loadCommands = async () => {
    try {
      setIsSyncing(true)
      const { data, error } = await supabase
        .from("netapp_commands")
        .select("*")
        .order("updated_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          setTableExists(false)
          setShowSetupDialog(true)
          throw new Error("資料表不存在")
        }
        throw error
      }

      setCommands(data || [])
      setLastSyncTime(new Date())
      setTableExists(true)

      toast({
        title: "✅ 同步成功",
        description: `已載入 ${data?.length || 0} 個 NetApp 指令`,
      })
    } catch (error) {
      console.error("載入 NetApp 指令失敗:", error)
      toast({
        title: "❌ 載入失敗",
        description: error instanceof Error ? error.message : "無法從雲端載入 NetApp 指令",
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

    await checkDatabaseStatus()
  }

  // 複製 SQL 腳本
  const copySqlScript = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCRIPT)
      setSqlCopied(true)
      toast({
        title: "✅ 已複製",
        description: "SQL 腳本已複製到剪貼簿",
      })
      setTimeout(() => setSqlCopied(false), 2000)
    } catch (error) {
      toast({
        title: "❌ 複製失敗",
        description: "請手動選取並複製 SQL 腳本",
        variant: "destructive",
      })
    }
  }

  // 複製指令
  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command)
      toast({
        title: "✅ 已複製",
        description: "指令已複製到剪貼簿",
      })
    } catch (error) {
      toast({
        title: "❌ 複製失敗",
        description: "請手動選取並複製指令",
        variant: "destructive",
      })
    }
  }

  // 更新過濾邏輯
  const filteredCommands = commands.filter((command) => {
    const matchesSearch =
      searchTerm === "" ||
      command.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      command.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      command.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      command.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || command.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // 新增指令
  const handleAddCommand = async () => {
    if (!newCommand.title || !newCommand.command) {
      toast({
        title: "請填寫必要欄位",
        description: "標題和指令為必填欄位",
        variant: "destructive",
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能新增指令",
        variant: "destructive",
      })
      return
    }

    if (!tableExists) {
      toast({
        title: "❌ 資料表不存在",
        description: "請先設定資料庫",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("netapp_commands")
        .insert([
          {
            title: newCommand.title,
            command: newCommand.command,
            description: newCommand.description,
            category: newCommand.category,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setCommands((prev) => [data, ...prev])
      setNewCommand({ title: "", command: "", description: "", category: "Volume" })
      setIsAddDialogOpen(false)

      toast({
        title: "🎉 新增成功",
        description: "NetApp 指令已成功新增到雲端",
      })
    } catch (error) {
      console.error("新增指令失敗:", error)
      toast({
        title: "❌ 新增失敗",
        description: "無法新增指令到雲端",
        variant: "destructive",
      })
    }
  }

  // 編輯指令
  const handleEditCommand = (command: NetAppCommand) => {
    setEditingCommand(command)
    setNewCommand({
      title: command.title,
      command: command.command,
      description: command.description || "",
      category: command.category || "Volume",
    })
  }

  // 複製指令為新指令
  const handleDuplicateCommand = (command: NetAppCommand) => {
    setNewCommand({
      title: `${command.title} (副本)`,
      command: command.command,
      description: command.description || "",
      category: command.category || "Volume",
    })
    setIsAddDialogOpen(true)
  }

  // 更新指令
  const handleUpdateCommand = async () => {
    if (!editingCommand || !newCommand.title || !newCommand.command) {
      toast({
        title: "請填寫必要欄位",
        description: "標題和指令為必填欄位",
        variant: "destructive",
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能更新指令",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("netapp_commands")
        .update({
          title: newCommand.title,
          command: newCommand.command,
          description: newCommand.description,
          category: newCommand.category,
        })
        .eq("id", editingCommand.id)
        .select()
        .single()

      if (error) throw error

      setCommands((prev) => prev.map((c) => (c.id === editingCommand.id ? data : c)))
      setEditingCommand(null)
      setNewCommand({ title: "", command: "", description: "", category: "Volume" })

      toast({
        title: "✅ 更新成功",
        description: "NetApp 指令已成功更新到雲端",
      })
    } catch (error) {
      console.error("更新指令失敗:", error)
      toast({
        title: "❌ 更新失敗",
        description: "無法更新指令到雲端",
        variant: "destructive",
      })
    }
  }

  // 刪除指令
  const handleDeleteCommand = async (id: string) => {
    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能刪除指令",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("netapp_commands").delete().eq("id", id)

      if (error) throw error

      setCommands((prev) => prev.filter((c) => c.id !== id))

      toast({
        title: "🗑️ 刪除成功",
        description: "NetApp 指令已從雲端刪除",
      })
    } catch (error) {
      console.error("刪除指令失敗:", error)
      toast({
        title: "❌ 刪除失敗",
        description: "無法從雲端刪除指令",
        variant: "destructive",
      })
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Volume: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      Aggregate: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      Network: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      Security: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      System: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      Backup: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      Performance: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
      Other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    }
    return colors[category as keyof typeof colors] || colors["Other"]
  }

  // 如果正在初始化，顯示載入畫面
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">檢查資料庫狀態</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">正在檢查 NetApp 指令資料表...</p>
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-600">請稍候</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild className="hover:bg-gray-100 dark:hover:bg-gray-800">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首頁
                </Link>
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Server className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    NetApp 指令
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    <span>儲存系統指令參考 • {commands.length} 個指令</span>
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
              {/* 資料庫狀態 */}
              {!tableExists && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">需要設定</span>
                </div>
              )}

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
                {isSyncing ? "檢查中..." : "重新檢查"}
              </Button>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={!isOnline || !tableExists}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新增指令
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ✨ 新增 NetApp 指令
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="title" className="text-base font-semibold">
                          指令標題 *
                        </Label>
                        <Input
                          id="title"
                          value={newCommand.title}
                          onChange={(e) => setNewCommand({ ...newCommand, title: e.target.value })}
                          placeholder="例如：建立新的 Volume"
                          className="mt-2 h-12 text-lg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category" className="text-base font-semibold">
                          分類
                        </Label>
                        <Select
                          value={newCommand.category}
                          onValueChange={(value) => setNewCommand({ ...newCommand, category: value })}
                        >
                          <SelectTrigger className="mt-2 h-12">
                            <SelectValue placeholder="選擇分類" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="command" className="text-base font-semibold">
                        指令內容 *
                      </Label>
                      <Textarea
                        id="command"
                        value={newCommand.command}
                        onChange={(e) => setNewCommand({ ...newCommand, command: e.target.value })}
                        placeholder="例如：volume create -vserver svm1 -volume vol1 -aggregate aggr1 -size 100GB"
                        rows={4}
                        className="mt-2 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-base font-semibold">
                        說明
                      </Label>
                      <Textarea
                        id="description"
                        value={newCommand.description}
                        onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                        placeholder="請輸入指令的詳細說明和使用情境..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={handleAddCommand}
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                      disabled={!isOnline || !tableExists}
                    >
                      <Save className="w-5 h-5 mr-2" />
                      新增指令
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
        <div className="max-w-7xl mx-auto">
          {!tableExists ? (
            /* 資料庫設定指引 */
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="py-12">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Database className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">設定 NetApp 指令資料庫</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      NetApp 指令資料表尚未建立，請按照以下步驟在 Supabase 中執行 SQL 腳本
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* 步驟說明 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">複製 SQL 腳本</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">點擊下方按鈕複製建表腳本</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">開啟 Supabase</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">前往 SQL Editor 頁面</p>
                      </div>
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">執行腳本</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">貼上並執行 SQL 腳本</p>
                      </div>
                    </div>

                    {/* SQL 腳本區域 */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">SQL 建表腳本</h4>
                        <Button onClick={copySqlScript} variant="outline" size="sm">
                          {sqlCopied ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              已複製
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              複製腳本
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="bg-gray-900 dark:bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        {SQL_SCRIPT}
                      </pre>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        開啟 Supabase 控制台
                      </Button>
                      <Button onClick={handleManualSync} variant="outline" disabled={!isOnline}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        執行完成後點此檢查
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 搜尋區域 */}
              <div className="mb-8">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="🔍 搜尋指令標題、內容或說明..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 h-14 text-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:shadow-xl transition-all duration-300"
                  />
                </div>
              </div>

              {/* 分類篩選 */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("all")}
                    className="rounded-full"
                  >
                    全部分類
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className="rounded-full"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 指令列表 */}
              <div className="grid grid-cols-1 gap-6">
                {filteredCommands.map((command) => (
                  <Card
                    key={command.id}
                    className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={`${getCategoryColor(command.category)} px-3 py-1 font-medium`}>
                          {command.category}
                        </Badge>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCommand(command.command)}
                            className="hover:bg-green-100 dark:hover:bg-green-900/30"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateCommand(command)}
                            className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            title="複製為新指令"
                          >
                            📋
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCommand(command)}
                            className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            disabled={!isOnline}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCommand(command.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                            disabled={!isOnline}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {command.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Terminal className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">NetApp CLI</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCommand(command.command)}
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap break-all">
                          {command.command}
                        </pre>
                      </div>
                      {command.description && (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{command.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-4">
                        <span>更新於 {new Date(command.updated_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCommands.length === 0 && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="py-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Terminal className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm ? "找不到符合條件的指令" : "尚無 NetApp 指令"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {searchTerm ? "請嘗試其他關鍵字" : "開始建立您的第一個 NetApp 指令"}
                    </p>
                    {!searchTerm && isOnline && (
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        新增指令
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* 編輯對話框 */}
      {editingCommand && (
        <Dialog open={!!editingCommand} onOpenChange={() => setEditingCommand(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ✏️ 編輯 NetApp 指令
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="edit-title" className="text-base font-semibold">
                    指令標題 *
                  </Label>
                  <Input
                    id="edit-title"
                    value={newCommand.title}
                    onChange={(e) => setNewCommand({ ...newCommand, title: e.target.value })}
                    className="mt-2 h-12 text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category" className="text-base font-semibold">
                    分類
                  </Label>
                  <Select
                    value={newCommand.category}
                    onValueChange={(value) => setNewCommand({ ...newCommand, category: value })}
                  >
                    <SelectTrigger className="mt-2 h-12">
                      <SelectValue placeholder="選擇分類" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-command" className="text-base font-semibold">
                  指令內容 *
                </Label>
                <Textarea
                  id="edit-command"
                  value={newCommand.command}
                  onChange={(e) => setNewCommand({ ...newCommand, command: e.target.value })}
                  rows={4}
                  className="mt-2 font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-base font-semibold">
                  說明
                </Label>
                <Textarea
                  id="edit-description"
                  value={newCommand.description}
                  onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={handleUpdateCommand}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                  disabled={!isOnline}
                >
                  <Save className="w-5 h-5 mr-2" />
                  更新指令
                </Button>
                <Button variant="outline" onClick={() => setEditingCommand(null)} className="flex-1 h-12 font-semibold">
                  <X className="w-5 h-5 mr-2" />
                  取消編輯
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 設定對話框 */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              🔧 設定 NetApp 指令資料庫
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-2">需要在 Supabase 中執行以下 SQL 腳本來建立 NetApp 指令資料表：</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">SQL 建表腳本</h4>
                <Button onClick={copySqlScript} variant="outline" size="sm">
                  {sqlCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      複製腳本
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-gray-900 dark:bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96">
                {SQL_SCRIPT}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                開啟 Supabase 控制台
              </Button>
              <Button
                onClick={handleManualSync}
                variant="outline"
                className="flex-1 bg-transparent"
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                執行完成後檢查
              </Button>
              <Button onClick={() => setShowSetupDialog(false)} variant="ghost" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                稍後設定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
