import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const SettingsContext = createContext({})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === '1')

  useEffect(() => {
    api.get('/admin/settings').then(setSettings).catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark', dark ? '1' : '0')
  }, [dark])

  return (
    <SettingsContext.Provider value={{ settings, dark, toggleDark: () => setDark(d => !d) }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
