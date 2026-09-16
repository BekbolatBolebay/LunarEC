import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/app-context';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'LunarEC — Modular CRM & ERP Suite',
  description: 'Кәсіпорын ресурстарын және тұтынушылар базасын басқарудың ашық бастапқы кодты модульдік жүйесі (Odoo 17/18 Architecture)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk" className="h-full">
      <body className="h-full font-sans bg-[#F6F7F9] text-slate-900 antialiased">
        <AppProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </AppProvider>
      </body>
    </html>
  );
}
