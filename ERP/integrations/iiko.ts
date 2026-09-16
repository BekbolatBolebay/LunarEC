import { createAdminClient } from './supabase/admin'

const IIKO_API = 'https://api-ru.iiko.services/api/1'

/**
 * iiko Cloud API session token retrieval
 * Endpoint: POST https://api-ru.iiko.services/api/1/access_token
 */
export async function getIikoToken(apiLogin: string): Promise<string> {
  const response = await fetch('https://api-ru.iiko.services/api/1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiLogin }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`iiko Auth Error: ${errText || response.statusText}`)
  }

  const data = await response.json()
  return data.token
}

/**
 * Pushes a MazirApp order to the restaurant's iiko POS terminal
 * Endpoint: POST https://api-ru.iiko.services/api/1/deliveries/create
 */
export async function sendOrderToIiko(orderId: string): Promise<{ success: boolean; iikoOrderId?: string; error?: string }> {
  const supabase = createAdminClient()

  // 1. Fetch order details with restaurant credentials and order items
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      restaurants!cafe_id (
        id,
        name_ru,
        iiko_api_login,
        iiko_organization_id,
        iiko_terminal_group_id
      ),
      order_items (
        id,
        quantity,
        price,
        menu_item_id,
        menu_items (
          id,
          name_ru,
          iiko_id
        )
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: `Order not found: ${orderError?.message || 'Unknown'}` }
  }

  const restaurant = order.restaurants as any
  if (!restaurant || !restaurant.iiko_api_login || !restaurant.iiko_organization_id || !restaurant.iiko_terminal_group_id) {
    return { success: false, error: 'Restaurant iiko integration settings are incomplete' }
  }

  try {
    // 2. Get Access Token
    const token = await getIikoToken(restaurant.iiko_api_login)

    // 3. Map order items into iiko product payload format
    const items = order.order_items.map((item: any) => {
      // Map menu item to iiko product ID.
      // If iiko_id column exists dynamically in the DB, we map it, else fallback to menu_item_id
      const productId = (item.menu_items as any)?.iiko_id || item.menu_item_id

      return {
        productId: productId,
        type: 'Product',
        amount: item.quantity,
        price: item.price
      }
    })

    // 4. Construct iiko delivery payload
    const payload = {
      organizationId: restaurant.iiko_organization_id,
      terminalGroupId: restaurant.iiko_terminal_group_id,
      deliveryInfo: {
        address: order.delivery_address ? {
          rawAddress: order.delivery_address
        } : undefined,
        order: {
          id: order.id,
          phone: order.customer_phone || order.phone || '+77777777777',
          customer: {
            name: order.customer_name || 'Guest'
          },
          items: items,
          comment: order.notes || 'Order from MazirApp',
          payment: {
            paymentType: {
              // Standard iiko payment types: cash or card
              id: order.payment_method === 'cash' 
                ? '09043a5e-aa2b-4db4-b258-37887e594411' // Standard Cash Payment ID (example)
                : 'f2d87e56-ff6b-4e1b-b384-e4c16a81c5d9'  // Standard Card/Online Payment ID (example)
            },
            sum: order.total_amount
          }
        }
      }
    }

    // 5. Send order payload to iiko Cloud
    const iikoResponse = await fetch('https://api-ru.iiko.services/api/1/deliveries/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!iikoResponse.ok) {
      const errText = await iikoResponse.text()
      console.error('[iiko sendOrder] API returned error:', errText)
      return { success: false, error: `iiko Cloud API Error: ${errText || iikoResponse.statusText}` }
    }

    const result = await iikoResponse.json()
    const iikoId = result.deliveryInfo?.id || 'Success'
    
    // Save the resulting iiko order ID inside order notes for auditing/logging
    await supabase
      .from('orders')
      .update({
        notes: `${order.notes || ''}\n[iiko Order ID: ${iikoId}]`
      })
      .eq('id', orderId)

    return { success: true, iikoOrderId: iikoId }
  } catch (error: any) {
    console.error('[iiko sendOrder] Exception caught:', error)
    return { success: false, error: error.message || 'Unknown integration exception' }
  }
}

// ----------------------------------------------------------------------------
// Menu sync (iiko nomenclature -> MazirApp menu)
// ----------------------------------------------------------------------------

export interface IikoProduct {
  id: string
  name: string
  price: number
  groupId: string | null
  isDeleted: boolean
  /** iiko item kind: Dish | Good | Service | Modifier ... */
  type: string
}

export interface IikoGroup {
  id: string
  name: string
}

export interface IikoNomenclature {
  products: IikoProduct[]
  groups: IikoGroup[]
}

/** Normalize a product name for fuzzy matching: lowercase, collapse whitespace, drop punctuation. */
export function normalizeName(raw: string | null | undefined): string {
  return (raw || '')
    .toLowerCase()
    .replace(/[ё]/g, 'е')
    .replace(/[^a-zа-яңғүұқөһәі0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Fetch the restaurant's full menu (nomenclature) from iiko Cloud.
 * Endpoint: POST https://api-ru.iiko.services/api/1/nomenclature
 */
export async function getIikoNomenclature(
  apiLogin: string,
  organizationId: string
): Promise<IikoNomenclature> {
  const token = await getIikoToken(apiLogin)

  const response = await fetch(`${IIKO_API}/nomenclature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationId, startRevision: 0 }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`iiko nomenclature error: ${errText || response.statusText}`)
  }

  const data = await response.json()

  const groups: IikoGroup[] = (data.groups || []).map((g: any) => ({
    id: g.id,
    name: g.name || '',
  }))

  // Only real orderable items (skip modifiers / deleted entries).
  const products: IikoProduct[] = (data.products || [])
    .filter((p: any) => !p.isDeleted && p.type !== 'Modifier')
    .map((p: any) => ({
      id: p.id,
      name: p.name || '',
      price: p.sizePrices?.[0]?.price?.currentPrice ?? p.price ?? 0,
      groupId: p.parentGroup ?? p.productCategoryId ?? null,
      isDeleted: !!p.isDeleted,
      type: p.type || 'Dish',
    }))

  return { products, groups }
}

export interface IikoSyncSummary {
  linked: number        // existing items that got an iiko_id filled in
  alreadyLinked: number // existing items that already had an iiko_id
  priceUpdated: number  // existing items whose price was refreshed from iiko
  imported: number      // new items created from iiko
  unmatchedApp: { id: string; name: string }[]     // app items with no iiko match
  unmatchedIiko: { id: string; name: string }[]    // iiko items with no app match (not imported)
  errors: string[]
}

/**
 * Pull the iiko nomenclature and reconcile it with the restaurant's MazirApp menu.
 *
 * - Existing menu items are matched to iiko products by normalized name and get
 *   their `iiko_id` filled in automatically (this is what makes order push work).
 * - When `importMissing` is true, iiko products that have no matching app item are
 *   created as new menu items (categories are created from iiko groups as needed).
 *
 * Returns a detailed summary so the admin can see exactly what happened.
 */
export async function syncIikoMenu(
  restaurantId: string,
  opts: { importMissing?: boolean; updatePrices?: boolean } = {}
): Promise<{ success: boolean; summary?: IikoSyncSummary; error?: string }> {
  const { importMissing = false, updatePrices = false } = opts
  const supabase = createAdminClient()

  // 1. Restaurant credentials
  const { data: restaurant, error: rErr } = await supabase
    .from('restaurants')
    .select('id, iiko_api_login, iiko_organization_id')
    .eq('id', restaurantId)
    .single()

  if (rErr || !restaurant) {
    return { success: false, error: `Restaurant not found: ${rErr?.message || 'unknown'}` }
  }
  if (!restaurant.iiko_api_login || !restaurant.iiko_organization_id) {
    return { success: false, error: 'iiko credentials are not configured for this restaurant' }
  }

  // 2. Fetch iiko menu + current app menu
  let nomenclature: IikoNomenclature
  try {
    nomenclature = await getIikoNomenclature(
      restaurant.iiko_api_login,
      restaurant.iiko_organization_id
    )
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to fetch iiko nomenclature' }
  }

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, name_ru, name_kk, iiko_id, price')
    .eq('cafe_id', restaurantId)

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_ru, name_kk')
    .eq('cafe_id', restaurantId)

  const summary: IikoSyncSummary = {
    linked: 0,
    alreadyLinked: 0,
    priceUpdated: 0,
    imported: 0,
    unmatchedApp: [],
    unmatchedIiko: [],
    errors: [],
  }

  // 3. Index app items by normalized name (ru + kk both point to the same row).
  const appByName = new Map<string, any>()
  for (const item of menuItems || []) {
    for (const n of [normalizeName(item.name_ru), normalizeName(item.name_kk)]) {
      if (n && !appByName.has(n)) appByName.set(n, item)
    }
  }

  // 4. Match each iiko product to an app item by name; fill iiko_id / refresh price.
  const matchedAppIds = new Set<string>()
  for (const product of nomenclature.products) {
    const key = normalizeName(product.name)
    const match = key ? appByName.get(key) : undefined

    if (match) {
      matchedAppIds.add(match.id)
      const patch: Record<string, any> = {}

      if (match.iiko_id) {
        summary.alreadyLinked++
      } else {
        patch.iiko_id = product.id
        summary.linked++
      }

      if (updatePrices && product.price > 0 && Number(match.price) !== Number(product.price)) {
        patch.price = product.price
        summary.priceUpdated++
      }

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase.from('menu_items').update(patch).eq('id', match.id)
        if (error) summary.errors.push(`Update ${match.name_ru}: ${error.message}`)
      }
    } else if (importMissing) {
      // Create a new menu item from the iiko product.
      const categoryId = await resolveCategory(
        supabase,
        restaurantId,
        categories || [],
        nomenclature.groups,
        product.groupId
      )
      const { error } = await supabase.from('menu_items').insert({
        cafe_id: restaurantId,
        category_id: categoryId,
        name_ru: product.name,
        name_kk: product.name,
        name_en: product.name,
        description_ru: '',
        description_kk: '',
        description_en: '',
        image_url: '',
        price: product.price,
        is_available: true,
        is_stop_list: false,
        iiko_id: product.id,
        sort_order: 100,
      })
      if (error) {
        summary.errors.push(`Import ${product.name}: ${error.message}`)
      } else {
        summary.imported++
      }
    } else {
      summary.unmatchedIiko.push({ id: product.id, name: product.name })
    }
  }

  // 5. App items that never matched any iiko product (will fail order push until fixed).
  for (const item of menuItems || []) {
    if (!matchedAppIds.has(item.id) && !item.iiko_id) {
      summary.unmatchedApp.push({ id: item.id, name: item.name_ru || item.name_kk })
    }
  }

  return { success: true, summary }
}

/** Find or create a MazirApp category that corresponds to an iiko group. */
async function resolveCategory(
  supabase: ReturnType<typeof createAdminClient>,
  restaurantId: string,
  categories: any[],
  groups: IikoGroup[],
  groupId: string | null
): Promise<string | null> {
  if (!groupId) return null
  const group = groups.find((g) => g.id === groupId)
  if (!group || !group.name) return null

  const existing = categories.find(
    (c) => normalizeName(c.name_ru) === normalizeName(group.name)
  )
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('categories')
    .insert({
      cafe_id: restaurantId,
      name_ru: group.name,
      name_kk: group.name,
      name_en: group.name,
      sort_order: 100,
      is_active: true,
    })
    .select('id, name_ru, name_kk')
    .single()

  if (error || !data) return null
  categories.push(data) // cache so the next product in the same group reuses it
  return data.id
}
