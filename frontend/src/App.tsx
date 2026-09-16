import { useEffect, useState } from 'react'
import './App.css'
import { Calculator } from './components/Calculator'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'calculator-theme'

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return savedTheme === 'dark' ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light',
    )
  }

  return (
    <main className="app-shell">
      <Calculator theme={theme} onToggleTheme={toggleTheme} />
      <p className="developer-credit">Developed by Nicolás Guevara Herrán</p>
    </main>
  )
}

export default App
