import LandingPage from './LandingPage'

// Отключаем статическую генерацию и кэширование для этой страницы
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function Home() {
  return <LandingPage />
}
