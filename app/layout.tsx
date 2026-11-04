import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Kanit, Pixelify_Sans } from 'next/font/google'
import './globals.css'

const pixel = Pixelify_Sans({ subsets: ['latin'], variable: '--font-pixel' })
const thai = Kanit({ subsets: ['thai', 'latin'], weight: ['400', '500', '700'], variable: '--font-thai' })

export const metadata: Metadata = {
  title: 'Pixel Quest - เกม RPG พิกเซล',
  description: 'เกม Pixel RPG ผจญภัย ล่ามอนสเตอร์ เปลี่ยนอาชีพ ตีบวกอาวุธ พร้อมระบบบันทึกอัตโนมัติ',
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pixel Quest',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0e0f1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // ช่วยให้เว็บขยายเต็มพื้นที่จอรวมถึงส่วนขอบโค้ง/รอยบาก
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${pixel.variable} ${thai.variable} h-full bg-background`}>
      <body className="font-sans antialiased h-full overflow-hidden select-none">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
