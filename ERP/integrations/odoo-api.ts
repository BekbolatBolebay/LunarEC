import { createAdminClient } from './supabase/admin'

export interface OdooConfig {
  url: string
  db: string
  user: string
  pass: string
}

/**
 * Generic Odoo JSON-RPC caller
 */
export async function odooJsonRpc(url: string, service: string, method: string, args: any[]) {
  // Ensure url doesn't have trailing slash
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url
  
  const response = await fetch(`${cleanUrl}/jsonrpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service,
        method,
        args,
      },
      id: Math.floor(Math.random() * 1000000000),
    }),
  })

  if (!response.ok) {
    throw new Error(`Odoo RPC HTTP Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(`Odoo RPC Error: ${data.error.data?.message || data.error.message}`)
  }
  return data.result
}

/**
 * Get Odoo UID (Authenticate)
 */
export async function getOdooUid(config: OdooConfig): Promise<number> {
  const uid = await odooJsonRpc(config.url, 'common', 'authenticate', [
    config.db,
    config.user,
    config.pass,
    {}
  ])
  if (!uid) {
    throw new Error('Odoo Authentication Failed: Invalid credentials or database')
  }
  return uid as number
}

/**
 * Execute a method on an Odoo model
 * Equivalent to `execute_kw` in python xmlrpc
 */
export async function executeOdoo(config: OdooConfig, model: string, method: string, args: any[], kwargs: any = {}) {
  const uid = await getOdooUid(config)
  return await odooJsonRpc(config.url, 'object', 'execute_kw', [
    config.db,
    uid,
    config.pass,
    model,
    method,
    args,
    kwargs
  ])
}

/**
 * Fetch Restaurant Odoo Config from Supabase
 */
export async function getRestaurantOdooConfig(restaurantId: string): Promise<OdooConfig | null> {
  // 1. Check central environment variables (.env)
  const envUrl = process.env.ODOO_URL
  const envDb = process.env.ODOO_DB
  const envUser = process.env.ODOO_USERNAME
  const envPass = process.env.ODOO_PASSWORD

  if (envUrl && envDb && envUser && envPass) {
    return {
      url: envUrl,
      db: envDb,
      user: envUser,
      pass: envPass
    }
  }

  // 2. Fallback to restaurant-specific settings
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('restaurants')
    .select('odoo_url, odoo_db, odoo_username, odoo_password')
    .eq('id', restaurantId)
    .single()

  if (error || !data || !data.odoo_url || !data.odoo_db || !data.odoo_username || !data.odoo_password) {
    return null
  }

  return {
    url: data.odoo_url,
    db: data.odoo_db,
    user: data.odoo_username,
    pass: data.odoo_password
  }
}

/**
 * Pushes a MazirApp order to Odoo's Sales/POS module
 */
export async function sendOrderToOdoo(orderId: string): Promise<{ success: boolean; odooOrderId?: number; error?: string }> {
  const supabase = createAdminClient()

  // 1. Fetch order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      restaurants!cafe_id (
        id, name_ru, odoo_url, odoo_db, odoo_username, odoo_password
      ),
      order_items (
        id, quantity, price, menu_item_id,
        menu_items ( id, name_ru, odoo_id )
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: `Order not found: ${orderError?.message}` }
  }

  const restaurant = order.restaurants as any

  // 2. Try central environment config first, then restaurant settings
  const envUrl = process.env.ODOO_URL
  const envDb = process.env.ODOO_DB
  const envUser = process.env.ODOO_USERNAME
  const envPass = process.env.ODOO_PASSWORD

  let config: OdooConfig | null = null
  if (envUrl && envDb && envUser && envPass) {
    config = {
      url: envUrl,
      db: envDb,
      user: envUser,
      pass: envPass
    }
  } else if (restaurant && restaurant.odoo_url && restaurant.odoo_db && restaurant.odoo_username && restaurant.odoo_password) {
    config = {
      url: restaurant.odoo_url,
      db: restaurant.odoo_db,
      user: restaurant.odoo_username,
      pass: restaurant.odoo_password
    }
  }

  if (!config) {
    return { success: false, error: 'Restaurant Odoo integration settings are incomplete' }
  }

  try {

    // 2. Map items to Odoo sale.order.line format: [0, 0, { product_id, product_uom_qty, price_unit }]
    const orderLines = []
    for (const item of order.order_items) {
      const odooProductId = (item.menu_items as any)?.odoo_id
      if (!odooProductId) {
        throw new Error(`Item ${(item.menu_items as any)?.name_ru} has no Odoo ID mapped.`)
      }
      
      orderLines.push([0, 0, {
        product_id: parseInt(odooProductId),
        product_uom_qty: item.quantity,
        price_unit: item.price
      }])
    }

    // 3. Construct Odoo payload (Sale Order)
    const payload = {
      partner_id: 1, // Default customer (could be dynamic)
      order_line: orderLines,
      note: `Order from MazirApp. ID: ${order.id}\nCustomer: ${order.customer_name || 'Guest'}\nPhone: ${order.customer_phone || ''}\nComment: ${order.notes || ''}`
    }

    // 4. Create Sale Order in Odoo
    const odooOrderId = await executeOdoo(config, 'sale.order', 'create', [payload])

    // Save Odoo ID to the DB
    await supabase
      .from('orders')
      .update({
        notes: `${order.notes || ''}\n[Odoo Order ID: ${odooOrderId}]`
      })
      .eq('id', orderId)

    return { success: true, odooOrderId: parseInt(odooOrderId) }
  } catch (error: any) {
    console.error('[odoo sendOrder] Exception caught:', error)
    return { success: false, error: error.message || 'Unknown integration exception' }
  }
}

