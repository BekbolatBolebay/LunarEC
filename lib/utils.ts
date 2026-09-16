import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = '₸'): string {
  return `${amount.toLocaleString('kk-KZ')} ${currency}`;
}

export function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('kk-KZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
