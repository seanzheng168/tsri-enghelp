"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen,
  Key,
  Globe,
  Terminal,
  Server,
  FolderOpen,
  FileText,
  ExternalLink,
  Wrench,
  Settings,
  Monitor,
  Sun,
  Moon,
  User,
  Edit,
  Save,
  X,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

interface Tool {
  id: string
  title: string
  icon: any
  description: string
  color: string
  buttonColor: string
  href: string
  customTitle?: string
  customDescription?: string
}

type Theme = "light" | "dark" | "system"

export default function HomePage() {
  const [userSession, setUserSession] = useState<any>(null)
  const [tools, setTools] = useState<Tool[]>([])
  const [theme, setTheme] = useState<Theme>("light")
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // 新增編輯工具的狀態
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [editToolForm, setEditToolForm] = useState({
    customTitle: "",
    customDescription: "",
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const defaultTools: Tool[] = [
    {
      id: "knowledge-base",
      title: "知識庫",
      icon: BookOpen,
      description: "智能文件管理系統",
      color: "from-blue-500 to-blue-600",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      href: "/eda-cloud", // 保持原有路由
    },
    {
      id: "password-generator",
      title: "密碼產生器",
      icon: Key,
      description: "安全密碼生成工具",
      color: "from-amber-500 to-orange-500",
      buttonColor: "bg-orange-500 hover:bg-orange-600",
      href: "/password-generator",
    },
    {
      id: "ip-lookup",
      title: "IP 查詢工具",
      icon: Globe,
      description: "網路IP位址查詢服務",
      color: "from-cyan-500 to-blue-500",
      buttonColor: "bg-cyan-600 hover:bg-cyan-700",
      href: "/ip-lookup",
    },
    {
      id: "netapp-commands",
      title: "NetApp 常用指令",
      icon: Terminal,
      description: "NetApp系統指令參考手冊",
      color: "from-green-500 to-emerald-600",
      buttonColor: "bg-green-600 hover:bg-green-700",
      href: "/netapp-commands",
    },
    {
      id: "centos-commands",
      title: "CentOS 常用指令",
      icon: Server,
      description: "CentOS Linux指令快速參考",
      color: "from-purple-500 to-indigo-600",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      href: "/centos-commands",
    },
    {
      id: "ip-management",
      title: "IP 管理系統",
      icon: FolderOpen,
      description: "網路IP位址管理平台",
      color: "from-rose-500 to-pink-600",
      buttonColor: "bg-rose-600 hover:bg-rose-700",
      href: "/ip-management",
    },
    {
      id: "meeting-records",
      title: "會議紀錄管理",
      icon: FileText,
      description: "會議記錄與追蹤系統",
      color: "from-indigo-500 to-purple-600",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700",
      href: "/meeting-records",
    },
    {
      id: "fortigate-dhcp",
      title: "Fortigate DHCP 指令生成器",
      icon: Terminal,
      description: "快速生成防火牆DHCP保留地址指令",
      color: "from-orange-500 to-red-600",
      buttonColor: "bg-red-600 hover:bg-red-700",
      href: "/fortigate-dhcp",
    },
  ]

  // 添加權限檢查函數
  const hasPermission = (toolId: string) => {
    if (!userSession) return true // 未登入時顯示所有工具
    if (userSession.permissions.includes("all")) return true
    return userSession.permissions.includes(toolId)
  }

  // 添加登出函數
  const handleLogout = () => {
    localStorage.removeItem("user-session")
    setUserSession(null)
    toast({
      title: "已登出",
      description: "您已成功登出系統",
    })
  }

  // 編輯工具函數
  const handleEditTool = (tool: Tool, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingTool(tool)
    setEditToolForm({
      customTitle: tool.customTitle || tool.title,
      customDescription: tool.customDescription || tool.description,
    })
    setIsEditDialogOpen(true)
  }

  // 更新工具函數
  const handleUpdateTool = () => {
    if (!editingTool) return

    // 更新工具資訊
    const updatedTools = tools.map((tool) =>
      tool.id === editingTool.id
        ? {
            ...tool,
            customTitle: editToolForm.customTitle,
            customDescription: editToolForm.customDescription,
          }
        : tool,
    )

    setTools(updatedTools)

    // 保存到 localStorage
    const savedAdminTools = localStorage.getItem("admin-tools")
    if (savedAdminTools) {
      try {
        const adminTools = JSON.parse(savedAdminTools)
        const updatedAdminTools = adminTools.map((tool: any) =>
          tool.id === editingTool.id
            ? {
                ...tool,
                customTitle: editToolForm.customTitle,
                customDescription: editToolForm.customDescription,
              }
            : tool,
        )
        localStorage.setItem("admin-tools", JSON.stringify(updatedAdminTools))
      } catch (error) {
        console.error("Failed to update admin tools:", error)
      }
    } else {
      // 如果沒有 admin-tools，則創建一個
      const newAdminTools = defaultTools.map((tool) => ({
        id: tool.id,
        title: tool.title,
        description: tool.description,
        customTitle: tool.id === editingTool.id ? editToolForm.customTitle : undefined,
        customDescription: tool.id === editingTool.id ? editToolForm.customDescription : undefined,
        isVisible: true,
        requiredPermissions: [tool.id],
      }))
      localStorage.setItem("admin-tools", JSON.stringify(newAdminTools))
    }

    setIsEditDialogOpen(false)
    setEditingTool(null)

    toast({
      title: "✅ 工具資訊已更新",
      description: "工具名稱和描述已成功更新",
    })
  }

  // 在 useEffect 中載入自定義工具資訊
  useEffect(() => {
    const session = localStorage.getItem("user-session")
    if (session) {
      try {
        setUserSession(JSON.parse(session))
      } catch (error) {
        console.error("Failed to parse user session:", error)
      }
    }

    // 載入自定義工具資訊
    const savedAdminTools = localStorage.getItem("admin-tools")
    let customizedTools = defaultTools

    if (savedAdminTools) {
      try {
        const adminTools = JSON.parse(savedAdminTools)
        customizedTools = defaultTools.map((tool) => {
          const adminTool = adminTools.find((t: any) => t.id === tool.id)
          if (adminTool) {
            return {
              ...tool,
              customTitle: adminTool.customTitle,
              customDescription: adminTool.customDescription,
            }
          }
          return tool
        })
      } catch (error) {
        console.error("Failed to load admin tools:", error)
      }
    }

    const savedOrder = localStorage.getItem("tsri-tools-order")
    const savedTheme = localStorage.getItem("tsri-theme") as Theme

    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder)
        const reorderedTools = orderIds
          .map((id: string) => customizedTools.find((tool) => tool.id === id))
          .filter(Boolean)
        setTools(reorderedTools)
      } catch (error) {
        console.error("Failed to load tools order:", error)
      }
    } else {
      setTools(customizedTools)
    }

    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  // 應用主題
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement

    if (newTheme === "dark") {
      root.classList.add("dark")
    } else if (newTheme === "light") {
      root.classList.remove("dark")
    } else {
      // system theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }

  // 處理主題切換
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem("tsri-theme", newTheme)
  }

  // 拖拽開始
  const handleDragStart = (e: React.DragEvent, toolId: string) => {
    setDraggedItem(toolId)
    e.dataTransfer.effectAllowed = "move"
  }

  // 拖拽結束
  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  // 拖拽經過
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  // 放置
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetId) return

    const newTools = [...tools]
    const draggedIndex = newTools.findIndex((tool) => tool.id === draggedItem)
    const targetIndex = newTools.findIndex((tool) => tool.id === targetId)

    // 移動工具
    const [removed] = newTools.splice(draggedIndex, 1)
    newTools.splice(targetIndex, 0, removed)

    setTools(newTools)

    // 保存到localStorage
    const orderIds = newTools.map((tool) => tool.id)
    localStorage.setItem("tsri-tools-order", JSON.stringify(orderIds))
  }

  // 重置為預設排列
  const resetToDefault = () => {
    setTools(defaultTools)
    localStorage.removeItem("tsri-tools-order")
  }

  const themeOptions = [
    { value: "light" as Theme, label: "淺色主題", icon: Sun },
    { value: "dark" as Theme, label: "深色主題", icon: Moon },
    { value: "system" as Theme, label: "跟隨系統", icon: Monitor },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  TSRI 工程師小幫手
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Engineer Toolkit Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userSession ? (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400">歡迎，{userSession.username}</span>
                  {userSession.role === "admin" && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin">
                        <Settings className="w-4 h-4 mr-2" />
                        管理後台
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    登出
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">
                    <User className="w-4 h-4 mr-2" />
                    登入
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">工程師專用工具集</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            為TSRI工程師量身打造的實用工具平台，提升工作效率，簡化日常操作
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tools
            .filter((tool) => {
              // 檢查工具是否可見
              const savedTools = localStorage.getItem("admin-tools")
              if (savedTools) {
                try {
                  const adminTools = JSON.parse(savedTools)
                  const adminTool = adminTools.find((t: any) => t.id === tool.id)
                  if (adminTool && !adminTool.isVisible) return false
                } catch (error) {
                  // 忽略錯誤，使用默認設定
                }
              }

              // 檢查用戶權限
              return hasPermission(tool.id)
            })
            .map((tool, index) => {
              const IconComponent = tool.icon
              return (
                <Card
                  key={tool.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white dark:bg-gray-800 backdrop-blur-sm overflow-hidden"
                  draggable
                  onDragStart={(e) => handleDragStart(e, tool.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, tool.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-14 h-14 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleEditTool(tool, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.customTitle || tool.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      {tool.customDescription || tool.description}
                    </p>
                    <Button
                      asChild
                      className={`w-full ${tool.buttonColor} text-white font-medium hover:shadow-lg transition-all duration-300`}
                    >
                      <Link href={tool.href}>
                        開啟工具
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 mt-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">TSRI 工程師小幫手</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2025 TSRI. All Rights Reserved.</p>
              <p className="text-sm text-gray-500 mt-1">台灣半導體研究中心</p>
            </div>
          </div>
        </div>
      </footer>

      {/* 編輯工具對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>編輯工具資訊</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tool-title">工具名稱</Label>
              <Input
                id="tool-title"
                value={editToolForm.customTitle}
                onChange={(e) => setEditToolForm({ ...editToolForm, customTitle: e.target.value })}
                placeholder={editingTool?.title}
              />
            </div>
            <div>
              <Label htmlFor="tool-description">工具描述</Label>
              <Textarea
                id="tool-description"
                value={editToolForm.customDescription}
                onChange={(e) => setEditToolForm({ ...editToolForm, customDescription: e.target.value })}
                placeholder={editingTool?.description}
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleUpdateTool} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                更新
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
