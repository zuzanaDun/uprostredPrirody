import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Uprostred prírody – príbeh nášho rodového statku',
  description: 'Sledujte príbeh tvorenia nášho rodového statku cez fotografie, videá, každodenné momenty a významné míľniky.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sk"><body>{children}</body></html>;
}
