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
    let ipv4Address = null

    // 檢查客戶端 IP 是否為有效的 IPv4
    if (clientIP && !clientIP.includes(":") && clientIP !== "127.0.0.1" && clientIP.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      ipv4Address = clientIP
    } else {
      // 使用外部服務獲取 IP
      const services = ["https://api.ipify.org?format=json", "https://httpbin.org/ip", "https://icanhazip.com"]

      for (const service of services) {
        try {
          const ipResponse = await fetch(service, {
            headers: {
              Accept: "application/json",
              "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)",
            },
            signal: AbortSignal.timeout(5000),
          })

          if (!ipResponse.ok) continue

          if (service.includes("icanhazip.com")) {
            // icanhazip 返回純文字
            const ip = (await ipResponse.text()).trim()
            if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
              ipv4Address = ip
              break
            }
          } else {
            const ipData = await safeJsonParse(ipResponse)
            const ip = ipData.ip || ipData.origin?.split(",")[0]?.trim()
            if (ip && !ip.includes(":")) {
              ipv4Address = ip
              break
            }
          }
        } catch (error) {
          console.error(`IP 服務失敗 (${service}):`, error)
          continue
        }
      }
    }

    if (!ipv4Address) {
      throw new Error("無法獲取有效的 IPv4 地址")
    }

    // 查詢地理位置 - 使用多個服務
    const geoServices = [
      {
        url: `https://ipapi.co/${ipv4Address}/json/`,
        parser: (data: any) => ({
          ip: data.ip || ipv4Address,
          country: data.country_name || "Unknown",
          region: data.region || "Unknown",
          city: data.city || "Unknown",
          isp: data.org || "Unknown",
          org: data.org || "Unknown",
          timezone: data.timezone || "Unknown",
        }),
      },
    ]

    for (const service of geoServices) {
      try {
        const geoResponse = await fetch(service.url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)",
          },
          signal: AbortSignal.timeout(8000),
        })

        if (!geoResponse.ok) continue

        const geoData = await safeJsonParse(geoResponse)
        const result = service.parser(geoData)

        return NextResponse.json({
          ...result,
          source: clientIP && !clientIP.includes(":") ? "client-header" : "external-service",
        })
      } catch (error) {
        console.error(`地理位置服務失敗 (${service.url}):`, error)
        continue
      }
    }

    // 如果地理位置查詢失敗，返回基本 IP 資訊
    return NextResponse.json({
      ip: ipv4Address,
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      isp: "Unknown",
      org: "Unknown",
      timezone: "Unknown",
      source: "basic",
    })
  } catch (error) {
    console.error("IPv4 查詢錯誤:", error)
    return NextResponse.json(
      {
        error: "IPv4 資訊查詢失敗",
        details: error instanceof Error ? error.message : "未知錯誤",
      },
      { status: 500 },
    )
  }
}
