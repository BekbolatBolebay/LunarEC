import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deductStockForOrder, awardLoyaltyPoints } from '@/lib/stock-utils'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, newStatus } = body

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'Missing orderId or newStatus' }, { status: 400 })
    }

    const results: any = {}

    // Deduct stock when order goes to 'preparing'
    if (newStatus === 'preparing') {
      const deductResult = await deductStockForOrder(orderId)
      results.stockDeduction = deductResult
    }

    // Award loyalty points when order is 'completed'
    if (newStatus === 'completed' || newStatus === 'delivered') {
      await awardLoyaltyPoints(orderId)
      results.loyaltyAwarded = true
    }

    return NextResponse.json({ success: true, ...results })
  } catch (error: any) {
    console.error('[warehouse/deduct-stock] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
