"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Settings, Users, Shield, Eye, EyeOff, Edit, Trash2, Save, X, UserPlus, Wrench, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface User {
  id: string
  username: string
  email: string
  role: string
  permissions: string[]
  createdAt: string
  isActive: boolean
}

interface Tool {
  id: string
  title: string
  description: string
  customTitle?: string
  customDescription?: string
  isVisible: boolean
  requiredPermissions: string[]
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

const defaultRoles: Role[] = [
  {
    id: "admin",
    name: "管理員",
    description: "擁有所有權限的超級管理員",
    permissions: ["all"],
  },
  {
    id: "editor",
    name: "編輯者",
    description: "可以管理內容和文檔",
    permissions: ["knowledge-base", "password-generator", "centos-commands", "netapp-commands", "meeting-records"],
  },
  {
    id: "user",
    name: "一般用戶",
    description: "基本工具使用權限",
    permissions: ["password-generator", "ip-lookup"],
  },
]

const defaultUsers: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@tsri.org.tw",
    role: "admin",
    permissions: ["all"],
    createdAt: "2025-01-20",
    isActive: true,
  },
  {
    id: "2",
    username: "editor1",
    email: "editor@tsri.org.tw",
    role: "editor",
    permissions: ["knowledge-base", "password-generator", "centos-commands", "netapp-commands", "meeting-records"],
    createdAt: "2025-01-21",
    isActive: true,
  },
]

const defaultTools: Tool[] = [
  {
    id: "knowledge-base",
    title: "知識庫",
    description: "智能文件管理系統",
    isVisible: true,
    requiredPermissions: ["knowledge-base"],
  },
  {
    id: "password-generator",
    title: "密碼產生器",
    description: "安全密碼生成工具",
    isVisible: true,
    requiredPermissions: ["password-generator"],
  },
  {
    id: "ip-lookup",
    title: "IP 查詢工具",
    description: "網路IP位址查詢服務",
    isVisible: true,
    requiredPermissions: ["ip-lookup"],
  },
  {
    id: "netapp-commands",
    title: "NetApp 常用指令速查",
    description: "NetApp系統指令參考手冊",
    isVisible: true,
    requiredPermissions: ["netapp-commands"],
  },
  {
    id: "centos-commands",
    title: "CentOS 常用指令速查",
    description: "CentOS Linux指令快速參考",
    isVisible: true,
    requiredPermissions: ["centos-commands"],
  },
  {
    id: "ip-management",
    title: "IP 管理系統",
    description: "網路IP位址管理平台",
    isVisible: true,
    requiredPermissions: ["ip-management"],
  },
  {
    id: "meeting-records",
    title: "會議紀錄管理",
    description: "會議記錄與追蹤系統",
    isVisible: true,
    requiredPermissions: ["meeting-records"],
  },
]

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [tools, setTools] = useState<Tool[]>(defaultTools)
  const [roles, setRoles] = useState<Role[]>(defaultRoles)
  const [activeTab, setActiveTab] = useState("users")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "user",
    permissions: [] as string[],
    isActive: true,
  })
  const { toast } = useToast()

  // 新增編輯工具的狀態
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [editToolForm, setEditToolForm] = useState({
    customTitle: "",
    customDescription: "",
  })

  // 載入數據
  useEffect(() => {
    const savedUsers = localStorage.getItem("admin-users")
    const savedTools = localStorage.getItem("admin-tools")

    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers))
      } catch (error) {
        console.error("Failed to load users:", error)
      }
    }

    if (savedTools) {
      try {
        setTools(JSON.parse(savedTools))
      } catch (error) {
        console.error("Failed to load tools:", error)
      }
    }
  }, [])

  // 保存數據
  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers)
    localStorage.setItem("admin-users", JSON.stringify(updatedUsers))
  }

  const saveTools = (updatedTools: Tool[]) => {
    setTools(updatedTools)
    localStorage.setItem("admin-tools", JSON.stringify(updatedTools))
  }

  // 新增用戶
  const handleAddUser = () => {
    if (!newUser.username || !newUser.email) {
      toast({
        title: "請填寫必要欄位",
        description: "用戶名和郵箱為必填欄位",
        variant: "destructive",
      })
      return
    }

    // 檢查用戶名是否已存在
    if (users.some((user) => user.username === newUser.username)) {
      toast({
        title: "用戶名已存在",
        description: "請選擇其他用戶名",
        variant: "destructive",
      })
      return
    }

    const selectedRole = roles.find((role) => role.id === newUser.role)
    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      permissions: selectedRole?.permissions || [],
      createdAt: new Date().toISOString().split("T")[0],
    }

    const updatedUsers = [...users, user]
    saveUsers(updatedUsers)

    setNewUser({
      username: "",
      email: "",
      role: "user",
      permissions: [],
      isActive: true,
    })
    setIsAddUserOpen(false)

    toast({
      title: "✅ 新增成功",
      description: "用戶已成功新增",
    })
  }

  // 編輯用戶
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewUser({
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    })
  }

  // 更新用戶
  const handleUpdateUser = () => {
    if (!editingUser || !newUser.username || !newUser.email) {
      toast({
        title: "請填寫必要欄位",
        description: "用戶名和郵箱為必填欄位",
        variant: "destructive",
      })
      return
    }

    const selectedRole = roles.find((role) => role.id === newUser.role)
    const updatedUsers = users.map((user) =>
      user.id === editingUser.id
        ? {
            ...user,
            ...newUser,
            permissions: selectedRole?.permissions || newUser.permissions,
          }
        : user,
    )

    saveUsers(updatedUsers)
    setEditingUser(null)
    setNewUser({
      username: "",
      email: "",
      role: "user",
      permissions: [],
      isActive: true,
    })

    toast({
      title: "✅ 更新成功",
      description: "用戶資料已成功更新",
    })
  }

  // 刪除用戶
  const handleDeleteUser = (id: string) => {
    const updatedUsers = users.filter((user) => user.id !== id)
    saveUsers(updatedUsers)

    toast({
      title: "🗑️ 刪除成功",
      description: "用戶已成功刪除",
    })
  }

  // 切換工具可見性
  const toggleToolVisibility = (toolId: string) => {
    const updatedTools = tools.map((tool) => (tool.id === toolId ? { ...tool, isVisible: !tool.isVisible } : tool))
    saveTools(updatedTools)

    const tool = tools.find((t) => t.id === toolId)
    toast({
      title: tool?.isVisible ? "🙈 工具已隱藏" : "👁️ 工具已顯示",
      description: `${tool?.title} ${tool?.isVisible ? "已隱藏" : "已顯示"}`,
    })
  }

  // 更新工具權限
  const updateToolPermissions = (toolId: string, permissions: string[]) => {
    const updatedTools = tools.map((tool) =>
      tool.id === toolId ? { ...tool, requiredPermissions: permissions } : tool,
    )
    saveTools(updatedTools)

    toast({
      title: "✅ 權限已更新",
      description: "工具權限設定已保存",
    })
  }

  // 新增編輯工具的函數
  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool)
    setEditToolForm({
      customTitle: tool.customTitle || tool.title,
      customDescription: tool.customDescription || tool.description,
    })
  }

  const handleUpdateTool = () => {
    if (!editingTool) return

    const updatedTools = tools.map((tool) =>
      tool.id === editingTool.id
        ? {
            ...tool,
            customTitle: editToolForm.customTitle,
            customDescription: editToolForm.customDescription,
          }
        : tool,
    )

    saveTools(updatedTools)
    setEditingTool(null)
    setEditToolForm({ customTitle: "", customDescription: "" })

    toast({
      title: "✅ 工具資訊已更新",
      description: "工具名稱和描述已成功更新",
    })
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      editor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      user: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    }
    return colors[role as keyof typeof colors] || colors.user
  }

  const allPermissions = [
    "knowledge-base",
    "password-generator",
    "ip-lookup",
    "netapp-commands",
    "centos-commands",
    "ip-management",
    "meeting-records",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
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
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                    系統管理後台
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">用戶權限與工具管理系統</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 導航標籤 */}
          <div className="flex space-x-1 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              onClick={() => setActiveTab("users")}
              className="flex-1 rounded-xl"
            >
              <Users className="w-4 h-4 mr-2" />
              用戶管理
            </Button>
            <Button
              variant={activeTab === "tools" ? "default" : "ghost"}
              onClick={() => setActiveTab("tools")}
              className="flex-1 rounded-xl"
            >
              <Wrench className="w-4 h-4 mr-2" />
              工具管理
            </Button>
            <Button
              variant={activeTab === "roles" ? "default" : "ghost"}
              onClick={() => setActiveTab("roles")}
              className="flex-1 rounded-xl"
            >
              <Shield className="w-4 h-4 mr-2" />
              角色權限
            </Button>
          </div>

          {/* 用戶管理 */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">用戶管理</h2>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                      <UserPlus className="w-4 h-4 mr-2" />
                      新增用戶
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>新增用戶</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username">用戶名 *</Label>
                        <Input
                          id="username"
                          value={newUser.username}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          placeholder="輸入用戶名"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">郵箱 *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="輸入郵箱地址"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">角色</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          checked={newUser.isActive}
                          onCheckedChange={(checked) => setNewUser({ ...newUser, isActive: checked as boolean })}
                        />
                        <Label htmlFor="isActive">啟用帳號</Label>
                      </div>
                      <Button onClick={handleAddUser} className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        新增用戶
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用戶名</TableHead>
                        <TableHead>郵箱</TableHead>
                        <TableHead>角色</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead>建立時間</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {roles.find((r) => r.id === user.role)?.name || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "啟用" : "停用"}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id)}
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
                </CardContent>
              </Card>
            </div>
          )}

          {/* 工具管理 */}
          {activeTab === "tools" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">工具管理</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tools.map((tool) => (
                  <Card
                    key={tool.id}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl group"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{tool.customTitle || tool.title}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTool(tool)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Switch checked={tool.isVisible} onCheckedChange={() => toggleToolVisibility(tool.id)} />
                          {tool.isVisible ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {tool.customDescription || tool.description}
                      </p>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">需要權限：</Label>
                        <div className="space-y-2">
                          {allPermissions.map((permission) => (
                            <div key={permission} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${tool.id}-${permission}`}
                                checked={tool.requiredPermissions.includes(permission)}
                                onCheckedChange={(checked) => {
                                  const newPermissions = checked
                                    ? [...tool.requiredPermissions, permission]
                                    : tool.requiredPermissions.filter((p) => p !== permission)
                                  updateToolPermissions(tool.id, newPermissions)
                                }}
                              />
                              <Label htmlFor={`${tool.id}-${permission}`} className="text-sm">
                                {permission}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">狀態：</span>
                          <Badge variant={tool.isVisible ? "default" : "secondary"}>
                            {tool.isVisible ? "顯示" : "隱藏"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 角色權限 */}
          {activeTab === "roles" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">角色權限</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roles.map((role) => (
                  <Card key={role.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        {role.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{role.description}</p>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">權限列表：</Label>
                        <div className="space-y-1">
                          {role.permissions.includes("all") ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                              所有權限
                            </Badge>
                          ) : (
                            role.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="mr-1 mb-1">
                                {permission}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          用戶數量: {users.filter((u) => u.role === role.id).length}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 編輯用戶對話框 */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>編輯用戶</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">用戶名 *</Label>
                <Input
                  id="edit-username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">郵箱 *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">角色</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={newUser.isActive}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, isActive: checked as boolean })}
                />
                <Label htmlFor="edit-isActive">啟用帳號</Label>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateUser} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  更新
                </Button>
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingTool && (
        <Dialog open={!!editingTool} onOpenChange={() => setEditingTool(null)}>
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
                  placeholder={editingTool.title}
                />
              </div>
              <div>
                <Label htmlFor="tool-description">工具描述</Label>
                <Textarea
                  id="tool-description"
                  value={editToolForm.customDescription}
                  onChange={(e) => setEditToolForm({ ...editToolForm, customDescription: e.target.value })}
                  placeholder={editingTool.description}
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateTool} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  更新
                </Button>
                <Button variant="outline" onClick={() => setEditingTool(null)} className="flex-1">
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
