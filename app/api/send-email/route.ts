import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const {
    recipients,
    subject,
    content,
  } = await req.json()

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"TSRI 通知" <${process.env.SMTP_USER}>`,
      to: recipients.join(','),
      subject,
      text: content,
    })

    return NextResponse.json({ message: 'Email sent successfully' })
  } catch (error) {
    console.error('寄信失敗:', error)
    return NextResponse.json({ message: 'Email sending failed', error }, { status: 500 })
  }
}
