/**
-- =========================================================
-- CRM NOTIFICATIONS SERVICE
-- Клиенттермен өзара байланыс және маркетингтік хабарламалар
-- =========================================================
*/

import nodemailer from 'nodemailer'
import webpush from 'web-push'

// SMTP Конфигурациясы
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Клиентке маркетингтік немесе транзакциялық Email жіберу
 */
export async function sendCustomerEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Mazir App CRM" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('[CRM Email Error]:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Клиенттің телефонына немесе браузеріне Web-Push / FCM хабарлама жіберу
 */
export async function sendCustomerPush(
  user: { fcm_token?: string; push_subscription?: any },
  payload: { title: string; body: string; icon?: string; url?: string }
) {
  try {
    // VAPID Web Push
    if (user.push_subscription && process.env.VAPID_PRIVATE_KEY) {
      await webpush.sendNotification(
        user.push_subscription,
        JSON.stringify(payload)
      )
      return { success: true }
    }
    return { success: false, reason: 'Жазылым токені жоқ' }
  } catch (err: any) {
    console.error('[CRM Push Error]:', err)
    return { success: false, error: err.message }
  }
}
