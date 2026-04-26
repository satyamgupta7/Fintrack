import React, { useState, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Savings from './components/Savings'
import Loans from './components/Loans'
import Expenses from './components/Expenses'
import AiInsights from './components/AiInsights'
import Simulator from './components/Simulator'
import Auth from './components/Auth'
import { loadData, saveData } from './utils/storage'

export const DataContext = createContext(null)
export function useData() { return useContext(DataContext) }

function getStoredUser() {
  try { return JSON.parse(sessionStorage.getItem('ft_user')) } catch { return null }
}

export default function App() {
  const [user, setUser] = useState(getStoredUser)
  const [data, setData] = useState(() => loadData(getStoredUser()?.email))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function updateData(newData) {
    setData(newData)
    saveData(newData, user?.email)
  }

  function handleLogin(u) {
    sessionStorage.setItem('ft_user', JSON.stringify(u))
    setUser(u)
    setData(loadData(u.email))
  }

  function handleLogout() {
    sessionStorage.removeItem('ft_user')
    setUser(null)
  }

  if (!user) return <Auth onLogin={handleLogin} />

  return (
    <DataContext.Provider value={{ data, updateData }}>
      <div className="app-layout">
        <Sidebar user={user} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <header className="mobile-topbar">
            <div className="mobile-topbar-logo">
              <div className="sidebar-logo-icon" style={{width:30,height:30,fontSize:13}}>FT</div>
              <span className="sidebar-logo-text" style={{fontSize:16}}>Fin<span>Track</span></span>
            </div>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
          </header>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/ai-insights" element={<AiInsights />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </DataContext.Provider>
  )
}
