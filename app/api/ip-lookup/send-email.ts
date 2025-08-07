import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

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
  } = req.body

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })


    await transporter.sendMail({
      from: `"${sender_name}" <${sender_email}>`,
      to: recipients.join(','),
      subject,
      text: content,
    })

    return res.status(200).json({ message: 'Email sent successfully' })
  } catch (error) {
    console.error('Send email failed:', error)
    return res.status(500).json({ message: 'Email sending failed', error })
  }
}
