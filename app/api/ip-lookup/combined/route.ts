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
  const results: any = {}
  
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
          results.ipv4 = {
            ip: clientIP,
            country: detailData.country_name || '未知',
            region: detailData.region || '未知',
            city: detailData.city || '未知',
            isp: detailData.org || '未知',
            timezone: detailData.timezone || '未知'
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get client IP details:', error)
    }
  }
  
  // 如果無法從標頭獲取或查詢失敗，則使用外部服務
  if (!results.ipv4) {
    try {
      // 嘗試使用 ipify 服務
      const ipifyResponse = await fetch('https://api.ipify.org?format=json', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
        },
      })
      
      if (ipifyResponse.ok) {
        const data = await ipifyResponse.json()
        if (data.ip) {
          // 獲取詳細資訊
          try {
            const detailResponse = await fetch(`https://ipapi.co/${data.ip}/json/`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
              },
            })
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json()
              if (!detailData.error) {
                results.ipv4 = {
                  ip: data.ip,
                  country: detailData.country_name || '未知',
                  region: detailData.region || '未知',
                  city: detailData.city || '未知',
                  isp: detailData.org || '未知',
                  timezone: detailData.timezone || '未知'
                }
              }
            }
          } catch (detailError) {
            console.warn('Failed to get IPv4 details:', detailError)
            results.ipv4 = {
              ip: data.ip,
              country: '未知',
              region: '未知',
              city: '未知',
              isp: '未知',
              timezone: '未知'
            }
          }
        }
      }
    } catch (error) {
      console.error('IPv4 lookup failed:', error)
    }
  }
  
  // 嘗試獲取 IPv6 資訊
  try {
    let ipv6Address = null
    
    // 方法 1: 嘗試 ipify IPv6 服務
    try {
      const response1 = await fetch('https://api6.ipify.org?format=json', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
        },
      })
      
      if (response1.ok) {
        const data1 = await response1.json()
        if (data1.ip && data1.ip.includes(':')) {
          ipv6Address = data1.ip
        }
      }
    } catch (error) {
      console.warn('IPv6 Method 1 failed:', error)
    }
    
    // 方法 2: 如果第一個方法失敗，嘗試替代服務
    if (!ipv6Address) {
      try {
        const response2 = await fetch('https://v6.ident.me/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
          },
        })
        
        if (response2.ok) {
          const text = await response2.text()
          const cleanText = text.trim()
          if (cleanText && cleanText.includes(':')) {
            ipv6Address = cleanText
          }
        }
      } catch (error) {
        console.warn('IPv6 Method 2 failed:', error)
      }
    }
    
    if (ipv6Address) {
      // 嘗試獲取詳細資訊
      try {
        const detailResponse = await fetch(`https://ipapi.co/${ipv6Address}/json/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
          },
        })
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json()
          
          if (!detailData.error) {
            results.ipv6 = {
              ip: ipv6Address,
              country: detailData.country_name || '未知',
              region: detailData.region || '未知',
              city: detailData.city || '未知',
              isp: detailData.org || '未知',
              timezone: detailData.timezone || '未知'
            }
          } else {
            results.ipv6 = {
              ip: ipv6Address,
              country: '未知',
              region: '未知',
              city: '未知',
              isp: '未知',
              timezone: '未知'
            }
          }
        } else {
          results.ipv6 = {
            ip: ipv6Address,
            country: '未知',
            region: '未知',
            city: '未知',
            isp: '未知',
            timezone: '未知'
          }
        }
      } catch (detailError) {
        console.warn('Failed to get IPv6 details:', detailError)
        results.ipv6 = {
          ip: ipv6Address,
          country: '未知',
          region: '未知',
          city: '未知',
          isp: '未知',
          timezone: '未知'
        }
      }
    }
  } catch (error) {
    console.error('IPv6 lookup failed:', error)
  }
  
  return NextResponse.json(results)
}
