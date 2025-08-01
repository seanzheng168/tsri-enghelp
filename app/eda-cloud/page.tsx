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
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  ImageIcon,
  Info,
  FileText,
  Clock,
  Eye,
  Sparkles,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface KBArticle {
  id: string
  title: string
  content: string
  images: { id: string; data: string }[]
  createdAt: string
  updatedAt: string
  views?: number
  category?: string
}

const defaultArticles: KBArticle[] = [
  {
    id: "1",
    title: "登入 EDA Cloud VPN 顯示「無法建立工作階段」",
    content: `請確定目前電腦是否使用的實體 IP 網路，並且對應確認設定的IP 位置是否正確。若目前的IP 與實際設定 IP 不同則無法連線成功，如需變更 IP 請至帳號中心或聯絡服務中心。

帳號申請資訊：EDA Cloud/Service Lab 帳號申請，建議您的帳號「帳戶」→「編輯工作階段設定」。

客服 IP 位置：此連結

※ EDA Cloud 2.0使用者來源為學術機構的使用者，使用學術機構內的網路會導致登入帳號失效。

※ EDA Cloud 2.0Service Lab (sa)帳號僅限服務中心設定產品且實際(Service Lab)帳號使用。`,
    images: [],
    createdAt: "2025-01-20",
    updatedAt: "2025-01-20",
    views: 156,
    category: "登入問題",
  },
  {
    id: "2",
    title: "登入EDA Cloud Citrix VPN無法顯示「目前無法登入請聯絡的測驗員，以確認您的帳號」",
    content: `出現此為當實現Cache的Citrix Workspace會異常，請將當實現的當實員清除；時間範圍建議「不限時間」或「所有時間」，並確認關閉的當實員清除Citrix Workspace所有當前服務與登入資訊。

以下是相關設定畫面：

[IMAGE:citrix-settings]

請按照上述步驟進行設定。

另外也可以參考以下畫面進行操作：

[IMAGE:cache-clear]

完成後重新啟動Citrix Workspace即可。`,
    images: [
      {
        id: "citrix-settings",
        data: "/placeholder.svg?height=400&width=600&text=Citrix+Workspace+Settings",
      },
      {
        id: "cache-clear",
        data: "/placeholder.svg?height=300&width=400&text=Cache+Clear+Dialog",
      },
    ],
    createdAt: "2025-01-19",
    updatedAt: "2025-01-19",
    views: 89,
    category: "連線問題",
  },
]

export default function EDACloudPage() {
  const [articles, setArticles] = useState<KBArticle[]>(defaultArticles)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null)
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    images: [] as { id: string; data: string }[],
    category: "一般問題",
  })
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const editContentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = ["登入問題", "連線問題", "系統設定", "一般問題", "其他"]

  // 載入儲存的文章
  useEffect(() => {
    const savedArticles = localStorage.getItem("eda-kb-articles")
    if (savedArticles) {
      try {
        setArticles(JSON.parse(savedArticles))
      } catch (error) {
        console.error("Failed to load articles:", error)
      }
    }
  }, [])

  // 儲存文章到 localStorage
  const saveArticles = (updatedArticles: KBArticle[]) => {
    setArticles(updatedArticles)
    localStorage.setItem("eda-kb-articles", JSON.stringify(updatedArticles))
  }

  // 更新過濾邏輯
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      searchTerm === "" ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // 處理圖片貼上
  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>, isEdit = false) => {
    const items = event.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf("image") !== -1) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const base64 = e.target?.result as string
            const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const placeholder = `[IMAGE:${imageId}]`

            const textarea = isEdit ? editContentTextareaRef.current : contentTextareaRef.current
            if (textarea) {
              const start = textarea.selectionStart
              const end = textarea.selectionEnd
              const currentContent = newArticle.content
              const newContent =
                currentContent.substring(0, start) + "\n\n" + placeholder + "\n\n" + currentContent.substring(end)

              const newImages = [...newArticle.images, { id: imageId, data: base64 }]
              setNewArticle({ ...newArticle, content: newContent, images: newImages })

              setTimeout(() => {
                if (textarea) {
                  const newPosition = start + placeholder.length + 4
                  textarea.setSelectionRange(newPosition, newPosition)
                  textarea.focus()
                }
              }, 0)

              toast({
                title: "✨ 圖片已插入",
                description: "圖片已成功插入到文字內容中",
              })
            }
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  // 新增文章
  const handleAddArticle = () => {
    if (!newArticle.title || !newArticle.content) {
      toast({
        title: "請填寫必要欄位",
        description: "標題和內容為必填欄位",
        variant: "destructive",
      })
      return
    }

    const article: KBArticle = {
      id: Date.now().toString(),
      ...newArticle,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      views: 0,
    }

    const updatedArticles = [...articles, article]
    saveArticles(updatedArticles)

    setNewArticle({ title: "", content: "", images: [], category: "一般問題" })
    setIsAddDialogOpen(false)

    toast({
      title: "🎉 新增成功",
      description: "文章已成功新增到知識庫",
    })
  }

  // 編輯文章
  const handleEditArticle = (article: KBArticle) => {
    setEditingArticle(article)
    setNewArticle({
      title: article.title,
      content: article.content,
      images: article.images,
      category: article.category || "一般問題",
    })
  }

  // 更新文章
  const handleUpdateArticle = () => {
    if (!editingArticle || !newArticle.title || !newArticle.content) {
      toast({
        title: "請填寫必要欄位",
        description: "標題和內容為必填欄位",
        variant: "destructive",
      })
      return
    }

    const updatedArticles = articles.map((article) =>
      article.id === editingArticle.id
        ? {
            ...article,
            ...newArticle,
            updatedAt: new Date().toISOString().split("T")[0],
          }
        : article,
    )

    saveArticles(updatedArticles)
    setEditingArticle(null)
    setNewArticle({ title: "", content: "", images: [], category: "一般問題" })

    toast({
      title: "✅ 更新成功",
      description: "文章已成功更新",
    })
  }

  // 刪除文章
  const handleDeleteArticle = (id: string) => {
    const updatedArticles = articles.filter((article) => article.id !== id)
    saveArticles(updatedArticles)
    setSelectedArticle(null)

    toast({
      title: "🗑️ 刪除成功",
      description: "文章已成功刪除",
    })
  }

  // 查看文章
  const handleViewArticle = (article: KBArticle) => {
    // 增加瀏覽次數
    const updatedArticles = articles.map((a) => (a.id === article.id ? { ...a, views: (a.views || 0) + 1 } : a))
    saveArticles(updatedArticles)
    setSelectedArticle({ ...article, views: (article.views || 0) + 1 })
  }

  // 渲染內容（處理圖片顯示）
  const renderContent = (content: string, images: { id: string; data: string }[]) => {
    const parts = content.split(/(\[IMAGE:[^\]]+\])/g)
    return parts.map((part, index) => {
      if (part.startsWith("[IMAGE:") && part.endsWith("]")) {
        const imageId = part.slice(7, -1)
        const image = images.find((img) => img.id === imageId)
        if (image) {
          return (
            <div key={index} className="my-6 flex justify-center">
              <img
                src={image.data || "/placeholder.svg"}
                alt="內容圖片"
                className="max-w-full h-auto rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => window.open(image.data, "_blank")}
              />
            </div>
          )
        } else {
          return (
            <div
              key={index}
              className="my-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
            >
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              圖片載入失敗: {imageId}
            </div>
          )
        }
      } else {
        return (
          <div key={index} className="whitespace-pre-wrap leading-relaxed">
            {part}
          </div>
        )
      }
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      登入問題: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      連線問題: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      系統設定: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      一般問題: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      其他: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    }
    return colors[category as keyof typeof colors] || colors["其他"]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    知識庫
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    智能文件管理系統 • {articles.length} 篇文章
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
                  新增文章
                  <Zap className="w-4 h-4 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ✨ 新增知識庫文章
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="title" className="text-base font-semibold">
                        文章標題 *
                      </Label>
                      <Input
                        id="title"
                        value={newArticle.title}
                        onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                        placeholder="例如：登入問題解決方案"
                        className="mt-2 h-12 text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-base font-semibold">
                        分類
                      </Label>
                      <Select
                        value={newArticle.category}
                        onValueChange={(value) => setNewArticle({ ...newArticle, category: value })}
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
                    <Label htmlFor="content" className="text-base font-semibold">
                      文章內容 *
                    </Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          💡 提示：可直接複製圖片並貼上到文字內容中的任意位置
                        </span>
                      </div>
                      <Textarea
                        ref={contentTextareaRef}
                        id="content"
                        value={newArticle.content}
                        onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                        onPaste={(e) => handlePaste(e, false)}
                        placeholder="請輸入詳細的解決方案或說明...&#10;&#10;您可以直接複製圖片並按 Ctrl+V 貼上到此處"
                        rows={15}
                        className="resize-none font-mono text-sm leading-relaxed"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddArticle}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    新增文章到知識庫
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {!selectedArticle ? (
            <>
              {/* 搜尋區域 */}
              <div className="mb-8">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="🔍 搜尋文章標題、內容或分類..."
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

              {/* 統計資訊 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 font-medium">總文章數</p>
                        <p className="text-3xl font-bold">{articles.length}</p>
                      </div>
                      <FileText className="w-12 h-12 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 font-medium">總瀏覽數</p>
                        <p className="text-3xl font-bold">{articles.reduce((sum, a) => sum + (a.views || 0), 0)}</p>
                      </div>
                      <Eye className="w-12 h-12 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 font-medium">搜尋結果</p>
                        <p className="text-3xl font-bold">{filteredArticles.length}</p>
                      </div>
                      <Search className="w-12 h-12 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 文章列表 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:-translate-y-1 cursor-pointer"
                    onClick={() => handleViewArticle(article)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={`${getCategoryColor(article.category || "其他")} px-3 py-1 font-medium`}>
                          {article.category || "其他"}
                        </Badge>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditArticle(article)
                            }}
                            className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteArticle(article.id)
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                        {article.content.replace(/\[IMAGE:[^\]]+\]/g, "[圖片]").substring(0, 150)}...
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{article.updatedAt}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{article.views || 0} 次瀏覽</span>
                          </div>
                        </div>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">查看詳情 →</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="py-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm ? "找不到符合條件的文章" : "知識庫暫無文章"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {searchTerm ? "請嘗試其他關鍵字" : "開始建立您的第一篇知識庫文章"}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        新增文章
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* 文章詳情頁面 */
            <div className="max-w-4xl mx-auto">
              <Button
                onClick={() => setSelectedArticle(null)}
                variant="ghost"
                className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回文章列表
              </Button>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-2xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`${getCategoryColor(selectedArticle.category || "其他")} px-4 py-2 font-medium`}>
                      {selectedArticle.category || "其他"}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditArticle(selectedArticle)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        編輯
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteArticle(selectedArticle.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        刪除
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {selectedArticle.title}
                  </CardTitle>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>更新於 {selectedArticle.updatedAt}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>{selectedArticle.views || 0} 次瀏覽</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                      {renderContent(selectedArticle.content, selectedArticle.images)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* 編輯對話框 */}
      {editingArticle && (
        <Dialog open={!!editingArticle} onOpenChange={() => setEditingArticle(null)}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ✏️ 編輯知識庫文章
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="edit-title" className="text-base font-semibold">
                    文章標題 *
                  </Label>
                  <Input
                    id="edit-title"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    className="mt-2 h-12 text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category" className="text-base font-semibold">
                    分類
                  </Label>
                  <Select
                    value={newArticle.category}
                    onValueChange={(value) => setNewArticle({ ...newArticle, category: value })}
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
                <Label htmlFor="edit-content" className="text-base font-semibold">
                  文章內容 *
                </Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      💡 提示：可直接複製圖片並貼上到文字內容中的任意位置
                    </span>
                  </div>
                  <Textarea
                    ref={editContentTextareaRef}
                    id="edit-content"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    onPaste={(e) => handlePaste(e, true)}
                    rows={15}
                    className="resize-none font-mono text-sm leading-relaxed"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={handleUpdateArticle}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                >
                  <Save className="w-5 h-5 mr-2" />
                  更新文章
                </Button>
                <Button variant="outline" onClick={() => setEditingArticle(null)} className="flex-1 h-12 font-semibold">
                  <X className="w-5 h-5 mr-2" />
                  取消編輯
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
