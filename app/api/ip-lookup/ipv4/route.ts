import { NextRequest, NextResponse } from 'next/server'

// 獲取客戶端真實 IP 地址
function getClientIP(request: NextRequest): string | null {
  // 檢查各種可能包含真實 IP 的標頭
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for 可能包含多個 IP，第一個是客戶端 IP
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

  // 如果都沒有，返回 null
  return null
}

export async function GET(request: NextRequest) {
  try {
    // 首先嘗試從請求標頭獲取客戶端 IP
    const clientIP = getClientIP(request)
    
    if (clientIP) {
      // 如果獲取到客戶端 IP，直接使用它查詢地理位置
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
        console.error('使用客戶端 IP 查詢失敗:', error)
      }
    }

    // 備用方案：使用外部服務獲取 IP
    const ipResponse = await fetch('https://api.ipify.org?format=json')
    const ipData = await ipResponse.json()
    
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
    } else {
      throw new Error(geoData.message || 'IP 查詢失敗')
    }
  } catch (error) {
    console.error('IPv4 查詢錯誤:', error)
    return NextResponse.json(
      { error: 'IPv4 資訊查詢失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
