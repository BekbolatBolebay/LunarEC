import { getPromoCodes, getBanners, getCertificates } from '@/lib/db'
import MarketingClient from './marketing-client'

export default async function MarketingPage() {
  const [promoCodes, banners, certificates] = await Promise.all([
    getPromoCodes(),
    getBanners(),
    getCertificates(),
  ])

  return (
    <MarketingClient
      initialPromoCodes={promoCodes}
      initialBanners={banners}
      initialCertificates={certificates}
    />
  )
}
