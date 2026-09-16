import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRestaurantId } from '@/lib/db'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

    const adminClient = createAdminClient()
    const [{ data: cards }, { data: restaurant }] = await Promise.all([
      adminClient.from('loyalty_cards').select('*, loyalty_transactions(*)').eq('cafe_id', restaurantId).order('points', { ascending: false }).limit(50),
      adminClient.from('restaurants').select('loyalty_enabled, loyalty_points_per_tenge, loyalty_tenge_per_point').eq('id', restaurantId).single()
    ])

    return NextResponse.json({ success: true, cards: cards || [], settings: restaurant || {} })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

    const body = await request.json()
    const adminClient = createAdminClient()

    // Toggle loyalty on/off + update settings
    if (body.action === 'update_settings') {
      await adminClient.from('restaurants').update({
        loyalty_enabled: body.loyalty_enabled,
        loyalty_points_per_tenge: Number(body.loyalty_points_per_tenge) || 0.01,
        loyalty_tenge_per_point: Number(body.loyalty_tenge_per_point) || 1.0
      }).eq('id', restaurantId)
      return NextResponse.json({ success: true })
    }

    // Manual point adjustment
    if (body.action === 'adjust_points') {
      const { card_id, points_delta, note } = body
      const { data: card } = await adminClient.from('loyalty_cards').select('points').eq('id', card_id).single()
      if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })
      const newPoints = Math.max(0, card.points + points_delta)
      await adminClient.from('loyalty_cards').update({ points: newPoints, updated_at: new Date().toISOString() }).eq('id', card_id)
      await adminClient.from('loyalty_transactions').insert({
        cafe_id: restaurantId,
        card_id,
        points_delta,
        reason: 'manual_adjust',
        note: note || 'Қолмен реттеу'
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
