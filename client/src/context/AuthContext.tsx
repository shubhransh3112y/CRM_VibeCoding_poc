import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

type User = { id: string; email: string; role: string; name: string; firstName?: string; lastName?: string; avatar?: any } | null

const AuthContext = createContext<any>(null)

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) {
      setToken(t)
      axios.get(API_BASE + '/auth/me', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => setUser(r.data.user))
        .catch(() => { setToken(null); localStorage.removeItem('token') })
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await axios.post(API_BASE + '/auth/login', { email, password })
    const t = res.data.token
    localStorage.setItem('token', t)
    setToken(t)
    const me = await axios.get(API_BASE + '/auth/me', { headers: { Authorization: `Bearer ${t}` } })
    setUser(me.data.user)
    return me.data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const updateUser = (next: any) => setUser(next)

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, API_BASE }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
