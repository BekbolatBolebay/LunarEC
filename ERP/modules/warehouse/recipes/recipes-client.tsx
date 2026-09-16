'use client'

import { useApp } from '@/lib/app-context'
import { ArrowLeft, Loader2, AlertCircle, Search, Scroll, FlaskConical, Pencil, Plus, Trash2, Check, X, Database } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function RecipesClient({ cafeId }: { cafeId: string }) {
  const { lang } = useApp()
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null)

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editingIngredients, setEditingIngredients] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  async function fetchRecipesAndStock() {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Fetch recipes
      const recRes = await fetch('/api/warehouse/recipes')
      const recData = await recRes.json()
      if (recRes.ok && recData.success) {
        setRecipes(recData.recipes || [])
      } else {
        setError(recData.error || 'Failed to fetch recipes')
      }

      // 2. Fetch stock items
      const stockRes = await fetch('/api/warehouse/inventory')
      const stockData = await stockRes.json()
      if (stockRes.ok && stockData.success) {
        setStockItems(stockData.stockItems || [])
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipesAndStock()
  }, [])

  // Sync selected recipe after updating
  const handleSelectRecipe = (recipe: any) => {
    setSelectedRecipe(recipe)
    setIsEditing(false)
  }

  const startEditing = () => {
    if (!selectedRecipe) return
    const currentIngs = (selectedRecipe.ingredients || []).map((ing: any) => ({
      stock_item_id: ing.stock_item_id || ing.id,
      qty_per_portion: ing.qty
    }))
    setEditingIngredients(currentIngs)
    setIsEditing(true)
  }

  const addIngredientRow = () => {
    setEditingIngredients(prev => [...prev, { stock_item_id: '', qty_per_portion: 0 }])
  }

  const removeIngredientRow = (index: number) => {
    setEditingIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const updateIngredientRow = (index: number, field: string, value: any) => {
    setEditingIngredients(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const saveLocalRecipe = async () => {
    if (!selectedRecipe) return
    
    // Validate ingredients
    const invalid = editingIngredients.some(ing => !ing.stock_item_id || parseFloat(ing.qty_per_portion) <= 0)
    if (invalid) {
      toast.error(lang === 'kk' ? 'Барлық өрістерді толтырыңыз және сан 0-ден көп болуы керек' : 'Заполните все поля и количество должно быть больше 0')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/warehouse/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_item_id: selectedRecipe.menu_item_id,
          ingredients: editingIngredients
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(lang === 'kk' ? 'Рецепт сақталды' : 'Рецепт сохранен')
        setIsEditing(false)
        
        // Refresh recipes and update selected UI
        const recRes = await fetch('/api/warehouse/recipes')
        const recData = await recRes.json()
        if (recRes.ok && recData.success) {
          setRecipes(recData.recipes || [])
          const updated = (recData.recipes || []).find((r: any) => r.menu_item_id === selectedRecipe.menu_item_id)
          if (updated) setSelectedRecipe(updated)
        }
      } else {
        toast.error(data.error || 'Failed to save recipe')
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const filteredRecipes = recipes.filter(item => {
    const name = lang === 'kk' ? (item.name_kk || '') : (item.name_ru || '')
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col min-h-full bg-muted/20">
      {/* Top Header */}
      <div className="bg-card px-4 pt-4 md:pt-12 pb-4 border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/warehouse" className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{lang === 'kk' ? 'Тех-карталар' : 'Технологические карты'}</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 w-fit px-2 py-1 rounded-lg">
          <>
            <Database className="w-3 h-3" />
            {lang === 'kk' ? 'Жергілікті MazirApp рецепттері' : 'Локальные рецепты MazirApp'}
          </>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'kk' ? 'Тағамды іздеу...' : 'Поиск блюда...'}
              className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Error state (Only block if not locally functional) */}
        {error && recipes.length === 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex gap-3 text-destructive items-start text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{lang === 'kk' ? 'Жүктеу қатесі' : 'Ошибка загрузки'}</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recipes List */}
          <div className="md:col-span-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-fit">
            <div className="p-4 border-b border-border font-bold text-sm bg-muted/20 uppercase tracking-wider text-muted-foreground">
              {lang === 'kk' ? 'Тағамдар тізімі' : 'Список блюд'}
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-3 text-primary" />
                <p className="text-xs font-semibold">{lang === 'kk' ? 'Жүктелуде...' : 'Загрузка...'}</p>
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                {lang === 'kk' ? 'Тағамдар табылмады' : 'Блюда не найдены'}
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {filteredRecipes.map((item) => (
                  <button
                    key={item.menu_item_id}
                    onClick={() => handleSelectRecipe(item)}
                    className={`w-full p-4 text-left transition-colors flex items-center justify-between ${
                      selectedRecipe?.menu_item_id === item.menu_item_id ? 'bg-primary/5 text-primary font-bold' : 'hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <span className="text-sm truncate pr-2">
                      {lang === 'kk' ? item.name_kk : item.name_ru}
                    </span>
                    <Scroll className="w-4 h-4 shrink-0 opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recipe Details / Editing Panel */}
          <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[300px]">
            {selectedRecipe ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {lang === 'kk' ? selectedRecipe.name_kk : selectedRecipe.name_ru}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'kk' ? `Порция өлшемі: ${selectedRecipe.bom_qty} дана` : `Размер порции: ${selectedRecipe.bom_qty} шт.`}
                    </p>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={startEditing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all active:scale-95 shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {lang === 'kk' ? 'Өңдеу' : 'Редактировать'}
                    </button>
                  )}
                </div>

                {isEditing ? (
                  // Edit form
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        {lang === 'kk' ? 'Ингредиенттер құрамы' : 'Состав ингредиентов'}
                      </p>
                      
                      {editingIngredients.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-2xl font-medium">
                          {lang === 'kk' ? 'Ингредиенттер қосылмаған' : 'Ингредиенты не добавлены'}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editingIngredients.map((item, index) => {
                            const selectedStock = stockItems.find(s => s.id === item.stock_item_id)
                            return (
                              <div key={index} className="flex items-center gap-3 bg-secondary/20 p-3 rounded-2xl border border-border/40">
                                <div className="flex-1 min-w-0">
                                  <select
                                    value={item.stock_item_id}
                                    onChange={(e) => updateIngredientRow(index, 'stock_item_id', e.target.value)}
                                    className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-primary"
                                  >
                                    <option value="">{lang === 'kk' ? 'Шикізатты таңдаңыз...' : 'Выберите сырье...'}</option>
                                    {stockItems.map(s => (
                                      <option key={s.id} value={s.id}>
                                        {lang === 'kk' ? (s.name_kk || s.name_ru) : (s.name_ru || s.name_kk)} ({s.unit || 'кг'})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="relative w-32 shrink-0">
                                  <input
                                    type="number"
                                    step="0.0001"
                                    value={item.qty_per_portion === 0 ? '' : item.qty_per_portion}
                                    onChange={(e) => updateIngredientRow(index, 'qty_per_portion', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-bold pr-10 focus:outline-none focus:border-primary text-right"
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">
                                    {selectedStock?.unit || 'кг'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeIngredientRow(index)}
                                  className="w-10 h-10 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                      <button
                        onClick={addIngredientRow}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        {lang === 'kk' ? 'Ингредиент қосу' : 'Добавить ингредиент'}
                      </button>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-all active:scale-95"
                        >
                          <X className="w-4 h-4" />
                          {lang === 'kk' ? 'Болдырмау' : 'Отмена'}
                        </button>
                        <button
                          onClick={saveLocalRecipe}
                          disabled={saving}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground bg-primary hover:bg-primary/95 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {lang === 'kk' ? 'Сақтау' : 'Сохранить'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View layout
                  <div className="space-y-4">
                    {selectedRecipe.ingredients.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl p-8 flex flex-col items-center justify-center">
                        <Scroll className="w-8 h-8 mb-3 opacity-40 text-primary" />
                        <p className="text-sm font-semibold mb-3">
                          {lang === 'kk' ? 'Бұл тағамға рецепт жазылмаған' : 'Для этого блюда еще не добавлен рецепт'}
                        </p>
                        <button
                          onClick={startEditing}
                          className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {lang === 'kk' ? 'Рецепт қосу' : 'Добавить рецепт'}
                        </button>
                      </div>
                    ) : (
                      <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border font-bold text-muted-foreground">
                              <th className="p-4">{lang === 'kk' ? 'Ингредиент' : 'Ингредиент'}</th>
                              <th className="p-4 text-right">{lang === 'kk' ? 'Шығыны (бір порцияға)' : 'Расход (на порцию)'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border font-medium">
                            {selectedRecipe.ingredients.map((ing: any, i: number) => (
                              <tr key={ing.id || i} className="hover:bg-muted/10">
                                <td className="p-4">
                                  {lang === 'kk' ? (ing.ingredient_name_kk || ing.ingredient_name) : (ing.ingredient_name || ing.ingredient_name_kk)}
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-primary">
                                  {ing.qty} {ing.unit || 'кг'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-16 text-center">
                <Scroll className="w-12 h-12 mb-4 opacity-40 text-primary" />
                <p className="text-sm font-semibold">
                  {lang === 'kk' ? 'Тағамның құрамын көру үшін оны сол жақтағы тізімнен таңдаңыз' : 'Выберите блюдо из списка слева, чтобы просмотреть его рецепт'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
