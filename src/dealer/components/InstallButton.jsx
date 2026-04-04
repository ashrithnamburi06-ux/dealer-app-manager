import { useEffect, useState } from 'react'

export default function InstallButton() {
  const [prompt, setPrompt] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const installApp = async () => {
    if (!prompt) return

    prompt.prompt()
    const choice = await prompt.userChoice

    if (choice.outcome === 'accepted') {
      console.log('Installed')
    }

    setPrompt(null)
  }

  if (!prompt) return null

  return (
    <button
      onClick={installApp}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 16px',
        background: '#0ea5e9',
        color: '#fff',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      Install App
    </button>
  )
}