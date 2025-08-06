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
    // 首先嘗試從請求標頭獲取客戶端 IP
    const clientIP = getClientIP(request)
    
    if (clientIP && clientIP.includes(':')) {
      // 如果是 IPv6 地址，直接查詢
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,message,country,regionName,city,isp,org,timezone,query`)
        const geoData = await geoResponse.json()
        
        if (geoData.status === 'success') {
          return NextResponse.json({
            ip: geoData.query,
            country: geoData.country,
            region: geoData.regionName,
            city: geoData.city,
            isp: geoData.isp,
            org: geoData.org,
            timezone: geoData.timezone,
            source: 'client-header'
          })
        }
      } catch (error) {
        console.error('使用客戶端 IPv6 查詢失敗:', error)
      }
    }

    // 備用方案：使用外部服務獲取 IPv6
    try {
      const ipResponse = await fetch('https://api64.ipify.org?format=json')
      const ipData = await ipResponse.json()
      
      if (ipData.ip && ipData.ip.includes(':')) {
        const geoResponse = await fetch(`http://ip-api.com/json/${ipData.ip}?fields=status,message,country,regionName,city,isp,org,timezone,query`)
        const geoData = await geoResponse.json()
        
        if (geoData.status === 'success') {
          return NextResponse.json({
            ip: geoData.query,
            country: geoData.country,
            region: geoData.regionName,
            city: geoData.city,
            isp: geoData.isp,
            org: geoData.org,
            timezone: geoData.timezone,
            source: 'external-service'
          })
        }
      }
    } catch (error) {
      console.error('IPv6 外部服務查詢失敗:', error)
    }

    // 如果沒有 IPv6，返回相應訊息
    return NextResponse.json({
      error: 'IPv6 不可用',
      message: '您的網路環境目前不支援 IPv6 或沒有啟用 IPv6 連線'
    }, { status: 404 })
  } catch (error) {
    console.error('IPv6 查詢錯誤:', error)
    return NextResponse.json(
      { error: 'IPv6 資訊查詢失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
