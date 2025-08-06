import { NextRequest, NextResponse } from 'next/server'

function getClientIP(request: NextRequest): string | null {
  // 嘗試從各種標頭獲取真實的客戶端 IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  const xClientIP = request.headers.get('x-client-ip')
  
  // x-forwarded-for 可能包含多個 IP，取第一個
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }
  
  // 其他標頭通常只包含一個 IP
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (xClientIP) return xClientIP
  
  // 最後嘗試從 request 對象獲取
  const ip = request.ip
  if (ip && ip !== '127.0.0.1' && ip !== '::1') {
    return ip
  }
  
  return null
}

export async function GET(request: NextRequest) {
  try {
    // 首先嘗試從請求標頭獲取客戶端 IP
    const clientIP = getClientIP(request)
    
    if (clientIP) {
      // 如果我們有客戶端 IP，直接查詢其詳細資訊
      try {
        const detailResponse = await fetch(`https://ipapi.co/${clientIP}/json/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
          },
        })
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json()
          if (!detailData.error) {
            return NextResponse.json({
              ip: clientIP,
              country: detailData.country_name || '未知',
              region: detailData.region || '未知',
              city: detailData.city || '未知',
              isp: detailData.org || '未知',
              timezone: detailData.timezone || '未知'
            })
          }
        }
      } catch (error) {
        console.warn('Failed to get client IP details:', error)
      }
    }
    
    // 如果無法從標頭獲取，則使用外部服務
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.reason || 'API error')
    }
    
    return NextResponse.json({
      ip: data.ip,
      country: data.country_name || '未知',
      region: data.region || '未知',
      city: data.city || '未知',
      isp: data.org || '未知',
      timezone: data.timezone || '未知'
    })
  } catch (error) {
    console.error('IPv4 lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IPv4 information' },
      { status: 500 }
    )
  }
}
