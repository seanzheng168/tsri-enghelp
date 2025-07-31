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
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  CloudOff,
  AlertTriangle,
  Database,
  Copy,
  CheckCircle,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

interface KBArticle {
  id: string
  title: string
  content: string
  images: { id: string; data: string }[]
  category: string
  views: number
  created_at: string
  updated_at: string
}

const categories = ["登入問題", "連線問題", "系統設定", "一般問題", "其他"]

const SQL_SCRIPT = `-- 建立知識庫文章表
CREATE TABLE IF NOT EXISTS kb_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    category TEXT DEFAULT '一般問題',
    views INTEGER DEFAULT 0,
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
DROP TRIGGER IF EXISTS update_kb_articles_updated_at ON kb_articles;
CREATE TRIGGER update_kb_articles_updated_at 
    BEFORE UPDATE ON kb_articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category);`

export default function EDACloudPage() {
  const [articles, setArticles] = useState<KBArticle[]>([])
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
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [tableExists, setTableExists] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [sqlCopied, setSqlCopied] = useState(false)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const editContentTextareaRef = useRef<HTMLTextAreaElement>(null)
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

  // 複製文章內容
  const copyArticleContent = async (article: KBArticle) => {
    // 移除圖片標記，只保留純文字內容
    const cleanContent = article.content.replace(/\[IMAGE:[^\]]+\]/g, "[圖片]")

    const content = `
標題: ${article.title}
分類: ${article.category}
瀏覽次數: ${article.views || 0}

內容:
${cleanContent}

建立時間: ${new Date(article.created_at).toLocaleString()}
更新時間: ${new Date(article.updated_at).toLocaleString()}
    `.trim()

    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "✅ 已複製",
        description: "文章內容已複製到剪貼簿",
      })
    } catch (error) {
      toast({
        title: "❌ 複製失敗",
        description: "請手動選取並複製內容",
        variant: "destructive",
      })
    }
  }

  // 檢查資料庫狀態
  const checkDatabaseStatus = async () => {
    try {
      setIsInitializing(true)

      // 嘗試查詢資料表是否存在
      const { data, error } = await supabase.from("kb_articles").select("count", { count: "exact" }).limit(1)

      if (error && error.code === "42P01") {
        // 資料表不存在
        setTableExists(false)
        setShowSetupDialog(true)
        toast({
          title: "🔧 需要設定資料庫",
          description: "知識庫資料表尚未建立，請按照指示設定",
        })
      } else if (error) {
        throw error
      } else {
        setTableExists(true)
        await loadArticles()
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

  // 載入知識庫文章
  const loadArticles = async () => {
    try {
      setIsSyncing(true)
      const { data, error } = await supabase.from("kb_articles").select("*").order("updated_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          setTableExists(false)
          setShowSetupDialog(true)
          throw new Error("資料表不存在")
        }
        throw error
      }

      setArticles(data || [])
      setLastSyncTime(new Date())
      setTableExists(true)

      toast({
        title: "✅ 同步成功",
        description: `已載入 ${data?.length || 0} 篇知識庫文章`,
      })
    } catch (error) {
      console.error("載入知識庫文章失敗:", error)
      toast({
        title: "❌ 載入失敗",
        description: error instanceof Error ? error.message : "無法從雲端載入知識庫文章",
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
  const handleAddArticle = async () => {
    if (!newArticle.title || !newArticle.content) {
      toast({
        title: "請填寫必要欄位",
        description: "標題和內容為必填欄位",
        variant: "destructive",
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能新增文章",
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
        .from("kb_articles")
        .insert([
          {
            title: newArticle.title,
            content: newArticle.content,
            images: newArticle.images,
            category: newArticle.category,
            views: 0,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setArticles((prev) => [data, ...prev])
      setNewArticle({ title: "", content: "", images: [], category: "一般問題" })
      setIsAddDialogOpen(false)

      toast({
        title: "🎉 新增成功",
        description: "文章已成功新增到雲端知識庫",
      })
    } catch (error) {
      console.error("新增文章失敗:", error)
      toast({
        title: "❌ 新增失敗",
        description: "無法新增文章到雲端",
        variant: "destructive",
      })
    }
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
  const handleUpdateArticle = async () => {
    if (!editingArticle || !newArticle.title || !newArticle.content) {
      toast({
        title: "請填寫必要欄位",
        description: "標題和內容為必填欄位",
        variant: "destructive",
      })
      return
    }

    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能更新文章",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("kb_articles")
        .update({
          title: newArticle.title,
          content: newArticle.content,
          images: newArticle.images,
          category: newArticle.category,
        })
        .eq("id", editingArticle.id)
        .select()
        .single()

      if (error) throw error

      setArticles((prev) => prev.map((a) => (a.id === editingArticle.id ? data : a)))
      setEditingArticle(null)
      setNewArticle({ title: "", content: "", images: [], category: "一般問題" })

      toast({
        title: "✅ 更新成功",
        description: "文章已成功更新到雲端",
      })
    } catch (error) {
      console.error("更新文章失敗:", error)
      toast({
        title: "❌ 更新失敗",
        description: "無法更新文章到雲端",
        variant: "destructive",
      })
    }
  }

  // 刪除文章
  const handleDeleteArticle = async (id: string) => {
    if (!isOnline) {
      toast({
        title: "🔌 網路未連線",
        description: "需要網路連線才能刪除文章",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("kb_articles").delete().eq("id", id)

      if (error) throw error

      setArticles((prev) => prev.filter((a) => a.id !== id))
      setSelectedArticle(null)

      toast({
        title: "🗑️ 刪除成功",
        description: "文章已從雲端刪除",
      })
    } catch (error) {
      console.error("刪除文章失敗:", error)
      toast({
        title: "❌ 刪除失敗",
        description: "無法從雲端刪除文章",
        variant: "destructive",
      })
    }
  }

  // 查看文章
  const handleViewArticle = async (article: KBArticle) => {
    if (!isOnline) {
      setSelectedArticle(article)
      return
    }

    try {
      // 增加瀏覽次數
      const { data, error } = await supabase
        .from("kb_articles")
        .update({ views: (article.views || 0) + 1 })
        .eq("id", article.id)
        .select()
        .single()

      if (error) throw error

      const updatedArticle = { ...article, views: (article.views || 0) + 1 }
      setArticles((prev) => prev.map((a) => (a.id === article.id ? updatedArticle : a)))
      setSelectedArticle(updatedArticle)
    } catch (error) {
      console.error("更新瀏覽次數失敗:", error)
      setSelectedArticle(article)
    }
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

  // 如果正在初始化，顯示載入畫面
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">檢查資料庫狀態</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">正在檢查知識庫資料表...</p>
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
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    <span>智能文件管理系統 • {articles.length} 篇文章</span>
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
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={!isOnline || !tableExists}
                  >
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
                      disabled={!isOnline || !tableExists}
                    >
                      <Save className="w-5 h-5 mr-2" />
                      新增文章到知識庫
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
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">設定知識庫資料庫</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      知識庫資料表尚未建立，請按照以下步驟在 Supabase 中執行 SQL 腳本
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

                    {/* 詳細說明 */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-2">執行步驟：</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>點擊「複製腳本」按鈕複製 SQL 腳本</li>
                            <li>點擊「開啟 Supabase 控制台」前往您的專案</li>
                            <li>在左側選單中點擊「SQL Editor」</li>
                            <li>將複製的腳本貼上到編輯器中</li>
                            <li>點擊「Run」按鈕執行腳本</li>
                            <li>執行成功後回到此頁面點擊「執行完成後點此檢查」</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !selectedArticle ? (
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
                              copyArticleContent(article)
                            }}
                            className="hover:bg-green-100 dark:hover:bg-green-900/30"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditArticle(article)
                            }}
                            className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            disabled={!isOnline}
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
                            disabled={!isOnline}
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
                            <span>{new Date(article.updated_at).toLocaleDateString()}</span>
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
                    {!searchTerm && isOnline && (
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
                        onClick={() => copyArticleContent(selectedArticle)}
                        className="hover:bg-green-50 dark:hover:bg-green-900/30"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        複製
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditArticle(selectedArticle)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        disabled={!isOnline}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        編輯
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteArticle(selectedArticle.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                        disabled={!isOnline}
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
                      <span>更新於 {new Date(selectedArticle.updated_at).toLocaleDateString()}</span>
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
                  disabled={!isOnline}
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

      {/* 設定對話框 */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔧 設定知識庫資料庫
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-2">需要在 Supabase 中執行以下 SQL 腳本來建立知識庫資料表：</p>
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
