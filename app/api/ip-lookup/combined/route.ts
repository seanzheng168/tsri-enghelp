import { NextRequest, NextResponse } from 'next/server'

// 獲取客戶端真實 IP 地址
function getClientIP(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  const clientIP = request.headers.get('x-client-ip')
  if (clientIP) {
    return clientIP
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const results = {
      ipv4: null as any,
      ipv6: null as any
    }

    // 獲取客戶端 IP
    const clientIP = getClientIP(request)

    // IPv4 查詢
    try {
      let ipv4Address = null
      
      if (clientIP && !clientIP.includes(':')) {
        // 如果客戶端 IP 是 IPv4
        ipv4Address = clientIP
      } else {
        // 備用方案：使用外部服務
        const ipv4Response = await fetch('https://api.ipify.org?format=json')
        const ipv4Data = await ipv4Response.json()
        ipv4Address = ipv4Data.ip
      }

      if (ipv4Address) {
        const geoResponse = await fetch(`http://ip-api.com/json/${ipv4Address}?fields=status,message,country,regionName,city,isp,org,timezone,query`)
        const geoData = await geoResponse.json()
        
        if (geoData.status === 'success') {
          results.ipv4 = {
            ip: geoData.query,
            country: geoData.country,
            region: geoData.regionName,
            city: geoData.city,
            isp: geoData.isp,
            org: geoData.org,
            timezone: geoData.timezone,
            source: clientIP && !clientIP.includes(':') ? 'client-header' : 'external-service'
          }
        }
      }
    } catch (error) {
      console.error('IPv4 查詢失敗:', error)
      results.ipv4 = { error: 'IPv4 查詢失敗' }
    }

    // IPv6 查詢
    try {
      let ipv6Address = null
      
      if (clientIP && clientIP.includes(':')) {
        // 如果客戶端 IP 是 IPv6
        ipv6Address = clientIP
      } else {
        // 備用方案：使用外部服務
        const ipv6Response = await fetch('https://api64.ipify.org?format=json')
        const ipv6Data = await ipv6Response.json()
        if (ipv6Data.ip && ipv6Data.ip.includes(':')) {
          ipv6Address = ipv6Data.ip
        }
      }

      if (ipv6Address) {
        const geoResponse = await fetch(`http://ip-api.com/json/${ipv6Address}?fields=status,message,country,regionName,city,isp,org,timezone,query`)
        const geoData = await geoResponse.json()
        
        if (geoData.status === 'success') {
          results.ipv6 = {
            ip: geoData.query,
            country: geoData.country,
            region: geoData.regionName,
            city: geoData.city,
            isp: geoData.isp,
            org: geoData.org,
            timezone: geoData.timezone,
            source: clientIP && clientIP.includes(':') ? 'client-header' : 'external-service'
          }
        }
      } else {
        results.ipv6 = {
          error: 'IPv6 不可用',
          message: '您的網路環境目前不支援 IPv6 或沒有啟用 IPv6 連線'
        }
      }
    } catch (error) {
      console.error('IPv6 查詢失敗:', error)
      results.ipv6 = {
        error: 'IPv6 不可用',
        message: '您的網路環境目前不支援 IPv6 或沒有啟用 IPv6 連線'
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('IP 查詢錯誤:', error)
    return NextResponse.json(
      { error: 'IP 資訊查詢失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
