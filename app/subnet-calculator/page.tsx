"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Copy, ChevronDown, ChevronUp, Calculator } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

type IPMode = "ipv4" | "ipv6"
type Theme = "cyber" | "flat" | "terminal" | "glass"

export default function SubnetCalculator() {
  const [mode, setMode] = useState<IPMode>("ipv4")
  const [theme, setTheme] = useState<Theme>("cyber")
  const [isDark, setIsDark] = useState(false)

  // IPv4 inputs
  const [ipv4, setIpv4] = useState("")
  const [cidr, setCidr] = useState(24)
  const [maskSelect, setMaskSelect] = useState("/24")

  // IPv6 inputs
  const [ipv6, setIpv6] = useState("")

  // Results
  const [ipv4Results, setIpv4Results] = useState<any>(null)
  const [ipv6Results, setIpv6Results] = useState<any>(null)

  // Errors
  const [ipv4Error, setIpv4Error] = useState("")
  const [cidrError, setCidrError] = useState("")
  const [ipv6Error, setIpv6Error] = useState("")

  // 生成子網路遮罩選項
  const generateMaskOptions = () => {
    const options = []
    for (let i = 0; i <= 32; i++) {
      const mask = cidrToMask(i)
      options.push({ value: `/${i}`, label: `/${i} - ${mask}` })
    }
    return options
  }

  // CIDR 轉子網路遮罩
  const cidrToMask = (cidr: number): string => {
    const mask = []
    for (let i = 0; i < 4; i++) {
      const n = Math.min(cidr, 8)
      mask.push((256 - Math.pow(2, 8 - n)) & 255)
      cidr -= n
    }
    return mask.join(".")
  }

  // 子網路遮罩轉 CIDR
  const maskToCidr = (mask: string): number => {
    return mask
      .split(".")
      .map((octet) => Number.parseInt(octet).toString(2).split("1").length - 1)
      .reduce((a, b) => a + b, 0)
  }

  // 驗證 IPv4
  const validateIPv4 = (ip: string): boolean => {
    const pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    if (!pattern.test(ip)) return false
    const parts = ip.split(".").map(Number)
    return parts.every((p) => p >= 0 && p <= 255)
  }

  // 驗證 IPv6
  const validateIPv6 = (ip: string): boolean => {
    const pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(\/\d{1,3})?$/
    return pattern.test(ip)
  }

  // 計算 IPv4
  const calculateIPv4 = () => {
    setIpv4Error("")
    setCidrError("")

    if (!validateIPv4(ipv4)) {
      setIpv4Error("請輸入有效的 IPv4 位址")
      return
    }

    if (cidr < 0 || cidr > 32) {
      setCidrError("CIDR 必須在 0-32 之間")
      return
    }

    const octets = ipv4.split(".").map(Number)
    const ipBinary = octets.map((o) => o.toString(2).padStart(8, "0")).join("")

    const mask = cidrToMask(cidr)
    const maskOctets = mask.split(".").map(Number)

    // 計算網路位址
    const networkOctets = octets.map((o, i) => o & maskOctets[i])
    const network = networkOctets.join(".")

    // 計算廣播位址
    const wildcardOctets = maskOctets.map((m) => 255 - m)
    const broadcastOctets = networkOctets.map((n, i) => n | wildcardOctets[i])
    const broadcast = broadcastOctets.join(".")

    // 計算主機範圍
    const firstHost = [...networkOctets]
    firstHost[3] += 1
    const lastHost = [...broadcastOctets]
    lastHost[3] -= 1

    // 計算可用主機數
    const hosts = Math.pow(2, 32 - cidr) - 2

    // 判斷網路類別
    const firstOctet = octets[0]
    let networkClass = ""
    if (firstOctet < 128) networkClass = "A"
    else if (firstOctet < 192) networkClass = "B"
    else if (firstOctet < 224) networkClass = "C"
    else if (firstOctet < 240) networkClass = "D (Multicast)"
    else networkClass = "E (Reserved)"

    // 判斷位址類型
    let addressType = "公用位址 (Public)"
    if (firstOctet === 10) addressType = "私有位址 (Private - Class A)"
    else if (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) addressType = "私有位址 (Private - Class B)"
    else if (firstOctet === 192 && octets[1] === 168) addressType = "私有位址 (Private - Class C)"
    else if (firstOctet === 127) addressType = "本機迴路 (Loopback)"

    setIpv4Results({
      ip: ipv4,
      class: networkClass,
      type: addressType,
      mask,
      cidr: `/${cidr}`,
      wildcard: wildcardOctets.join("."),
      hosts: hosts > 0 ? hosts.toLocaleString() : "0",
      network,
      broadcast,
      range: `${firstHost.join(".")} - ${lastHost.join(".")}`,
      hex: octets.map((o) => o.toString(16).padStart(2, "0").toUpperCase()).join("."),
      binary: ipBinary,
      networkBinary: ipBinary.slice(0, cidr),
      hostBinary: ipBinary.slice(cidr),
    })
  }

  // 計算 IPv6
  const calculateIPv6 = () => {
    setIpv6Error("")

    let ip = ipv6
    let prefix = 64

    if (ip.includes("/")) {
      const parts = ip.split("/")
      ip = parts[0]
      prefix = Number.parseInt(parts[1])
    }

    if (!validateIPv6(ipv6)) {
      setIpv6Error("請輸入有效的 IPv6 位址")
      return
    }

    // 展開 IPv6
    const expandIPv6 = (addr: string): string => {
      if (addr.includes("::")) {
        const parts = addr.split("::")
        const left = parts[0] ? parts[0].split(":") : []
        const right = parts[1] ? parts[1].split(":") : []
        const missing = 8 - left.length - right.length
        const middle = Array(missing).fill("0000")
        return [...left, ...middle, ...right].map((p) => p.padStart(4, "0")).join(":")
      }
      return addr
        .split(":")
        .map((p) => p.padStart(4, "0"))
        .join(":")
    }

    const expanded = expandIPv6(ip)
    const parts = expanded.split(":")

    // 計算網路前綴
    const binary = parts.map((p) => Number.parseInt(p, 16).toString(2).padStart(16, "0")).join("")
    const networkBinary = binary.slice(0, prefix).padEnd(128, "0")

    // 轉回十六進位
    const networkParts = []
    for (let i = 0; i < 128; i += 16) {
      networkParts.push(
        Number.parseInt(networkBinary.slice(i, i + 16), 2)
          .toString(16)
          .padStart(4, "0"),
      )
    }

    const network = networkParts.join(":")

    // 計算主機數
    const hosts = prefix < 64 ? "2^" + (128 - prefix) : Math.pow(2, 128 - prefix).toLocaleString()

    setIpv6Results({
      ip: expanded,
      compressed: ip,
      prefix: `/${prefix}`,
      network,
      hosts,
      binary: binary.slice(0, prefix),
      hostBits: 128 - prefix,
    })
  }

  // 處理計算
  const handleCompute = () => {
    if (mode === "ipv4") {
      calculateIPv4()
    } else {
      calculateIPv6()
    }
  }

  // 重置
  const handleReset = () => {
    setIpv4("")
    setIpv6("")
    setCidr(24)
    setMaskSelect("/24")
    setIpv4Results(null)
    setIpv6Results(null)
    setIpv4Error("")
    setCidrError("")
    setIpv6Error("")
  }

  // 複製到剪貼簿
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "✅ 已複製",
      description: "內容已複製到剪貼簿",
    })
  }

  // 同步 CIDR 和遮罩選擇
  useEffect(() => {
    setMaskSelect(`/${cidr}`)
  }, [cidr])

  useEffect(() => {
    const cidrNum = Number.parseInt(maskSelect.replace("/", ""))
    setCidr(cidrNum)
  }, [maskSelect])

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-colors duration-300 py-8 px-4`}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            🧮 網段計算機
          </h1>
          <p className="text-gray-600 dark:text-gray-400">IPv4/IPv6 Subnet Calculator</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-center gap-4">
          <Button
            variant={mode === "ipv4" ? "default" : "outline"}
            onClick={() => setMode("ipv4")}
            className="min-w-[120px]"
          >
            IPv4
          </Button>
          <Button
            variant={mode === "ipv6" ? "default" : "outline"}
            onClick={() => setMode("ipv6")}
            className="min-w-[120px]"
          >
            IPv6
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              ✏️ 輸入區 ({mode === "ipv4" ? "IPv4" : "IPv6"})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "ipv4" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ipv4">IP 位址 (IPv4 Address)</Label>
                  <Input
                    id="ipv4"
                    placeholder="例如: 192.168.10.55"
                    value={ipv4}
                    onChange={(e) => setIpv4(e.target.value)}
                    className={ipv4Error ? "border-red-500" : ""}
                  />
                  {ipv4Error && <p className="text-sm text-red-500">{ipv4Error}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maskSelect">子網路遮罩 (Subnet Mask)</Label>
                  <Select value={maskSelect} onValueChange={setMaskSelect}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {generateMaskOptions().map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mask Bits / CIDR</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCidr(Math.max(0, cidr - 1))}
                      disabled={cidr <= 0}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max="32"
                      value={cidr}
                      onChange={(e) => setCidr(Number.parseInt(e.target.value) || 0)}
                      className={`text-center font-bold ${cidrError ? "border-red-500" : ""}`}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCidr(Math.min(32, cidr + 1))}
                      disabled={cidr >= 32}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  </div>
                  {cidrError && <p className="text-sm text-red-500">{cidrError}</p>}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="ipv6">IPv6 位址 (IPv6 Address)</Label>
                <Input
                  id="ipv6"
                  placeholder="例如: 2001:db8::1/64"
                  value={ipv6}
                  onChange={(e) => setIpv6(e.target.value)}
                  className={ipv6Error ? "border-red-500" : ""}
                />
                {ipv6Error && <p className="text-sm text-red-500">{ipv6Error}</p>}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCompute} className="flex-1">
                計算 Compute
              </Button>
              <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
                清除 Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="space-y-6">
          {mode === "ipv4" && ipv4Results && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>🧭 基本資訊 IPv4 Basic</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow label="IP 位址" value={ipv4Results.ip} onCopy={() => copyToClipboard(ipv4Results.ip)} />
                  <ResultRow label="網路類別" value={ipv4Results.class} />
                  <ResultRow label="位址類型" value={ipv4Results.type} />
                  <ResultRow
                    label="子網路遮罩"
                    value={ipv4Results.mask}
                    onCopy={() => copyToClipboard(ipv4Results.mask)}
                  />
                  <ResultRow label="CIDR" value={ipv4Results.cidr} onCopy={() => copyToClipboard(ipv4Results.cidr)} />
                  <ResultRow
                    label="萬用遮罩"
                    value={ipv4Results.wildcard}
                    onCopy={() => copyToClipboard(ipv4Results.wildcard)}
                  />
                  <ResultRow label="可用主機數" value={ipv4Results.hosts} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🌐 位址範圍 IPv4 Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="網路位址"
                    value={ipv4Results.network}
                    onCopy={() => copyToClipboard(ipv4Results.network)}
                  />
                  <ResultRow
                    label="廣播位址"
                    value={ipv4Results.broadcast}
                    onCopy={() => copyToClipboard(ipv4Results.broadcast)}
                  />
                  <ResultRow
                    label="主機範圍"
                    value={ipv4Results.range}
                    onCopy={() => copyToClipboard(ipv4Results.range)}
                    bold
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔁 其他表示法 IPv4 Others</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow label="十六進位" value={ipv4Results.hex} onCopy={() => copyToClipboard(ipv4Results.hex)} />
                  <ResultRow
                    label="二進位"
                    value={
                      <span className="font-mono text-xs break-all">
                        <span className="text-red-500 font-bold">{ipv4Results.networkBinary}</span>
                        <span className="text-green-500 font-bold">{ipv4Results.hostBinary}</span>
                      </span>
                    }
                    onCopy={() => copyToClipboard(ipv4Results.binary)}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {mode === "ipv6" && ipv6Results && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>🧭 基本資訊 IPv6 Basic</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow label="完整位址" value={ipv6Results.ip} onCopy={() => copyToClipboard(ipv6Results.ip)} />
                  <ResultRow
                    label="壓縮位址"
                    value={ipv6Results.compressed}
                    onCopy={() => copyToClipboard(ipv6Results.compressed)}
                  />
                  <ResultRow
                    label="前綴長度"
                    value={ipv6Results.prefix}
                    onCopy={() => copyToClipboard(ipv6Results.prefix)}
                  />
                  <ResultRow label="可用主機數" value={ipv6Results.hosts} />
                  <ResultRow label="主機位元數" value={ipv6Results.hostBits.toString()} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🌐 網路資訊 IPv6 Network</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ResultRow
                    label="網路前綴"
                    value={ipv6Results.network}
                    onCopy={() => copyToClipboard(ipv6Results.network)}
                  />
                  <ResultRow
                    label="網路位元 (二進位)"
                    value={
                      <span className="font-mono text-xs break-all text-red-500 font-bold">{ipv6Results.binary}</span>
                    }
                    onCopy={() => copyToClipboard(ipv6Results.binary)}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {!ipv4Results && !ipv6Results && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>請輸入 IP 位址並點擊計算按鈕</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 text-center text-sm text-gray-500 dark:text-gray-400 py-6 border-t border-gray-200 dark:border-gray-700">
        <p>© 2025 TSRI. All Rights Reserved.</p>
        <p className="mt-1">台灣半導體研究中心</p>
      </footer>
    </div>
  )
}

// 結果行組件
function ResultRow({
  label,
  value,
  onCopy,
  bold = false,
}: {
  label: string
  value: string | React.ReactNode
  onCopy?: () => void
  bold?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">{label}:</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className={`text-sm font-mono text-right ${bold ? "font-bold" : ""}`}>{value}</span>
        {onCopy && (
          <Button size="icon" variant="ghost" onClick={onCopy} className="h-6 w-6">
            <Copy className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
