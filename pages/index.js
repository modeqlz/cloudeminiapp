import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoadingCard from '../components/LoadingCard'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const initTelegramWebApp = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()
        
        if (tg.initData) {
          // Authenticate with Telegram data
          fetch('/api/auth/telegram', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData: tg.initData }),
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // Store user data
              localStorage.setItem('telegramUser', JSON.stringify(data.user))
              // Redirect to home
              router.push('/home')
            } else {
              setError(data.error || 'Authentication failed')
              setIsLoading(false)
            }
          })
          .catch(err => {
            setError('Connection error')
            setIsLoading(false)
          })
        } else {
          setError('No Telegram data available')
          setIsLoading(false)
        }
      } else {
        // For development/testing
        setTimeout(() => {
          setError('Telegram WebApp not available. Please open in Telegram.')
          setIsLoading(false)
        }, 2000)
      }
    }

    initTelegramWebApp()
  }, [])

  if (isLoading) {
    return <LoadingCard />
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return null
}