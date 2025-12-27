import { useLayoutEffect, useState } from 'react'

type ThemeChoice = 'light' | 'dark'

function getInitialTheme(): ThemeChoice {
  const htmlPref = document.documentElement.getAttribute('data-theme') as ThemeChoice | null
  const saved = localStorage.getItem('theme') as ThemeChoice | null
  // Use saved choice if present; else use the html attribute; else default to 'light'
  return saved ?? (htmlPref ?? 'light')
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(getInitialTheme())

  // Apply before paint to avoid seeing the wrong theme briefly
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', choice)
    localStorage.setItem('theme', choice)
  }, [choice])

  const toggle = () => setChoice(c => (c === 'light' ? 'dark' : 'light'))

  return (
    <button aria-label="Toggle theme" onClick={toggle}>
      {choice === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  )
}
