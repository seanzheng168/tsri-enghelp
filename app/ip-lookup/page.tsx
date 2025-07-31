"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, ArrowLeft, Construction } from "lucide-react"
import Link from "next/link"

export default function IPLookupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">網路IP位址查詢服務</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <Card className="max-w-2xl mx-auto shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Construction className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900 dark:text-white">功能開發中</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">IP 查詢工具功能正在開發中，敬請期待！</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              此功能將提供IP位址查詢、地理位置顯示和網路資訊分析
            </p>
            <Button asChild className="mt-6">
              <Link href="/">返回首頁</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
