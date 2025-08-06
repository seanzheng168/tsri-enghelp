import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 嘗試多個 IPv6 檢測服務
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
      console.warn('Method 1 failed:', error)
    }
    
    // 方法 2: 如果第一個失敗，嘗試替代服務
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
        console.warn('Method 2 failed:', error)
      }
    }
    
    if (!ipv6Address) {
      return NextResponse.json(
        { error: 'IPv6 not available' },
        { status: 404 }
      )
    }
    
    // 嘗試獲取 IPv6 地址的詳細資訊
    try {
      const detailResponse = await fetch(`https://ipapi.co/${ipv6Address}/json/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
        },
      })
      
      if (detailResponse.ok) {
        const detailData = await detailResponse.json()
        
        if (!detailData.error) {
          return NextResponse.json({
            ip: ipv6Address,
            country: detailData.country_name || '未知',
            region: detailData.region || '未知',
            city: detailData.city || '未知',
            isp: detailData.org || '未知',
            timezone: detailData.timezone || '未知'
          })
        }
      }
    } catch (detailError) {
      console.warn('Failed to get IPv6 details:', detailError)
    }
    
    // 如果詳細資訊獲取失敗，返回基本資訊
    return NextResponse.json({
      ip: ipv6Address,
      country: '未知',
      region: '未知',
      city: '未知',
      isp: '未知',
      timezone: '未知'
    })
    
  } catch (error) {
    console.error('IPv6 lookup error:', error)
    return NextResponse.json(
      { error: 'IPv6 not available' },
      { status: 404 }
    )
  }
}
