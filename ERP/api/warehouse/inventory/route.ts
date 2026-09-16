import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRestaurantId } from '@/lib/db'
import { createAdminClient } from '@/lib/supabase/admin'

// GET - list stock items + recent inventory counts
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

    const adminClient = createAdminClient()
    const [{ data: stockItems }, { data: counts }] = await Promise.all([
      adminClient.from('stock_items').select('*').eq('cafe_id', restaurantId).order('name_ru'),
      adminClient.from('inventory_counts').select('*, inventory_count_items(*)').eq('cafe_id', restaurantId).order('started_at', { ascending: false }).limit(5)
    ])

    return NextResponse.json({ success: true, stockItems: stockItems || [], counts: counts || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST - create/finish inventory count, or manage stock items
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

    const body = await request.json()
    const adminClient = createAdminClient()

    // Create a new stock item
    if (body.action === 'create_item') {
      const { data, error } = await adminClient.from('stock_items').insert({
        cafe_id: restaurantId,
        name_ru: body.name_ru,
        name_kk: body.name_kk || body.name_ru,
        unit: body.unit || 'кг',
        qty: Number(body.qty) || 0,
        low_stock_threshold: Number(body.low_stock_threshold) || 5
      }).select().single()
      if (error) throw error
      return NextResponse.json({ success: true, item: data })
    }

    // Start inventory count
    if (body.action === 'start_count') {
      const { data: stockItems } = await adminClient
        .from('stock_items').select('id, qty').eq('cafe_id', restaurantId)

      const { data: count, error: countErr } = await adminClient
        .from('inventory_counts')
        .insert({ cafe_id: restaurantId, cashier_id: user.id, status: 'in_progress' })
        .select().single()
      if (countErr) throw countErr

      // Create items for each stock_item with current system_qty
      const items = (stockItems || []).map(s => ({
        inventory_count_id: count.id,
        stock_item_id: s.id,
        system_qty: s.qty,
        counted_qty: null
      }))
      let createdItems: any[] = []
      if (items.length > 0) {
        const { data, error: insertErr } = await adminClient
          .from('inventory_count_items')
          .insert(items)
          .select()
        if (!insertErr && data) {
          createdItems = data
        }
      }
      return NextResponse.json({ success: true, count, items: createdItems })
    }

    // Submit counted quantities and finalize
    if (body.action === 'finish_count') {
      const { countId, items } = body
      // items = [{ inventory_count_item_id, counted_qty }]
      for (const item of items) {
        await adminClient.from('inventory_count_items')
          .update({ counted_qty: Number(item.counted_qty) })
          .eq('id', item.id)
      }

      // Get final diffs and apply to stock
      const { data: countItems } = await adminClient
        .from('inventory_count_items')
        .select('*, stock_items(id, cafe_id, name_ru)')
        .eq('inventory_count_id', countId)

      for (const ci of countItems || []) {
        if (ci.counted_qty === null || ci.counted_qty === undefined) continue
        const diff = ci.counted_qty - ci.system_qty
        if (diff === 0) continue

        const stockItem = (ci as any).stock_items
        // Update stock qty
        await adminClient.from('stock_items').update({ qty: ci.counted_qty, updated_at: new Date().toISOString() }).eq('id', ci.stock_item_id)
        // Log movement
        await adminClient.from('stock_movements').insert({
          cafe_id: stockItem?.cafe_id,
          stock_item_id: ci.stock_item_id,
          delta: diff,
          reason: 'inventory_count',
          reference_id: countId,
          note: `Инвентаризация #${countId.slice(0, 8)}`
        })
      }

      // Mark count as completed
      await adminClient.from('inventory_counts').update({ status: 'completed', finished_at: new Date().toISOString() }).eq('id', countId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
