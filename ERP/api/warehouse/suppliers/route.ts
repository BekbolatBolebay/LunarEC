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
    const [{ data: suppliers }, { data: purchaseOrders }] = await Promise.all([
      adminClient.from('suppliers').select('*').eq('cafe_id', restaurantId).eq('is_active', true).order('name'),
      adminClient.from('purchase_orders').select('*, suppliers(name), purchase_order_items(*)').eq('cafe_id', restaurantId).order('created_at', { ascending: false }).limit(20)
    ])
    return NextResponse.json({ success: true, suppliers: suppliers || [], purchaseOrders: purchaseOrders || [] })
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

    // Create supplier
    if (body.action === 'create_supplier') {
      const { data, error } = await adminClient.from('suppliers').insert({
        cafe_id: restaurantId, name: body.name, phone: body.phone, email: body.email, address: body.address
      }).select().single()
      if (error) throw error
      return NextResponse.json({ success: true, supplier: data })
    }

    // Create purchase order
    if (body.action === 'create_po') {
      const { data: po, error: poErr } = await adminClient.from('purchase_orders').insert({
        cafe_id: restaurantId,
        supplier_id: body.supplier_id || null,
        status: 'draft',
        notes: body.notes,
        created_by: user.id
      }).select().single()
      if (poErr) throw poErr

      // Insert PO items
      const items = (body.items || []).map((i: any) => ({
        purchase_order_id: po.id,
        stock_item_id: i.stock_item_id || null,
        name_ru: i.name_ru,
        qty: Number(i.qty) || 0,
        unit: i.unit || 'кг',
        price_per_unit: Number(i.price_per_unit) || 0
      }))
      if (items.length > 0) {
        await adminClient.from('purchase_order_items').insert(items)
      }
      // Update total
      const total = items.reduce((s: number, i: any) => s + i.qty * i.price_per_unit, 0)
      await adminClient.from('purchase_orders').update({ total_amount: total }).eq('id', po.id)
      return NextResponse.json({ success: true, po })
    }

    // Receive a purchase order — add stock
    if (body.action === 'receive_po') {
      const { poId } = body
      const { data: po } = await adminClient.from('purchase_orders').select('*, purchase_order_items(*)').eq('id', poId).single()
      if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

      for (const item of (po as any).purchase_order_items || []) {
        if (!item.stock_item_id) continue
        // Add to stock
        const { data: stock } = await adminClient.from('stock_items').select('qty').eq('id', item.stock_item_id).single()
        if (stock) {
          await adminClient.from('stock_items').update({ qty: Number(stock.qty) + Number(item.qty), updated_at: new Date().toISOString() }).eq('id', item.stock_item_id)
          await adminClient.from('stock_movements').insert({
            cafe_id: restaurantId,
            stock_item_id: item.stock_item_id,
            delta: Number(item.qty),
            reason: 'purchase_receipt',
            reference_id: poId,
            note: `Тапсырыс #${poId.slice(0, 8)} бойынша кіріс`
          })
        }
      }
      await adminClient.from('purchase_orders').update({ status: 'received', received_at: new Date().toISOString() }).eq('id', poId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
