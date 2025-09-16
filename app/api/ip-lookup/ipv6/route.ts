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

    // 檢查是否為 HTML 回應
    if (text.trim().startsWith("<") || text.includes("<!DOCTYPE")) {
      throw new Error("Received HTML instead of JSON")
    }

    return JSON.parse(text)
  } catch (error) {
    console.error("JSON 解析失敗:", error)
    throw new Error("Invalid JSON response")
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    let ipv6Address = null

    if (clientIP && clientIP.includes(":")) {
      ipv6Address = clientIP
    } else {
      // 使用外部服務獲取 IPv6
      try {
        const ipResponse = await fetch("https://api64.ipify.org?format=json", {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)",
          },
          signal: AbortSignal.timeout(5000),
        })

        if (ipResponse.ok) {
          const ipData = await safeJsonParse(ipResponse)
          if (ipData.ip && ipData.ip.includes(":")) {
            ipv6Address = ipData.ip
          }
        }
      } catch (error) {
        console.error("IPv6 外部服務失敗:", error)
      }
    }

    if (!ipv6Address) {
      return NextResponse.json(
        {
          error: "IPv6 不可用",
          message: "您的網路環境目前不支援 IPv6 或沒有啟用 IPv6 連線",
        },
        { status: 404 },
      )
    }

    // 查詢地理位置
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ipv6Address}/json/`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)",
        },
        signal: AbortSignal.timeout(8000),
      })

      if (geoResponse.ok) {
        const geoData = await safeJsonParse(geoResponse)

        return NextResponse.json({
          ip: geoData.ip || ipv6Address,
          country: geoData.country_name || "Unknown",
          region: geoData.region || "Unknown",
          city: geoData.city || "Unknown",
          isp: geoData.org || "Unknown",
          org: geoData.org || "Unknown",
          timezone: geoData.timezone || "Unknown",
          source: clientIP && clientIP.includes(":") ? "client-header" : "external-service",
        })
      }
    } catch (geoError) {
      console.error("IPv6 地理位置查詢失敗:", geoError)
    }

    // 返回基本 IPv6 資訊
    return NextResponse.json({
      ip: ipv6Address,
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      isp: "Unknown",
      org: "Unknown",
      timezone: "Unknown",
      source: "basic",
    })
  } catch (error) {
    console.error("IPv6 查詢錯誤:", error)
    return NextResponse.json(
      {
        error: "IPv6 資訊查詢失敗",
        details: error instanceof Error ? error.message : "未知錯誤",
      },
      { status: 500 },
    )
  }
}
