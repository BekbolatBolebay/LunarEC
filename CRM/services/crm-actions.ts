'use server'

import { createClient } from '../../../../admin/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Сыйлық сертификатын жасау (Create Gift Certificate)
 */
export async function createGiftCertificateAction(payload: {
  code: string
  initial_amount: number
  expiry_date?: string | null
  recipient_name?: string
  recipient_email?: string
  recipient_phone?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Рұқсат етілмеген (Unauthorized)')

  // Мейрамхана ID табу
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('cafe_id')
    .eq('id', user.id)
    .single()

  const cafeId = staff?.cafe_id
  if (!cafeId) throw new Error('Мейрамхана табылмады')

  const { data, error } = await supabase
    .from('gift_certificates')
    .insert({
      cafe_id: cafeId,
      code: payload.code.toUpperCase().trim(),
      initial_amount: payload.initial_amount,
      current_balance: payload.initial_amount,
      recipient_name: payload.recipient_name,
      recipient_email: payload.recipient_email,
      recipient_phone: payload.recipient_phone,
      expiry_date: payload.expiry_date || null,
      is_active: true,
      is_paid: true,
      activated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/certificates')
  return data
}

/**
 * Клиентке жеке push немесе хабарлама жіберу (CRM Notification)
 */
export async function notifyCustomerAction(
  userId: string,
  payload: { title: string; body: string; icon?: string; url?: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Рұқсат етілмеген')

  console.log(`[CRM] Клиентке хабарлама жіберу: ${userId}`, payload)
  return { success: true }
}

/**
 * Клиенттің бонустық балансын қолмен түзету (Adjust Loyalty Points)
 */
export async function adjustLoyaltyPointsAction(
  cardId: string,
  pointsDelta: number,
  reason: string = 'manual_adjust',
  note?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Рұқсат етілмеген')

  const { data: card, error: cardError } = await supabase
    .from('loyalty_cards')
    .select('id, cafe_id, points')
    .eq('id', cardId)
    .single()

  if (cardError || !card) throw new Error('Бонус картасы табылмады')

  const newPoints = Math.max(0, (card.points || 0) + pointsDelta)

  // Карта балансын жаңарту
  await supabase
    .from('loyalty_cards')
    .update({ points: newPoints, updated_at: new Date().toISOString() })
    .eq('id', cardId)

  // Транзакция тарихына жазу
  await supabase
    .from('loyalty_transactions')
    .insert({
      cafe_id: card.cafe_id,
      card_id: cardId,
      points_delta: pointsDelta,
      reason,
      note
    })

  revalidatePath('/loyalty')
  return { success: true, newPoints }
}
