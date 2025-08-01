"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Server, ArrowLeft, Plus, Edit, Trash2, Copy, Search, Save, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Command {
  id: string
  title: string
  command: string
  description: string
  category: string
}

const defaultCategories = ["System", "Performance", "Disk", "Network", "Package", "CPU", "Memory"]

const defaultCommands: Command[] = [
  {
    id: "1",
    title: "查詢 CentOS 版本",
    command: "cat /etc/centos-release",
    description: "顯示目前的 CentOS 作業系統版本",
    category: "System",
  },
  {
    id: "2",
    title: "查詢核心版本",
    command: "uname -r",
    description: "顯示目前使用的 Linux 核心版本",
    category: "System",
  },
  {
    id: "3",
    title: "查看系統負載",
    command: "top",
    description: "即時顯示系統程序和資源使用情況",
    category: "Performance",
  },
  {
    id: "4",
    title: "查看磁碟使用量",
    command: "df -h",
    description: "以人類可讀格式顯示檔案系統磁碟使用量",
    category: "Disk",
  },
  {
    id: "5",
    title: "查看網路介面",
    command: "ip addr show",
    description: "顯示所有網路介面的IP位址資訊",
    category: "Network",
  },
]

export default function CentOSCommandsPage() {
  const [commands, setCommands] = useState<Command[]>(defaultCommands)
  const [selectedCategory, setSelectedCategory] = useState("System")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCommand, setEditingCommand] = useState<Command | null>(null)
  const [newCommand, setNewCommand] = useState({
    title: "",
    command: "",
    description: "",
    category: "System",
  })
  const { toast } = useToast()

  // 載入儲存的指令
  useEffect(() => {
    const savedCommands = localStorage.getItem("centos-commands")
    if (savedCommands) {
      try {
        setCommands(JSON.parse(savedCommands))
      } catch (error) {
        console.error("Failed to load commands:", error)
      }
    }
  }, [])

  // 儲存指令到 localStorage
  const saveCommands = (updatedCommands: Command[]) => {
    setCommands(updatedCommands)
    localStorage.setItem("centos-commands", JSON.stringify(updatedCommands))
  }

  // 過濾指令
  const filteredCommands = commands.filter((cmd) => {
    // 如果有搜尋詞，則進行全域搜尋，忽略分類篩選
    if (searchTerm !== "") {
      return (
        cmd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 如果沒有搜尋詞，則按分類篩選
    return cmd.category === selectedCategory
  })

  // 新增指令
  const handleAddCommand = () => {
    if (!newCommand.title || !newCommand.command) {
      toast({
        title: "請填寫必要欄位",
        description: "標題和指令為必填欄位",
        variant: "destructive",
      })
      return
    }

    const command: Command = {
      id: Date.now().toString(),
      ...newCommand,
    }

    const updatedCommands = [...commands, command]
    saveCommands(updatedCommands)

    setNewCommand({ title: "", command: "", description: "", category: "System" })
    setIsAddDialogOpen(false)

    toast({
      title: "新增成功",
      description: "指令已成功新增",
    })
  }

  // 編輯指令
  const handleEditCommand = (command: Command) => {
    setEditingCommand(command)
    setNewCommand({
      title: command.title,
      command: command.command,
      description: command.description,
      category: command.category,
    })
  }

  // 更新指令
  const handleUpdateCommand = () => {
    if (!editingCommand || !newCommand.title || !newCommand.command) {
      toast({
        title: "請填寫必要欄位",
        description: "標題和指令為必填欄位",
        variant: "destructive",
      })
      return
    }

    const updatedCommands = commands.map((cmd) => (cmd.id === editingCommand.id ? { ...cmd, ...newCommand } : cmd))

    saveCommands(updatedCommands)
    setEditingCommand(null)
    setNewCommand({ title: "", command: "", description: "", category: "System" })

    toast({
      title: "更新成功",
      description: "指令已成功更新",
    })
  }

  // 刪除指令
  const handleDeleteCommand = (id: string) => {
    const updatedCommands = commands.filter((cmd) => cmd.id !== id)
    saveCommands(updatedCommands)

    toast({
      title: "刪除成功",
      description: "指令已成功刪除",
    })
  }

  // 複製指令
  const copyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command)
      toast({
        title: "複製成功",
        description: "指令已複製到剪貼簿",
      })
    } catch (err) {
      toast({
        title: "複製失敗",
        description: "無法複製到剪貼簿",
        variant: "destructive",
      })
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
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CentOS 常用指令速查</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Linux 指令快速參考</p>
                </div>
              </div>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  新增指令
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>新增指令</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">指令標題 *</Label>
                    <Input
                      id="title"
                      value={newCommand.title}
                      onChange={(e) => setNewCommand({ ...newCommand, title: e.target.value })}
                      placeholder="例如：查詢系統版本"
                    />
                  </div>
                  <div>
                    <Label htmlFor="command">指令 *</Label>
                    <Input
                      id="command"
                      value={newCommand.command}
                      onChange={(e) => setNewCommand({ ...newCommand, command: e.target.value })}
                      placeholder="例如：cat /etc/centos-release"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">說明</Label>
                    <Textarea
                      id="description"
                      value={newCommand.description}
                      onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                      placeholder="指令的詳細說明..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">分類</Label>
                    <select
                      id="category"
                      value={newCommand.category}
                      onChange={(e) => setNewCommand({ ...newCommand, category: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {defaultCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAddCommand} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    新增指令
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* 搜尋欄 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜尋指令..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        {/* 分類標籤 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {defaultCategories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 ${
                selectedCategory === category
                  ? "bg-purple-500 hover:bg-purple-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* 指令列表 */}
        <div className="space-y-4">
          {filteredCommands.map((command) => (
            <Card key={command.id} className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 dark:text-white">{command.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => copyCommand(command.command)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEditCommand(command)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCommand(command.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-3">
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100">{command.command}</code>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{command.description}</p>
              </CardContent>
            </Card>
          ))}

          {filteredCommands.length === 0 && (
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? "找不到符合搜尋條件的指令" : "此分類暫無指令"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* 編輯對話框 */}
      {editingCommand && (
        <Dialog open={!!editingCommand} onOpenChange={() => setEditingCommand(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>編輯指令</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">指令標題 *</Label>
                <Input
                  id="edit-title"
                  value={newCommand.title}
                  onChange={(e) => setNewCommand({ ...newCommand, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-command">指令 *</Label>
                <Input
                  id="edit-command"
                  value={newCommand.command}
                  onChange={(e) => setNewCommand({ ...newCommand, command: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">說明</Label>
                <Textarea
                  id="edit-description"
                  value={newCommand.description}
                  onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">分類</Label>
                <select
                  id="edit-category"
                  value={newCommand.category}
                  onChange={(e) => setNewCommand({ ...newCommand, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {defaultCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateCommand} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  更新
                </Button>
                <Button variant="outline" onClick={() => setEditingCommand(null)} className="flex-1">
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
