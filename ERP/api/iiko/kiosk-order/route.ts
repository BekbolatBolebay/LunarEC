import { NextResponse } from 'next/server'

/**
 * iiko Cloud integration for KIOSK / self-service terminal orders.
 *
 * Unlike `send-order/route.ts` (which pushes an existing, authenticated DB order
 * using per-restaurant credentials), this route is meant for an in-store kiosk:
 * it builds a fresh order from the terminal's cart and submits it to iiko using
 * a single server-side API login from the environment.
 *
 * The kiosk frontend lives in a different app (`client`), so this route is
 * called cross-origin. It is protected by a shared secret (`KIOSK_SECRET`)
 * sent in the `x-kiosk-secret` header, and it returns CORS headers so the
 * browser is allowed to make the request.
 *
 * Flow:
 *   0. Authorize via x-kiosk-secret header (vs KIOSK_SECRET env)
 *   1. Read IIKO_API_LOGIN from env.
 *   2. POST /api/1/access_token        -> Bearer token
 *   3. POST /api/1/organizations       -> organizationId
 *   4. Map incoming cart items to iiko's `items` payload format
 *   5. POST /api/1/deliveries/create   -> create the order
 */

const IIKO_BASE_URL = process.env.IIKO_API_BASE_URL || 'https://api-ru.iiko.services'

// Allowed kiosk origin for CORS. Set KIOSK_ALLOWED_ORIGIN to the kiosk app URL
// in production; defaults to '*' for local/MVP use.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': process.env.KIOSK_ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-kiosk-secret',
}

function jsonRes(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

// ---- Types ---------------------------------------------------------------

type KioskOrderType = 'takeaway' | 'eat_in'

interface KioskOrderItem {
  /** Our internal menu item id. In production map this to the iiko productId. */
  id: string
  name?: string
  quantity: number
  price: number
  /** Optional: pre-resolved iiko product id (menu_items.iiko_id) from the frontend. */
  iikoProductId?: string
}

interface KioskOrderRequest {
  items: KioskOrderItem[]
  total_amount: number
  type: KioskOrderType
  customerName?: string
  phone?: string
  comment?: string
}

interface IikoOrderItem {
  productId: string
  type: 'Product'
  amount: number
  price: number
}

interface IikoOrganizationsResponse {
  organizations?: Array<{ id: string; name?: string }>
}

interface IikoAccessTokenResponse {
  token?: string
}

// ---- iiko helpers --------------------------------------------------------

async function getIikoToken(apiLogin: string): Promise<string> {
  const res = await fetch(`${IIKO_BASE_URL}/api/1/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiLogin }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`iiko auth failed (${res.status}): ${detail || res.statusText}`)
  }

  const data = (await res.json()) as IikoAccessTokenResponse
  if (!data.token) {
    throw new Error('iiko auth response did not contain a token')
  }
  return data.token
}

async function getOrganizationId(token: string): Promise<string> {
  // Allow pinning a specific organization via env; otherwise discover it.
  if (process.env.IIKO_ORGANIZATION_ID) {
    return process.env.IIKO_ORGANIZATION_ID
  }

  const res = await fetch(`${IIKO_BASE_URL}/api/1/organizations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ returnAdditionalInfo: false, includeDisabled: false }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`iiko organizations lookup failed (${res.status}): ${detail || res.statusText}`)
  }

  const data = (await res.json()) as IikoOrganizationsResponse
  const organizationId = data.organizations?.[0]?.id
  if (!organizationId) {
    throw new Error('No iiko organization found for this API login')
  }
  return organizationId
}

/**
 * Map our cart items into iiko's product line format.
 *
 * Each menu item should carry its real iiko product id (menu_items.iiko_id),
 * forwarded by the frontend as `iikoProductId`. Falls back to our internal id
 * when the mapping has not been filled in yet.
 */
function mapItemsToIiko(items: KioskOrderItem[]): IikoOrderItem[] {
  return items.map((item) => ({
    productId: item.iikoProductId || item.id,
    type: 'Product',
    amount: item.quantity,
    price: item.price,
  }))
}

function validateBody(body: unknown): KioskOrderRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object')
  }

  const { items, total_amount, type } = body as Partial<KioskOrderRequest>

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('`items` must be a non-empty array')
  }
  if (typeof total_amount !== 'number' || total_amount <= 0) {
    throw new Error('`total_amount` must be a positive number')
  }
  if (type !== 'takeaway' && type !== 'eat_in') {
    throw new Error("`type` must be either 'takeaway' or 'eat_in'")
  }

  return body as KioskOrderRequest
}

// ---- Route handlers ------------------------------------------------------

// CORS preflight for the cross-origin kiosk frontend.
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Step 0: authorize the kiosk via shared secret
    const expectedSecret = process.env.KIOSK_SECRET || 'test-secret-123'
    if (!expectedSecret) {
      return jsonRes({ error: 'KIOSK_SECRET is not configured on the server' }, 500)
    }
    if (request.headers.get('x-kiosk-secret') !== expectedSecret) {
      return jsonRes({ error: 'Unauthorized' }, 401)
    }

    // Parse & validate the incoming kiosk order (client errors before server config)
    let order: KioskOrderRequest
    try {
      order = validateBody(await request.json())
    } catch (validationError: any) {
      return jsonRes({ error: validationError.message || 'Invalid request body' }, 400)
    }

    // Step 1: credentials from env
    const apiLogin = process.env.IIKO_API_LOGIN
    if (!apiLogin) {
      return jsonRes({ error: 'IIKO_API_LOGIN is not configured on the server' }, 500)
    }

    // Step 2: auth -> Bearer token
    const token = await getIikoToken(apiLogin)

    // Step 3: resolve organization
    const organizationId = await getOrganizationId(token)

    // Step 4: build the iiko delivery payload
    // `takeaway` -> customer picks up; `eat_in` -> served in venue.
    const orderServiceType = order.type === 'takeaway' ? 'DeliveryByClient' : 'DeliveryByCourier'

    const payload = {
      organizationId,
      createOrderSettings: { mode: 'Async' },
      order: {
        phone: order.phone || '+70000000000',
        orderServiceType,
        customer: {
          name: order.customerName || 'Kiosk order',
        },
        items: mapItemsToIiko(order.items),
        comment: order.comment || `Kiosk ${order.type} order from MazirApp`,
      },
    }

    // Step 5: create the order in iiko
    const res = await fetch(`${IIKO_BASE_URL}/api/1/deliveries/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('[iiko kiosk-order] deliveries/create failed:', detail)
      return jsonRes({ error: 'iiko order creation failed', detail: detail || res.statusText }, 502)
    }

    const result = await res.json()
    return jsonRes({
      success: true,
      organizationId,
      iikoOrderId: result?.orderInfo?.id ?? result?.correlationId ?? null,
      data: result,
    })
  } catch (error: any) {
    console.error('[iiko kiosk-order] Unexpected error:', error)
    return jsonRes({ error: 'Internal server error', detail: error?.message || String(error) }, 500)
  }
}
