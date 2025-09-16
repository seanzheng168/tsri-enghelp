"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, ArrowLeft, RefreshCw, Copy, Wifi, MapPin, Clock, Server } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface IPInfo {
  ipv4?: {
    ip: string
    country: string
    region: string
    city: string
    isp: string
    timezone: string
    source?: string
  }
  ipv6?: {
    ip: string
    country: string
    region: string
    city: string
    isp: string
    timezone: string
    source?: string
  }
  error?: string
  details?: string
}

export default function IPLookupPage() {
  const [ipInfo, setIpInfo] = useState<IPInfo>({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  // 查詢 IP 資訊 - 使用組合 API
  const fetchIPInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ip-lookup/combined")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // 處理錯誤回應
      if (data.error) {
        console.error("API 錯誤:", data.error, data.details)
        toast({
          title: "⚠️ 查詢警告",
          description: data.details || "部分資訊可能不完整",
          variant: "destructive",
        })
      }

      setIpInfo(data)
      setLastUpdated(new Date())

      const hasIPv4 = !!data.ipv4?.ip && data.ipv4.ip !== "Unknown" && data.ipv4.ip !== "127.0.0.1"
      const hasIPv6 = !!data.ipv6?.ip && data.ipv6.ip !== "Unknown"

      if (hasIPv4 || hasIPv6) {
        toast({
          title: "✅ 查詢完成",
          description: `已獲取 ${hasIPv4 ? "IPv4" : ""}${hasIPv4 && hasIPv6 ? " 和 " : ""}${hasIPv6 ? "IPv6" : ""} 資訊`,
        })
      } else if (!data.error) {
        toast({
          title: "⚠️ 查詢完成",
          description: "僅獲取到基本資訊，部分服務可能不可用",
        })
      }
    } catch (error) {
      console.error("IP 查詢失敗:", error)
      toast({
        title: "❌ 查詢失敗",
        description: "無法獲取 IP 資訊，請檢查網路連線後再試",
        variant: "destructive",
      })

      // 設置錯誤狀態但保持基本結構
      setIpInfo({
        ipv4: {
          ip: "Unknown",
          country: "Unknown",
          region: "Unknown",
          city: "Unknown",
          isp: "Unknown",
          timezone: "Unknown",
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 複製 IP 地址
  const copyIP = async (ip: string) => {
    if (!ip || ip === "Unknown" || ip === "127.0.0.1") {
      toast({
        title: "❌ 無法複製",
        description: "IP 地址無效",
        variant: "destructive",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(ip)
      toast({
        title: "✅ 已複製",
        description: `IP 地址 ${ip} 已複製到剪貼簿`,
      })
    } catch (error) {
      toast({
        title: "❌ 複製失敗",
        description: "請手動選取並複製 IP 地址",
        variant: "destructive",
      })
    }
  }

  // 頁面載入時自動查詢
  useEffect(() => {
    fetchIPInfo()
  }, [])

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
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">IP 查詢工具</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">查詢您目前的網路IP位址資訊</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  最後更新: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <Button onClick={fetchIPInfo} disabled={isLoading} variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "查詢中..." : "重新查詢"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* IPv4 資訊卡片 */}
          {ipInfo.ipv4 && ipInfo.ipv4.ip && ipInfo.ipv4.ip !== "Unknown" && ipInfo.ipv4.ip !== "127.0.0.1" && (
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-white" />
                  </div>
                  <span>IPv4 資訊</span>
                  {ipInfo.ipv4.source && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {ipInfo.ipv4.source}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IP 地址</label>
                      <Button size="sm" variant="ghost" onClick={() => copyIP(ipInfo.ipv4!.ip)} className="h-6 w-6 p-0">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{ipInfo.ipv4.ip}</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">地理位置</label>
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {ipInfo.ipv4.city}, {ipInfo.ipv4.region}, {ipInfo.ipv4.country}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Server className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">網路服務商</label>
                    </div>
                    <div className="text-gray-900 dark:text-white">{ipInfo.ipv4.isp}</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">時區</label>
                    </div>
                    <div className="text-gray-900 dark:text-white">{ipInfo.ipv4.timezone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* IPv6 資訊卡片 */}
          {ipInfo.ipv6 && ipInfo.ipv6.ip && ipInfo.ipv6.ip !== "Unknown" && (
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <span>IPv6 資訊</span>
                  {ipInfo.ipv6.source && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                      {ipInfo.ipv6.source}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">IPv6 地址</label>
                      <Button size="sm" variant="ghost" onClick={() => copyIP(ipInfo.ipv6!.ip)} className="h-6 w-6 p-0">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400 break-all">
                      {ipInfo.ipv6.ip}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">地理位置</label>
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {ipInfo.ipv6.city}, {ipInfo.ipv6.region}, {ipInfo.ipv6.country}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Server className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">網路服務商</label>
                    </div>
                    <div className="text-gray-900 dark:text-white">{ipInfo.ipv6.isp}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 無 IPv6 提示 */}
          {ipInfo.ipv4 && (!ipInfo.ipv6 || !ipInfo.ipv6.ip || ipInfo.ipv6.ip === "Unknown") && (
            <Card className="shadow-lg border-0 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">IPv6 不可用</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      您的網路環境目前不支援 IPv6 或未啟用 IPv6 連線
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 載入中狀態 */}
          {isLoading && (
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">正在查詢 IP 資訊</h3>
                <p className="text-gray-500 dark:text-gray-400">請稍候，正在獲取您的網路資訊...</p>
              </CardContent>
            </Card>
          )}

          {/* 查詢失敗狀態 */}
          {!isLoading &&
            (!ipInfo.ipv4 || ipInfo.ipv4.ip === "Unknown" || ipInfo.ipv4.ip === "127.0.0.1") &&
            (!ipInfo.ipv6 || ipInfo.ipv6.ip === "Unknown") && (
              <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">無法獲取 IP 資訊</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">請檢查網路連線或稍後再試</p>
                  <Button onClick={fetchIPInfo} className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新查詢
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>
      </main>
    </div>
  )
}
