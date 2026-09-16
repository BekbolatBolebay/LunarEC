import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendOrderToIiko } from '@/lib/iiko'

/**
 * API route to securely push an order to the iiko POS system
 * Only authorized admins/managers of the cafe are allowed to trigger this.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate the requesting user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch the user's staff profile role (Admin or Manager required)
    const { data: profile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 })
    }

    // 4. Send order to iiko POS
    const result = await sendOrderToIiko(orderId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, iikoOrderId: result.iikoOrderId })
  } catch (error: any) {
    console.error('[iiko send-order API] Error occurred:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
