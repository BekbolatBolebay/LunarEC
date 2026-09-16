import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRestaurantId } from '@/lib/db'
import { syncIikoMenu } from '@/lib/iiko'

/**
 * API route to sync the restaurant's menu from its iiko POS nomenclature.
 * Matches existing items by name (filling in iiko_id) and, optionally, imports
 * items that only exist in iiko. Only admins/managers of the cafe may run it.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorize (admin or manager only)
    const { data: profile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Resolve which restaurant we're operating on
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) {
      return NextResponse.json({ error: 'No active restaurant found' }, { status: 400 })
    }

    // 4. Parse options
    const body = await request.json().catch(() => ({}))
    const importMissing = !!body.importMissing
    const updatePrices = !!body.updatePrices

    // 5. Run the sync
    const result = await syncIikoMenu(restaurantId, { importMissing, updatePrices })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, summary: result.summary })
  } catch (error: any) {
    console.error('[iiko sync-menu API] Error occurred:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
