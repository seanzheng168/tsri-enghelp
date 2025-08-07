import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const {
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_password,
    sender_email,
    sender_name,
    recipients,
    subject,
    content,
  } = await req.json()

  try {
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: smtp_port,
      secure: smtp_port === 465,
      auth: {
        user: smtp_user,
        pass: smtp_password,
      },
    })

    await transporter.sendMail({
      from: `"${sender_name}" <${sender_email}>`,
      to: recipients.join(','),
      subject,
      text: content,
    })

    return NextResponse.json({ message: 'Email sent successfully' })
  } catch (error) {
    console.error('Send email failed:', error)
    return NextResponse.json({ message: 'Email sending failed', error }, { status: 500 })
  }
}
