import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 1. Verify that the requester is an admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role in public.staff_profiles
    const { data: userData, error: userError } = await supabase
        .from('staff_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userError || userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // 2. Use Admin Client to delete from auth.users
    const adminClient = createAdminClient()

    // Note: Deleting from auth.users will cascade to public.staff_profiles via ON DELETE CASCADE.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)

    if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
}
