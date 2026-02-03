import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export function apiClient() {
  const client = axios.create({ baseURL: API_BASE })
  client.interceptors.request.use(cfg => {
    const token = localStorage.getItem('token')
    if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` }
    return cfg
  })
  return client
}

export default API_BASE
