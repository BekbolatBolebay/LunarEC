import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRestaurantId } from '@/lib/db'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) {
      return NextResponse.json({ error: 'No active restaurant found' }, { status: 400 })
    }

    // Fetch all menu items
    const { data: menuItems, error: itemsError } = await supabase
      .from('menu_items')
      .select('id, name_ru, name_kk, price')
      .eq('cafe_id', restaurantId)
      .order('name_ru')

    if (itemsError || !menuItems) {
      return NextResponse.json({ success: true, recipes: [] })
    }

    // Fetch recipe ingredients with stock info
    const { data: localIngredients } = await supabase
      .from('recipe_ingredients')
      .select(`
        id,
        menu_item_id,
        stock_item_id,
        qty_per_portion,
        stock_items (
          id,
          name_ru,
          name_kk,
          unit
        )
      `)
      .eq('cafe_id', restaurantId)

    const ingredientsMap = new Map<string, any[]>()
    if (localIngredients) {
      localIngredients.forEach((ing: any) => {
        const itemIngredients = ingredientsMap.get(ing.menu_item_id) || []
        itemIngredients.push({
          id: ing.id,
          stock_item_id: ing.stock_item_id,
          ingredient_name: ing.stock_items?.name_ru || 'Ингредиент',
          ingredient_name_kk: ing.stock_items?.name_kk || 'Ингредиент',
          qty: ing.qty_per_portion,
          unit: ing.stock_items?.unit || 'кг'
        })
        ingredientsMap.set(ing.menu_item_id, itemIngredients)
      })
    }

    const recipesList = menuItems.map(item => ({
      menu_item_id: item.id,
      name_ru: item.name_ru,
      name_kk: item.name_kk,
      bom_qty: 1.0,
      ingredients: ingredientsMap.get(item.id) || []
    }))

    return NextResponse.json({ success: true, recipes: recipesList })
  } catch (error: any) {
    console.error('[warehouse/recipes GET] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) {
      return NextResponse.json({ error: 'No active restaurant found' }, { status: 400 })
    }

    const body = await request.json()
    const { menu_item_id, ingredients } = body

    if (!menu_item_id || !Array.isArray(ingredients)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Delete existing recipe ingredients
    const { error: deleteError } = await adminClient
      .from('recipe_ingredients')
      .delete()
      .eq('cafe_id', restaurantId)
      .eq('menu_item_id', menu_item_id)

    if (deleteError) throw deleteError

    // Insert new recipe ingredients
    if (ingredients.length > 0) {
      const inserts = ingredients.map((ing: any) => ({
        cafe_id: restaurantId,
        menu_item_id,
        stock_item_id: ing.stock_item_id,
        qty_per_portion: parseFloat(ing.qty_per_portion) || 0
      }))

      const { error: insertError } = await adminClient
        .from('recipe_ingredients')
        .insert(inserts)

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[warehouse/recipes POST] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
