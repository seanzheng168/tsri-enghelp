"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Copy,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  ChevronLeft,
  ChevronRight,
  FileText,
  Settings,
  Home,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

interface DHCPReservation {
  id: string
  ipAddress: string
  macAddress: string
  description: string
}

export default function FortigateDHCPPage() {
  const [dhcpId, setDhcpId] = useState("1")
  const [reservations, setReservations] = useState<DHCPReservation[]>([
    {
      id: "1",
      ipAddress: "192.168.1.10",
      macAddress: "00:11:22:33:44:55",
      description: "",
    },
  ])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DHCPReservation | null>(null)
  const [newReservation, setNewReservation] = useState({
    ipAddress: "",
    macAddress: "",
    description: "",
  })
  const [bulkImportText, setBulkImportText] = useState("")
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)

  const generateCommands = useCallback(() => {
    if (reservations.length === 0) return ""

    let commands = `config system dhcp server\nedit ${dhcpId}\n    config reserved-address\n`

    reservations.forEach((reservation) => {
      commands += `        edit 0\n`
      commands += `            set ip ${reservation.ipAddress}\n`
      commands += `            set mac ${reservation.macAddress}\n`
      commands += `            set description "${reservation.description}"\n`
      commands += `        next\n`
    })

    commands += `    end\nnext\nend`
    return commands
  }, [dhcpId, reservations])

  const copyCommands = async () => {
    const commands = generateCommands()
    if (!commands) {
      toast({
        title: "⚠️ 無法複製",
        description: "請先添加至少一個 IP-MAC 綁定",
        variant: "destructive",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(commands)
      toast({
        title: "✅ 複製成功",
        description: "Fortigate DHCP 指令已複製到剪貼板",
      })
    } catch (error) {
      toast({
        title: "❌ 複製失敗",
        description: "無法複製到剪貼板，請手動複製",
        variant: "destructive",
      })
    }
  }

  const exportToFile = () => {
    const commands = generateCommands()
    if (!commands) {
      toast({
        title: "⚠️ 無法匯出",
        description: "請先添加至少一個 IP-MAC 綁定",
        variant: "destructive",
      })
      return
    }

    const blob = new Blob([commands], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fortigate-dhcp-${dhcpId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "✅ 匯出成功",
      description: `檔案已下載：fortigate-dhcp-${dhcpId}.txt`,
    })
  }

  const isValidIP = (ip: string) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(ip)
  }

  const isValidMAC = (mac: string) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    return macRegex.test(mac)
  }

  const formatMAC = (mac: string) => {
    return mac
      .replace(/[:-]/g, "")
      .replace(/(.{2})/g, "$1:")
      .slice(0, -1)
      .toLowerCase()
  }

  const addReservation = () => {
    if (!newReservation.ipAddress || !newReservation.macAddress) {
      toast({
        title: "⚠️ 輸入不完整",
        description: "請填寫 IP 地址和 MAC 地址",
        variant: "destructive",
      })
      return
    }

    if (!isValidIP(newReservation.ipAddress)) {
      toast({
        title: "⚠️ IP 地址格式錯誤",
        description: "請輸入正確的 IP 地址格式",
        variant: "destructive",
      })
      return
    }

    if (!isValidMAC(newReservation.macAddress)) {
      toast({
        title: "⚠️ MAC 地址格式錯誤",
        description: "請輸入正確的 MAC 地址格式 (例: 00:11:22:33:44:55)",
        variant: "destructive",
      })
      return
    }

    const isDuplicate = reservations.some(
      (r) =>
        r.ipAddress === newReservation.ipAddress ||
        r.macAddress.toLowerCase() === newReservation.macAddress.toLowerCase(),
    )

    if (isDuplicate) {
      toast({
        title: "⚠️ 重複的地址",
        description: "IP 地址或 MAC 地址已存在",
        variant: "destructive",
      })
      return
    }

    const newId = Date.now().toString()
    const formattedMAC = formatMAC(newReservation.macAddress)

    setReservations([
      ...reservations,
      {
        id: newId,
        ipAddress: newReservation.ipAddress,
        macAddress: formattedMAC,
        description: newReservation.description || "未命名設備",
      },
    ])

    setNewReservation({ ipAddress: "", macAddress: "", description: "" })
    setIsAddDialogOpen(false)

    toast({
      title: "✅ 添加成功",
      description: "新的 DHCP 保留地址已添加",
    })
  }

  const updateReservation = () => {
    if (!editingItem) return

    if (!isValidIP(editingItem.ipAddress) || !isValidMAC(editingItem.macAddress)) {
      toast({
        title: "⚠️ 格式錯誤",
        description: "請檢查 IP 地址和 MAC 地址格式",
        variant: "destructive",
      })
      return
    }

    const updatedReservations = reservations.map((r) =>
      r.id === editingItem.id ? { ...editingItem, macAddress: formatMAC(editingItem.macAddress) } : r,
    )

    setReservations(updatedReservations)
    setEditingItem(null)

    toast({
      title: "✅ 更新成功",
      description: "DHCP 保留地址已更新",
    })
  }

  const deleteReservation = (id: string) => {
    setReservations(reservations.filter((r) => r.id !== id))
    toast({
      title: "✅ 刪除成功",
      description: "DHCP 保留地址已刪除",
    })
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setBulkImportText(content)
        processBulkImport(content)
      }
    }
    reader.readAsText(file)
  }

  const processBulkImport = (content?: string) => {
    const textToProcess = content || bulkImportText
    if (!textToProcess.trim()) {
      toast({
        title: "⚠️ 輸入為空",
        description: "請輸入要導入的數據或選擇檔案",
        variant: "destructive",
      })
      return
    }

    const lines = textToProcess.trim().split("\n")
    const newReservations: DHCPReservation[] = []
    let errorCount = 0

    lines.forEach((line, index) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim())
      if (parts.length >= 2) {
        const [ip, mac, desc = `設備${index + 1}`] = parts

        if (isValidIP(ip) && isValidMAC(mac)) {
          const exists = [...reservations, ...newReservations].some(
            (r) => r.ipAddress === ip || r.macAddress.toLowerCase() === mac.toLowerCase(),
          )

          if (!exists) {
            newReservations.push({
              id: `bulk_${Date.now()}_${index}`,
              ipAddress: ip,
              macAddress: formatMAC(mac),
              description: desc,
            })
          }
        } else {
          errorCount++
        }
      } else {
        errorCount++
      }
    })

    if (newReservations.length > 0) {
      setReservations([...reservations, ...newReservations])
      toast({
        title: "✅ 批量導入成功",
        description: `成功導入 ${newReservations.length} 個地址${errorCount > 0 ? `，跳過 ${errorCount} 個錯誤項目` : ""}`,
      })
    } else {
      toast({
        title: "⚠️ 導入失敗",
        description: "沒有有效的數據可以導入",
        variant: "destructive",
      })
    }

    setBulkImportText("")
    setIsBulkImportOpen(false)
  }

  const clearAll = () => {
    setReservations([])
    toast({
      title: "✅ 清除完成",
      description: "所有 DHCP 保留地址已清除",
    })
  }

  const totalPages = Math.ceil(reservations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReservations = reservations.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                返回首頁
              </Link>
            </Button>
            <div></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fortigate DHCP 指令生成器</h1>
          <p className="text-gray-600 dark:text-gray-300">快速生成防火牆定義MAC地址的Fortigate CLI指令</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>配置設定</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dhcp-id">DHCP 設備編號</Label>
                  <Input
                    id="dhcp-id"
                    value={dhcpId}
                    onChange={(e) => setDhcpId(e.target.value)}
                    placeholder="輸入 DHCP 設備編號"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        批量導入
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>批量導入 IP-MAC 綁定</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>方式一：上傳檔案 (支援 CSV, TXT)</Label>
                          <Input type="file" accept=".csv,.txt" onChange={handleFileImport} className="mt-2" />
                        </div>

                        <div className="text-center text-gray-500">或</div>

                        <div>
                          <Label>方式二：直接輸入文字</Label>
                          <p className="text-sm text-gray-500 mb-2">
                            格式：IP地址,MAC地址,描述（可選）
                            <br />
                            支援逗號(,)、分號(;)、Tab分隔
                          </p>
                          <Textarea
                            value={bulkImportText}
                            onChange={(e) => setBulkImportText(e.target.value)}
                            placeholder="192.168.1.10,00:11:22:33:44:55,設備1&#10;192.168.1.11,00:11:22:33:44:56,設備2&#10;192.168.1.12;00:11:22:33:44:57;設備3"
                            rows={8}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={() => processBulkImport()}>導入</Button>
                          <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>
                            取消
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" onClick={exportToFile}>
                    <Download className="w-4 h-4 mr-2" />
                    匯出檔案
                  </Button>

                  <Button variant="outline" size="sm" onClick={clearAll}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    清除全部
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>IP-MAC 綁定列表</CardTitle>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        新增項目
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新增 DHCP 保留地址</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-ip">IP 地址</Label>
                          <Input
                            id="new-ip"
                            value={newReservation.ipAddress}
                            onChange={(e) => setNewReservation({ ...newReservation, ipAddress: e.target.value })}
                            placeholder="192.168.1.10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-mac">MAC 地址</Label>
                          <Input
                            id="new-mac"
                            value={newReservation.macAddress}
                            onChange={(e) => setNewReservation({ ...newReservation, macAddress: e.target.value })}
                            placeholder="00:11:22:33:44:55"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-desc">描述（選填）</Label>
                          <Input
                            id="new-desc"
                            value={newReservation.description}
                            onChange={(e) => setNewReservation({ ...newReservation, description: e.target.value })}
                            placeholder="設備描述"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={addReservation}>添加</Button>
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            取消
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {reservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>尚未添加任何 IP-MAC 綁定</p>
                    <p className="text-sm">點擊「新增項目」開始添加</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP 地址</TableHead>
                          <TableHead>MAC 地址</TableHead>
                          <TableHead>描述</TableHead>
                          <TableHead className="w-20">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentReservations.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell className="font-mono">{reservation.ipAddress}</TableCell>
                            <TableCell className="font-mono">{reservation.macAddress}</TableCell>
                            <TableCell>{reservation.description}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button size="sm" variant="ghost" onClick={() => setEditingItem(reservation)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteReservation(reservation.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          顯示 {startIndex + 1}-{Math.min(endIndex, reservations.length)} 項，共 {reservations.length}{" "}
                          項
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>生成的指令</CardTitle>
                  <Button onClick={copyCommands} disabled={reservations.length === 0}>
                    <Copy className="w-4 h-4 mr-2" />
                    複製指令
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{generateCommands() || "# 請先添加 IP-MAC 綁定項目"}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>使用說明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>• IP地址格式：192.168.1.10</p>
                <p>• MAC地址格式：00:11:22:33:44:55 或 00-11-22-33-44-55</p>
                <p>• 批量導入支援：CSV檔案、TXT檔案、直接輸入</p>
                <p>• 分隔符號支援：逗號(,)、分號(;)、Tab</p>
                <p>
                  • <strong>所有edit編號設為0，不會覆蓋原有記錄</strong>
                </p>
                <p>• 生成的指令適用於 FortiOS 6.x 以上版本</p>
                <p>• 可直接複製指令到 FortiGate CLI 執行</p>
                <p>• 可匯出為檔案保存配置</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {editingItem && (
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>編輯 DHCP 保留地址</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-ip">IP 地址</Label>
                  <Input
                    id="edit-ip"
                    value={editingItem.ipAddress}
                    onChange={(e) => setEditingItem({ ...editingItem, ipAddress: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-mac">MAC 地址</Label>
                  <Input
                    id="edit-mac"
                    value={editingItem.macAddress}
                    onChange={(e) => setEditingItem({ ...editingItem, macAddress: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-desc">描述</Label>
                  <Input
                    id="edit-desc"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={updateReservation}>更新</Button>
                  <Button variant="outline" onClick={() => setEditingItem(null)}>
                    取消
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
