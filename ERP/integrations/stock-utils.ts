import { createAdminClient } from './supabase/admin'

/**
 * Deducts ingredients from stock when an order moves to 'preparing' status.
 * Looks up recipe_ingredients for each menu item in the order,
 * multiplies by quantity, then creates stock_movements (negative delta).
 */
export async function deductStockForOrder(orderId: string): Promise<{
  success: boolean
  deductions: { name: string; qty: number; unit: string }[]
  warnings: string[]
  error?: string
}> {
  const supabase = createAdminClient()
  const deductions: { name: string; qty: number; unit: string }[] = []
  const warnings: string[] = []

  try {
    // 1. Get order items with menu_item_id
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity')
      .eq('order_id', orderId)

    if (itemsError || !orderItems || orderItems.length === 0) {
      return { success: true, deductions: [], warnings: ['No order items found'] }
    }

    const menuItemIds = orderItems.map(i => i.menu_item_id).filter(Boolean)

    // 2. Get recipe ingredients for all menu items
    const { data: recipes, error: recipesError } = await supabase
      .from('recipe_ingredients')
      .select(`
        menu_item_id,
        qty_per_portion,
        stock_items ( id, cafe_id, name_ru, unit, qty )
      `)
      .in('menu_item_id', menuItemIds)

    if (recipesError || !recipes || recipes.length === 0) {
      // No recipes configured - skip silently
      return { success: true, deductions: [], warnings: ['No recipes configured for order items'] }
    }

    // 3. Aggregate total deduction per stock_item
    const deductMap = new Map<string, { stockItem: any; totalDelta: number }>()

    for (const recipe of recipes) {
      const orderItem = orderItems.find(oi => oi.menu_item_id === recipe.menu_item_id)
      if (!orderItem) continue

      const stockItem = (recipe as any).stock_items
      if (!stockItem) continue

      const totalDelta = recipe.qty_per_portion * orderItem.quantity
      if (deductMap.has(stockItem.id)) {
        deductMap.get(stockItem.id)!.totalDelta += totalDelta
      } else {
        deductMap.set(stockItem.id, { stockItem, totalDelta })
      }
    }

    // 4. Apply deductions
    for (const [stockItemId, { stockItem, totalDelta }] of deductMap.entries()) {
      // Check for low stock
      const newQty = stockItem.qty - totalDelta
      if (newQty < 0) {
        warnings.push(`${stockItem.name_ru}: жеткіліксіз (${stockItem.qty} ${stockItem.unit} бар, ${totalDelta} керек)`)
      }

      // Insert stock movement (negative = deduction)
      const { error: movErr } = await supabase
        .from('stock_movements')
        .insert({
          cafe_id: stockItem.cafe_id,
          stock_item_id: stockItemId,
          delta: -totalDelta,
          reason: 'order_deduction',
          reference_id: orderId,
          note: `Тапсырыс #${orderId.slice(0, 8)} бойынша шығыс`
        })

      if (movErr) {
        console.error('[deductStock] Movement insert error:', movErr)
        continue
      }

      // Update stock_items.qty
      await supabase
        .from('stock_items')
        .update({ qty: Math.max(0, newQty), updated_at: new Date().toISOString() })
        .eq('id', stockItemId)

      deductions.push({ name: stockItem.name_ru, qty: totalDelta, unit: stockItem.unit })
    }

    return { success: true, deductions, warnings }
  } catch (err: any) {
    console.error('[deductStock] Exception:', err)
    return { success: false, deductions: [], warnings: [], error: err.message }
  }
}

/**
 * Awards loyalty points when an order is completed.
 * points = total_amount * loyalty_points_per_tenge
 */
export async function awardLoyaltyPoints(orderId: string): Promise<void> {
  const supabase = createAdminClient()

  try {
    // 1. Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, cafe_id, customer_phone, total_amount, phone')
      .eq('id', orderId)
      .single()

    if (orderError || !order) return

    // 2. Check restaurant loyalty settings
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('loyalty_enabled, loyalty_points_per_tenge')
      .eq('id', order.cafe_id)
      .single()

    if (restError || !restaurant || !restaurant.loyalty_enabled) return

    const phone = order.customer_phone || order.phone
    if (!phone) return

    const points = Math.floor(Number(order.total_amount) * Number(restaurant.loyalty_points_per_tenge || 0.01))
    if (points <= 0) return

    // 3. Fetch existing loyalty card if any
    const { data: existing, error: fetchError } = await supabase
      .from('loyalty_cards')
      .select('id, points, total_spent')
      .eq('cafe_id', order.cafe_id)
      .eq('customer_phone', phone)
      .maybeSingle()

    let cardId: string

    if (existing) {
      cardId = existing.id
      const newPoints = existing.points + points
      const newTotalSpent = Number(existing.total_spent) + Number(order.total_amount)

      const { error: updateError } = await supabase
        .from('loyalty_cards')
        .update({
          points: newPoints,
          total_spent: newTotalSpent,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)

      if (updateError) {
        console.error('[awardLoyalty] Update error:', updateError)
        return
      }
    } else {
      const { data: newCard, error: insertError } = await supabase
        .from('loyalty_cards')
        .insert({
          cafe_id: order.cafe_id,
          customer_phone: phone,
          points: points,
          total_spent: Number(order.total_amount)
        })
        .select('id')
        .single()

      if (insertError || !newCard) {
        console.error('[awardLoyalty] Insert error:', insertError)
        return
      }
      cardId = newCard.id
    }

    // 4. Log loyalty transaction
    await supabase.from('loyalty_transactions').insert({
      cafe_id: order.cafe_id,
      card_id: cardId,
      order_id: orderId,
      points_delta: points,
      reason: 'order_earn',
      note: `Тапсырыс ${orderId.slice(0, 8)} үшін +${points} балл`
    })
  } catch (err: any) {
    console.error('[awardLoyalty] Exception:', err)
  }
}
