import { NextResponse } from 'next/server'

export async function GET() {
  const results: any = {}
  
  // Fetch IPv4 information using multiple reliable sources
  try {
    // Try ipify first (most reliable for public IP)
    let ipv4Data = null
    
    try {
      const ipifyResponse = await fetch('https://api.ipify.org?format=json', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
        },
      })
      
      if (ipifyResponse.ok) {
        const data = await ipifyResponse.json()
        if (data.ip) {
          // Get detailed info from ipapi.co
          try {
            const detailResponse = await fetch(`https://ipapi.co/${data.ip}/json/`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
              },
            })
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json()
              if (!detailData.error) {
                ipv4Data = {
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
            console.warn('Failed to get IPv4 details, using basic info:', detailError)
            ipv4Data = {
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
      console.warn('ipify failed, trying backup service:', error)
    }
    
    // If ipify failed, try backup service
    if (!ipv4Data) {
      try {
        const backupResponse = await fetch('https://httpbin.org/ip', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TSRI-IP-Lookup/1.0)',
          },
        })
        
        if (backupResponse.ok) {
          const data = await backupResponse.json()
          if (data.origin) {
            ipv4Data = {
              ip: data.origin,
              country: '未知',
              region: '未知',
              city: '未知',
              isp: '未知',
              timezone: '未知'
            }
          }
        }
      } catch (backupError) {
        console.warn('Backup service also failed:', backupError)
      }
    }
    
    if (ipv4Data) {
      results.ipv4 = ipv4Data
    }
  } catch (error) {
    console.error('IPv4 lookup failed:', error)
  }
  
  // Try to fetch IPv6 information
  try {
    let ipv6Address = null
    
    // Method 1: Try ipify IPv6 service
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
    
    // Method 2: Try alternative service if first failed
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
      // Try to get detailed information
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
            // Basic IPv6 info without details
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
          // Basic IPv6 info without details
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
        // Basic IPv6 info without details
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
