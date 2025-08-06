import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Try multiple IPv6 detection services
    let ipv6Address = null
    
    // Method 1: Try ipify IPv6 service
    try {
      const response1 = await fetch('https://api6.ipify.org?format=json', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)',
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
    
    // Method 2: Try alternative service if first failed
    if (!ipv6Address) {
      try {
        const response2 = await fetch('https://v6.ident.me/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)',
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
    
    // Try to get detailed information about the IPv6 address
    try {
      const detailResponse = await fetch(`https://ipapi.co/${ipv6Address}/json/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)',
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
    
    // If detailed info fails, return basic info
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
