'use server'

import { createClient } from '../../../../admin/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Қызметкерлер тізімін алу (ERP HR)
 */
export async function getWorkersAction(cafeId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Жаңа қызметкерді жүйеге тіркеу (ERP HR)
 */
export async function createWorkerAction(formData: FormData) {
  const supabase = await createClient()
  const cafeId = formData.get('cafe_id') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const baseRate = Number(formData.get('base_rate')) || 0

  if (!cafeId || !fullName || !role || !email || !password) {
    throw new Error('Барлық міндетті өрістерді толтырыңыз')
  }

  // Auth қолданушысын құру
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, cafe_id: cafeId }
    }
  })

  if (authError || !authData.user) {
    throw new Error(`Қолданушы тіркеу қатесі: ${authError?.message}`)
  }

  // Staff профилін сақтау
  const { error: profileError } = await supabase
    .from('staff_profiles')
    .insert({
      id: authData.user.id,
      cafe_id: cafeId,
      full_name: fullName,
      role,
      phone,
      base_rate: baseRate,
      is_active: true
    })

  if (profileError) throw profileError

  revalidatePath('/workers')
  return { success: true, userId: authData.user.id }
}

/**
 * Қызметкерді өшіру
 */
export async function deleteWorkerAction(workerId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('staff_profiles')
    .delete()
    .eq('id', workerId)

  if (error) throw error
  revalidatePath('/workers')
  return { success: true }
}

/**
 * Күнделікті табельді алу (Attendance)
 */
export async function getAttendanceAction(cafeId: string, date: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff_attendance')
    .select('*, staff_profiles(full_name, role)')
    .eq('cafe_id', cafeId)
    .eq('work_date', date)

  if (error) throw error
  return data
}

/**
 * Табель жазбасын жаңарту (Check-in / Check-out)
 */
export async function updateAttendanceAction(
  id: string,
  newCheckIn: string | null,
  newCheckOut: string | null
) {
  const supabase = await createClient()

  let hoursWorked: number | null = null
  if (newCheckIn && newCheckOut) {
    const diffMs = new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()
    hoursWorked = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)))
  }

  const { error } = await supabase
    .from('staff_attendance')
    .update({
      check_in: newCheckIn,
      check_out: newCheckOut,
      hours_worked: hoursWorked,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/workers/attendance')
  return { success: true }
}
