import { createClient } from '@/lib/supabase/server'
import ClientsClient from './clients-client'

export default async function ClientsPage() {
    const supabase = await createClient()

    // Aggregate clients from orders table
    const { data: orders } = await supabase
        .from('orders')
        .select('id, user_id, customer_name, customer_phone, total_amount, address')
        .order('created_at', { ascending: false })

    const clientsMap: Record<string, any> = {}

    orders?.forEach(o => {
        if (!o.customer_phone) return
        if (!clientsMap[o.customer_phone]) {
            clientsMap[o.customer_phone] = {
                id: o.user_id, // Store the UUID for deletion
                customer_name: o.customer_name,
                customer_phone: o.customer_phone,
                total_orders: 0,
                total_spent: 0,
                last_address: o.address,
                loyalty_points: (o.clients as any)?.loyalty_points || 0
            }
        }
        clientsMap[o.customer_phone].total_orders += 1
        clientsMap[o.customer_phone].total_spent += Number(o.total_amount)
    })

    const clients = Object.values(clientsMap).sort((a, b) => b.total_spent - a.total_spent)

    return (
        <ClientsClient initialClients={clients} />
    )
}
