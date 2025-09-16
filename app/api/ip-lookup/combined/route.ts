import { type NextRequest, NextResponse } from "next/server"

// 獲取客戶端真實 IP 地址
function getClientIP(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip")
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  const clientIP = request.headers.get("x-client-ip")
  if (clientIP) {
    return clientIP
  }

  return null
}

// 安全的 JSON 解析
async function safeJsonParse(response: Response) {
  try {
    const text = await response.text()
    if (!text.trim()) {
      throw new Error("Empty response")
    }

    // 檢查是否為 HTML 回應（通常是錯誤頁面）
    if (text.trim().startsWith("<") || text.includes("<!DOCTYPE")) {
      throw new Error("Received HTML instead of JSON")
    }

    return JSON.parse(text)
  } catch (error) {
    console.error("JSON 解析失敗:", error)
    throw new Error("Invalid JSON response")
  }
}

// 獲取 IPv4 地址
async function getIPv4Address(): Promise<string | null> {
  const services = ["https://api.ipify.org?format=json", "https://httpbin.org/ip", "https://icanhazip.com"]

  for (const service of services) {
    try {
      const response = await fetch(service, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) continue

      if (service.includes("icanhazip.com")) {
        // icanhazip 返回純文字
        const ip = (await response.text()).trim()
        if (ip && !ip.includes(":") && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          return ip
        }
      } else {
        const data = await safeJsonParse(response)
        const ip = data.ip || data.origin?.split(",")[0]?.trim()
        if (ip && !ip.includes(":")) {
          return ip
        }
      }
    } catch (error) {
      console.error(`IPv4 服務失敗 (${service}):`, error)
      continue
    }
  }

  return null
}

// 獲取 IPv6 地址
async function getIPv6Address(): Promise<string | null> {
  try {
    const response = await fetch("https://api64.ipify.org?format=json", {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) return null

    const data = await safeJsonParse(response)
    const ip = data.ip
    if (ip && ip.includes(":")) {
      return ip
    }
  } catch (error) {
    console.error("IPv6 服務失敗:", error)
  }

  return null
}

// 查詢地理位置資訊（使用多個服務）
async function getGeoInfo(ip: string) {
  // 嘗試多個地理位置服務
  const geoServices = [
    {
      url: `https://ipapi.co/${ip}/json/`,
      parser: (data: any) => ({
        ip: data.ip || ip,
        country: data.country_name || "Unknown",
        region: data.region || "Unknown",
        city: data.city || "Unknown",
        isp: data.org || "Unknown",
        timezone: data.timezone || "Unknown",
      }),
    },
    {
      url: `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp,org,timezone,query`,
      parser: (data: any) => {
        if (data.status !== "success") throw new Error(data.message || "API failed")
        return {
          ip: data.query || ip,
          country: data.country || "Unknown",
          region: data.regionName || "Unknown",
          city: data.city || "Unknown",
          isp: data.isp || data.org || "Unknown",
          timezone: data.timezone || "Unknown",
        }
      },
    },
  ]

  for (const service of geoServices) {
    try {
      const response = await fetch(service.url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)",
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) continue

      const data = await safeJsonParse(response)
      return service.parser(data)
    } catch (error) {
      console.error(`地理位置服務失敗 (${service.url}):`, error)
      continue
    }
  }

  // 如果所有服務都失敗，返回基本資訊
  return {
    ip: ip,
    country: "Unknown",
    region: "Unknown",
    city: "Unknown",
    isp: "Unknown",
    timezone: "Unknown",
  }
}

export async function GET(request: NextRequest) {
  try {
    const results = {
      ipv4: null as any,
      ipv6: null as any,
    }

    // 獲取客戶端 IP
    const clientIP = getClientIP(request)

    // IPv4 查詢
    try {
      let ipv4Address = null

      // 優先使用客戶端 IP（如果是有效的 IPv4）
      if (
        clientIP &&
        !clientIP.includes(":") &&
        clientIP !== "127.0.0.1" &&
        clientIP !== "localhost" &&
        clientIP.match(/^\d+\.\d+\.\d+\.\d+$/)
      ) {
        ipv4Address = clientIP
      } else {
        // 使用外部服務
        ipv4Address = await getIPv4Address()
      }

      if (ipv4Address) {
        const geoInfo = await getGeoInfo(ipv4Address)
        results.ipv4 = {
          ...geoInfo,
          source: clientIP && !clientIP.includes(":") ? "client-header" : "external-service",
        }
      }
    } catch (error) {
      console.error("IPv4 查詢失敗:", error)
      results.ipv4 = null
    }

    // IPv6 查詢
    try {
      let ipv6Address = null

      // 優先使用客戶端 IP（如果是 IPv6）
      if (clientIP && clientIP.includes(":")) {
        ipv6Address = clientIP
      } else {
        // 使用外部服務
        ipv6Address = await getIPv6Address()
      }

      if (ipv6Address) {
        const geoInfo = await getGeoInfo(ipv6Address)
        results.ipv6 = {
          ...geoInfo,
          source: clientIP && clientIP.includes(":") ? "client-header" : "external-service",
        }
      }
    } catch (error) {
      console.error("IPv6 查詢失敗:", error)
      results.ipv6 = null
    }

    // 如果兩個都失敗，提供一個基本的回應
    if (!results.ipv4 && !results.ipv6) {
      results.ipv4 = {
        ip: "127.0.0.1",
        country: "Local",
        region: "Local",
        city: "Local",
        isp: "Local Network",
        timezone: "Local",
        source: "fallback",
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("IP 查詢錯誤:", error)

    // 返回錯誤但仍提供基本結構
    return NextResponse.json({
      ipv4: {
        ip: "Unknown",
        country: "Unknown",
        region: "Unknown",
        city: "Unknown",
        isp: "Unknown",
        timezone: "Unknown",
        source: "error",
      },
      ipv6: null,
      error: "IP 資訊查詢失敗",
      details: error instanceof Error ? error.message : "未知錯誤",
    })
  }
}
