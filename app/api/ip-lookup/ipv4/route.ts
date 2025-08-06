import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IP-Lookup-Tool/1.0)',
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
