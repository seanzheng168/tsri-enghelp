"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, RefreshCw, Key, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function PasswordGeneratorPage() {
  const [passwordCount, setPasswordCount] = useState(10)
  const [passwordLength, setPasswordLength] = useState(12)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [generatedPasswords, setGeneratedPasswords] = useState<string[]>([])
  const { toast } = useToast()

  const generatePasswords = () => {
    let charset = ""

    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    charset += "0123456789"
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:<>?"

    if (excludeAmbiguous) {
      charset = charset.replace(/[0O1lI.,|]/g, "")
    }

    const passwords: string[] = []
    const specialChars = "!@#$%^&*()_+-=[]{}|;:<>?"

    for (let i = 0; i < passwordCount; i++) {
      let password = ""
      let specialCharCount = 0
      const maxSpecialChars = 3

      for (let j = 0; j < passwordLength; j++) {
        let char = charset.charAt(Math.floor(Math.random() * charset.length))

        if (specialChars.includes(char) && specialCharCount >= maxSpecialChars) {
          let nonSpecialCharset = charset
          for (const specialChar of specialChars) {
            nonSpecialCharset = nonSpecialCharset.replace(new RegExp(`\\${specialChar}`, "g"), "")
          }
          char = nonSpecialCharset.charAt(Math.floor(Math.random() * nonSpecialCharset.length))
        } else if (specialChars.includes(char)) {
          specialCharCount++
        }

        password += char
      }
      passwords.push(password)
    }

    setGeneratedPasswords(passwords)
  }

  const copyAllPasswords = async () => {
    const allPasswords = generatedPasswords.join("\n")
    try {
      await navigator.clipboard.writeText(allPasswords)
      toast({
        title: "複製成功",
        description: `已複製 ${generatedPasswords.length} 組密碼到剪貼簿`,
      })
    } catch (err) {
      toast({
        title: "複製失敗",
        description: "無法複製到剪貼簿",
        variant: "destructive",
      })
    }
  }

  const copyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password)
      toast({
        title: "複製成功",
        description: "密碼已複製到剪貼簿",
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
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首頁
              </Link>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">密碼產生器</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">安全密碼生成工具</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-white">密碼設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 密碼數量和長度設定 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="count">產生幾組密碼？</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={passwordCount}
                    onChange={(e) => setPasswordCount(Number.parseInt(e.target.value) || 1)}
                    className="bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">每組密碼長度？</Label>
                  <Input
                    id="length"
                    type="number"
                    min="4"
                    max="128"
                    value={passwordLength}
                    onChange={(e) => setPasswordLength(Number.parseInt(e.target.value) || 8)}
                    className="bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* 密碼選項 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclude-ambiguous"
                    checked={excludeAmbiguous}
                    onCheckedChange={(checked) => setExcludeAmbiguous(checked as boolean)}
                  />
                  <Label htmlFor="exclude-ambiguous">排除混淆字元 (0O0IL1|.,)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-uppercase"
                    checked={includeUppercase}
                    onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                  />
                  <Label htmlFor="include-uppercase">包含大寫英文</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-lowercase"
                    checked={includeLowercase}
                    onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                  />
                  <Label htmlFor="include-lowercase">包含小寫英文</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-symbols"
                    checked={includeSymbols}
                    onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                  />
                  <Label htmlFor="include-symbols">包含符號</Label>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={generatePasswords}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  產生密碼
                </Button>
                <Button
                  onClick={copyAllPasswords}
                  variant="outline"
                  disabled={generatedPasswords.length === 0}
                  className="flex-1 bg-transparent"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  複製全部密碼
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 生成的密碼顯示 */}
          {generatedPasswords.length > 0 && (
            <Card className="mt-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 dark:text-white">
                  生成的密碼 ({generatedPasswords.length} 組)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {generatedPasswords.map((password, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <code className="font-mono text-sm flex-1 mr-4 break-all">{password}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyPassword(password)}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {generatedPasswords.length === 0 && (
            <Card className="mt-6 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">密碼將顯示在此...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
