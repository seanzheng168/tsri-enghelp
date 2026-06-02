"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Copy, Trash2, Terminal, AlertTriangle, CheckCircle, Info } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

interface DhcpEntry {
  ip: string
  mac: string
  description: string
}

export default function PaloAltoDhcpPage() {
  const [selectedInterface, setSelectedInterface] = useState("ae3.80")
  const [currentMode, setCurrentMode] = useState("bulk")
  
  // Mode 1: Bulk input
  const [bulkInput, setBulkInput] = useState("")
  
  // Mode 2: Split columns
  const [ipColumn, setIpColumn] = useState("")
  const [macColumn, setMacColumn] = useState("")
  const [descColumn, setDescColumn] = useState("")
  
  // Output
  const [generatedCommands, setGeneratedCommands] = useState("尚未產生指令")

  const interfaces = [
    { value: "ae3.80", label: "ae3.80 (適用 192.168.80.x ~ 87.x)" },
    { value: "ae3.64", label: "ae3.64 (適用 192.168.64.x ~ 67.x)" },
  ]

  const buildCommand = (intf: string, ip: string, mac: string, desc: string): string => {
    let output = ""
    if (mac) {
      output += `set network dhcp interface ${intf} server reserved ${ip} mac ${mac}\n`
    }
    if (desc) {
      const safeDesc = desc.replace(/\s+/g, "_")
      output += `set network dhcp interface ${intf} server reserved ${ip} description ${safeDesc}\n`
    }
    return output
  }

  const generateCommands = () => {
    let bodyCommands = ""

    if (currentMode === "bulk") {
      const rawData = bulkInput.trim()
      if (!rawData) {
        toast({
          title: "請輸入資料",
          description: "請在輸入區域中填入 IP、MAC 和描述資料",
          variant: "destructive",
        })
        return
      }

      const lines = rawData.split("\n")
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 2) {
          bodyCommands += buildCommand(
            selectedInterface,
            parts[0],
            parts[1],
            parts.slice(2).join("_")
          )
        }
      })
    } else {
      const ips = ipColumn.trim().split("\n")
      const macs = macColumn.trim().split("\n")
      const descs = descColumn.trim().split("\n")

      if (!ips[0] || ips[0].trim() === "") {
        toast({
          title: "請輸入 IP 位址",
          description: "請至少輸入一個 IP 位址",
          variant: "destructive",
        })
        return
      }

      ips.forEach((ip, i) => {
        const cleanIp = ip.trim()
        const cleanMac = macs[i] ? macs[i].trim() : ""
        const cleanDesc = descs[i] ? descs[i].trim() : ""
        if (cleanIp !== "") {
          bodyCommands += buildCommand(selectedInterface, cleanIp, cleanMac, cleanDesc)
        }
      })
    }

    if (bodyCommands) {
      setGeneratedCommands(bodyCommands.trim())
      toast({
        title: "指令產生成功",
        description: "DHCP 設定指令已成功產生",
      })
    } else {
      setGeneratedCommands("查無有效資料，無法產生指令。")
      toast({
        title: "無法產生指令",
        description: "請檢查輸入資料格式是否正確",
        variant: "destructive",
      })
    }
  }

  const clearInputs = () => {
    setBulkInput("")
    setIpColumn("")
    setMacColumn("")
    setDescColumn("")
    setGeneratedCommands("尚未產生指令")
    toast({
      title: "已清空",
      description: "所有欄位已清空",
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    if (text === "尚未產生指令" || text.includes("無法產生指令")) {
      toast({
        title: "無法複製",
        description: "請先產生有效的指令",
        variant: "destructive",
      })
      return
    }
    navigator.clipboard.writeText(text)
    toast({
      title: "已複製",
      description: `${label}已複製到剪貼簿`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首頁
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Terminal className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Palo Alto DHCP 指令產生器
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PA Firewall DHCP Reserved IP Generator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Interface Selection */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Label className="font-semibold text-gray-700 dark:text-gray-300">
                  請對照 IP 範圍選擇介面:
                </Label>
                <Select value={selectedInterface} onValueChange={setSelectedInterface}>
                  <SelectTrigger className="w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interfaces.map((intf) => (
                      <SelectItem key={intf.value} value={intf.value}>
                        {intf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">請務必核對產出的 IP 是否在此介面範圍內！</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Tabs */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <Tabs value={currentMode} onValueChange={setCurrentMode}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="bulk">混合快速貼上 (Mode 1)</TabsTrigger>
                  <TabsTrigger value="split">分欄位大量貼上 (Mode 2)</TabsTrigger>
                </TabsList>

                <TabsContent value="bulk" className="space-y-4">
                  <div>
                    <Label className="font-semibold mb-2 block">
                      請輸入資料 (每列格式：IP MAC 描述(選填)):
                    </Label>
                    <Textarea
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      rows={10}
                      placeholder={`192.168.80.99 aa:bb:cc:11:22:33 Device_A\n192.168.64.99 dd:ee:ff:44:55:66 Device_B`}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="split" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="font-semibold mb-2 block">1. IP 位址</Label>
                      <Textarea
                        value={ipColumn}
                        onChange={(e) => setIpColumn(e.target.value)}
                        rows={10}
                        placeholder="192.168.80.100"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold mb-2 block">2. MAC 位址</Label>
                      <Textarea
                        value={macColumn}
                        onChange={(e) => setMacColumn(e.target.value)}
                        rows={10}
                        placeholder="aa:bb:cc:dd:ee:ff"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label className="font-semibold mb-2 block">3. 描述 (選填)</Label>
                      <Textarea
                        value={descColumn}
                        onChange={(e) => setDescColumn(e.target.value)}
                        rows={10}
                        placeholder="Host_Name"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <Button
                  onClick={generateCommands}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  產生指令
                </Button>
                <Button variant="outline" onClick={clearInputs}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空全部
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">產生的指令</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    【步驟一】開啟腳本模式與進入設定模式
                  </span>
                  <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-xs border border-orange-200 dark:border-orange-800">
                    <AlertTriangle className="w-3 h-3" />
                    請手動「一行一行」複製貼上至 PA，勿一次全抓
                  </span>
                </div>
                <div className="bg-gray-900 text-amber-400 p-4 rounded-lg font-mono text-sm border-l-4 border-amber-400">
                  <pre>set cli scripting-mode on{"\n"}configure</pre>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-600 dark:text-green-400">
                    【步驟二】大量灌入 DHCP 設定指令
                  </span>
                  <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-3 h-3" />
                    成功進入 [edit] 模式後，可複製下方所有指令一次貼上
                  </span>
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm border-l-4 border-green-500 min-h-[120px] whitespace-pre-wrap">
                  {generatedCommands}
                </div>
                <Button
                  onClick={() => copyToClipboard(generatedCommands, "步驟二指令")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  複製步驟二所有指令
                </Button>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    【步驟三】確認無誤後 Commit 套用設定
                  </span>
                  <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs border border-blue-200 dark:border-blue-800">
                    <Info className="w-3 h-3" />
                    執行此指令才會將設定正式寫入 Running Config
                  </span>
                </div>
                <div className="bg-gray-900 text-blue-400 p-4 rounded-lg font-mono text-sm border-l-4 border-blue-500">
                  <pre>commit</pre>
                </div>
                <Button
                  onClick={() => copyToClipboard("commit", "Commit 指令")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  複製 Commit 指令
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
